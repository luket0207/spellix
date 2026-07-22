import { canAddTokenToBag } from '../debug/tokenBagAdmin';
import {
  REWARD_TOKEN_DISCARD_DROP_ZONE_ID,
  TOKEN_BAG_DROP_ZONE_ID,
} from '../spells/spellSetup';
import { getSpellColumnCapacity } from '../spells/nonBattleSpellEffects';

export function getRewardSpellSlotDropId({
  destinationId,
  mergedColumns = [],
  rewardTokenId,
  spellSlots = [],
  tokenId,
}) {
  if (tokenId !== rewardTokenId) {
    return '';
  }

  const destinationSlot = spellSlots.find(({ id }) => id === destinationId);
  const destinationSlotIndex = spellSlots.findIndex(({ id }) => id === destinationId);
  const destinationColumn = destinationSlotIndex + 1;

  if (
    !destinationSlot ||
    mergedColumns.some(({ removedColumn }) => removedColumn === destinationColumn) ||
    destinationSlot.tokens.length >=
      getSpellColumnCapacity(spellSlots, destinationSlotIndex, mergedColumns)
  ) {
    return '';
  }

  return destinationSlot.id;
}

export function isRewardTokenBagDrop({
  destinationId,
  rewardTokenId,
  tokenBag = [],
  tokenId,
}) {
  return (
    tokenId === rewardTokenId &&
    destinationId === TOKEN_BAG_DROP_ZONE_ID &&
    canAddTokenToBag(tokenBag)
  );
}

export function isRewardTokenFullBagDrop({
  destinationId,
  rewardTokenId,
  tokenBag = [],
  tokenId,
}) {
  return (
    tokenId === rewardTokenId &&
    destinationId === TOKEN_BAG_DROP_ZONE_ID &&
    !canAddTokenToBag(tokenBag)
  );
}

export function isRewardTokenDiscardDrop({
  destinationId,
  rewardTokenId,
  tokenId,
}) {
  return (
    tokenId === rewardTokenId &&
    destinationId === REWARD_TOKEN_DISCARD_DROP_ZONE_ID
  );
}

export function getBagTokenDiscardReplacementId({
  destinationId,
  tokenBag = [],
  tokenId,
}) {
  if (
    destinationId !== REWARD_TOKEN_DISCARD_DROP_ZONE_ID ||
    canAddTokenToBag(tokenBag)
  ) {
    return '';
  }

  return tokenBag.find(({ id }) => id === tokenId)?.id ?? '';
}

export function getRequestedBagTokenReplacementId({
  isReplacementRequested,
  tokenBag = [],
  tokenId,
}) {
  if (!isReplacementRequested || canAddTokenToBag(tokenBag)) {
    return '';
  }

  return tokenBag.find(({ id }) => id === tokenId)?.id ?? '';
}
