import { CARD_SUITS, CARD_VALUES, type Card } from '../models/card.ts';
import type { PlayerInput } from '../models/player.ts';

export const CARDS_PER_PLAYER = 4;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export interface Deal {
  deck: Card[];
  hands: Map<string, Card[]>;
}

export function createDeck(): Card[] {
  return CARD_VALUES.flatMap((value) =>
    CARD_SUITS.map((suit) => ({ id: `${value}-${suit}`, value, suit })),
  );
}

export function shuffleDeck(cards: readonly Card[], random: () => number = Math.random): Card[] {
  const shuffled = cards.map((card) => ({ ...card }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = random();
    if (sample < 0 || sample >= 1) {
      throw new RangeError('A função aleatória deve retornar um número entre 0 e 1.');
    }
    const swapIndex = Math.floor(sample * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function drawCard(deck: readonly Card[]): { card: Card; remaining: Card[] } | null {
  const [card, ...remaining] = deck;
  return card ? { card: { ...card }, remaining: remaining.map((item) => ({ ...item })) } : null;
}

export function receiveCard(hand: readonly Card[], card: Card): Card[] {
  if (hand.some((existing) => existing.id === card.id)) {
    throw new Error(`A carta ${card.id} já está na mão.`);
  }
  return [...hand.map((item) => ({ ...item })), { ...card }];
}

export function distributeCards(players: readonly PlayerInput[], deck: readonly Card[]): Deal {
  validatePlayerCount(players.length);
  if (deck.length < players.length * CARDS_PER_PLAYER) {
    throw new Error('O baralho não possui cartas suficientes para a distribuição.');
  }
  if (new Set(deck.map((card) => card.id)).size !== deck.length) {
    throw new Error('O baralho contém cartas duplicadas.');
  }

  const hands = new Map(players.map((player) => [player.id, [] as Card[]]));
  const remaining = deck.map((card) => ({ ...card }));

  for (let cardIndex = 0; cardIndex < CARDS_PER_PLAYER; cardIndex += 1) {
    for (const player of players) {
      const drawn = drawCard(remaining);
      if (!drawn) throw new Error('O baralho acabou durante a distribuição.');
      remaining.splice(0, remaining.length, ...drawn.remaining);
      hands.get(player.id)?.push(drawn.card);
    }
  }

  return { deck: remaining, hands };
}

export function validatePlayerCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
    throw new RangeError(`A partida precisa ter entre ${MIN_PLAYERS} e ${MAX_PLAYERS} jogadores.`);
  }
}