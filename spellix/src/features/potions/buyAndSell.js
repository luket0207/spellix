import { TOKEN_TYPES } from '../../data/tokens';

function getRandomIndex(length, randomFn) {
  return Math.min(Math.floor(randomFn() * length), length - 1);
}

export function generateBuyAndSellTokenChoices(randomFn = Math.random) {
  const firstTokenType =
    TOKEN_TYPES[getRandomIndex(TOKEN_TYPES.length, randomFn)];
  const remainingTokenTypes = TOKEN_TYPES.filter(
    (tokenType) => tokenType !== firstTokenType
  );
  const secondTokenType =
    remainingTokenTypes[getRandomIndex(remainingTokenTypes.length, randomFn)];

  return [firstTokenType, secondTokenType];
}
