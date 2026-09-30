import assert from 'node:assert/strict';
import test from 'node:test';
import { GameEngine, PENALTY_WORD } from './GameEngine.ts';
import { createDeck, distributeCards, drawCard, receiveCard, shuffleDeck } from './services/DeckService.ts';
import { hasFourOfAKind } from './utils/hand.ts';

const roster = [
  { id: 'lucas', name: 'Lucas' },
  { id: 'henrique', name: 'Henrique' },
];

function randomForOrder(deck, desiredIds) {
  const working = [...deck];
  const samples = [];
  for (let index = working.length - 1; index > 0; index -= 1) {
    const targetId = desiredIds[index];
    const swapIndex = working.findIndex((card, candidateIndex) => candidateIndex <= index && card.id === targetId);
    assert.notEqual(swapIndex, -1);
    samples.push((swapIndex + 0.25) / (index + 1));
    [working[index], working[swapIndex]] = [working[swapIndex], working[index]];
  }
  let cursor = 0;
  return () => samples[cursor++ % samples.length] ?? 0;
}

function engineForFourOfAKind() {
  const deck = createDeck();
  const firstEight = [
    '7-spades', '3-spades', '7-hearts', '4-spades',
    '7-diamonds', '5-spades', '8-spades', '7-clubs',
  ];
  const desired = [...firstEight, ...deck.map((card) => card.id).filter((id) => !firstEight.includes(id))];
  return new GameEngine(roster, { random: randomForOrder(deck, desired), now: () => new Date('2026-01-02T03:04:05.000Z') });
}

function completeWinningExchange(engine) {
  const lucasHand = engine.getPlayerHand('lucas');
  const henriqueHand = engine.getPlayerHand('henrique');
  const cardFromLucas = lucasHand.find((card) => card.value !== '7');
  const cardFromHenrique = henriqueHand.find((card) => card.value === '7');
  assert.ok(cardFromLucas && cardFromHenrique);
  assert.equal(engine.playCard('lucas', cardFromLucas.id).ok, true);
  assert.equal(engine.playCard('henrique', cardFromHenrique.id).ok, true);
  assert.equal(engine.finalizeExchange().ok, true);
}

test('creates one physical card for every value and suit', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((card) => card.id)).size, 52);
});

test('shuffles without losing or duplicating cards', () => {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck, () => 0.5);
  assert.notDeepEqual(shuffled.map((card) => card.id), deck.map((card) => card.id));
  assert.deepEqual(new Set(shuffled.map((card) => card.id)), new Set(deck.map((card) => card.id)));
});

test('distributes exactly four cards and keeps the remainder', () => {
  const deal = distributeCards(roster, createDeck());
  assert.equal(deal.hands.get('lucas').length, 4);
  assert.equal(deal.hands.get('henrique').length, 4);
  assert.equal(deal.deck.length, 44);
});

test('accepts a two-player game', () => {
  assert.equal(new GameEngine(roster).getState('lucas').players.length, 2);
});

test('supports up to six players', () => {
  const sixPlayers = Array.from({ length: 6 }, (_, index) => ({ id: `p${index}`, name: `Player ${index}` }));
  const game = new GameEngine(sixPlayers);
  assert.equal(game.getState('p0').players.length, 6);
  assert.deepEqual(sixPlayers.map((player) => game.getPlayerHand(player.id).length), Array(6).fill(4));
  assert.throws(() => new GameEngine([...sixPlayers, { id: 'p6', name: 'Player 6' }]));
});

test('keeps the configured circular order and resolves neighbors', () => {
  const game = new GameEngine([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }]);
  assert.deepEqual(game.getState('a').order, ['a', 'b', 'c']);
  assert.equal(game.getNextPlayer('c').id, 'a');
  assert.equal(game.getPreviousPlayer('a').id, 'c');
  assert.deepEqual(game.getNextPlayer('a').hand, []);
});

test('moves each selected card to the next player in the order', () => {
  const game = new GameEngine(roster);
  const firstBefore = game.getPlayerHand('lucas').map((card) => card.id);
  const secondBefore = game.getPlayerHand('henrique').map((card) => card.id);
  const sentByFirst = firstBefore[0];
  const sentBySecond = secondBefore[0];
  game.playCard('lucas', sentByFirst);
  game.playCard('henrique', sentBySecond);
  assert.equal(game.finalizeExchange().ok, true);
  assert.ok(game.getPlayerHand('henrique').some((card) => card.id === sentByFirst));
  assert.ok(game.getPlayerHand('lucas').some((card) => card.id === sentBySecond));
});

