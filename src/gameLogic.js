import { FAAN_TABLE, STARTING_SCORE } from './constants.js';

/**
 * Convert faan count to points based on win type
 * @param {number} faan - Number of faans
 * @param {string} winType - 'self-drawn' or 'discard'
 * @returns {number} Points value
 */
export function faanToPoints(faan, winType) {
  if (faan <= 0) return 0;
  if (faan > 13) faan = 13; // Cap at max
  const [selfDraw, discard] = FAAN_TABLE[faan];
  return winType === 'self-drawn' ? selfDraw : discard;
}

/**
 * Calculate seat wind for a player based on dealer position
 * @param {number} playerIndex - Player index (0-3)
 * @param {number} dealerIndex - Current dealer index (0-3)
 * @returns {number} Seat wind (0=East, 1=South, 2=West, 3=North)
 */
export function getSeatWind(playerIndex, dealerIndex) {
  return (playerIndex - dealerIndex + 4) % 4;
}

/**
 * Create initial game state
 * @param {string[]} playerNames - Array of 4 player names
 * @param {string} scoringVariation - 'full' or 'half'
 * @returns {object} Initial game state
 */
export function createInitialGameState(playerNames, scoringVariation = 'full') {
  return {
    players: playerNames.map((name) => ({ name, score: STARTING_SCORE })),
    dealerIndex: 0,
    startingDealerIndex: 0,
    roundNumber: 1,
    prevailingWind: 0,
    dealerRotations: 0,
    history: [],
    scoringVariation,
  };
}

/**
 * Rotate dealer to next player and update prevailing wind if needed
 * @param {object} gameState - Current game state
 * @returns {object} New game state with updated dealer
 */
export function rotateDealer(gameState) {
  const newState = { ...gameState };
  newState.dealerIndex = (newState.dealerIndex + 1) % 4;
  newState.dealerRotations = newState.dealerRotations + 1;

  // Prevailing wind changes after all 4 players have been dealer
  if (newState.dealerRotations >= 4) {
    newState.prevailingWind = (newState.prevailingWind + 1) % 4;
    newState.dealerRotations = 0;
  }

  return newState;
}

/**
 * Process a win and update game state (pure function)
 * @param {object} gameState - Current game state
 * @param {number} winnerIndex - Index of winning player
 * @param {string} winType - 'self-drawn' or 'discard'
 * @param {number|null} discarderIndex - Index of discarder (null for self-drawn)
 * @param {number} points - Points to transfer
 * @param {number} faans - Faan count for history
 * @returns {object} Object with newState and changes array
 */
export function processWin(
  gameState,
  winnerIndex,
  winType,
  discarderIndex,
  points,
  faans
) {
  // Deep clone state
  const newState = JSON.parse(JSON.stringify(gameState));
  const changes = [];

  if (winType === 'self-drawn') {
    // All 3 losers pay the winner
    newState.players.forEach((player, index) => {
      if (index === winnerIndex) {
        player.score += points * 3;
        changes.push({ playerIndex: index, change: points * 3 });
      } else {
        player.score -= points;
        changes.push({ playerIndex: index, change: -points });
      }
    });
  } else {
    // Discard win
    if (newState.scoringVariation === 'half') {
      // Half gun: Discarder pays half, others pay quarter each
      const discarderPays = points / 2;
      const otherPay = points / 4;

      newState.players.forEach((player, index) => {
        if (index === winnerIndex) {
          player.score += points;
          changes.push({ playerIndex: index, change: points });
        } else if (index === discarderIndex) {
          player.score -= discarderPays;
          changes.push({ playerIndex: index, change: -discarderPays });
        } else {
          player.score -= otherPay;
          changes.push({ playerIndex: index, change: -otherPay });
        }
      });
    } else {
      // Full gun: Only discarder pays (default)
      newState.players[winnerIndex].score += points;
      newState.players[discarderIndex].score -= points;
      changes.push({ playerIndex: winnerIndex, change: points });
      changes.push({ playerIndex: discarderIndex, change: -points });
    }
  }

  // Record history
  newState.history.push({
    game: newState.roundNumber,
    winner: newState.players[winnerIndex].name,
    winType,
    discarder:
      discarderIndex !== null ? newState.players[discarderIndex].name : null,
    faans,
    points,
    changes: changes.map((c) => ({
      name: newState.players[c.playerIndex].name,
      change: c.change,
    })),
  });

  // Handle dealer rotation - dealer stays if they win
  if (winnerIndex !== newState.dealerIndex) {
    const rotatedState = rotateDealer(newState);
    newState.dealerIndex = rotatedState.dealerIndex;
    newState.dealerRotations = rotatedState.dealerRotations;
    newState.prevailingWind = rotatedState.prevailingWind;
  }

  newState.roundNumber++;
  return { newState, changes };
}

/**
 * Process a tie and update game state (pure function)
 * @param {object} gameState - Current game state
 * @returns {object} New game state
 */
export function processTie(gameState) {
  // Deep clone state
  const newState = JSON.parse(JSON.stringify(gameState));

  // Record history
  newState.history.push({
    game: newState.roundNumber,
    winner: null,
    winType: 'tie',
    discarder: null,
    points: 0,
    changes: [],
  });

  // Dealer rotates on tie
  const rotatedState = rotateDealer(newState);
  newState.dealerIndex = rotatedState.dealerIndex;
  newState.dealerRotations = rotatedState.dealerRotations;
  newState.prevailingWind = rotatedState.prevailingWind;

  newState.roundNumber++;
  return newState;
}

/**
 * Calculate total scores (should always be 0 for a valid game)
 * @param {object} gameState - Current game state
 * @returns {number} Sum of all player scores
 */
export function getTotalScores(gameState) {
  return gameState.players.reduce((sum, player) => sum + player.score, 0);
}
