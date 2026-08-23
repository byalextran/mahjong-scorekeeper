import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { STORAGE_KEY } from '../../src/constants.js';

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

function startGame() {
  ['Alice', 'Bob', 'Carol', 'Dave'].forEach((name, index) => {
    setValue(document.getElementById(`player-${index}`), name, 'input');
  });
  document.getElementById('start-game-btn').click();
}

describe('integration: bao self-draw modal flow', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  test('records a 7 faan bao self-draw with one payer paying all shares', async () => {
    await loadApp();
    startGame();

    document.getElementById('add-game-btn').click();
    setValue(document.getElementById('winner-select'), '0');
    setValue(document.getElementById('points-input'), '7', 'input');

    const baoGroup = document.getElementById('bao-self-draw-group');
    expect(baoGroup.classList.contains('hidden')).toBe(false);

    document.getElementById('bao-self-draw-checkbox').click();
    const baoPayerGroup = document.getElementById('bao-payer-group');
    expect(baoPayerGroup.classList.contains('hidden')).toBe(false);

    setValue(document.getElementById('bao-payer-select'), '2');
    document.getElementById('submit-game-btn').click();

    const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(savedGame.players.map((player) => player.score)).toEqual([
      192,
      0,
      -192,
      0,
    ]);
    expect(savedGame.history[0].baoSelfDraw).toBe(true);
    expect(savedGame.history[0].baoPayer).toBe('Carol');
    expect(savedGame.history[0].changes).toEqual([
      { name: 'Alice', change: 192 },
      { name: 'Carol', change: -192 },
    ]);

    document.getElementById('history-btn').click();
    const historyText = document.getElementById('history-list').textContent;
    expect(historyText).toContain('Carol·bao payer');
    expect(historyText).not.toContain('Bao payer: Carol');
  });

  test('hides and clears bao controls when faans drop below 7', async () => {
    await loadApp();
    startGame();

    document.getElementById('add-game-btn').click();
    setValue(document.getElementById('winner-select'), '0');
    setValue(document.getElementById('points-input'), '7', 'input');
    document.getElementById('bao-self-draw-checkbox').click();
    setValue(document.getElementById('bao-payer-select'), '2');

    setValue(document.getElementById('points-input'), '6', 'input');

    expect(document.getElementById('bao-self-draw-group').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('bao-payer-group').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('bao-self-draw-checkbox').checked).toBe(false);
    expect(document.getElementById('bao-payer-select').value).toBe('');
  });
});
