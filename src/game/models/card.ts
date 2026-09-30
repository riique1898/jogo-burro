export const CARD_VALUES = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
] as const;

export const CARD_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export type CardValue = (typeof CARD_VALUES)[number];
export type CardSuit = (typeof CARD_SUITS)[number];

export interface Card {
  id: string;
  value: CardValue;
  suit: CardSuit;
}