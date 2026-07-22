import {
  addLootChestReward,
  createCaveRewardResolution,
  getNextPendingCaveReward,
  resolvePendingCaveReward,
} from './caveRewardResolution';

const CAVE_TOKEN = { label: 'Red', rarity: 'Common', type: 'red' };
const CAVE_POTION = { id: 'cave-potion', name: 'Cave Potion' };
const LOOT_TOKEN = {
  category: 'Rare Token',
  id: 'loot-token',
  item: { label: 'Guard', rarity: 'Rare', type: 'blue' },
  itemType: 'token',
};
const LOOT_POTION = {
  category: 'Common Potion',
  id: 'loot-potion',
  item: { id: 'loot-potion-item', name: 'Loot Potion' },
  itemType: 'potion',
};

function createResolution(overrides = {}) {
  return createCaveRewardResolution({
    caveRewards: {
      hasLootChest: true,
      potion: CAVE_POTION,
      token: CAVE_TOKEN,
    },
    finalReturnBehaviour: 'nextPlayerTurn',
    playerId: 'player-1',
    ...overrides,
  });
}

test('starts at Loot Chest and preserves Cave token, potion, and final return data', () => {
  const resolution = createResolution();

  expect(resolution).toMatchObject({
    finalReturnBehaviour: 'nextPlayerTurn',
    lootResolved: false,
    playerId: 'player-1',
    potionsResolved: false,
    stage: 'lootChest',
    tokensResolved: false,
  });
  expect(resolution.pendingTokens).toEqual([
    expect.objectContaining({ item: CAVE_TOKEN, source: 'cave', status: 'pending' }),
  ]);
  expect(resolution.pendingPotions).toEqual([
    expect.objectContaining({ item: CAVE_POTION, source: 'cave', status: 'pending' }),
  ]);
});

test('queues a Loot potion but still assigns every token before either potion', () => {
  let resolution = addLootChestReward(createResolution(), LOOT_POTION);

  expect(resolution.stage).toBe('tokenAssignment');
  expect(getNextPendingCaveReward(resolution)).toMatchObject({
    item: CAVE_TOKEN,
    rewardType: 'token',
    source: 'cave',
  });

  resolution = resolvePendingCaveReward(resolution, {
    destination: 'discarded',
    rewardType: 'token',
    source: 'cave',
  });

  expect(resolution.stage).toBe('potionResolution');
  expect(getNextPendingCaveReward(resolution)).toMatchObject({
    item: LOOT_POTION.item,
    rewardType: 'potion',
    source: 'lootChest',
  });
});

test('queues a Loot token before the Cave token and waits for both before potions', () => {
  let resolution = addLootChestReward(createResolution(), LOOT_TOKEN);

  expect(getNextPendingCaveReward(resolution)).toMatchObject({
    item: LOOT_TOKEN.item,
    source: 'lootChest',
  });

  resolution = resolvePendingCaveReward(resolution, {
    destination: 'spellSlot',
    rewardType: 'token',
    source: 'lootChest',
  });

  expect(resolution.tokensResolved).toBe(false);
  expect(getNextPendingCaveReward(resolution)).toMatchObject({ source: 'cave' });

  resolution = resolvePendingCaveReward(resolution, {
    destination: 'tokenBag',
    rewardType: 'token',
    source: 'cave',
  });

  expect(resolution).toMatchObject({
    stage: 'potionResolution',
    tokensResolved: true,
  });
});

test('processes multiple potions one at a time before final turn behavior', () => {
  let resolution = addLootChestReward(
    createResolution({
      caveRewards: {
        hasLootChest: true,
        potion: CAVE_POTION,
        token: null,
      },
    }),
    LOOT_POTION
  );

  expect(getNextPendingCaveReward(resolution)).toMatchObject({
    source: 'lootChest',
  });

  resolution = resolvePendingCaveReward(resolution, {
    destination: 'potionSlot',
    rewardType: 'potion',
    source: 'lootChest',
  });

  expect(getNextPendingCaveReward(resolution)).toMatchObject({ source: 'cave' });
  expect(resolution.potionsResolved).toBe(false);

  resolution = resolvePendingCaveReward(resolution, {
    destination: 'potionDiscarded',
    rewardType: 'potion',
    source: 'cave',
  });

  expect(resolution).toMatchObject({
    potionsResolved: true,
    stage: 'finalTurnBehaviour',
  });
  expect(getNextPendingCaveReward(resolution)).toBeNull();
});

test('Nothing resolves Loot without adding a queued reward', () => {
  const resolution = addLootChestReward(createResolution(), {
    category: 'Nothing',
    id: 'nothing',
    itemType: 'nothing',
  });

  expect(resolution.lootResolved).toBe(true);
  expect(resolution.pendingTokens).toHaveLength(1);
  expect(resolution.pendingPotions).toHaveLength(1);
  expect(resolution.stage).toBe('tokenAssignment');
});
