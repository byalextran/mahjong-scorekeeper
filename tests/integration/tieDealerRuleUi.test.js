import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { STARTING_SCORE, STORAGE_KEY } from '../../src/constants.js';

const html = readFileSync(resolve('index.html'), 'utf8');

function setValue(element, value, eventType = 'change') {
  element.value = value;
  element.dispatchEvent(new Event(eventType, { bubbles: true }));
}

async function loadApp() {
  document.documentElement.innerHTML = html;
  vi.resetModules();
  await import('../../app.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

function enterPlayerNames() {
  ['Alice', 'Bob', 'Carol', 'Dave'].forEach((name, index) => {
    setValue(document.getElementById(`player-${index}`), name, 'input');
  });
}

describe('integration: tie dealer rule setup', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  test('starts new games with advance dealer as the default tie rule', async () => {
    await loadApp();
    enterPlayerNames();

    document.getElementById('start-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerRule).toBe('advance');
  });

  test('stores dealer stays when selected before starting a game', async () => {
    await loadApp();
    enterPlayerNames();
    document.querySelector('input[name="tie-dealer-rule"][value="stay"]').click();

    document.getElementById('start-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerRule).toBe('stay');
  });

  test('backfills saved games without a tie dealer rule to advance', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        players: ['Alice', 'Bob', 'Carol', 'Dave'].map((name) => ({
          name,
          score: STARTING_SCORE,
        })),
        dealerIndex: 0,
        startingDealerIndex: 0,
        roundNumber: 1,
        prevailingWind: 0,
        dealerRotations: 0,
        history: [],
        scoringVariation: 'full',
      })
    );

    await loadApp();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerRule).toBe('advance');
  });
});
