export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 6;
export const PLAYER_COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export function clampPlayerCount(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return MIN_PLAYER_COUNT;
  }

  return Math.min(MAX_PLAYER_COUNT, Math.max(MIN_PLAYER_COUNT, numericValue));
}

export function createPlayers(playerCount, existingPlayers = []) {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    colour: existingPlayers[index]?.colour ?? PLAYER_COLOURS[index],
  }));
}

export function createInitialGameSetup() {
  return {
    playerCount: MIN_PLAYER_COUNT,
    players: createPlayers(MIN_PLAYER_COUNT),
    turnOrder: [],
    currentTurnIndex: 0,
    board: null,
  };
}

export function createTurnOrder(players, randomFn = Math.random) {
  const playerIds = players.map((player) => player.id);

  for (let index = playerIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [playerIds[index], playerIds[swapIndex]] = [playerIds[swapIndex], playerIds[index]];
  }

  return playerIds;
}

export function getCurrentPlayer(gameSetup) {
  const currentPlayerId = gameSetup.turnOrder[gameSetup.currentTurnIndex];

  return gameSetup.players.find((player) => player.id === currentPlayerId) ?? null;
}
