import { createCopyPasteDuplicate } from './copyPaste';

describe('Copy and Paste token duplication', () => {
  test('creates a separate uncommitted token with a unique player token id', () => {
    const sourceToken = {
      committed: false,
      id: 'player-1-red-2',
      protected: true,
      source: 'starting',
      type: 'red',
    };
    const player = {
      id: 'player-1',
      spellSlots: [
        {
          tokens: [
            { committed: true, id: 'player-1-red-5', type: 'red' },
          ],
        },
      ],
      tokenBag: [sourceToken],
    };

    const duplicate = createCopyPasteDuplicate(player, sourceToken);

    expect(duplicate).toEqual({
      committed: false,
      id: 'player-1-red-6',
      type: 'red',
    });
    expect(duplicate).not.toBe(sourceToken);
    expect(sourceToken.id).toBe('player-1-red-2');
  });
});
