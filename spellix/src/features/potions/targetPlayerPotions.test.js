import { getHeavyWeightBoardRoll } from './targetPlayerPotions';

describe('target player potion helpers', () => {
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
