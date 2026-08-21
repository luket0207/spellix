import { REWARD_CATEGORIES } from '../rewards/battleRewards';
import {
  LOOT_CHEST_REWARD_WEIGHTS,
  generateLootChestRewards,
  shuffleLootChestRewards,
} from './lootChest';

describe('lootChest', () => {
  test('defines the required loot reward weights', () => {
    expect(LOOT_CHEST_REWARD_WEIGHTS).toEqual({
      [REWARD_CATEGORIES.COMMON_TOKEN]: 40,
      [REWARD_CATEGORIES.RARE_TOKEN]: 10,
      [REWARD_CATEGORIES.COMMON_POTION]: 40,
      [REWARD_CATEGORIES.RARE_POTION]: 10,
    });
  });

  test('generates one Nothing and two unique non-Nothing categories', () => {
    const rewards = generateLootChestRewards(() => 0);
    const categories = rewards.map(({ category }) => category);

    expect(rewards).toHaveLength(3);
    expect(rewards.filter(({ itemType }) => itemType === 'nothing')).toHaveLength(1);
    expect(new Set(categories).size).toBe(3);
  });

  test.each([
    [0, REWARD_CATEGORIES.COMMON_TOKEN, 'token', 'Common'],
    [0.45, REWARD_CATEGORIES.RARE_TOKEN, 'token', 'Rare'],
    [0.55, REWARD_CATEGORIES.COMMON_POTION, 'potion', 'Common'],
    [0.95, REWARD_CATEGORIES.RARE_POTION, 'potion', 'Rare'],
  ])(
    'maps a first category roll of %s to %s',
    (categoryRoll, category, itemType, rarity) => {
      const rolls = [categoryRoll, 0, 0, 0];
      const rewards = generateLootChestRewards(() => rolls.shift() ?? 0);
      const generatedReward = rewards.find(({ itemType: type }) => type !== 'nothing');

      expect(generatedReward).toMatchObject({ category, itemType });
      expect(generatedReward.item.rarity).toBe(rarity);
      if (itemType === 'potion') {
        expect(['Board', 'Both']).toContain(generatedReward.item.availability);
      }
    }
  );

  test('shuffles complete rewards without mutating or losing their item data', () => {
    const rewards = generateLootChestRewards(() => 0);
    const originalOrder = rewards.map(({ id }) => id);
    const shuffled = shuffleLootChestRewards(rewards, () => 0);

    expect(rewards.map(({ id }) => id)).toEqual(originalOrder);
    expect(shuffled.map(({ id }) => id)).not.toEqual(originalOrder);
    expect(shuffled).toEqual(expect.arrayContaining(rewards));
  });

  test('allows every generated reward to finish in every chest position', () => {
    const rewards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const randomSequences = [
      [0, 0],
      [0, 0.999],
      [0.34, 0],
      [0.34, 0.999],
      [0.999, 0],
      [0.999, 0.999],
    ];
    const arrangements = randomSequences.map((sequence) => {
      const rolls = [...sequence];

      return shuffleLootChestRewards(rewards, () => rolls.shift()).map(
        ({ id }) => id
      );
    });

    expect(
      new Set(arrangements.map((arrangement) => arrangement.join(''))).size
    ).toBe(6);
    rewards.forEach(({ id }) => {
      [0, 1, 2].forEach((position) => {
        expect(arrangements.some((arrangement) => arrangement[position] === id)).toBe(
          true
        );
      });
    });
  });
});
