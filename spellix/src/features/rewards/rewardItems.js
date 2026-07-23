import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import { generateRewardCategories, REWARD_CATEGORIES } from './battleRewards';

const REWARD_ITEM_REQUIREMENTS = {
  [REWARD_CATEGORIES.COMMON_TOKEN]: { itemType: 'token', rarity: 'Common' },
  [REWARD_CATEGORIES.RARE_TOKEN]: { itemType: 'token', rarity: 'Rare' },
  [REWARD_CATEGORIES.COMMON_POTION]: { itemType: 'potion', rarity: 'Common' },
  [REWARD_CATEGORIES.RARE_POTION]: { itemType: 'potion', rarity: 'Rare' },
};

function getEligibleItems({ itemType, rarity }, availability) {
  if (itemType === 'token') {
    return Object.entries(TOKEN_DEFINITIONS)
      .filter(([, definition]) => definition.rarity === rarity)
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
  availability = null
) {
  const requirement = REWARD_ITEM_REQUIREMENTS[category];

  if (!requirement) {
    return null;
  }

  const eligibleItems = getEligibleItems(requirement, availability);

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

  return categories.map((category, index) => ({
    id: `reward-choice-${index + 1}`,
    ...generateRewardItem(category, randomFn, 'Battle'),
  }));
}
