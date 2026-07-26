import { canAddTokenToBag } from '../debug/tokenBagAdmin';
import { getOverCapacityColumnNumbers } from '../spells/nonBattleSpellEffects';

export function createTokensmithMove({
  mergedColumns = [],
  spellSlots = [],
  tokenBag = [],
  tokenId,
}) {
  if (!canAddTokenToBag(tokenBag)) {
    return { status: 'full' };
  }

  let selectedToken = null;
  let selectedSlotIndex = -1;

  spellSlots.some((slot, slotIndex) => {
    const token = (slot.tokens ?? []).find(
      (currentToken) => currentToken.id === tokenId && currentToken.committed
    );

    if (!token) {
      return false;
    }

    selectedToken = token;
    selectedSlotIndex = slotIndex;
    return true;
  });

  if (!selectedToken) {
    return { status: 'missing' };
  }

  const nextSpellSlots = spellSlots.map((slot, slotIndex) => ({
    ...slot,
    tokens: (slot.tokens ?? [])
      .filter(
        (token) =>
          slotIndex !== selectedSlotIndex || token.id !== selectedToken.id
      )
      .map((token) => ({ ...token })),
  }));

  if (
    getOverCapacityColumnNumbers(nextSpellSlots, mergedColumns).length > 0
  ) {
    return { status: 'invalid-spell-state' };
  }

  return {
    spellSlots: nextSpellSlots,
    status: 'moved',
    tokenBag: [
      ...tokenBag.map((token) => ({ ...token })),
      { ...selectedToken, committed: false },
    ],
  };
}
