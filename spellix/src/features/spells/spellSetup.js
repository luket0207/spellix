import { cloneSpellSlots, cloneTokenBag } from '../gameSetup/gameSetup';
import { getSpellColumnCapacity } from './nonBattleSpellEffects';

export const TOKEN_BAG_DROP_ZONE_ID = 'token-bag';
export const REWARD_TOKEN_DISCARD_DROP_ZONE_ID = 'reward-discard';
const STARTING_TOKEN_COUNT = 7;

function normalizeTokens(tokens = []) {
  return [...tokens]
    .map((token) => ({
      committed: Boolean(token.committed),
      id: token.id,
      type: token.type,
    }))
    .sort((firstToken, secondToken) => firstToken.id.localeCompare(secondToken.id));
}

function normalizeSpellState({ spellSlots = [], tokenBag = [] }) {
  return {
    spellSlots: spellSlots.map((slot) => ({
      id: slot.id,
      maxTokens: slot.maxTokens,
      tokens: normalizeTokens(slot.tokens),
    })),
    tokenBag: normalizeTokens(tokenBag),
  };
}

export function countPlacedTokens(spellSlots = []) {
  return spellSlots.reduce((total, slot) => total + slot.tokens.length, 0);
}

export function isStartingSpellSetupComplete({ spellSlots = [], tokenBag = [] }) {
  const placedStartingTokenCount = spellSlots.reduce(
    (total, slot) =>
      total + slot.tokens.filter((token) => token.source === 'starting').length,
    0
  );
  const hasUnplacedStartingToken = tokenBag.some(
    (token) => token.source === 'starting'
  );

  return placedStartingTokenCount === STARTING_TOKEN_COUNT && !hasUnplacedStartingToken;
}

function findTokenLocation(tokenId, tokenBag, spellSlots) {
  const bagIndex = tokenBag.findIndex((token) => token.id === tokenId);

  if (bagIndex >= 0) {
    return {
      containerId: TOKEN_BAG_DROP_ZONE_ID,
      token: tokenBag[bagIndex],
      tokenIndex: bagIndex,
    };
  }

  for (const slot of spellSlots) {
    const tokenIndex = slot.tokens.findIndex((token) => token.id === tokenId);

    if (tokenIndex >= 0) {
      return {
        containerId: slot.id,
        token: slot.tokens[tokenIndex],
        tokenIndex,
      };
    }
  }

  return null;
}

export function moveSpellTokenInDraft({
  destinationId,
  mergedColumns = [],
  spellSlots,
  tokenBag,
  tokenId,
}) {
  if (!destinationId) {
    return {
      didMove: false,
      spellSlots,
      tokenBag,
    };
  }

  const destinationColumn = spellSlots.findIndex(({ id }) => id === destinationId) + 1;

  if (
    mergedColumns.some(({ removedColumn }) => removedColumn === destinationColumn)
  ) {
    return {
      didMove: false,
      spellSlots,
      tokenBag,
    };
  }

  const nextTokenBag = cloneTokenBag(tokenBag);
  const nextSpellSlots = cloneSpellSlots(spellSlots);
  const location = findTokenLocation(tokenId, nextTokenBag, nextSpellSlots);

  if (!location || location.token.committed || location.containerId === destinationId) {
    return {
      didMove: false,
      spellSlots,
      tokenBag,
    };
  }

  const destinationSlot =
    destinationId === TOKEN_BAG_DROP_ZONE_ID
      ? null
      : nextSpellSlots.find((slot) => slot.id === destinationId);

  if (!destinationSlot && destinationId !== TOKEN_BAG_DROP_ZONE_ID) {
    return {
      didMove: false,
      spellSlots,
      tokenBag,
    };
  }

  const destinationSlotIndex = destinationSlot
    ? nextSpellSlots.findIndex(({ id }) => id === destinationSlot.id)
    : -1;

  if (
    destinationSlot &&
    destinationSlot.tokens.length >=
      getSpellColumnCapacity(nextSpellSlots, destinationSlotIndex, mergedColumns)
  ) {
    return {
      didMove: false,
      spellSlots,
      tokenBag,
    };
  }

  const tokenToMove = { ...location.token, committed: false };

  if (location.containerId === TOKEN_BAG_DROP_ZONE_ID) {
    nextTokenBag.splice(location.tokenIndex, 1);
  } else {
    const sourceSlot = nextSpellSlots.find((slot) => slot.id === location.containerId);
    sourceSlot.tokens.splice(location.tokenIndex, 1);
  }

  if (destinationId === TOKEN_BAG_DROP_ZONE_ID) {
    nextTokenBag.push(tokenToMove);
  } else {
    destinationSlot.tokens.push(tokenToMove);
  }

  return {
    didMove: true,
    spellSlots: nextSpellSlots,
    tokenBag: nextTokenBag,
  };
}

export function createCommittedSpellData({ spellSlots, tokenBag }) {
  return {
    tokenBag: cloneTokenBag(tokenBag),
    spellSlots: cloneSpellSlots(spellSlots).map((slot) => ({
      ...slot,
      tokens: slot.tokens.map((token) => ({
        ...token,
        committed: true,
      })),
    })),
  };
}

export function hasDraftSpellChanges({
  draftSpellSlots,
  draftTokenBag,
  savedSpellSlots,
  savedTokenBag,
}) {
  const normalizedDraftState = normalizeSpellState({
    spellSlots: draftSpellSlots,
    tokenBag: draftTokenBag,
  });
  const normalizedSavedState = normalizeSpellState({
    spellSlots: savedSpellSlots,
    tokenBag: savedTokenBag,
  });

  return JSON.stringify(normalizedDraftState) !== JSON.stringify(normalizedSavedState);
}
