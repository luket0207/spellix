import {
  createCaveTokenRewardAssignment,
  createCaveRewardGrant,
  getPendingCaveReward,
  resolveCavePotionReward,
} from './caveRewardGrant';

const caveRewards = {
  hasLootChest: true,
  hasRollAgainPotion: true,
  potion: {
    colour: 'green',
    id: 'small-heal',
    name: 'Small Heal',
    rarity: 'Common',
  },
  token: {
    label: 'Red',
    rarity: 'Common',
    type: 'red',
  },
};

function createPlayer({ potions = [], tokenBag = [] } = {}) {
  return {
    id: 'player-1',
    potions,
    spellSlots: [],
    tokenBag,
  };
}

test('keeps the Cave token and potion pending for ordered resolution', () => {
  const result = createCaveRewardGrant(createPlayer(), caveRewards);

  expect(result.player.tokenBag).toEqual([]);
  expect(result.player.potions).toEqual([]);
  expect(result.rewardGrant.token).toEqual({
    item: caveRewards.token,
    status: 'pendingAssignment',
  });
  expect(result.rewardGrant.potion.status).toBe('pending');
  expect(getPendingCaveReward(result.rewardGrant)).toMatchObject({
    item: caveRewards.token,
    type: 'token',
  });
  expect(createCaveTokenRewardAssignment('player-1', caveRewards.token)).toMatchObject({
    phase: 'reward',
    playerId: 'player-1',
    selectedRewardChoiceId: 'cave-token-reward',
    source: 'cave',
    rewardChoices: [
      {
        id: 'cave-token-reward',
        item: caveRewards.token,
        itemType: 'token',
      },
    ],
  });
});

test('keeps full-capacity rewards pending in assignment-then-potion order', () => {
  const tokenBag = Array.from({ length: 5 }, (_, index) => ({
    committed: false,
    id: `bag-${index + 1}`,
    type: index === 0 ? 'blue' : 'red',
  }));
  const potions = Array.from({ length: 3 }, (_, index) => ({
    colour: 'green',
    id: `potion-${index + 1}`,
    name: `Potion ${index + 1}`,
  }));
  const result = createCaveRewardGrant(createPlayer({ potions, tokenBag }), caveRewards);

  expect(result.player.tokenBag).toEqual(tokenBag);
  expect(result.player.potions).toEqual(potions);
  expect(getPendingCaveReward(result.rewardGrant)).toMatchObject({
    item: expect.objectContaining({ type: 'red' }),
    type: 'token',
  });

  const assignedRewardGrant = {
    ...result.rewardGrant,
    token: { ...result.rewardGrant.token, status: 'assigned' },
  };
  expect(getPendingCaveReward(assignedRewardGrant)).toMatchObject({
    item: caveRewards.potion,
    type: 'potion',
  });

  const potionResolution = resolveCavePotionReward({
    player: result.player,
    replacedPotionIndex: 1,
    rewardGrant: assignedRewardGrant,
  });

  expect(potionResolution.player.potions).toHaveLength(3);
  expect(potionResolution.player.potions[1]).toEqual(caveRewards.potion);
  expect(potionResolution.rewardGrant.potion.status).toBe('replaced');
  expect(getPendingCaveReward(potionResolution.rewardGrant)).toBeNull();
});

test('can discard a new full-capacity potion after token assignment without changing it', () => {
  const tokenBag = Array.from({ length: 5 }, (_, index) => ({
    id: `bag-${index + 1}`,
    type: 'red',
  }));
  const potions = Array.from({ length: 3 }, (_, index) => ({
    id: `potion-${index + 1}`,
    name: `Potion ${index + 1}`,
  }));
  const result = createCaveRewardGrant(createPlayer({ potions, tokenBag }), caveRewards);
  const assignedRewardGrant = {
    ...result.rewardGrant,
    token: { ...result.rewardGrant.token, status: 'discarded' },
  };
  const potionResolution = resolveCavePotionReward({
    player: result.player,
    rewardGrant: assignedRewardGrant,
  });

  expect(potionResolution.rewardGrant.token.status).toBe('discarded');
  expect(potionResolution.rewardGrant.potion.status).toBe('discarded');
  expect(potionResolution.player.tokenBag).toEqual(tokenBag);
  expect(potionResolution.player.potions).toEqual(potions);
});
