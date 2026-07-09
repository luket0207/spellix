import {
  addTokenToBag,
  canAddTokenToBag,
  createDebugToken,
  replaceTokenInBag,
} from './tokenBagAdmin';

describe('tokenBagAdmin', () => {
  test('creates a unique debug token id based on the player token history', () => {
    const player = {
      id: 'player-1',
      spellSlots: [
        {
          id: 'slot-1',
          maxTokens: 5,
          tokens: [
            { id: 'player-1-red-1', type: 'red', committed: true },
            { id: 'player-1-red-5', type: 'red', committed: true },
          ],
        },
      ],
      tokenBag: [
        { id: 'player-1-red-2', type: 'red', committed: false },
        { id: 'player-1-blue-1', type: 'blue', committed: false },
      ],
    };

    expect(createDebugToken(player, 'red')).toEqual({
      id: 'player-1-red-6',
      type: 'red',
      committed: false,
    });
  });

  test('reports whether the token bag is below capacity', () => {
    expect(canAddTokenToBag([{ id: '1' }, { id: '2' }])).toBe(true);
    expect(
      canAddTokenToBag([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }])
    ).toBe(false);
  });

  test('adds a new uncommitted token to the bag', () => {
    const nextTokenBag = addTokenToBag([{ id: 'player-1-red-1', type: 'red', committed: false }], {
      id: 'player-1-blue-1',
      type: 'blue',
      committed: true,
    });

    expect(nextTokenBag).toEqual([
      { id: 'player-1-red-1', type: 'red', committed: false },
      { id: 'player-1-blue-1', type: 'blue', committed: false },
    ]);
  });

  test('replaces one existing bag token while keeping bag size unchanged', () => {
    const nextTokenBag = replaceTokenInBag(
      [
        { id: 'player-1-red-1', type: 'red', committed: false },
        { id: 'player-1-blue-1', type: 'blue', committed: false },
      ],
      'player-1-red-1',
      { id: 'player-1-purple-1', type: 'purple', committed: false }
    );

    expect(nextTokenBag).toEqual([
      { id: 'player-1-purple-1', type: 'purple', committed: false },
      { id: 'player-1-blue-1', type: 'blue', committed: false },
    ]);
  });
});
