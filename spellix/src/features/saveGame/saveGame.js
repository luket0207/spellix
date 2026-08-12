export const SAVE_FILE_NAME = 'spellix-save.txt';
export const SAVE_VERSION = 1;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function encodeUtf8(value) {
  return encodeURIComponent(value).replace(
    /%([0-9A-F]{2})/g,
    (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16))
  );
}

function decodeUtf8(value) {
  const encodedBytes = Array.from(
    value,
    (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
  ).join('');

  return decodeURIComponent(encodedBytes);
}

function isValidPlayer(player) {
  return (
    isPlainObject(player) &&
    typeof player.id === 'string' &&
    Number.isFinite(player.currentHealth) &&
    Number.isFinite(player.maxHealth) &&
    isPlainObject(player.position) &&
    Number.isFinite(player.position.x) &&
    Number.isFinite(player.position.y) &&
    Array.isArray(player.tokenBag) &&
    Array.isArray(player.spellSlots) &&
    Array.isArray(player.mergedColumns) &&
    Array.isArray(player.potions) &&
    Array.isArray(player.pendingPotionEffects) &&
    isPlainObject(player.eliteProgress) &&
    isPlainObject(player.villageProgress) &&
    isPlainObject(player.turnPotionUsage)
  );
}

function isValidGameState(gameState) {
  if (
    !isPlainObject(gameState) ||
    !isPlainObject(gameState.board) ||
    !Array.isArray(gameState.board.features) ||
    !Array.isArray(gameState.board.squares) ||
    !Array.isArray(gameState.players) ||
    gameState.players.length < 2 ||
    gameState.playerCount !== gameState.players.length ||
    !gameState.players.every(isValidPlayer) ||
    !Array.isArray(gameState.turnOrder) ||
    gameState.turnOrder.length !== gameState.players.length ||
    !Number.isInteger(gameState.currentTurnIndex) ||
    gameState.currentTurnIndex < 0 ||
    gameState.currentTurnIndex >= gameState.turnOrder.length ||
    !isPlainObject(gameState.eliteBossEnemyAssignments)
  ) {
    return false;
  }

  const playerIds = new Set(gameState.players.map(({ id }) => id));

  return (
    playerIds.size === gameState.players.length &&
    new Set(gameState.turnOrder).size === gameState.turnOrder.length &&
    gameState.turnOrder.every((playerId) => playerIds.has(playerId))
  );
}

export function createSaveFileText(
  gameState,
  appState = {},
  savedAt = new Date()
) {
  const json = JSON.stringify({
    appState,
    gameState,
    savedAt: savedAt.toISOString(),
    version: SAVE_VERSION,
  });

  return window.btoa(encodeUtf8(json));
}

export function parseSaveFileText(fileText) {
  const normalizedText = typeof fileText === 'string' ? fileText.trim() : '';

  if (
    normalizedText.length === 0 ||
    normalizedText.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedText)
  ) {
    throw new Error('Save file is not valid base64.');
  }

  const saveData = JSON.parse(decodeUtf8(window.atob(normalizedText)));

  if (
    !isPlainObject(saveData) ||
    saveData.version !== SAVE_VERSION ||
    typeof saveData.savedAt !== 'string' ||
    Number.isNaN(Date.parse(saveData.savedAt)) ||
    !isValidGameState(saveData.gameState) ||
    (saveData.appState !== undefined && !isPlainObject(saveData.appState))
  ) {
    throw new Error('Save file has an unsupported or invalid structure.');
  }

  return {
    appState: saveData.appState ?? {},
    gameState: saveData.gameState,
    savedAt: saveData.savedAt,
    version: saveData.version,
  };
}

export function readSaveFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('error', () => reject(new Error('Save file could not be read.')));
    reader.addEventListener('load', () => {
      try {
        resolve(parseSaveFileText(reader.result));
      } catch (error) {
        reject(error);
      }
    });
    reader.readAsText(file);
  });
}

export function downloadSaveFile(fileText) {
  const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.download = SAVE_FILE_NAME;
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
