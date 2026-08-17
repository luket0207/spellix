import { createShuffledTrackQueue } from './musicQueue';

test('creates a complete shuffled cycle without duplicate tracks', () => {
  const tracks = ['one', 'two', 'three', 'four'];
  const queue = createShuffledTrackQueue(tracks, { randomFn: () => 0 });

  expect(queue).toHaveLength(tracks.length);
  expect(new Set(queue)).toEqual(new Set(tracks));
  expect(queue).not.toEqual(tracks);
});

test('avoids starting a new cycle with the previous final track', () => {
  const queue = createShuffledTrackQueue(['one', 'two', 'three'], {
    previousTrack: 'one',
    randomFn: () => 0.99,
  });

  expect(queue).toHaveLength(3);
  expect(new Set(queue)).toEqual(new Set(['one', 'two', 'three']));
  expect(queue[0]).not.toBe('one');
});
