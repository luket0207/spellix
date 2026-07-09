import { cloneTokenBag } from '../gameSetup/gameSetup';

export const DEBUG_TOKEN_TYPES = [
  'red',
  'blue',
  'orange',
  'green',
  'light-blue',
  'light-green',
  'black',
  'white',
  'purple',
  'yellow',
  'grey',
];

export const TOKEN_BAG_MAX_CAPACITY = 5;

function getPlayerTokens(player) {
  return [
    ...(player?.tokenBag ?? []),
    ...((player?.spellSlots ?? []).flatMap((slot) => slot.tokens) ?? []),
  ];
}

export function getDebugTokenTypeLabel(tokenType) {
  return tokenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function createDebugToken(player, tokenType) {
  const tokenIdPrefix = `${player.id}-${tokenType}-`;
  const nextTokenNumber =
    getPlayerTokens(player).reduce((highestNumber, token) => {
      if (!token.id.startsWith(tokenIdPrefix)) {
        return highestNumber;
      }

      const suffix = Number(token.id.slice(tokenIdPrefix.length));

      return Number.isNaN(suffix) ? highestNumber : Math.max(highestNumber, suffix);
    }, 0) + 1;

  return {
    id: `${tokenIdPrefix}${nextTokenNumber}`,
    type: tokenType,
    committed: false,
  };
}

export function canAddTokenToBag(tokenBag = []) {
  return tokenBag.length < TOKEN_BAG_MAX_CAPACITY;
}

export function addTokenToBag(tokenBag = [], token) {
  return [...cloneTokenBag(tokenBag), { ...token, committed: false }];
}

export function replaceTokenInBag(tokenBag = [], replacedTokenId, replacementToken) {
  const tokenToReplaceIndex = tokenBag.findIndex((token) => token.id === replacedTokenId);

  if (tokenToReplaceIndex < 0) {
    return tokenBag;
  }

  const nextTokenBag = cloneTokenBag(tokenBag);

  nextTokenBag.splice(tokenToReplaceIndex, 1, { ...replacementToken, committed: false });

  return nextTokenBag;
}
