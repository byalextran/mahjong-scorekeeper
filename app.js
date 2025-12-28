import { STORAGE_KEY, STARTING_SCORE, WINDS, WIND_CHARS, FAAN_TABLE } from './src/constants.js';
import { faanToPoints, processWin, processTie } from './src/gameLogic.js';
import { APP_VERSION, CHANGELOG } from './version.js';

let gameState = null;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const gameInfo = document.getElementById('game-info');
const gameDisplay = document.getElementById('game-display');
const windDisplay = document.getElementById('wind-display');
const playerCards = document.querySelectorAll('.player-card');

const diceModal = document.getElementById('dice-modal');
const gameModal = document.getElementById('game-modal');
const historyModal = document.getElementById('history-modal');
const resetModal = document.getElementById('reset-modal');
const changelogModal = document.getElementById('changelog-modal');
const kebabBtn = document.getElementById('kebab-btn');
const kebabDropdown = document.getElementById('kebab-dropdown');

const winnerSelect = document.getElementById('winner-select');
const winTypeGroup = document.getElementById('win-type-group');
const discarderGroup = document.getElementById('discarder-group');
const discarderSelect = document.getElementById('discarder-select');
const pointsGroup = document.getElementById('points-group');
const pointsInput = document.getElementById('points-input');
const faanError = document.getElementById('faan-error');
const historyList = document.getElementById('history-list');

const MAX_FAAN = Math.max(...Object.keys(FAAN_TABLE).map(Number));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  setupEventListeners();
});

function setupEventListeners() {
  // Setup screen
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('randomize-btn').addEventListener('click', randomizeSeating);

  // Enter key starts game from player inputs and update randomize button state
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`player-${i}`);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startGame();
      }
    });
    input.addEventListener('input', updateRandomizeButtonState);
  }

  // Game screen
  document.getElementById('roll-dice-action-btn').addEventListener('click', showAndRollDice);
  document.getElementById('add-game-btn').addEventListener('click', openGameModal);
  document.getElementById('history-btn').addEventListener('click', () => {
    closeKebabMenu();
    openHistoryModal();
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    closeKebabMenu();
    openResetModal();
  });

  // Kebab menu
  kebabBtn.addEventListener('click', toggleKebabMenu);
  document.addEventListener('click', (e) => {
    if (!kebabBtn.contains(e.target) && !kebabDropdown.contains(e.target)) {
      closeKebabMenu();
    }
  });

  // Dice modal
  document.getElementById('close-dice-btn').addEventListener('click', closeDiceModal);
  document.getElementById('close-dice-x-btn').addEventListener('click', closeDiceModal);
  document.getElementById('reroll-dice-btn').addEventListener('click', rollDice);

  // Game modal
  document.getElementById('cancel-game-btn').addEventListener('click', closeGameModal);
  document.getElementById('submit-game-btn').addEventListener('click', submitGame);
  winnerSelect.addEventListener('change', handleWinnerChange);
  document.querySelectorAll('input[name="win-type"]').forEach(radio => {
    radio.addEventListener('change', handleWinTypeChange);
  });

  // History modal
  document.getElementById('close-history-btn').addEventListener('click', closeHistoryModal);
  document.getElementById('close-history-x-btn').addEventListener('click', closeHistoryModal);

  // Reset modal
  document.getElementById('cancel-reset-btn').addEventListener('click', closeResetModal);
  document.getElementById('confirm-reset-btn').addEventListener('click', confirmReset);

  // Changelog modal
  document.getElementById('changelog-link').addEventListener('click', (e) => {
    e.preventDefault();
    openChangelogModal();
  });
  document.getElementById('close-changelog-btn').addEventListener('click', closeChangelogModal);
  document.getElementById('close-changelog-x-btn').addEventListener('click', closeChangelogModal);

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!diceModal.classList.contains('hidden')) closeDiceModal();
      if (!gameModal.classList.contains('hidden')) closeGameModal();
      if (!historyModal.classList.contains('hidden')) closeHistoryModal();
      if (!resetModal.classList.contains('hidden')) closeResetModal();
      if (!changelogModal.classList.contains('hidden')) closeChangelogModal();
    }
  });

  // Initialize version display
  initVersionDisplay();
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    gameState = JSON.parse(saved);
    // Backward compatibility: default to 'full' if not set
    if (!gameState.scoringVariation) {
      gameState.scoringVariation = 'full';
    }
    showGameScreen();
    renderUI();
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function updateRandomizeButtonState() {
  const allFilled = [0, 1, 2, 3].every(i =>
    document.getElementById(`player-${i}`).value.trim() !== ''
  );
  document.getElementById('randomize-btn').disabled = !allFilled;
}

