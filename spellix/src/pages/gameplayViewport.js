export const GAMEPLAY_BASE_HEIGHT = 940;
export const GAMEPLAY_BASE_WIDTH = 1320;
export const GAMEPLAY_VIEWPORT_INSET = 24;

export function calculateGameplayScale({ viewportHeight, viewportWidth }) {
  if (
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(viewportWidth) ||
    viewportHeight <= 0 ||
    viewportWidth <= 0
  ) {
    return 1;
  }

  const availableHeight = Math.max(0, viewportHeight - GAMEPLAY_VIEWPORT_INSET);
  const availableWidth = Math.max(0, viewportWidth - GAMEPLAY_VIEWPORT_INSET);

  return Math.max(
    0,
    Math.min(
      1,
      availableHeight / GAMEPLAY_BASE_HEIGHT,
      availableWidth / GAMEPLAY_BASE_WIDTH
    )
  );
}

export function getBrowserGameplayScale() {
  if (typeof window === 'undefined') {
    return 1;
  }

  return calculateGameplayScale({
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  });
}
