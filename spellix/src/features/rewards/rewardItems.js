import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import { generateRewardCategories, REWARD_CATEGORIES } from './battleRewards';

const REWARD_ITEM_REQUIREMENTS = {
  [REWARD_CATEGORIES.COMMON_TOKEN]: { itemType: 'token', rarity: 'Common' },
  [REWARD_CATEGORIES.RARE_TOKEN]: { itemType: 'token', rarity: 'Rare' },
  [REWARD_CATEGORIES.COMMON_POTION]: { itemType: 'potion', rarity: 'Common' },
  [REWARD_CATEGORIES.RARE_POTION]: { itemType: 'potion', rarity: 'Rare' },
};

function getEligibleItems(
  { itemType, rarity },
  availability,
  excludedTokenTypes = new Set()
) {
  if (itemType === 'token') {
    return Object.entries(TOKEN_DEFINITIONS)
      .filter(
        ([type, definition]) =>
          definition.rarity === rarity && !excludedTokenTypes.has(type)
      )
      .map(([type, definition]) => ({ type, ...definition }));
  }

  return POTION_DEFINITIONS.filter(
    (potion) =>
      potion.rarity === rarity &&
      (!availability ||
        potion.availability === 'Both' ||
        potion.availability === availability)
  );
}

export function generateRewardItem(
  category,
  randomFn = Math.random,
  availability = null,
  excludedTokenTypes = new Set()
) {
  const requirement = REWARD_ITEM_REQUIREMENTS[category];

  if (!requirement) {
    return null;
  }

  const eligibleItems = getEligibleItems(
    requirement,
    availability,
    excludedTokenTypes
  );

  if (eligibleItems.length === 0) {
    return null;
  }

  const selectedIndex = Math.min(
    Math.floor(randomFn() * eligibleItems.length),
    eligibleItems.length - 1
  );

  return {
    category,
    item: { ...eligibleItems[selectedIndex] },
    itemType: requirement.itemType,
  };
}

export function generateBattleRewardChoices(battleLevel, randomFn = Math.random) {
  const categories = generateRewardCategories(battleLevel, randomFn);
  const selectedTokenTypes = new Set();

  return categories.map((category, index) => {
    let reward = generateRewardItem(
      category,
      randomFn,
      'Battle',
      selectedTokenTypes
    );

    if (!reward && REWARD_ITEM_REQUIREMENTS[category]?.itemType === 'token') {
      console.warn('Battle reward token pool has no unique choices remaining.');
      reward = generateRewardItem(category, randomFn, 'Battle');
    }

    if (reward?.itemType === 'token') {
      selectedTokenTypes.add(reward.item.type);
    }

    return {
      id: `reward-choice-${index + 1}`,
      ...reward,
    };
  });
}

export function generateEliteTowerRewardChoices(randomFn = Math.random) {
  const selectedTokenTypes = new Set();

  return Array.from({ length: 3 }, (_, index) => {
    const reward = generateRewardItem(
      REWARD_CATEGORIES.RARE_TOKEN,
      randomFn,
      'Battle',
      selectedTokenTypes
    );

    if (!reward) {
      console.warn('Elite Tower reward token pool has no unique choices remaining.');
      return null;
    }

    selectedTokenTypes.add(reward.item.type);

    return {
      id: `reward-choice-${index + 1}`,
      ...reward,
    };
  }).filter(Boolean);
}
