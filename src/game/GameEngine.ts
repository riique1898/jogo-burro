import type { Card } from './models/card.ts';
import type { GameActionResult, GameResult, GameState } from './models/game.ts';
import type { GameEvent, GameEventListener } from './models/events.ts';
import type { Player, PlayerInput } from './models/player.ts';
import { createDeck, distributeCards, MAX_PLAYERS, receiveCard, shuffleDeck, validatePlayerCount } from './services/DeckService.ts';
import { hasFourOfAKind } from './utils/hand.ts';

export const PENALTY_WORD = 'BURRO';

export interface GameEngineOptions {
  random?: () => number;
  now?: () => Date;
  idFactory?: () => string;
}

export class GameEngine {
  private state: GameState;
  private readonly roster: PlayerInput[];
  private readonly random: () => number;
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly listeners = new Set<GameEventListener>();

  constructor(players: readonly PlayerInput[], options: GameEngineOptions = {}) {
    validatePlayerCount(players.length);
    if (new Set(players.map((player) => player.id)).size !== players.length) {
      throw new Error('Os identificadores dos jogadores devem ser únicos.');
    }
    if (players.some((player) => !player.id.trim() || !player.name.trim())) {
      throw new Error('Cada jogador precisa ter identificador e nome.');
    }

    this.roster = players.map((player) => ({ ...player }));
    this.random = options.random ?? Math.random;
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? (() => `game-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    this.state = this.createInitialState();
  }

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(viewerId: string): GameState {
    if (!this.state.order.includes(viewerId)) {
      throw new Error(`Jogador desconhecido: ${viewerId}.`);
    }

    const snapshot = structuredClone(this.state);
    const maskPlayer = (player: Player): Player => ({
      ...player,
      hand: viewerId === player.id ? player.hand : [],
    });
    snapshot.players = snapshot.players.map(maskPlayer);
    snapshot.winner = snapshot.winner ? maskPlayer(snapshot.winner) : null;
    snapshot.penalized = snapshot.penalized ? maskPlayer(snapshot.penalized) : null;
    snapshot.roundWinner = snapshot.roundWinner ? maskPlayer(snapshot.roundWinner) : null;
    if (snapshot.result) {
      snapshot.result.winner = maskPlayer(snapshot.result.winner);
      snapshot.result.penalized = maskPlayer(snapshot.result.penalized);
      snapshot.result.players = snapshot.result.players.map(maskPlayer);
    }
    snapshot.pendingCards = {};
    snapshot.deck = [];
    return snapshot;
  }

  getPlayerHand(playerId: string): Card[] {
    const player = this.findPlayer(playerId);
    return player.hand.map((card) => ({ ...card }));
  }

  getNextPlayer(playerId: string): Player {
    const index = this.state.order.indexOf(playerId);
    if (index === -1) throw new Error(`Jogador desconhecido: ${playerId}.`);
    const next = this.findPlayer(this.state.order[(index + 1) % this.state.order.length] as string);
    return { ...structuredClone(next), hand: [] };
  }

  getPreviousPlayer(playerId: string): Player {
    const index = this.state.order.indexOf(playerId);
    if (index === -1) throw new Error(`Jogador desconhecido: ${playerId}.`);
    const previousIndex = (index - 1 + this.state.order.length) % this.state.order.length;
    const previous = this.findPlayer(this.state.order[previousIndex] as string);
    return { ...structuredClone(previous), hand: [] };
  }

  playCard(playerId: string, cardId: string): GameActionResult {
    if (this.state.status !== 'active') return this.failure('A partida já foi encerrada.');
    if (this.state.phase !== 'selecting') return this.failure('A troca não está aceitando cartas neste momento.');
    if (playerId !== this.state.currentPlayerId) return this.failure('Não é o turno deste jogador.');
    if (this.state.pendingCards[playerId]) return this.failure('Este jogador já escolheu uma carta nesta troca.');

    const player = this.findPlayer(playerId);
    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return this.failure('A carta selecionada não está na mão do jogador.');

    const [card] = player.hand.splice(cardIndex, 1);
    if (!card) return this.failure('Não foi possível retirar a carta selecionada.');
    this.state.pendingCards[playerId] = card;
    const recipient = this.getNextPlayer(playerId);
    this.emit({ type: 'card-played', playerId, recipientId: recipient.id, cardId: card.id });

    const nextPlayerIndex = (this.state.order.indexOf(playerId) + 1) % this.state.order.length;
    this.state.currentPlayerId = this.state.order[nextPlayerIndex] as string;
    if (Object.keys(this.state.pendingCards).length === this.state.players.length) {
      this.state.phase = 'ready-to-exchange';
    } else {
      this.emit({ type: 'turn-changed', playerId: this.state.currentPlayerId });
    }
    return { ok: true, value: undefined };
  }

  finalizeExchange(): GameActionResult {
    if (this.state.status !== 'active') return this.failure('A partida já foi encerrada.');
    if (this.state.phase !== 'ready-to-exchange') {
      return this.failure('Todos os jogadores precisam escolher uma carta antes da troca.');
    }

    const transfers: Array<{ from: string; to: string; card: Card }> = [];
    for (let index = 0; index < this.state.order.length; index += 1) {
      const from = this.state.order[index] as string;
      const to = this.state.order[(index + 1) % this.state.order.length] as string;
      const card = this.state.pendingCards[from];
      if (!card) return this.failure('A troca está incompleta; tente novamente.');
      transfers.push({ from, to, card: { ...card } });
    }

    for (const transfer of transfers) {
      const recipient = this.findPlayer(transfer.to);
      recipient.hand = receiveCard(recipient.hand, transfer.card);
    }
    this.state.pendingCards = {};
    this.state.round += 1;
    this.state.currentPlayerId = this.state.order[0] as string;
    this.state.phase = this.state.players.some((player) => hasFourOfAKind(player.hand))
      ? 'claiming'
      : 'selecting';
    this.emit({ type: 'exchange-finalized', transfers });
    this.emit({ type: 'turn-changed', playerId: this.state.currentPlayerId });
    return { ok: true, value: undefined };
  }

  claimFourOfAKind(playerId: string): GameActionResult<GameResult | null> {
    if (this.state.status !== 'active') return this.failure('A partida já foi encerrada.');
    if (this.state.phase !== 'claiming') return this.failure('Ainda não há uma combinação para confirmar.');
    const winner = this.findPlayer(playerId);
    if (!hasFourOfAKind(winner.hand)) return this.failure('O jogador não possui quatro cartas do mesmo valor.');

    const penalized = this.findPlayer(this.getNextPlayer(playerId).id);
    const letter = PENALTY_WORD[penalized.penalty.length];
    if (!letter) return this.failure('Este jogador já completou a penalidade BURRO.');

    this.state.roundWinner = winner;
    this.state.penalized = penalized;
    penalized.penalty.push(letter);
    this.emit({ type: 'player-completed', winnerId: winner.id, penalizedId: penalized.id });
    this.emit({ type: 'penalty-assigned', playerId: penalized.id, letter });

    if (penalized.penalty.length === PENALTY_WORD.length) {
      penalized.status = 'eliminated';
      const matchWinner = this.state.players
        .filter((player) => player.id !== penalized.id)
        .sort((left, right) => left.penalty.length - right.penalty.length || left.position - right.position)[0];
      if (!matchWinner) return this.failure('Não foi possível determinar o vencedor da partida.');

      matchWinner.status = 'winner';
      this.state.winner = matchWinner;
      this.state.status = 'finished';
      this.state.phase = 'finished';
      const resultPlayers = this.state.players.map((player) => ({ ...structuredClone(player), hand: [] }));
      this.state.result = {
        winner: structuredClone(resultPlayers.find((player) => player.id === matchWinner.id) as Player),
        penalized: structuredClone(resultPlayers.find((player) => player.id === penalized.id) as Player),
        players: resultPlayers,
        rounds: this.state.round,
        reason: 'burro-completed',
        completedAt: this.now(),
      };
      this.emit({ type: 'game-finished', result: structuredClone(this.state.result) });
      return { ok: true, value: structuredClone(this.state.result) };
    }

    this.startNextHand();
    return { ok: true, value: null };
  }

  restart(viewerId: string): GameState {
    if (!this.state.order.includes(viewerId)) {
      throw new Error(`Jogador desconhecido: ${viewerId}.`);
    }
    this.state = this.createInitialState();
    this.emit({ type: 'game-restarted', gameId: this.state.id });
    return this.getState(viewerId);
  }

  private createInitialState(): GameState {
    const shuffled = shuffleDeck(createDeck(), this.random);
    const deal = distributeCards(this.roster, shuffled);
    const players: Player[] = this.roster.map((input, position) => ({
      ...input,
      position,
      hand: deal.hands.get(input.id) ?? [],
      status: 'active',
      penalty: [],
    }));

    return {
      id: this.idFactory(),
      players,
      currentPlayerId: this.roster[0]?.id ?? '',
      round: 0,
      status: 'active',
      phase: players.some((player) => hasFourOfAKind(player.hand)) ? 'claiming' : 'selecting',
      deck: deal.deck,
      order: this.roster.map((player) => player.id),
      winner: null,
      penalized: null,
      roundWinner: null,
      pendingCards: {},
      result: null,
    };
  }

  private startNextHand(): void {
    const shuffled = shuffleDeck(createDeck(), this.random);
    const deal = distributeCards(this.roster, shuffled);
    for (const player of this.state.players) {
      player.hand = deal.hands.get(player.id) ?? [];
    }
    this.state.deck = deal.deck;
    this.state.pendingCards = {};
    this.state.currentPlayerId = this.state.order[0] as string;
    this.state.phase = this.state.players.some((player) => hasFourOfAKind(player.hand))
      ? 'claiming'
      : 'selecting';
    this.emit({ type: 'turn-changed', playerId: this.state.currentPlayerId });
  }

  private findPlayer(playerId: string): Player {
    const player = this.state.players.find((candidate) => candidate.id === playerId);
    if (!player) throw new Error(`Jogador desconhecido: ${playerId}.`);
    return player;
  }

  private failure<T = void>(error: string): GameActionResult<T> {
    return { ok: false, error };
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(structuredClone(event));
  }
}