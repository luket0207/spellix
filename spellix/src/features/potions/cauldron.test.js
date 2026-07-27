import { POTION_DEFINITIONS } from '../../data/potions';
import { generateCauldronPotionChoices } from './cauldron';

describe('Cauldron potion choices', () => {
  test.each(POTION_DEFINITIONS.map(({ id }, index) => [id, index]))(
    'allows %s to occupy the first choice with equal catalog probability',
    (potionId, potionIndex) => {
      const randomValue = (potionIndex + 0.5) / POTION_DEFINITIONS.length;
      const choices = generateCauldronPotionChoices(() => randomValue);

      expect(choices[0].id).toBe(potionId);
    }
  );

  test('returns exactly three different potions from the complete current catalog', () => {
    const randomValues = [0, 0.5, 0.99];
    const choices = generateCauldronPotionChoices(() => randomValues.shift());

    expect(choices).toHaveLength(3);
    expect(new Set(choices.map(({ id }) => id)).size).toBe(3);
    choices.forEach((choice) => {
      expect(POTION_DEFINITIONS).toContain(choice);
    });
  });
});
