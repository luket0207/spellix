import {
  BATTLE_REWARD_CONFIGS,
  generateRewardCategories,
  REWARD_CATEGORIES,
} from './battleRewards';

const {
  COMMON_POTION,
  COMMON_TOKEN,
  RARE_POTION,
  RARE_TOKEN,
} = REWARD_CATEGORIES;

describe('battleRewards', () => {
  test('defines the exact choice counts and weighted categories for every battle level', () => {
    expect(BATTLE_REWARD_CONFIGS).toEqual({
      1: {
        choiceCount: 1,
        weights: {
          [COMMON_TOKEN]: 80,
          [RARE_TOKEN]: 0,
          [COMMON_POTION]: 20,
          [RARE_POTION]: 0,
        },
      },
      2: {
        choiceCount: 2,
        weights: {
          [COMMON_TOKEN]: 60,
          [RARE_TOKEN]: 10,
          [COMMON_POTION]: 25,
          [RARE_POTION]: 5,
        },
      },
      3: {
        choiceCount: 3,
        weights: {
          [COMMON_TOKEN]: 40,
          [RARE_TOKEN]: 30,
          [COMMON_POTION]: 20,
          [RARE_POTION]: 10,
        },
      },
      4: {
        choiceCount: 3,
        weights: {
          [COMMON_TOKEN]: 20,
          [RARE_TOKEN]: 50,
          [COMMON_POTION]: 5,
          [RARE_POTION]: 25,
        },
      },
    });
  });

  test.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 3],
  ])('creates the required choice count for a level %i win', (battleLevel, choiceCount) => {
    expect(generateRewardCategories(battleLevel, () => 0)).toHaveLength(choiceCount);
  });

  test.each([
    [1, 0.7999, COMMON_TOKEN],
    [1, 0.8, COMMON_POTION],
    [2, 0.5999, COMMON_TOKEN],
    [2, 0.6, RARE_TOKEN],
    [2, 0.7, COMMON_POTION],
    [2, 0.95, RARE_POTION],
    [3, 0.3999, COMMON_TOKEN],
    [3, 0.4, RARE_TOKEN],
    [3, 0.7, COMMON_POTION],
    [3, 0.9, RARE_POTION],
    [4, 0.1999, COMMON_TOKEN],
    [4, 0.2, RARE_TOKEN],
    [4, 0.7, COMMON_POTION],
    [4, 0.75, RARE_POTION],
  ])(
    'maps a level %i roll of %f to %s',
    (battleLevel, randomValue, expectedCategory) => {
      expect(generateRewardCategories(battleLevel, () => randomValue)[0]).toBe(
        expectedCategory
      );
    }
  );

  test('rolls each choice independently', () => {
    const randomValues = [0.1, 0.5, 0.8];

    expect(generateRewardCategories(3, () => randomValues.shift())).toEqual([
      COMMON_TOKEN,
      RARE_TOKEN,
      COMMON_POTION,
    ]);
  });

  test('returns no choices for an unsupported battle level', () => {
    expect(generateRewardCategories(0, () => 0)).toEqual([]);
    expect(generateRewardCategories(5, () => 0)).toEqual([]);
  });
});
