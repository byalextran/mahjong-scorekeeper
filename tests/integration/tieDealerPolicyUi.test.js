import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_KEY, TIE_DEALER_POLICIES } from '../../src/constants.js';

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

function enterPlayers() {
  ['Alice', 'Bob', 'Carol', 'Dave'].forEach((name, index) => {
    setValue(document.getElementById(`player-${index}`), name, 'input');
  });
}

describe('integration: tie dealer policy setup', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  test('starts new games with advance dealer after tie by default', async () => {
    await loadApp();
    enterPlayers();

    document.getElementById('start-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerPolicy).toBe(TIE_DEALER_POLICIES.ADVANCE);
  });

  test('starts new games with keep dealer after tie when selected', async () => {
    await loadApp();
    enterPlayers();
    document.querySelector(
      `input[name="tie-dealer-policy"][value="${TIE_DEALER_POLICIES.KEEP}"]`
    ).checked = true;

    document.getElementById('start-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerPolicy).toBe(TIE_DEALER_POLICIES.KEEP);
  });

  test('keeps dealer after a tie when keep dealer is selected', async () => {
    await loadApp();
    enterPlayers();
    document.querySelector(
      `input[name="tie-dealer-policy"][value="${TIE_DEALER_POLICIES.KEEP}"]`
    ).checked = true;
    document.getElementById('start-game-btn').click();

    document.getElementById('add-game-btn').click();
    setValue(document.getElementById('winner-select'), 'tie');
    document.getElementById('submit-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.dealerIndex).toBe(0);
    expect(savedGame.dealerRotations).toBe(0);
    expect(savedGame.prevailingWind).toBe(0);
    expect(savedGame.roundNumber).toBe(2);
    expect(savedGame.history[0]).not.toHaveProperty('tieDealerPolicy');
  });

  test('loads saved games without tie dealer policy as advance dealer after tie', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        players: [
          { name: 'Alice', score: 0 },
          { name: 'Bob', score: 0 },
          { name: 'Carol', score: 0 },
          { name: 'Dave', score: 0 },
        ],
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
    document.getElementById('add-game-btn').click();
    setValue(document.getElementById('winner-select'), 'tie');
    document.getElementById('submit-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerPolicy).toBe(TIE_DEALER_POLICIES.ADVANCE);
    expect(savedGame.dealerIndex).toBe(1);
    expect(savedGame.dealerRotations).toBe(1);
  });

  test('reset returns tie dealer policy setup to advance dealer', async () => {
    await loadApp();
    enterPlayers();
    document.querySelector(
      `input[name="tie-dealer-policy"][value="${TIE_DEALER_POLICIES.KEEP}"]`
    ).checked = true;
    document.getElementById('start-game-btn').click();

    document.getElementById('reset-btn').click();
    document.getElementById('confirm-reset-btn').click();
    enterPlayers();
    document.getElementById('start-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.tieDealerPolicy).toBe(TIE_DEALER_POLICIES.ADVANCE);
  });
});
