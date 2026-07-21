import {
  MINI_GAME_PUNISHMENTS,
  selectMiniGameHealthLoss,
} from './miniGamePunishment';

describe('mini game failure punishment', () => {
  test('defines the requested health-loss values and weights', () => {
    expect(MINI_GAME_PUNISHMENTS).toEqual([
      { healthLost: 10, weight: 20 },
      { healthLost: 15, weight: 18 },
      { healthLost: 20, weight: 16 },
      { healthLost: 25, weight: 12 },
      { healthLost: 30, weight: 10 },
      { healthLost: 35, weight: 9 },
      { healthLost: 40, weight: 7 },
      { healthLost: 45, weight: 5 },
      { healthLost: 50, weight: 3 },
    ]);
  });

  test.each([
    [0, 10],
    [0.19999, 10],
    [0.2, 15],
    [0.37999, 15],
    [0.38, 20],
    [0.53999, 20],
    [0.54, 25],
    [0.65999, 25],
    [0.66, 30],
    [0.75999, 30],
    [0.76, 35],
    [0.84999, 35],
    [0.85, 40],
    [0.91999, 40],
    [0.92, 45],
    [0.96999, 45],
    [0.97, 50],
    [0.99999, 50],
  ])('maps random value %p to %p health lost', (randomValue, healthLost) => {
    expect(selectMiniGameHealthLoss(() => randomValue)).toBe(healthLost);
  });
});
