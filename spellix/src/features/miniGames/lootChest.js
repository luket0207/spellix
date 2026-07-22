import { REWARD_CATEGORIES } from '../rewards/battleRewards';
import { generateRewardItem } from '../rewards/rewardItems';

const LOOT_REWARD_CATEGORY_ORDER = [
  REWARD_CATEGORIES.COMMON_TOKEN,
  REWARD_CATEGORIES.RARE_TOKEN,
  REWARD_CATEGORIES.COMMON_POTION,
  REWARD_CATEGORIES.RARE_POTION,
];

export const LOOT_CHEST_REWARD_WEIGHTS = {
  [REWARD_CATEGORIES.COMMON_TOKEN]: 40,
  [REWARD_CATEGORIES.RARE_TOKEN]: 10,
  [REWARD_CATEGORIES.COMMON_POTION]: 40,
  [REWARD_CATEGORIES.RARE_POTION]: 10,
};

function selectWeightedCategory(availableCategories, randomFn) {
  const totalWeight = availableCategories.reduce(
    (total, category) => total + LOOT_CHEST_REWARD_WEIGHTS[category],
    0
  );
  const roll = Math.min(Math.max(randomFn(), 0), 0.999999) * totalWeight;
  let cumulativeWeight = 0;

  for (const category of availableCategories) {
    cumulativeWeight += LOOT_CHEST_REWARD_WEIGHTS[category];

    if (roll < cumulativeWeight) {
      return category;
    }
  }

  return availableCategories[availableCategories.length - 1];
}

export function generateLootChestRewards(randomFn = Math.random) {
  const availableCategories = [...LOOT_REWARD_CATEGORY_ORDER];
  const generatedRewards = Array.from({ length: 2 }, (_, index) => {
    const category = selectWeightedCategory(availableCategories, randomFn);
    const categoryIndex = availableCategories.indexOf(category);

    availableCategories.splice(categoryIndex, 1);

    return {
      id: `loot-reward-${index + 1}`,
      ...generateRewardItem(category, randomFn),
    };
  });

  return [
    ...generatedRewards,
    {
      category: 'Nothing',
      id: 'loot-reward-nothing',
      itemType: 'nothing',
    },
  ];
}

export function shuffleLootChestRewards(rewards, randomFn = Math.random) {
  const shuffledRewards = rewards.map((reward) => ({ ...reward }));

  for (let index = shuffledRewards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(
      Math.min(Math.max(randomFn(), 0), 0.999999) * (index + 1)
    );

    [shuffledRewards[index], shuffledRewards[swapIndex]] = [
      shuffledRewards[swapIndex],
      shuffledRewards[index],
    ];
  }

  return shuffledRewards;
}

export function createLootChestRewardAssignment(playerId, reward) {
  if (!playerId || !['token', 'potion'].includes(reward?.itemType) || !reward.item) {
    return null;
  }

  const choiceId = `${reward.id}-choice`;

  return {
    environment: 'fields',
    phase: 'reward',
    playerId,
    rewardChoices: [
      {
        category: reward.category,
        id: choiceId,
        item: { ...reward.item },
        itemType: reward.itemType,
      },
    ],
    selectedRewardChoiceId: choiceId,
    source: 'lootChest',
  };
}

export function resolveLootChestAssignment(miniGameResult, activeBattle, destination) {
  if (
    activeBattle?.source !== 'lootChest' ||
    miniGameResult?.lootChestReward?.status !== 'processing'
  ) {
    return miniGameResult;
  }

  return {
    ...miniGameResult,
    lootChestReward: {
      ...miniGameResult.lootChestReward,
      destination,
      status: 'resolved',
    },
  };
}
