import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import { REWARD_CATEGORIES } from './battleRewards';
import { generateBattleRewardChoices, generateRewardItem } from './rewardItems';

function getExpectedTokenTypes(rarity) {
  return Object.entries(TOKEN_DEFINITIONS)
    .filter(([, definition]) => definition.rarity === rarity)
    .map(([type]) => type);
}

function getExpectedPotionIds(rarity, availability = null) {
  return POTION_DEFINITIONS.filter(
    (potion) =>
      potion.rarity === rarity &&
      (!availability ||
        potion.availability === 'Both' ||
        potion.availability === availability)
  ).map(({ id }) => id);
}

function selectEveryItem(category, itemCount, availability) {
  return Array.from({ length: itemCount }, (_, index) =>
    generateRewardItem(
      category,
      () => (index + 0.5) / itemCount,
      availability
    )
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
          description: { en: 'Plus 10 Damage', jp: 'ダメージ＋10' },
          label: 'Red',
          name: { en: 'Damage', jp: 'ダメージ' },
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

  test('generates distinct token types when repeated rolls select one token category', () => {
    const choices = generateBattleRewardChoices(3, () => 0);

    expect(choices.map(({ item }) => item.type)).toEqual([
      'red',
      'blue',
      'orange',
    ]);
  });

  test('allows common and shiny versions of one colour as distinct token choices', () => {
    const rolls = [0, 0.65, 0, 0.45];
    const choices = generateBattleRewardChoices(2, () => rolls.shift());

    expect(choices.map(({ item }) => item.type)).toEqual([
      'red',
      'red-yellow-outline',
    ]);
  });

  test('warns and safely falls back when a token pool has no unique option left', () => {
    const commonDefinitions = Object.values(TOKEN_DEFINITIONS).filter(
      ({ rarity }) => rarity === 'Common'
    );
    const originalRarities = commonDefinitions.map(({ rarity }) => rarity);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    commonDefinitions.slice(1).forEach((definition) => {
      definition.rarity = 'Rare';
    });

    try {
      const choices = generateBattleRewardChoices(3, () => 0);

      expect(choices).toHaveLength(3);
      expect(choices.map(({ item }) => item.type)).toEqual(['red', 'red', 'red']);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      commonDefinitions.forEach((definition, index) => {
        definition.rarity = originalRarities[index];
      });
      warnSpy.mockRestore();
    }
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

  test.each([
    ['Battle', REWARD_CATEGORIES.COMMON_POTION, 'Common'],
    ['Battle', REWARD_CATEGORIES.RARE_POTION, 'Rare'],
    ['Board', REWARD_CATEGORIES.COMMON_POTION, 'Common'],
    ['Board', REWARD_CATEGORIES.RARE_POTION, 'Rare'],
  ])(
    'selects only %s-compatible %s potions',
    (availability, category, rarity) => {
      const expectedIds = getExpectedPotionIds(rarity, availability);
      const selectedIds = selectEveryItem(
        category,
        expectedIds.length,
        availability
      ).map(({ item }) => item.id);

      expect(selectedIds).toEqual(expectedIds);
    }
  );

  test('includes outlined tokens in rare pools and excludes them from common pools', () => {
    const outlinedTypes = [
      'red-yellow-outline',
      'blue-yellow-outline',
      'orange-yellow-outline',
      'green-yellow-outline',
      'light-green-yellow-outline',
    ];

    expect(getExpectedTokenTypes('Rare')).toEqual(
      expect.arrayContaining(outlinedTypes)
    );
    expect(getExpectedTokenTypes('Common')).not.toEqual(
      expect.arrayContaining(outlinedTypes)
    );
  });

  test('includes the new potions only in their matching Board reward pools', () => {
    const commonBoardIds = selectEveryItem(
      REWARD_CATEGORIES.COMMON_POTION,
      getExpectedPotionIds('Common', 'Board').length,
      'Board'
    ).map(({ item }) => item.id);
    const rareBoardIds = selectEveryItem(
      REWARD_CATEGORIES.RARE_POTION,
      getExpectedPotionIds('Rare', 'Board').length,
      'Board'
    ).map(({ item }) => item.id);
    const battleIds = [
      ...selectEveryItem(
        REWARD_CATEGORIES.COMMON_POTION,
        getExpectedPotionIds('Common', 'Battle').length,
        'Battle'
      ),
      ...selectEveryItem(
        REWARD_CATEGORIES.RARE_POTION,
        getExpectedPotionIds('Rare', 'Battle').length,
        'Battle'
      ),
    ].map(({ item }) => item.id);

    expect(commonBoardIds).toContain('spellbound');
    expect(rareBoardIds).toContain('triple-dice');
    expect(battleIds).not.toEqual(
      expect.arrayContaining(['spellbound', 'triple-dice'])
    );
  });

  test('keeps board-only potions out of generated battle choices', () => {
    const choices = generateBattleRewardChoices(4, () => 0.9999);
    const potionChoices = choices.filter(({ itemType }) => itemType === 'potion');

    expect(
      potionChoices.every(({ item }) =>
        ['Battle', 'Both'].includes(item.availability)
      )
    ).toBe(true);
  });

  test('keeps Mini potions out of standard pools and exposes them to Mini contexts', () => {
    const miniPotionIds = ['bridge-builder', 'good-decisions', 'cave-runner'];
    const boardIds = selectEveryItem(
      REWARD_CATEGORIES.COMMON_POTION,
      getExpectedPotionIds('Common', 'Board').length,
      'Board'
    ).map(({ item }) => item.id);
    const battleIds = selectEveryItem(
      REWARD_CATEGORIES.COMMON_POTION,
      getExpectedPotionIds('Common', 'Battle').length,
      'Battle'
    ).map(({ item }) => item.id);
    const miniIds = selectEveryItem(
      REWARD_CATEGORIES.COMMON_POTION,
      getExpectedPotionIds('Common', 'Mini').length,
      'Mini'
    ).map(({ item }) => item.id);

    expect(boardIds).not.toEqual(expect.arrayContaining(miniPotionIds));
    expect(battleIds).not.toEqual(expect.arrayContaining(miniPotionIds));
    expect(miniIds).toEqual(expect.arrayContaining(miniPotionIds));
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
