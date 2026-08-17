import { DEFAULT_PLAYER_GENDER, getPlayerPieceImageName } from './pieceImages';
import { applyLightGreenHealthBonus } from '../spells/nonBattleSpellEffects';
import { selectEliteBossEnemyAssignments } from '../gameBoard/eliteBossEncounters';
import {
  createVillageActionState,
  createVillageProgress,
} from '../villages/villageVisits';

export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 6;
export const PLAYER_COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const DEFAULT_PLAYER_LANGUAGE = 'en';
export const PLAYER_LANGUAGES = ['en', 'jp'];
const SPELL_SLOT_COUNT = 6;
const SPELL_SLOT_CAPACITY = 5;
export const STARTING_TOKEN_COUNT = 5;
const STARTING_TOKEN_COUNTS = {
  red: STARTING_TOKEN_COUNT,
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

    const player = {
      activePotion: existingPlayer?.activePotion
        ? { ...existingPlayer.activePotion }
        : null,
      id: playerId,
      number: index + 1,
      anywhereMode: existingPlayer?.anywhereMode ?? false,
      baseMaxHealth: existingPlayer?.baseMaxHealth ?? existingPlayer?.maxHealth ?? 100,
      columnMergesUsed:
        existingPlayer?.columnMergesUsed ?? existingPlayer?.mergedColumns?.length ?? 0,
      colour,
      currentHealth: existingPlayer?.currentHealth ?? 100,
      diedLastTurn: Boolean(existingPlayer?.diedLastTurn),
      eliteProgress: {
        eliteTowerGravel: Boolean(
          existingPlayer?.eliteProgress?.eliteTowerGravel
        ),
        eliteTowerWoods: Boolean(
          existingPlayer?.eliteProgress?.eliteTowerWoods
        ),
      },
      gender,
      hasLeftStartArea: existingPlayer?.hasLeftStartArea ?? false,
      hasUnseenTokenBagTokens:
        existingPlayer?.hasUnseenTokenBagTokens ??
        (existingPlayer ? Boolean(existingPlayer.tokenBag?.length) : true),
      language: existingPlayer?.language ?? DEFAULT_PLAYER_LANGUAGE,
      maxHealth: existingPlayer?.maxHealth ?? 100,
      mergedColumns:
        existingPlayer?.mergedColumns?.map((merge) => ({
          ...merge,
          columns: [...merge.columns],
        })) ?? [],
      nextForcedRoll: existingPlayer?.nextForcedRoll
        ? { ...existingPlayer.nextForcedRoll }
        : null,
      nextBoardDiceCount: existingPlayer?.nextBoardDiceCount ?? null,
      pendingPotionEffects:
        existingPlayer?.pendingPotionEffects?.map((effect) => ({ ...effect })) ?? [],
      pieceImage: getPlayerPieceImageName({ colour, gender }),
      potions: existingPlayer?.potions?.map((potion) => ({ ...potion })) ?? [],
      skipNextTurn: Boolean(existingPlayer?.skipNextTurn),
      tokenBag: existingPlayer ? cloneTokenBag(existingPlayer.tokenBag) : createInitialTokenBag(playerId),
      spellSlots: existingPlayer
        ? cloneSpellSlots(existingPlayer.spellSlots)
        : createInitialSpellSlots(),
      hasCommittedInitialSpells: existingPlayer?.hasCommittedInitialSpells ?? false,
      turnPotionUsage: {
        ...existingPlayer?.turnPotionUsage,
        boardPotionUsedThisTurn: Boolean(
          existingPlayer?.turnPotionUsage?.boardPotionUsedThisTurn
        ),
      },
      villageProgress: createVillageProgress(existingPlayer?.villageProgress),
      villageActionState: createVillageActionState(
        existingPlayer?.villageActionState
      ),
    };

    return applyLightGreenHealthBonus(player, player.spellSlots);
  });
}

export function createInitialGameSetup() {
  return {
    activeBattle: null,
    buyAndSellTransaction: null,
    cauldronChoiceState: null,
    devineChanceResult: null,
    debugMode: false,
    hasRolledMovementDice: false,
    miniGameResult: null,
    miniGameReturnNotice: null,
    pendingNextTurnModal: false,
    pendingTurnRespawn: null,
    pendingPotionGrant: null,
    stormMasterEffect: null,
    stormMasterPendingPlayerId: null,
    stormMasterResult: null,
    troublemakerResult: null,
    villageVisit: null,
    playerCount: MIN_PLAYER_COUNT,
    players: createPlayers(MIN_PLAYER_COUNT),
    turnOrder: [],
    currentTurnIndex: 0,
    board: null,
    eliteBossEnemyAssignments: selectEliteBossEnemyAssignments(),
    winnerDisplay: null,
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
