import { DEFAULT_PLAYER_GENDER, getPlayerPieceImageName } from './pieceImages';

export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 6;
export const PLAYER_COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const DEFAULT_PLAYER_LANGUAGE = 'en';
export const PLAYER_LANGUAGES = ['en', 'jp'];
const SPELL_SLOT_COUNT = 6;
const SPELL_SLOT_CAPACITY = 5;
const STARTING_TOKEN_COUNTS = {
  red: 5,
  blue: 2,
};

function createInitialTokenBag(playerId) {
  return Object.entries(STARTING_TOKEN_COUNTS).flatMap(([type, count]) =>
    Array.from({ length: count }, (_, index) => ({
      id: `${playerId}-${type}-${index + 1}`,
      type,
      committed: false,
      protected: true,
      source: 'starting',
    }))
  );
}

export function cloneTokenBag(tokenBag = []) {
  return tokenBag.map((token) => ({ ...token }));
}

function createInitialSpellSlots() {
  return Array.from({ length: SPELL_SLOT_COUNT }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: SPELL_SLOT_CAPACITY,
    tokens: [],
  }));
}

export function cloneSpellSlots(spellSlots = []) {
  return spellSlots.map((slot) => ({
    ...slot,
    tokens: slot.tokens.map((token) => ({ ...token })),
  }));
}

export function clampPlayerCount(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return MIN_PLAYER_COUNT;
  }

  return Math.min(MAX_PLAYER_COUNT, Math.max(MIN_PLAYER_COUNT, numericValue));
}

export function createPlayers(playerCount, existingPlayers = []) {
  return Array.from({ length: playerCount }, (_, index) => {
    const playerId = `player-${index + 1}`;
    const existingPlayer = existingPlayers[index];
    const colour = existingPlayer?.colour ?? PLAYER_COLOURS[index];
    const gender = existingPlayer?.gender ?? DEFAULT_PLAYER_GENDER;

    return {
      id: playerId,
      number: index + 1,
      anywhereMode: existingPlayer?.anywhereMode ?? false,
      colour,
      currentHealth: existingPlayer?.currentHealth ?? 100,
      gender,
      hasLeftStartArea: existingPlayer?.hasLeftStartArea ?? false,
      language: existingPlayer?.language ?? DEFAULT_PLAYER_LANGUAGE,
      maxHealth: existingPlayer?.maxHealth ?? 100,
      pieceImage: getPlayerPieceImageName({ colour, gender }),
      potions: existingPlayer?.potions?.map((potion) => ({ ...potion })) ?? [],
      tokenBag: existingPlayer ? cloneTokenBag(existingPlayer.tokenBag) : createInitialTokenBag(playerId),
      spellSlots: existingPlayer
        ? cloneSpellSlots(existingPlayer.spellSlots)
        : createInitialSpellSlots(),
      hasCommittedInitialSpells: existingPlayer?.hasCommittedInitialSpells ?? false,
    };
  });
}

export function createInitialGameSetup() {
  return {
    activeBattle: null,
    pendingPotionGrant: null,
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