function randomizeSeating() {
  // Collect current names from inputs
  const names = [];
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`player-${i}`);
    names.push(input.value.trim());
  }

  // Fisher-Yates shuffle
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  // Put shuffled names back into inputs
  for (let i = 0; i < 4; i++) {
    document.getElementById(`player-${i}`).value = names[i];
  }
}

function startGame() {
  const names = [];
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`player-${i}`);
    const name = input.value.trim() || `Player ${i + 1}`;
    names.push(name);
  }

  const scoringVariation = document.querySelector('input[name="scoring-variation"]:checked').value;

  gameState = {
    players: names.map(name => ({ name, score: STARTING_SCORE })),
    dealerIndex: 0,
    startingDealerIndex: 0,
    roundNumber: 1,
    prevailingWind: 0,
    dealerRotations: 0,
    history: [],
    scoringVariation
  };

  saveToLocalStorage();
  showGameScreen();
  renderUI();
}

function showGameScreen() {
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameInfo.classList.remove('hidden');
}

function renderUI() {
  if (!gameState) return;

  // Update header
  gameDisplay.textContent = `Game ${gameState.roundNumber}`;
  windDisplay.textContent = `${WIND_CHARS[gameState.prevailingWind]} ${WINDS[gameState.prevailingWind]}`;

  // Update player cards
  playerCards.forEach((card) => {
    const index = parseInt(card.dataset.player);
    const player = gameState.players[index];
    const seatWind = (index - gameState.dealerIndex + 4) % 4;
    const isDealer = index === gameState.dealerIndex;
    const isStartingDealer = index === gameState.startingDealerIndex;

    card.querySelector('.player-name').textContent = player.name;
    card.querySelector('.player-wind').textContent = `${WIND_CHARS[seatWind]} ${WINDS[seatWind]}`;

    const scoreEl = card.querySelector('.player-score');
    scoreEl.textContent = player.score;
    scoreEl.classList.remove('positive', 'negative');
    if (player.score > 0) {
      scoreEl.classList.add('positive');
    } else if (player.score < 0) {
      scoreEl.classList.add('negative');
    }

    const badge = card.querySelector('.dealer-badge');
    badge.classList.toggle('hidden', !isDealer);
    card.classList.toggle('is-dealer', isDealer);

    const startingBadge = card.querySelector('.starting-dealer-badge');
    startingBadge.classList.toggle('hidden', !isStartingDealer);
  });
}

function showAndRollDice() {
  rollDice();
  diceModal.classList.remove('hidden');
}

function closeDiceModal() {
  diceModal.classList.add('hidden');
}

function toggleKebabMenu() {
  kebabDropdown.classList.toggle('hidden');
}

function closeKebabMenu() {
  kebabDropdown.classList.add('hidden');
}

// Dot patterns for dice faces (3x3 grid positions: tl, tc, tr, ml, mc, mr, bl, bc, br)
const DICE_PATTERNS = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true]
};

function renderDie(element, value) {
  const pattern = DICE_PATTERNS[value];
  element.innerHTML = '';
  pattern.forEach((show, i) => {
    const dot = document.createElement('div');
    dot.className = 'die-dot' + (show ? ' visible' : '');
    element.appendChild(dot);
  });
}

function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const die3 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2 + die3;

  renderDie(document.getElementById('die-1'), die1);
  renderDie(document.getElementById('die-2'), die2);
  renderDie(document.getElementById('die-3'), die3);
  document.getElementById('dice-total').textContent = total;
}

function openGameModal() {
  // Populate winner select
  winnerSelect.innerHTML = '<option value="">-- Select Winner --</option>';
  winnerSelect.innerHTML += '<option value="tie">Tie (No Winner)</option>';
  gameState.players.forEach((player, index) => {
    winnerSelect.innerHTML += `<option value="${index}">${player.name}</option>`;
  });

  // Reset form
  winnerSelect.value = '';
  winTypeGroup.classList.add('hidden');
  discarderGroup.classList.add('hidden');
  pointsGroup.classList.add('hidden');
  pointsInput.value = '';
  faanError.classList.add('hidden');
  document.querySelector('input[name="win-type"][value="self-drawn"]').checked = true;

  gameModal.classList.remove('hidden');
}

function closeGameModal() {
  gameModal.classList.add('hidden');
}

function handleWinnerChange() {
  const winner = winnerSelect.value;

  if (winner === '' || winner === 'tie') {
    winTypeGroup.classList.add('hidden');
    discarderGroup.classList.add('hidden');
    pointsGroup.classList.add('hidden');
  } else {
    winTypeGroup.classList.remove('hidden');
    pointsGroup.classList.remove('hidden');
    handleWinTypeChange();
  }
}

