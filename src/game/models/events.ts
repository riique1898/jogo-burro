import type { Card } from './card.ts';
import type { GameResult } from './game.ts';

export type GameEvent =
  | { type: 'card-played'; playerId: string; recipientId: string }
  | { type: 'turn-changed'; playerId: string }
  | { type: 'exchange-finalized'; transfers: Array<{ from: string; to: string }> }
  | { type: 'card-received'; playerId: string; card: Card }
  | { type: 'player-completed'; winnerId: string; penalizedId: string }
  | { type: 'penalty-assigned'; playerId: string; letter: string }
  | { type: 'game-finished'; result: GameResult }
  | { type: 'game-restarted'; gameId: string };

export type GameEventListener = (event: GameEvent) => void;

export interface GameCommandPort {
  playCard(playerId: string, cardId: string): void;
  finalizeExchange(): void;
  claimFourOfAKind(playerId: string): void;
}

export interface GameEventPort {
  subscribe(playerId: string, listener: GameEventListener): () => void;
}