import { describe, test, expect } from 'vitest';
import {
  rotateDealer,
  createInitialGameState,
  processWin,
  processTie,
  faanToPoints,
} from '../../src/gameLogic.js';

describe('rotateDealer', () => {
  describe('counter-clockwise rotation', () => {
    test('dealer rotates 0 -> 1 -> 2 -> 3 -> 0', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      state = rotateDealer(state);
      expect(state.dealerIndex).toBe(1);

      state = rotateDealer(state);
      expect(state.dealerIndex).toBe(2);

      state = rotateDealer(state);
      expect(state.dealerIndex).toBe(3);

      state = rotateDealer(state);
      expect(state.dealerIndex).toBe(0);
    });

    test('rotateDealer correctly applies modulo 4', () => {
      const state = { dealerIndex: 3, dealerRotations: 0, prevailingWind: 0 };
      const newState = rotateDealer(state);
      expect(newState.dealerIndex).toBe(0);
    });
  });

  describe('dealer rotations counter', () => {
    test('dealerRotations increments on each rotation', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      state = rotateDealer(state);
      expect(state.dealerRotations).toBe(1);

      state = rotateDealer(state);
      expect(state.dealerRotations).toBe(2);

      state = rotateDealer(state);
      expect(state.dealerRotations).toBe(3);
    });

    test('dealerRotations resets to 0 after 4 rotations', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      for (let i = 0; i < 4; i++) {
        state = rotateDealer(state);
      }

      expect(state.dealerRotations).toBe(0);
    });
  });

  describe('prevailing wind progression', () => {
    test('prevailing wind remains East during first 3 rotations', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      for (let i = 0; i < 3; i++) {
        state = rotateDealer(state);
        expect(state.prevailingWind).toBe(0); // East
      }
    });

    test('prevailing wind changes to South after 4 rotations', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      for (let i = 0; i < 4; i++) {
        state = rotateDealer(state);
      }

      expect(state.prevailingWind).toBe(1); // South
      expect(state.dealerRotations).toBe(0); // Reset
    });

    test('prevailing wind cycles East -> South -> West -> North -> East', () => {
      let state = { dealerIndex: 0, dealerRotations: 0, prevailingWind: 0 };

      // Complete East round (4 rotations)
      for (let i = 0; i < 4; i++) state = rotateDealer(state);
      expect(state.prevailingWind).toBe(1); // South

      // Complete South round (4 rotations)
      for (let i = 0; i < 4; i++) state = rotateDealer(state);
      expect(state.prevailingWind).toBe(2); // West

      // Complete West round (4 rotations)
      for (let i = 0; i < 4; i++) state = rotateDealer(state);
      expect(state.prevailingWind).toBe(3); // North

      // Complete North round (4 rotations) - wraps to East
      for (let i = 0; i < 4; i++) state = rotateDealer(state);
      expect(state.prevailingWind).toBe(0); // East
    });
  });
});

describe('dealer rotation on win/tie', () => {
  describe('dealer wins - no rotation', () => {
    test('dealer remains dealer when they win (self-drawn)', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const points = faanToPoints(3, 'self-drawn');
      const { newState } = processWin(
        initialState,
        0,
        'self-drawn',
        null,
        points,
        3
      );

      expect(newState.dealerIndex).toBe(0);
      expect(newState.dealerRotations).toBe(0);
    });

    test('dealer remains dealer when they win (discard)', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const points = faanToPoints(3, 'discard');
      const { newState } = processWin(initialState, 0, 'discard', 1, points, 3);

      expect(newState.dealerIndex).toBe(0);
    });

    test('dealer rotations counter does not increment when dealer wins', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const points = faanToPoints(5, 'self-drawn');
      const { newState } = processWin(
        initialState,
        0,
        'self-drawn',
        null,
        points,
        5
      );

      expect(newState.dealerRotations).toBe(0);
    });
  });

  describe('tie - dealer rotates', () => {
    test('dealer rotates when tie occurs', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const newState = processTie(initialState);

      expect(newState.dealerIndex).toBe(1);
    });

    test('dealerRotations increments on tie', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const newState = processTie(initialState);

      expect(newState.dealerRotations).toBe(1);
    });
  });

  describe('non-dealer wins - dealer rotates', () => {
    test('dealer rotates when non-dealer wins', () => {
      const initialState = createInitialGameState([
        'Alice',
        'Bob',
        'Carol',
        'Dave',
      ]);
      const points = faanToPoints(3, 'self-drawn');
      const { newState } = processWin(
        initialState,
        2,
        'self-drawn',
        null,
        points,
        3
      );

      expect(newState.dealerIndex).toBe(1);
    });

    test('dealer rotates from player 1 to player 2 when non-dealer wins', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      state.dealerIndex = 1;
      state.dealerRotations = 1;

      const points = faanToPoints(3, 'self-drawn');
      const { newState } = processWin(state, 3, 'self-drawn', null, points, 3);

      expect(newState.dealerIndex).toBe(2);
    });
  });

  describe('dealer wins delays wind change', () => {
    test('dealer wins do not increment dealerRotations', () => {
      let state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);

      // 3 ties (rotations 1, 2, 3)
      for (let i = 0; i < 3; i++) {
        state = processTie(state);
      }
      expect(state.dealerRotations).toBe(3);

      // Dealer (now player 3) wins - no rotation
      const points = faanToPoints(3, 'self-drawn');
      const result = processWin(
        state,
        state.dealerIndex,
        'self-drawn',
        null,
        points,
        3
      );
      state = result.newState;

      expect(state.dealerRotations).toBe(3);
      expect(state.prevailingWind).toBe(0); // Still East
    });
  });
});
