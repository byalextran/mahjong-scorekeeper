import { describe, test, expect } from 'vitest';
import { faanToPoints } from '../../src/gameLogic.js';

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

    test('faan above 13 is capped at 13', () => {
      expect(faanToPoints(15, 'self-drawn')).toBe(faanToPoints(13, 'self-drawn'));
      expect(faanToPoints(20, 'discard')).toBe(faanToPoints(13, 'discard'));
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
