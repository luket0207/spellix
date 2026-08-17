import { MUSIC_TRACKS } from './musicTracks';

test('loads all ten unique MP3 files from the music folder', () => {
  expect(MUSIC_TRACKS).toHaveLength(10);
  expect(new Set(MUSIC_TRACKS).size).toBe(10);
  MUSIC_TRACKS.forEach((track) => expect(track).toMatch(/\.mp3$/));
});