test('advances current player in fixed order while cards are selected', () => {
  const game = new GameEngine(roster);
  assert.equal(game.getState('lucas').currentPlayerId, 'lucas');
  game.playCard('lucas', game.getPlayerHand('lucas')[0].id);
  assert.equal(game.getState('henrique').currentPlayerId, 'henrique');
});

test('blocks a play outside the current player turn', () => {
  const game = new GameEngine(roster);
  const result = game.playCard('henrique', game.getPlayerHand('henrique')[0].id);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /turno/i);
});

test('rejects a card that does not exist in the hand', () => {
  const game = new GameEngine(roster);
  const result = game.playCard('lucas', 'not-a-card');
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /não está na mão/i);
});

test('recognizes four cards with the same value', () => {
  const fourSevens = ['spades', 'hearts', 'diamonds', 'clubs'].map((suit) => ({ id: `7-${suit}`, value: '7', suit }));
  assert.equal(hasFourOfAKind(fourSevens), true);
  assert.equal(hasFourOfAKind(fourSevens.slice(0, 3)), false);
});

test('records a round winner and emits completion event after a valid claim', () => {
  const game = engineForFourOfAKind();
  const observed = [];
  game.subscribe((event) => observed.push(event.type));
  completeWinningExchange(game);
  const result = game.claimFourOfAKind('lucas');
  assert.equal(result.ok, true);
  assert.equal(game.getState('lucas').roundWinner.id, 'lucas');
  assert.ok(observed.includes('player-completed'));
});

test('rejects a claim when the player does not have four equal cards', () => {
  const game = engineForFourOfAKind();
  completeWinningExchange(game);
  const result = game.claimFourOfAKind('henrique');
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /quatro cartas do mesmo valor/i);
});

test('assigns one BURRO letter to the next player after each completed hand', () => {
  const game = engineForFourOfAKind();
  completeWinningExchange(game);
  game.claimFourOfAKind('lucas');
  assert.deepEqual(game.getState('henrique').players.find((player) => player.id === 'henrique').penalty, ['B']);
  assert.equal(PENALTY_WORD, 'BURRO');
});

test('finishes the match when a player completes BURRO and prepares the result', () => {
  const game = engineForFourOfAKind();
  for (let penalty = 0; penalty < PENALTY_WORD.length; penalty += 1) {
    completeWinningExchange(game);
    const result = game.claimFourOfAKind('lucas');
    assert.equal(result.ok, true);
  }
  const state = game.getState('lucas');
  assert.equal(state.status, 'finished');
  assert.equal(state.winner.id, 'lucas');
  assert.equal(state.penalized.id, 'henrique');
  assert.deepEqual(state.result.penalized.penalty, [...PENALTY_WORD]);
  assert.deepEqual(state.result.players.find((player) => player.id === 'henrique').hand, []);
  assert.deepEqual(state.penalized.hand, []);
  assert.equal(state.result.rounds, 5);
  assert.equal(state.result.completedAt.toISOString(), '2026-01-02T03:04:05.000Z');
});

test('draws and receives without duplicating a physical card', () => {
  const deck = createDeck();
  const drawn = drawCard(deck);
  assert.ok(drawn);
  assert.equal(drawn.remaining.length, deck.length - 1);
  assert.equal(receiveCard([], drawn.card).length, 1);
  assert.throws(() => receiveCard([drawn.card], drawn.card), /já está na mão/);
});

test('hides opponents hands from a player snapshot', () => {
  const game = new GameEngine(roster);
  const state = game.getState('lucas');
  assert.equal(state.players.find((player) => player.id === 'lucas').hand.length, 4);
  assert.equal(state.players.find((player) => player.id === 'henrique').hand.length, 0);
});

test('restarts with a new match, empty penalties, and four cards per player', () => {
  const game = engineForFourOfAKind();
  const oldId = game.getState('lucas').id;
  assert.throws(() => game.restart('unknown'));
  assert.equal(game.getState('lucas').id, oldId);
  completeWinningExchange(game);
  game.claimFourOfAKind('lucas');
  const reset = game.restart('lucas');
  assert.notEqual(reset.id, oldId);
  assert.equal(reset.round, 0);
  assert.deepEqual(reset.players.map((player) => player.penalty), [[], []]);
  assert.deepEqual(['lucas', 'henrique'].map((playerId) => game.getPlayerHand(playerId).length), [4, 4]);
});