import {
  getBagTokenDiscardReplacementId,
  getRequestedBagTokenReplacementId,
  getRewardSpellSlotDropId,
  isRewardTokenBagDrop,
  isRewardTokenDiscardDrop,
  isRewardTokenFullBagDrop,
} from './rewardTokenAssignment';

const spellSlots = [
  { id: 'slot-1', maxTokens: 5, tokens: Array.from({ length: 5 }) },
  { id: 'slot-2', maxTokens: 5, tokens: [] },
];

describe('reward token assignment drops', () => {
  test('accepts only the new reward token in a spell slot with capacity', () => {
    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-2',
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'reward-token',
      })
    ).toBe('slot-2');

    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-1',
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'reward-token',
      })
    ).toBe('');
    expect(
      getRewardSpellSlotDropId({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'reward-token',
      })
    ).toBe('');
    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-2',
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'bag-token',
      })
    ).toBe('');
  });

  test('accepts a reward only in committed Grey-adjusted adjacent capacity', () => {
    const greyAdjustedSlots = [
      {
        id: 'slot-1',
        maxTokens: 5,
        tokens: Array.from({ length: 5 }, (_, index) => ({
          id: `red-${index}`,
          type: 'red',
        })),
      },
      {
        id: 'slot-2',
        maxTokens: 5,
        tokens: [{ committed: true, id: 'grey-1', type: 'grey' }],
      },
    ];

    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-1',
        rewardTokenId: 'reward-token',
        spellSlots: greyAdjustedSlots,
        tokenId: 'reward-token',
      })
    ).toBe('slot-1');

    greyAdjustedSlots[1].tokens[0].committed = false;
    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-1',
        rewardTokenId: 'reward-token',
        spellSlots: greyAdjustedSlots,
        tokenId: 'reward-token',
      })
    ).toBe('');
  });

  test('uses merged Grey capacity and rejects the removed merged destination', () => {
    const spellSlots = [
      {
        id: 'slot-1',
        maxTokens: 5,
        tokens: Array.from({ length: 5 }, (_, index) => ({
          committed: true,
          id: `red-${index}`,
          type: 'red',
        })),
      },
      { id: 'slot-2', maxTokens: 5, tokens: [] },
      {
        id: 'slot-3',
        maxTokens: 5,
        tokens: [{ committed: true, id: 'grey-3', type: 'grey' }],
      },
    ];
    const mergedColumns = [
      { activeColumn: 1, columns: [1, 2], removedColumn: 2 },
    ];

    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-1',
        mergedColumns,
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'reward-token',
      })
    ).toBe('slot-1');
    expect(
      getRewardSpellSlotDropId({
        destinationId: 'slot-2',
        mergedColumns,
        rewardTokenId: 'reward-token',
        spellSlots,
        tokenId: 'reward-token',
      })
    ).toBe('');
  });

  test('accepts the new reward token in a non-full token bag only', () => {
    expect(
      isRewardTokenBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 4 }),
        tokenId: 'reward-token',
      })
    ).toBe(true);
    expect(
      isRewardTokenBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 5 }),
        tokenId: 'reward-token',
      })
    ).toBe(false);
    expect(
      isRewardTokenBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: [],
        tokenId: 'bag-token',
      })
    ).toBe(false);
    expect(
      isRewardTokenBagDrop({
        destinationId: 'slot-2',
        rewardTokenId: 'reward-token',
        tokenBag: [],
        tokenId: 'reward-token',
      })
    ).toBe(false);
  });

  test('accepts only the new reward token in the discard drop zone', () => {
    expect(
      isRewardTokenDiscardDrop({
        destinationId: 'reward-discard',
        rewardTokenId: 'reward-token',
        tokenId: 'reward-token',
      })
    ).toBe(true);
    expect(
      isRewardTokenDiscardDrop({
        destinationId: 'reward-discard',
        rewardTokenId: 'reward-token',
        tokenId: 'bag-token',
      })
    ).toBe(false);
    expect(
      isRewardTokenDiscardDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenId: 'reward-token',
      })
    ).toBe(false);
  });

  test('accepts only the new reward token dropped into a full token bag', () => {
    expect(
      isRewardTokenFullBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 5 }),
        tokenId: 'reward-token',
      })
    ).toBe(true);
    expect(
      isRewardTokenFullBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 4 }),
        tokenId: 'reward-token',
      })
    ).toBe(false);
    expect(
      isRewardTokenFullBagDrop({
        destinationId: 'token-bag',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 5 }),
        tokenId: 'bag-token',
      })
    ).toBe(false);
    expect(
      isRewardTokenFullBagDrop({
        destinationId: 'slot-2',
        rewardTokenId: 'reward-token',
        tokenBag: Array.from({ length: 5 }),
        tokenId: 'reward-token',
      })
    ).toBe(false);
  });

  test('accepts only a current full-bag token dropped into the discard zone', () => {
    const fullTokenBag = Array.from({ length: 5 }, (_, index) => ({
      id: `bag-token-${index + 1}`,
    }));

    expect(
      getBagTokenDiscardReplacementId({
        destinationId: 'reward-discard',
        tokenBag: fullTokenBag,
        tokenId: 'bag-token-3',
      })
    ).toBe('bag-token-3');
    expect(
      getBagTokenDiscardReplacementId({
        destinationId: 'reward-discard',
        tokenBag: fullTokenBag.slice(0, 4),
        tokenId: 'bag-token-3',
      })
    ).toBe('');
    expect(
      getBagTokenDiscardReplacementId({
        destinationId: 'reward-discard',
        tokenBag: fullTokenBag,
        tokenId: 'reward-token',
      })
    ).toBe('');
    expect(
      getBagTokenDiscardReplacementId({
        destinationId: 'reward-discard',
        tokenBag: fullTokenBag,
        tokenId: 'spell-token',
      })
    ).toBe('');
    expect(
      getBagTokenDiscardReplacementId({
        destinationId: 'token-bag',
        tokenBag: fullTokenBag,
        tokenId: 'bag-token-3',
      })
    ).toBe('');
  });

  test('selects a clicked full-bag token only after replacement is requested', () => {
    const fullTokenBag = Array.from({ length: 5 }, (_, index) => ({
      id: `bag-token-${index + 1}`,
    }));

    expect(
      getRequestedBagTokenReplacementId({
        isReplacementRequested: true,
        tokenBag: fullTokenBag,
        tokenId: 'bag-token-3',
      })
    ).toBe('bag-token-3');
    expect(
      getRequestedBagTokenReplacementId({
        isReplacementRequested: false,
        tokenBag: fullTokenBag,
        tokenId: 'bag-token-3',
      })
    ).toBe('');
    expect(
      getRequestedBagTokenReplacementId({
        isReplacementRequested: true,
        tokenBag: fullTokenBag.slice(0, 4),
        tokenId: 'bag-token-3',
      })
    ).toBe('');
    expect(
      getRequestedBagTokenReplacementId({
        isReplacementRequested: true,
        tokenBag: fullTokenBag,
        tokenId: 'reward-token',
      })
    ).toBe('');
  });
});
