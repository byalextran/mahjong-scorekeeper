import { describe, test, expect } from 'vitest';
import {
  faanToPoints,
  processWin,
  processTie,
  createInitialGameState,
  getTotalScores,
} from '../../src/gameLogic.js';

describe('scoring', () => {
  describe('ties', () => {
    test('tie does not change any player scores', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const newState = processTie(state);

      expect(newState.players[0].score).toBe(0);
      expect(newState.players[1].score).toBe(0);
      expect(newState.players[2].score).toBe(0);
      expect(newState.players[3].score).toBe(0);
    });

    test('tie history entry has empty changes array', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const newState = processTie(state);

      expect(newState.history[0].changes).toEqual([]);
      expect(newState.history[0].points).toBe(0);
      expect(newState.history[0].winType).toBe('tie');
    });
  });

  describe('0 faan wins', () => {
    test('0 faan self-drawn win does not change any player scores', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(0, 'self-drawn');
      const { newState } = processWin(state, 1, 'self-drawn', null, points, 0);

      expect(newState.players.every((p) => p.score === 0)).toBe(true);
    });

    test('0 faan discard win does not change scores', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(0, 'discard');
      const { newState } = processWin(state, 1, 'discard', 2, points, 0);

      expect(newState.players.every((p) => p.score === 0)).toBe(true);
    });
  });

  describe('self-drawn wins', () => {
    test('winner gains 3x points, each loser loses 1x points', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(3, 'self-drawn'); // 8 points
      const { newState } = processWin(state, 0, 'self-drawn', null, points, 3);

      expect(newState.players[0].score).toBe(24); // +8 * 3
      expect(newState.players[1].score).toBe(-8); // -8
      expect(newState.players[2].score).toBe(-8); // -8
      expect(newState.players[3].score).toBe(-8); // -8
    });

    test('self-drawn is zero-sum', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(5, 'self-drawn');
      const { newState } = processWin(state, 2, 'self-drawn', null, points, 5);

      const total = getTotalScores(newState);
      expect(total).toBe(0);
    });

    test('any player can win self-drawn', () => {
      for (let winnerIndex = 0; winnerIndex < 4; winnerIndex++) {
        const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
        const points = faanToPoints(4, 'self-drawn'); // 16 points
        const { newState } = processWin(
          state,
          winnerIndex,
          'self-drawn',
          null,
          points,
          4
        );

        expect(newState.players[winnerIndex].score).toBe(48); // +16 * 3
        expect(getTotalScores(newState)).toBe(0);
      }
    });
  });

  describe('discard wins - full gun', () => {
    test('only discarder pays full points', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.scoringVariation = 'full';
      const points = faanToPoints(3, 'discard'); // 16 points
      const { newState } = processWin(state, 0, 'discard', 1, points, 3);

      expect(newState.players[0].score).toBe(16); // Winner +16
      expect(newState.players[1].score).toBe(-16); // Discarder -16
      expect(newState.players[2].score).toBe(0); // No change
      expect(newState.players[3].score).toBe(0); // No change
    });

    test('full gun is zero-sum', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.scoringVariation = 'full';
      const points = faanToPoints(5, 'discard');
      const { newState } = processWin(state, 2, 'discard', 0, points, 5);

      const total = getTotalScores(newState);
      expect(total).toBe(0);
    });
  });

  describe('discard wins - shared gun', () => {
    test('discarder pays half, others pay quarter each', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.scoringVariation = 'half';
      const points = faanToPoints(4, 'discard'); // 32 points
      const { newState } = processWin(state, 0, 'discard', 1, points, 4);

      expect(newState.players[0].score).toBe(32); // Winner +32
      expect(newState.players[1].score).toBe(-16); // Discarder -16 (half)
      expect(newState.players[2].score).toBe(-8); // Other -8 (quarter)
      expect(newState.players[3].score).toBe(-8); // Other -8 (quarter)
    });

    test('shared gun is zero-sum', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.scoringVariation = 'half';
      const points = faanToPoints(6, 'discard');
      const { newState } = processWin(state, 3, 'discard', 1, points, 6);

      const total = getTotalScores(newState);
      expect(total).toBe(0);
    });
  });

  describe('history recording', () => {
    test('self-drawn win recorded correctly in history', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(5, 'self-drawn');
      const { newState } = processWin(state, 1, 'self-drawn', null, points, 5);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0].winner).toBe('Bob');
      expect(newState.history[0].winType).toBe('self-drawn');
      expect(newState.history[0].faans).toBe(5);
      expect(newState.history[0].discarder).toBeNull();
    });

    test('discard win recorded correctly in history', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const points = faanToPoints(3, 'discard');
      const { newState } = processWin(state, 2, 'discard', 0, points, 3);

      expect(newState.history).toHaveLength(1);
      expect(newState.history[0].winner).toBe('Carol');
      expect(newState.history[0].winType).toBe('discard');
      expect(newState.history[0].discarder).toBe('Alice');
    });
  });
});
