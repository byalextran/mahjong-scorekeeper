import { describe, test, expect } from 'vitest';
import {
  createInitialGameState,
  processWin,
  processTie,
  faanToPoints,
  getSeatWind,
  getTotalScores,
} from '../../src/gameLogic.js';

describe('integration: complete game flow', () => {
  describe('full East round (4 dealer rotations)', () => {
    test('complete East round with all non-dealer wins', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Game 1: Player 1 (South) wins, dealer rotates 0 -> 1
      let result = processWin(
        state,
        1,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(1);
      expect(state.dealerRotations).toBe(1);
      expect(state.prevailingWind).toBe(0); // Still East

      // Game 2: Player 2 wins, dealer rotates 1 -> 2
      result = processWin(
        state,
        2,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(2);
      expect(state.dealerRotations).toBe(2);

      // Game 3: Player 3 wins, dealer rotates 2 -> 3
      result = processWin(
        state,
        3,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(3);
      expect(state.dealerRotations).toBe(3);

      // Game 4: Player 0 wins, dealer rotates 3 -> 0, wind changes
      result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(0);
      expect(state.prevailingWind).toBe(1); // Now South
      expect(state.dealerRotations).toBe(0); // Reset
    });
  });

  describe('dealer consecutive wins scenario', () => {
    test('dealer winning multiple times delays rotation', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Dealer (player 0) wins 3 times in a row
      for (let i = 0; i < 3; i++) {
        const result = processWin(
          state,
          0,
          'self-drawn',
          null,
          faanToPoints(3, 'self-drawn'),
          3
        );
        state = result.newState;
        expect(state.dealerIndex).toBe(0);
        expect(state.dealerRotations).toBe(0);
      }

      expect(state.roundNumber).toBe(4);
      expect(state.prevailingWind).toBe(0); // Still East
    });

    test('after dealer wins, next non-dealer win still triggers rotation', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Dealer wins twice
      for (let i = 0; i < 2; i++) {
        const result = processWin(
          state,
          0,
          'self-drawn',
          null,
          faanToPoints(3, 'self-drawn'),
          3
        );
        state = result.newState;
      }
      expect(state.dealerIndex).toBe(0);

      // Non-dealer wins
      const result = processWin(
        state,
        2,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(1);
      expect(state.dealerRotations).toBe(1);
    });
  });

  describe('mixed game results', () => {
    test('complex scenario: ties, dealer wins, non-dealer wins', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Game 1: Tie - dealer rotates
      state = processTie(state);
      expect(state.dealerIndex).toBe(1);
      expect(state.dealerRotations).toBe(1);

      // Game 2: Dealer (player 1) wins - stays dealer
      let result = processWin(
        state,
        1,
        'self-drawn',
        null,
        faanToPoints(2, 'self-drawn'),
        2
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(1);
      expect(state.dealerRotations).toBe(1);

      // Game 3: Non-dealer (player 3) wins - dealer rotates
      result = processWin(
        state,
        3,
        'discard',
        0,
        faanToPoints(4, 'discard'),
        4
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(2);
      expect(state.dealerRotations).toBe(2);

      // Game 4: Tie - dealer rotates
      state = processTie(state);
      expect(state.dealerIndex).toBe(3);
      expect(state.dealerRotations).toBe(3);

      // Game 5: Non-dealer wins - completes East round
      result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;
      expect(state.dealerIndex).toBe(0);
      expect(state.prevailingWind).toBe(1); // South
    });
  });

  describe('full game simulation (16 minimum games)', () => {
    test('complete game with all 4 wind rounds', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Simulate minimum 16 games (4 winds x 4 rotations each)
      for (let windRound = 0; windRound < 4; windRound++) {
        expect(state.prevailingWind).toBe(windRound);

        for (let rotation = 0; rotation < 4; rotation++) {
          // Non-dealer always wins to force rotation
          const winnerIndex = (state.dealerIndex + 1) % 4;
          const result = processWin(state, winnerIndex, 'self-drawn', null, 8, 3);
          state = result.newState;
        }
      }

      // After 16 games, back to East
      expect(state.prevailingWind).toBe(0);
      expect(state.roundNumber).toBe(17);
    });
  });

  describe('score history tracking', () => {
    test('history correctly records all game results', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Game 1: Self-drawn win
      let result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;

      // Game 2: Discard win
      result = processWin(
        state,
        1,
        'discard',
        2,
        faanToPoints(5, 'discard'),
        5
      );
      state = result.newState;

      // Game 3: Tie
      state = processTie(state);

      expect(state.history).toHaveLength(3);
      expect(state.history[0].winType).toBe('self-drawn');
      expect(state.history[1].winType).toBe('discard');
      expect(state.history[1].discarder).toBe('Carol');
      expect(state.history[2].winType).toBe('tie');
    });
  });

  describe('wind assignments during game', () => {
    test('seat winds rotate correctly as dealer changes', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Initially: P0=East, P1=South, P2=West, P3=North
      expect(getSeatWind(0, state.dealerIndex)).toBe(0); // East
      expect(getSeatWind(1, state.dealerIndex)).toBe(1); // South
      expect(getSeatWind(2, state.dealerIndex)).toBe(2); // West
      expect(getSeatWind(3, state.dealerIndex)).toBe(3); // North

      // After tie, dealer becomes P1
      state = processTie(state);

      // Now: P0=North, P1=East, P2=South, P3=West
      expect(getSeatWind(0, state.dealerIndex)).toBe(3); // North
      expect(getSeatWind(1, state.dealerIndex)).toBe(0); // East
      expect(getSeatWind(2, state.dealerIndex)).toBe(1); // South
      expect(getSeatWind(3, state.dealerIndex)).toBe(2); // West
    });
  });
});
