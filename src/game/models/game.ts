import type { Card } from './card.ts';
import type { Player } from './player.ts';

export type GameStatus = 'active' | 'finished';
export type GamePhase = 'selecting' | 'ready-to-exchange' | 'claiming' | 'finished';

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerId: string;
  round: number;
  status: GameStatus;
  phase: GamePhase;
  deck: Card[];
  order: string[];
  winner: Player | null;
  penalized: Player | null;
  roundWinner: Player | null;
  pendingCards: Record<string, Card>;
  result: GameResult | null;
}

export interface GameResult {
  winner: Player;
  penalized: Player;
  players: Player[];
  rounds: number;
  reason: 'burro-completed';
  completedAt: Date;
}

export type GameActionResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string };