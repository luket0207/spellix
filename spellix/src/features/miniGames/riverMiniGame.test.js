import { createRiverRows } from './riverMiniGame';

describe('createRiverRows', () => {
  test('creates three rows with the required safe-rock counts', () => {
    const rows = createRiverRows(() => 0.5);

    expect(rows).toHaveLength(3);
    expect(rows.map(({ rocks }) => rocks.length)).toEqual([3, 3, 3]);
    expect(
      rows.map(({ rocks }) => rocks.filter(({ isSafe }) => isSafe).length)
    ).toEqual([2, 2, 1]);
  });

  test('uses the supplied random source to vary safe rock positions', () => {
    const firstRows = createRiverRows(() => 0);
    const secondRows = createRiverRows(() => 0.99);

    expect(firstRows.map(({ rocks }) => rocks.map(({ isSafe }) => isSafe))).not.toEqual(
      secondRows.map(({ rocks }) => rocks.map(({ isSafe }) => isSafe))
    );
  });

  test('assigns three fixed, non-repeating rock images within each row', () => {
    const rows = createRiverRows(() => 0.25);

    rows.forEach(({ rocks }) => {
      expect(new Set(rocks.map(({ imageId }) => imageId)).size).toBe(3);
      expect(rocks.every(({ imageSrc }) => Boolean(imageSrc))).toBe(true);
    });

    expect(rows[0].rocks.map(({ imageId }) => imageId)).toEqual(
      rows[1].rocks.map(({ imageId }) => imageId)
    );
  });
});
