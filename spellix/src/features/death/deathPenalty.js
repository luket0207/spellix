export const DEATH_TOKEN_PENALTIES = Object.freeze({
  level1BattleLoss: 1,
  level2BattleLoss: 1,
  level3BattleLoss: 2,
  level4BattleLoss: 3,
  miniGameDeath: 1,
});

export function getDeathTokenPenalty({ battleLevel, deathType = 'battle' } = {}) {
  if (deathType === 'miniGame') {
    return DEATH_TOKEN_PENALTIES.miniGameDeath;
  }

  return DEATH_TOKEN_PENALTIES[`level${battleLevel}BattleLoss`] ?? 0;
}

function getRemovableTokens(spellSlots) {
  return spellSlots.flatMap((slot, slotIndex) =>
    slot.tokens.flatMap((token, tokenIndex) =>
      token.committed && !token.protected
        ? [{ columnNumber: slotIndex + 1, slotIndex, token, tokenIndex }]
        : []
    )
  );
}

function getTokenLocationKey({ slotIndex, tokenIndex }) {
  return `${slotIndex}:${tokenIndex}`;
}

export function applyDeathTokenPenalty({
  randomFn = Math.random,
  removalCount = 0,
  spellSlots = [],
} = {}) {
  const removableTokens = getRemovableTokens(spellSlots);
  const blackTokens = removableTokens.filter(({ token }) => token.type === 'black');
  const selectedTokens = blackTokens.slice(0, Math.max(0, removalCount));
  const selectedKeys = new Set(selectedTokens.map(getTokenLocationKey));
  const randomCandidates = removableTokens.filter(
    (removableToken) =>
      removableToken.token.type !== 'black' && !selectedKeys.has(getTokenLocationKey(removableToken))
  );

  while (selectedTokens.length < removalCount && randomCandidates.length > 0) {
    const randomIndex = Math.min(
      Math.floor(randomFn() * randomCandidates.length),
      randomCandidates.length - 1
    );
    const [selectedToken] = randomCandidates.splice(randomIndex, 1);

    selectedTokens.push(selectedToken);
    selectedKeys.add(getTokenLocationKey(selectedToken));
  }

  return {
    removedTokens: selectedTokens.map(({ columnNumber, token }) => ({
      columnNumber,
      token: { ...token },
    })),
    spellSlots: spellSlots.map((slot, slotIndex) => ({
      ...slot,
      tokens: slot.tokens
        .filter((token, tokenIndex) => !selectedKeys.has(`${slotIndex}:${tokenIndex}`))
        .map((token) => ({ ...token })),
    })),
  };
}
