import { createTokensmithMove } from './tokensmith';

function createSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

test('moves the exact committed token back to the bag as uncommitted', () => {
  const spellSlots = createSpellSlots();
  const selectedToken = {
    committed: true,
    id: 'player-1-red-2',
    protected: true,
    source: 'starting',
    type: 'red',
  };

  spellSlots[0].tokens = [
    { committed: true, id: 'player-1-red-1', type: 'red' },
    selectedToken,
  ];

  const result = createTokensmithMove({
    spellSlots,
    tokenBag: [{ committed: false, id: 'player-1-blue-1', type: 'blue' }],
    tokenId: selectedToken.id,
  });

  expect(result.status).toBe('moved');
  expect(result.spellSlots[0].tokens).toEqual([
    { committed: true, id: 'player-1-red-1', type: 'red' },
  ]);
  expect(result.tokenBag[1]).toEqual({
    ...selectedToken,
    committed: false,
  });
  expect(spellSlots[0].tokens).toHaveLength(2);
});

test('rejects full bags, missing tokens, and moves that invalidate Grey capacity', () => {
  const fullBag = Array.from({ length: 5 }, (_, index) => ({
    committed: false,
    id: `bag-${index + 1}`,
    type: 'red',
  }));
  const spellSlots = createSpellSlots();

  spellSlots[0].tokens = Array.from({ length: 6 }, (_, index) => ({
    committed: true,
    id: `red-${index + 1}`,
    type: 'red',
  }));
  spellSlots[1].tokens = [
    { committed: true, id: 'grey-1', type: 'grey' },
  ];

  expect(
    createTokensmithMove({
      spellSlots,
      tokenBag: fullBag,
      tokenId: 'red-1',
    }).status
  ).toBe('full');
  expect(
    createTokensmithMove({
      spellSlots,
      tokenBag: [],
      tokenId: 'missing-token',
    }).status
  ).toBe('missing');
  expect(
    createTokensmithMove({
      spellSlots,
      tokenBag: [],
      tokenId: 'grey-1',
    }).status
  ).toBe('invalid-spell-state');
});
