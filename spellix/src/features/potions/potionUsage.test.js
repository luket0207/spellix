import { canUsePotionInContext } from './potionUsage';

describe('canUsePotionInContext', () => {
  test.each([
    ['Board', 'board', true],
    ['Both', 'board', true],
    ['Battle', 'board', false],
    ['Mini', 'board', false],
    ['Battle', 'battle', true],
    ['Both', 'battle', true],
    ['Board', 'battle', false],
    ['Mini', 'battle', false],
    ['Mini', 'mini', true],
    ['Both', 'mini', false],
  ])(
    'returns %s for a %s potion in the %s context',
    (availability, context, expected) => {
      expect(canUsePotionInContext({ availability }, context)).toBe(expected);
    }
  );

  test('returns false for missing potions and unknown contexts', () => {
    expect(canUsePotionInContext(null, 'board')).toBe(false);
    expect(canUsePotionInContext({ availability: 'Board' }, 'unknown')).toBe(
      false
    );
  });
});
