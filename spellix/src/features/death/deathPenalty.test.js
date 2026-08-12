import {
  applyDeathTokenPenalty,
  DEATH_TOKEN_PENALTIES,
  getDeathTokenPenalty,
} from './deathPenalty';

function createToken(id, type, { committed = true, protected: isProtected = false } = {}) {
  return {
    id,
    type,
    committed,
    protected: isProtected,
  };
}

function createSpellSlots(tokenGroups) {
  return tokenGroups.map((tokens, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens,
  }));
}

describe('death token penalty', () => {
  test('maps battle levels and future mini game deaths to removal amounts', () => {
    expect(DEATH_TOKEN_PENALTIES).toEqual({
      level1BattleLoss: 1,
      level2BattleLoss: 1,
      level3BattleLoss: 1,
      level4BattleLoss: 2,
      miniGameDeath: 1,
    });
    expect(getDeathTokenPenalty({ battleLevel: 1 })).toBe(1);
    expect(getDeathTokenPenalty({ battleLevel: 2 })).toBe(1);
    expect(getDeathTokenPenalty({ battleLevel: 3 })).toBe(1);
    expect(getDeathTokenPenalty({ battleLevel: 4 })).toBe(2);
    expect(getDeathTokenPenalty({ deathType: 'miniGame' })).toBe(1);
  });

  test('removes committed Black tokens first, then selects each random remainder separately', () => {
    const spellSlots = createSpellSlots([
      [
        createToken('starting-red', 'red', { protected: true }),
        createToken('black-1', 'black'),
        createToken('green-1', 'green'),
      ],
      [createToken('black-2', 'black'), createToken('green-2', 'green')],
      [createToken('gained-blue', 'blue'), createToken('bag-draft', 'black', { committed: false })],
    ]);
    const randomFn = jest.fn(() => 0.99);

    const result = applyDeathTokenPenalty({ randomFn, removalCount: 3, spellSlots });

    expect(result.removedTokens).toEqual([
      { columnNumber: 1, token: expect.objectContaining({ id: 'black-1', type: 'black' }) },
      { columnNumber: 2, token: expect.objectContaining({ id: 'black-2', type: 'black' }) },
      { columnNumber: 3, token: expect.objectContaining({ id: 'gained-blue', type: 'blue' }) },
    ]);
    expect(randomFn).toHaveBeenCalledTimes(1);
    expect(result.spellSlots[0].tokens.map(({ id }) => id)).toEqual([
      'starting-red',
      'green-1',
    ]);
    expect(result.spellSlots[1].tokens.map(({ id }) => id)).toEqual(['green-2']);
    expect(result.spellSlots[2].tokens.map(({ id }) => id)).toEqual(['bag-draft']);
    expect(spellSlots[0].tokens).toHaveLength(3);
  });

  test('returns separate records for duplicate removals and never removes protected or uncommitted tokens', () => {
    const spellSlots = createSpellSlots([
      [createToken('starting-blue', 'blue', { protected: true })],
      [createToken('green-1', 'green'), createToken('green-2', 'green')],
      [createToken('uncommitted-green', 'green', { committed: false })],
    ]);

    const result = applyDeathTokenPenalty({ randomFn: () => 0, removalCount: 5, spellSlots });

    expect(result.removedTokens).toEqual([
      { columnNumber: 2, token: expect.objectContaining({ id: 'green-1' }) },
      { columnNumber: 2, token: expect.objectContaining({ id: 'green-2' }) },
    ]);
    expect(result.spellSlots[0].tokens).toHaveLength(1);
    expect(result.spellSlots[2].tokens).toHaveLength(1);
  });

  test('allows later-gained Red and Blue tokens to be removed based on metadata rather than color', () => {
    const spellSlots = createSpellSlots([
      [
        createToken('starting-red', 'red', { protected: true }),
        createToken('gained-red', 'red'),
      ],
      [
        createToken('starting-blue', 'blue', { protected: true }),
        createToken('gained-blue', 'blue'),
      ],
    ]);

    const result = applyDeathTokenPenalty({ randomFn: () => 0, removalCount: 2, spellSlots });

    expect(result.removedTokens.map(({ token }) => token.id)).toEqual(['gained-red', 'gained-blue']);
    expect(result.spellSlots.flatMap(({ tokens }) => tokens).map(({ id }) => id)).toEqual([
      'starting-red',
      'starting-blue',
    ]);
  });
});
