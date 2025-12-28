import { describe, test, expect } from 'vitest';
import { faanToPoints } from '../../src/gameLogic.js';
import { MAX_FAAN, FAAN_TABLE } from '../../src/constants.js';

describe('faanToPoints', () => {
  describe('edge cases', () => {
    test('0 faan returns 0 points for self-drawn', () => {
      expect(faanToPoints(0, 'self-drawn')).toBe(0);
    });

    test('0 faan returns 0 points for discard', () => {
      expect(faanToPoints(0, 'discard')).toBe(0);
    });

    test('negative faan returns 0 points', () => {
      expect(faanToPoints(-1, 'self-drawn')).toBe(0);
      expect(faanToPoints(-5, 'discard')).toBe(0);
    });

    test('faan above MAX_FAAN throws RangeError', () => {
      expect(() => faanToPoints(MAX_FAAN + 1, 'self-drawn')).toThrow(RangeError);
      expect(() => faanToPoints(MAX_FAAN + 7, 'discard')).toThrow(RangeError);
      expect(() => faanToPoints(50, 'self-drawn')).toThrow(`Faan cannot exceed ${MAX_FAAN}`);
    });
  });

  describe('valid faan range (0 to MAX_FAAN)', () => {
    test('all valid faan values (1 to MAX_FAAN) return positive points', () => {
      for (let faan = 1; faan <= MAX_FAAN; faan++) {
        expect(faanToPoints(faan, 'self-drawn')).toBeGreaterThan(0);
        expect(faanToPoints(faan, 'discard')).toBeGreaterThan(0);
      }
    });

    test('all valid faan values (1 to MAX_FAAN) have entries in FAAN_TABLE', () => {
      for (let faan = 1; faan <= MAX_FAAN; faan++) {
        expect(FAAN_TABLE[faan]).toBeDefined();
        expect(FAAN_TABLE[faan]).toHaveLength(2);
      }
    });

    test('0 faan is valid and returns 0 points', () => {
      expect(faanToPoints(0, 'self-drawn')).toBe(0);
      expect(faanToPoints(0, 'discard')).toBe(0);
    });
  });

  describe('self-drawn points', () => {
    test.each([
      [1, 2],
      [2, 4],
      [3, 8],
      [4, 16],
      [5, 32],
      [6, 48],
      [7, 64],
      [8, 96],
      [9, 128],
      [10, 192],
      [11, 256],
      [12, 384],
      [13, 512],
    ])('%i faan self-drawn = %i points', (faan, expectedPoints) => {
      expect(faanToPoints(faan, 'self-drawn')).toBe(expectedPoints);
    });
  });

  describe('discard points', () => {
    test.each([
      [1, 4],
      [2, 8],
      [3, 16],
      [4, 32],
      [5, 64],
      [6, 96],
      [7, 128],
      [8, 192],
      [9, 256],
      [10, 384],
      [11, 512],
      [12, 768],
      [13, 1024],
    ])('%i faan discard = %i points', (faan, expectedPoints) => {
      expect(faanToPoints(faan, 'discard')).toBe(expectedPoints);
    });
  });
});
