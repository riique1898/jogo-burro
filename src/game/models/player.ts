import type { Card } from './card.ts';

export type PlayerStatus = 'active' | 'eliminated' | 'winner';

export interface Player {
  id: string;
  name: string;
  position: number;
  hand: Card[];
  status: PlayerStatus;
  penalty: string[];
}

export interface PlayerInput {
  id: string;
  name: string;
}