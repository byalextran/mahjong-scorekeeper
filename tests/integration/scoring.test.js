import { describe, test, expect } from 'vitest';
import {
  createInitialGameState,
  processWin,
  processTie,
  faanToPoints,
  getTotalScores,
} from '../../src/gameLogic.js';

describe('integration: score total accuracy', () => {
  describe('zero-sum verification', () => {
    test('scores remain zero-sum after 10 random rounds', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      for (let i = 0; i < 10; i++) {
        const winnerIndex = i % 4;
        const winType = i % 2 === 0 ? 'self-drawn' : 'discard';
        const faan = (i % 5) + 1;
        const points = faanToPoints(faan, winType);
        const discarderIndex =
          winType === 'discard' ? (winnerIndex + 1) % 4 : null;

        const result = processWin(
          state,
          winnerIndex,
          winType,
          discarderIndex,
          points,
          faan
        );
        state = result.newState;
      }

      const total = getTotalScores(state);
      expect(total).toBe(0);
    });

    test('scores remain zero-sum with mixed ties and wins', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Win -> Tie -> Win -> Tie -> Win
      let result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(5, 'self-drawn'),
        5
      );
      state = result.newState;

      state = processTie(state);

      result = processWin(
        state,
        2,
        'discard',
        1,
        faanToPoints(3, 'discard'),
        3
      );
      state = result.newState;

      state = processTie(state);

      result = processWin(
        state,
        3,
        'self-drawn',
        null,
        faanToPoints(8, 'self-drawn'),
        8
      );
      state = result.newState;

      expect(getTotalScores(state)).toBe(0);
    });
  });

  describe('cumulative scoring accuracy', () => {
    test('specific sequence produces correct individual scores', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Round 1: Alice (player 0) self-draws 3 faan (8 points each)
      // Alice: +24, others: -8 each
      let result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(3, 'self-drawn'),
        3
      );
      state = result.newState;

      expect(state.players[0].score).toBe(24);
      expect(state.players[1].score).toBe(-8);
      expect(state.players[2].score).toBe(-8);
      expect(state.players[3].score).toBe(-8);

      // Round 2: Bob (player 1) wins from Carol (player 2) discard, 5 faan (64 points) - full gun
      // Bob: +64, Carol: -64
      result = processWin(
        state,
        1,
        'discard',
        2,
        faanToPoints(5, 'discard'),
        5
      );
      state = result.newState;

      expect(state.players[0].score).toBe(24);
      expect(state.players[1].score).toBe(-8 + 64); // 56
      expect(state.players[2].score).toBe(-8 - 64); // -72
      expect(state.players[3].score).toBe(-8);

      // Verify zero-sum
      expect(getTotalScores(state)).toBe(0);
    });

    test('high faan wins accumulate correctly', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // 13 faan self-drawn: 512 points each = 1536 total
      const result = processWin(
        state,
        0,
        'self-drawn',
        null,
        faanToPoints(13, 'self-drawn'),
        13
      );
      state = result.newState;

      expect(state.players[0].score).toBe(1536);
      expect(state.players[1].score).toBe(-512);
      expect(state.players[2].score).toBe(-512);
      expect(state.players[3].score).toBe(-512);
      expect(getTotalScores(state)).toBe(0);
    });

    test('shared gun scoring accumulates correctly', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.scoringVariation = 'half';

      // 4 faan discard (32 points): winner +32, discarder -16, others -8 each
      let result = processWin(
        state,
        0,
        'discard',
        1,
        faanToPoints(4, 'discard'),
        4
      );
      state = result.newState;

      expect(state.players[0].score).toBe(32);
      expect(state.players[1].score).toBe(-16);
      expect(state.players[2].score).toBe(-8);
      expect(state.players[3].score).toBe(-8);

      // Another shared gun win: 6 faan (96 points)
      result = processWin(
        state,
        2,
        'discard',
        3,
        faanToPoints(6, 'discard'),
        6
      );
      state = result.newState;

      expect(state.players[0].score).toBe(32 - 24); // 8
      expect(state.players[1].score).toBe(-16 - 24); // -40
      expect(state.players[2].score).toBe(-8 + 96); // 88
      expect(state.players[3].score).toBe(-8 - 48); // -56

      expect(getTotalScores(state)).toBe(0);
    });
  });

  describe('edge case sequences', () => {
    test('all ties result in zero scores', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      for (let i = 0; i < 8; i++) {
        state = processTie(state);
      }

      expect(state.players.every((p) => p.score === 0)).toBe(true);
      expect(state.roundNumber).toBe(9);
    });

    test('alternating wins between two players', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // Player 0 and 1 alternate winning
      for (let i = 0; i < 4; i++) {
        const winnerIndex = i % 2;
        const result = processWin(
          state,
          winnerIndex,
          'self-drawn',
          null,
          faanToPoints(3, 'self-drawn'),
          3
        );
        state = result.newState;
      }

      // P0 wins rounds 1, 3 (as dealer stays): +24, +24 = +48
      // But P0 loses in rounds where they don't win: need to calculate carefully
      // This is complex, just verify zero-sum
      expect(getTotalScores(state)).toBe(0);
    });

    test('0 faan wins throughout game maintain zero-sum', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // All 0 faan wins - no score changes
      for (let i = 0; i < 5; i++) {
        const result = processWin(
          state,
          i % 4,
          'self-drawn',
          null,
          faanToPoints(0, 'self-drawn'),
          0
        );
        state = result.newState;
      }

      expect(state.players.every((p) => p.score === 0)).toBe(true);
      expect(state.roundNumber).toBe(6);
    });
  });
});
