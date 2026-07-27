import {
  getMultiDiceCount,
  isMultiDicePotion,
} from './multiDice';

describe('multi-dice potion rules', () => {
  test.each([
    ['double-dice', 2],
    ['triple-dice', 3],
  ])('%s uses the required number of board dice', (potionId, expectedCount) => {
    expect(isMultiDicePotion({ id: potionId })).toBe(true);
    expect(getMultiDiceCount({ id: potionId })).toBe(expectedCount);
  });

  test('normal and unrelated potion rolls keep one die', () => {
    expect(isMultiDicePotion({ id: 'small-heal' })).toBe(false);
    expect(getMultiDiceCount({ id: 'small-heal' })).toBe(1);
    expect(getMultiDiceCount(null)).toBe(1);
  });
});
