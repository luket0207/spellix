import { TOKEN_TYPES } from '../../data/tokens';
import { generateBuyAndSellTokenChoices } from './buyAndSell';

describe('Buy and Sell token choices', () => {
  test.each(TOKEN_TYPES.map((tokenType, index) => [tokenType, index]))(
    'gives %s an equal first-choice slot',
    (tokenType, index) => {
      const randomFn = jest
        .fn()
        .mockReturnValueOnce((index + 0.01) / TOKEN_TYPES.length)
        .mockReturnValueOnce(0);

      expect(generateBuyAndSellTokenChoices(randomFn)[0]).toBe(tokenType);
    }
  );

  test('always returns two different token types from the complete pool', () => {
    const choices = generateBuyAndSellTokenChoices(
      jest.fn().mockReturnValue(0)
    );

    expect(choices).toHaveLength(2);
    expect(new Set(choices).size).toBe(2);
    choices.forEach((tokenType) =>
      expect(TOKEN_TYPES).toContain(tokenType)
    );
  });
});
