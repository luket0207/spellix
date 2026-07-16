export const REWARD_CATEGORIES = {
  COMMON_TOKEN: 'Common Token',
  RARE_TOKEN: 'Rare Token',
  COMMON_POTION: 'Common Potion',
  RARE_POTION: 'Rare Potion',
};

const REWARD_CATEGORY_ORDER = [
  REWARD_CATEGORIES.COMMON_TOKEN,
  REWARD_CATEGORIES.RARE_TOKEN,
  REWARD_CATEGORIES.COMMON_POTION,
  REWARD_CATEGORIES.RARE_POTION,
];

export const BATTLE_REWARD_CONFIGS = {
  1: {
    choiceCount: 1,
    weights: {
      [REWARD_CATEGORIES.COMMON_TOKEN]: 80,
      [REWARD_CATEGORIES.RARE_TOKEN]: 0,
      [REWARD_CATEGORIES.COMMON_POTION]: 20,
      [REWARD_CATEGORIES.RARE_POTION]: 0,
    },
  },
  2: {
    choiceCount: 2,
    weights: {
      [REWARD_CATEGORIES.COMMON_TOKEN]: 60,
      [REWARD_CATEGORIES.RARE_TOKEN]: 10,
      [REWARD_CATEGORIES.COMMON_POTION]: 25,
      [REWARD_CATEGORIES.RARE_POTION]: 5,
    },
  },
  3: {
    choiceCount: 3,
    weights: {
      [REWARD_CATEGORIES.COMMON_TOKEN]: 40,
      [REWARD_CATEGORIES.RARE_TOKEN]: 30,
      [REWARD_CATEGORIES.COMMON_POTION]: 20,
      [REWARD_CATEGORIES.RARE_POTION]: 10,
    },
  },
  4: {
    choiceCount: 3,
    weights: {
      [REWARD_CATEGORIES.COMMON_TOKEN]: 20,
      [REWARD_CATEGORIES.RARE_TOKEN]: 50,
      [REWARD_CATEGORIES.COMMON_POTION]: 5,
      [REWARD_CATEGORIES.RARE_POTION]: 25,
    },
  },
};

function selectRewardCategory(weights, randomFn) {
  const roll = randomFn() * 100;
  let cumulativeWeight = 0;

  for (const category of REWARD_CATEGORY_ORDER) {
    cumulativeWeight += weights[category];

    if (roll < cumulativeWeight) {
      return category;
    }
  }

  for (let index = REWARD_CATEGORY_ORDER.length - 1; index >= 0; index -= 1) {
    const category = REWARD_CATEGORY_ORDER[index];

    if (weights[category] > 0) {
      return category;
    }
  }

  return null;
}

export function generateRewardCategories(battleLevel, randomFn = Math.random) {
  const config = BATTLE_REWARD_CONFIGS[battleLevel];

  if (!config) {
    return [];
  }

  return Array.from({ length: config.choiceCount }, () =>
    selectRewardCategory(config.weights, randomFn)
  );
}
