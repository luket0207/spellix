import {
  POTION_MAX_CAPACITY,
  gainPotion,
  resolvePendingPotion,
} from './potionCapacity';

const potions = [
  { id: 'roll-choice', name: 'Roll Choice' },
  { id: 'small-heal', name: 'Small Heal' },
  { id: 'ice-beam', name: 'Ice Beam' },
];

describe('potionCapacity', () => {
  test.each([0, 2])(
    'adds a potion immediately when the player currently has %i',
    (currentPotionCount) => {
      const currentPotions = potions.slice(0, currentPotionCount);

      const result = gainPotion(currentPotions, potions[2]);

      expect(result).toEqual({
        pendingPotion: null,
        potions: [...currentPotions, potions[2]],
      });
    }
  );

  test('sets the maximum capacity at three potions', () => {
    expect(POTION_MAX_CAPACITY).toBe(3);
  });

  test('keeps the new potion pending when the player already has three', () => {
    const newPotion = { id: 'heal', name: 'Heal' };
    const result = gainPotion(potions, newPotion);

    expect(result).toEqual({
      pendingPotion: newPotion,
      potions,
    });
    expect(result.potions).toHaveLength(3);
    expect(result.potions).not.toBe(potions);
    expect(result.pendingPotion).not.toBe(newPotion);
  });

  test('discards the pending potion without changing the current collection', () => {
    const result = resolvePendingPotion({
      pendingPotion: { id: 'heal', name: 'Heal' },
      potions,
    });

    expect(result).toEqual(potions);
    expect(result).not.toBe(potions);
  });

  test('replaces the selected current potion and never creates a fourth slot', () => {
    const pendingPotion = { id: 'heal', name: 'Heal' };
    const result = resolvePendingPotion({
      pendingPotion,
      potions,
      replacedPotionIndex: 1,
    });

    expect(result).toEqual([potions[0], pendingPotion, potions[2]]);
    expect(result).toHaveLength(3);
    expect(result[1]).not.toBe(pendingPotion);
    expect(potions[1]).toEqual({ id: 'small-heal', name: 'Small Heal' });
  });

  test('treats an invalid replacement selection as discarding the new potion', () => {
    const result = resolvePendingPotion({
      pendingPotion: { id: 'heal', name: 'Heal' },
      potions,
      replacedPotionIndex: 3,
    });

    expect(result).toEqual(potions);
    expect(result).toHaveLength(3);
  });
});
