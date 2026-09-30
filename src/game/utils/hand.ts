import type { Card } from '../models/card.ts';

export function hasFourOfAKind(hand: readonly Card[]): boolean {
  return hand.length === 4 && hand.every((card) => card.value === hand[0]?.value);
}