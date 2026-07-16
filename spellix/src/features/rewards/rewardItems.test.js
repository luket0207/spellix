import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import { REWARD_CATEGORIES } from './battleRewards';
import { generateBattleRewardChoices, generateRewardItem } from './rewardItems';

function getExpectedTokenTypes(rarity) {
  return Object.entries(TOKEN_DEFINITIONS)
    .filter(([, definition]) => definition.rarity === rarity)
    .map(([type]) => type);
}

function getExpectedPotionIds(rarity) {
  return POTION_DEFINITIONS.filter((potion) => potion.rarity === rarity).map(({ id }) => id);
}

function selectEveryItem(category, itemCount) {
  return Array.from({ length: itemCount }, (_, index) =>
    generateRewardItem(category, () => (index + 0.5) / itemCount)
  );
}

describe('rewardItems', () => {
  test.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 3],
  ])('generates the configured reward choice count for level %i', (battleLevel, choiceCount) => {
    const choices = generateBattleRewardChoices(battleLevel, () => 0);

    expect(choices).toHaveLength(choiceCount);
    expect(choices.map(({ id }) => id)).toEqual(
      Array.from({ length: choiceCount }, (_, index) => `reward-choice-${index + 1}`)
    );
    expect(choices.every(({ item }) => Boolean(item))).toBe(true);
  });

  test('generates all categories before selecting their exact items', () => {
    const rolls = [0.1, 0.96, 0, 0];
    const choices = generateBattleRewardChoices(2, () => rolls.shift());

    expect(choices).toEqual([
      {
        category: REWARD_CATEGORIES.COMMON_TOKEN,
        id: 'reward-choice-1',
        item: {
          description: 'Plus 10 Damage',
          label: 'Red',
          rarity: 'Common',
          type: 'red',
        },
        itemType: 'token',
      },
      {
        category: REWARD_CATEGORIES.RARE_POTION,
        id: 'reward-choice-2',
        item: POTION_DEFINITIONS[0],
        itemType: 'potion',
      },
    ]);
  });

  test('returns no complete choices for an unsupported battle level', () => {
    expect(generateBattleRewardChoices(5, () => 0)).toEqual([]);
  });

  test.each([
    [REWARD_CATEGORIES.COMMON_TOKEN, 'token', 'Common'],
    [REWARD_CATEGORIES.RARE_TOKEN, 'token', 'Rare'],
    [REWARD_CATEGORIES.COMMON_POTION, 'potion', 'Common'],
    [REWARD_CATEGORIES.RARE_POTION, 'potion', 'Rare'],
  ])('maps %s to a %s item with %s rarity', (category, itemType, rarity) => {
    const reward = generateRewardItem(category, () => 0);

    expect(reward.category).toBe(category);
    expect(reward.itemType).toBe(itemType);
    expect(reward.item.rarity).toBe(rarity);
  });

  test.each([
    [REWARD_CATEGORIES.COMMON_TOKEN, 'Common'],
    [REWARD_CATEGORIES.RARE_TOKEN, 'Rare'],
  ])('selects every eligible token for %s from centralized token data', (category, rarity) => {
    const expectedTypes = getExpectedTokenTypes(rarity);
    const selectedTypes = selectEveryItem(category, expectedTypes.length).map(
      ({ item }) => item.type
    );

    expect(selectedTypes).toEqual(expectedTypes);
    expect(selectedTypes).not.toEqual(
      expect.arrayContaining(getExpectedTokenTypes(rarity === 'Common' ? 'Rare' : 'Common'))
    );
  });

  test.each([
    [REWARD_CATEGORIES.COMMON_POTION, 'Common'],
    [REWARD_CATEGORIES.RARE_POTION, 'Rare'],
  ])('selects every eligible potion for %s from centralized potion data', (category, rarity) => {
    const expectedIds = getExpectedPotionIds(rarity);
    const selectedIds = selectEveryItem(category, expectedIds.length).map(({ item }) => item.id);

    expect(selectedIds).toEqual(expectedIds);
    expect(selectedIds).not.toEqual(
      expect.arrayContaining(getExpectedPotionIds(rarity === 'Common' ? 'Rare' : 'Common'))
    );
  });

  test('returns independent item data without mutating the potion catalog', () => {
    const reward = generateRewardItem(REWARD_CATEGORIES.RARE_POTION, () => 0);
    const catalogPotion = POTION_DEFINITIONS.find(({ id }) => id === reward.item.id);

    expect(reward.item).toEqual(catalogPotion);
    expect(reward.item).not.toBe(catalogPotion);
  });

  test('uses the final eligible item for a random value at the upper boundary', () => {
    const expectedRarePotionIds = getExpectedPotionIds('Rare');
    const reward = generateRewardItem(REWARD_CATEGORIES.RARE_POTION, () => 0.9999);

    expect(reward.item.id).toBe(expectedRarePotionIds[expectedRarePotionIds.length - 1]);
  });

  test('returns null for an unsupported reward category', () => {
    expect(generateRewardItem('Unknown Reward', () => 0)).toBeNull();
  });
});
