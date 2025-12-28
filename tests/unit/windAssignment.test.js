import { describe, test, expect } from 'vitest';
import { getSeatWind, createInitialGameState } from '../../src/gameLogic.js';

describe('wind direction assignment', () => {
  describe('getSeatWind', () => {
    test('dealer is always East (seat wind 0)', () => {
      for (let dealerIndex = 0; dealerIndex < 4; dealerIndex++) {
        const seatWind = getSeatWind(dealerIndex, dealerIndex);
        expect(seatWind).toBe(0); // East
      }
    });

    test('winds assigned counter-clockwise: East, South, West, North when dealer is 0', () => {
      const dealerIndex = 0;

      expect(getSeatWind(0, dealerIndex)).toBe(0); // East
      expect(getSeatWind(1, dealerIndex)).toBe(1); // South
      expect(getSeatWind(2, dealerIndex)).toBe(2); // West
      expect(getSeatWind(3, dealerIndex)).toBe(3); // North
    });

    test('winds shift correctly when dealer is player 1', () => {
      const dealerIndex = 1;

      expect(getSeatWind(0, dealerIndex)).toBe(3); // North
      expect(getSeatWind(1, dealerIndex)).toBe(0); // East (dealer)
      expect(getSeatWind(2, dealerIndex)).toBe(1); // South
      expect(getSeatWind(3, dealerIndex)).toBe(2); // West
    });

    test('winds shift correctly when dealer is player 2', () => {
      const dealerIndex = 2;

      expect(getSeatWind(0, dealerIndex)).toBe(2); // West
      expect(getSeatWind(1, dealerIndex)).toBe(3); // North
      expect(getSeatWind(2, dealerIndex)).toBe(0); // East (dealer)
      expect(getSeatWind(3, dealerIndex)).toBe(1); // South
    });

    test('winds shift correctly when dealer is player 3', () => {
      const dealerIndex = 3;

      expect(getSeatWind(0, dealerIndex)).toBe(1); // South
      expect(getSeatWind(1, dealerIndex)).toBe(2); // West
      expect(getSeatWind(2, dealerIndex)).toBe(3); // North
      expect(getSeatWind(3, dealerIndex)).toBe(0); // East (dealer)
    });

    test('all 4 winds appear exactly once for any dealer position', () => {
      for (let dealerIndex = 0; dealerIndex < 4; dealerIndex++) {
        const winds = [];
        for (let i = 0; i < 4; i++) {
          winds.push(getSeatWind(i, dealerIndex));
        }
        // Each wind (0-3) should appear exactly once
        expect(winds.sort()).toEqual([0, 1, 2, 3]);
      }
    });
  });

  describe('initial game state', () => {
    test('first player (index 0) starts as dealer', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      expect(state.dealerIndex).toBe(0);
    });

    test('starting dealer index is 0', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      expect(state.startingDealerIndex).toBe(0);
    });

    test('dealer player has East wind (seat wind 0)', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      const seatWind = getSeatWind(0, state.dealerIndex);
      expect(seatWind).toBe(0); // East
    });

    test('prevailing wind starts as East (0)', () => {
      const state = createInitialGameState(['Alice', 'Bob', 'Carol', 'Dave']);
      expect(state.prevailingWind).toBe(0);
    });
  });
});