function handleWinTypeChange() {
  const winType = document.querySelector('input[name="win-type"]:checked').value;
  const winnerIndex = parseInt(winnerSelect.value);

  if (winType === 'discard') {
    // Populate discarder select (exclude winner)
    discarderSelect.innerHTML = '<option value="">-- Select Discarder --</option>';
    gameState.players.forEach((player, index) => {
      if (index !== winnerIndex) {
        discarderSelect.innerHTML += `<option value="${index}">${player.name}</option>`;
      }
    });
    discarderGroup.classList.remove('hidden');
  } else {
    discarderGroup.classList.add('hidden');
  }
}

function submitGame() {
  const winner = winnerSelect.value;

  // Handle tie
  if (winner === 'tie') {
    handleTie();
    closeGameModal();
    return;
  }

  // Validate winner selected
  if (winner === '') {
    alert('Please select a winner or Tie.');
    return;
  }

  const winnerIndex = parseInt(winner);
  const winType = document.querySelector('input[name="win-type"]:checked').value;
  const faans = parseInt(pointsInput.value);

  // Validate faans
  if (isNaN(faans) || faans < 0 || faans > MAX_FAAN) {
    faanError.textContent = `Please enter a value between 0 and ${MAX_FAAN}.`;
    faanError.classList.remove('hidden');
    return;
  }

  const points = faanToPoints(faans, winType);

  // Validate discarder for discard win
  let discarderIndex = null;
  if (winType === 'discard') {
    const discarder = discarderSelect.value;
    if (discarder === '') {
      alert('Please select who discarded.');
      return;
    }
    discarderIndex = parseInt(discarder);
  }

  handleWin(winnerIndex, winType, discarderIndex, points, faans);
  closeGameModal();
}

function handleWin(winnerIndex, winType, discarderIndex, points, faans) {
  const result = processWin(gameState, winnerIndex, winType, discarderIndex, points, faans);
  gameState = result.newState;
  saveToLocalStorage();
  renderUI();
}

function handleTie() {
  gameState = processTie(gameState);
  saveToLocalStorage();
  renderUI();
}

function openHistoryModal() {
  if (gameState.history.length === 0) {
    historyList.innerHTML = '<p class="no-history">No games recorded yet.</p>';
  } else {
    // Reverse to show latest game first
    historyList.innerHTML = [...gameState.history].reverse().map(h => {
      let headerLeft = '';
      let bodyContent = '';

      if (h.winType === 'tie') {
        headerLeft = '<span class="winner-faan"><span class="tie-text">Tie</span></span>';
        bodyContent = '<div class="tie-text" style="font-size: 0.85rem;">No score changes</div>';
      } else {
        const faanLabel = h.faans === 1 ? 'faan' : 'faans';
        const faanText = `${h.faans} ${faanLabel}`;
        headerLeft = `<span class="winner-faan"><span class="winner-name">${h.winner}</span><span class="faan-separator">·</span><span class="faan-count">${faanText}</span></span>`;

        const allZero = h.changes.every(c => c.change === 0);
        if (allZero) {
          bodyContent = '<div class="tie-text" style="font-size: 0.85rem;">No score changes</div>';
        } else {
          const changesHtml = h.changes.map(c => {
            const cls = c.change > 0 ? 'change-positive' : 'change-negative';
            const sign = c.change > 0 ? '+' : '';
            return `<div class="history-change"><span>${c.name}</span><span class="${cls}">${sign}${c.change}</span></div>`;
          }).join('');
          bodyContent = changesHtml ? `<div class="history-changes">${changesHtml}</div>` : '';
        }
      }

      return `
                <div class="history-item">
                    <div class="card-header">
                        ${headerLeft}
                        <span class="history-game">Game ${h.game || h.round}</span>
                    </div>
                    <div class="card-body">
                        ${bodyContent}
                    </div>
                </div>
            `;
    }).join('');
  }

  historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
  historyModal.classList.add('hidden');
}

function openResetModal() {
  resetModal.classList.remove('hidden');
}

function closeResetModal() {
  resetModal.classList.add('hidden');
}

function confirmReset() {
  localStorage.removeItem(STORAGE_KEY);
  gameState = null;

  // Reset setup inputs
  for (let i = 0; i < 4; i++) {
    document.getElementById(`player-${i}`).value = '';
  }
  updateRandomizeButtonState();

  setupScreen.classList.remove('hidden');
  gameScreen.classList.add('hidden');
  gameInfo.classList.add('hidden');

  // Focus player 1 input
  document.getElementById('player-0').focus();

  closeResetModal();
}

function initVersionDisplay() {
  document.getElementById('version-display').textContent = `v${APP_VERSION}`;
}

function openChangelogModal() {
  const changelogList = document.getElementById('changelog-list');
  changelogList.innerHTML = CHANGELOG.map(entry => `
    <div class="changelog-entry">
      <div class="changelog-version">v${entry.version}</div>
      <ul class="changelog-changes">
        ${entry.changes.map(change => `<li>${change}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  changelogModal.classList.remove('hidden');
}

function closeChangelogModal() {
  changelogModal.classList.add('hidden');
}
