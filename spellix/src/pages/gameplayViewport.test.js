import {
  calculateGameplayScale,
  GAMEPLAY_BASE_HEIGHT,
  GAMEPLAY_BASE_WIDTH,
} from './gameplayViewport';

describe('gameplay viewport scale', () => {
  test('keeps the natural gameplay size when the viewport can contain it', () => {
    expect(
      calculateGameplayScale({ viewportHeight: 1080, viewportWidth: 1920 })
    ).toBe(1);
  });

  test('scales from available viewport height on a short laptop screen', () => {
    expect(
      calculateGameplayScale({ viewportHeight: 768, viewportWidth: 1366 })
    ).toBeCloseTo((768 - 24) / GAMEPLAY_BASE_HEIGHT);
  });

  test('also scales from available width without changing the base aspect ratio', () => {
    expect(
      calculateGameplayScale({ viewportHeight: 1200, viewportWidth: 1000 })
    ).toBeCloseTo((1000 - 24) / GAMEPLAY_BASE_WIDTH);
  });

  test('uses an unscaled fallback when viewport dimensions are unavailable', () => {
    expect(calculateGameplayScale({})).toBe(1);
  });
});
