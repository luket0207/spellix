import {
  blocksBoardPotionUse,
  getHeavyWeightBoardRoll,
  isTargetPlayerPotion,
} from './targetPlayerPotions';

describe('target player potion helpers', () => {
  test.each(['spellbound', 'heavy-weight', 'troublemaker'])(
    'routes %s through other-player targeting and blocks further Board potion use',
    (potionId) => {
      const potion = { id: potionId };

      expect(isTargetPlayerPotion(potion)).toBe(true);
      expect(blocksBoardPotionUse(potion)).toBe(true);
    }
  );

  test.each([
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 3],
  ])('halves board roll %i to %i and rounds up', (originalRoll, expectedRoll) => {
    expect(getHeavyWeightBoardRoll(originalRoll)).toBe(expectedRoll);
  });
});
