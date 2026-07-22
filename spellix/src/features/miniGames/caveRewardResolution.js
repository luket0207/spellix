const PENDING_STATUS = 'pending';

function createQueuedReward(rewardType, source, item, reward = null) {
  return {
    id: reward?.id ?? `${source}-${rewardType}`,
    item: { ...item },
    reward: reward
      ? {
          ...reward,
          item: { ...item },
        }
      : null,
    rewardType,
    source,
    status: PENDING_STATUS,
  };
}

function refreshResolution(resolution) {
  const tokensResolved = resolution.pendingTokens.every(
    ({ status }) => status !== PENDING_STATUS
  );
  const potionsResolved = resolution.pendingPotions.every(
    ({ status }) => status !== PENDING_STATUS
  );
  const stage = !resolution.lootResolved
    ? 'lootChest'
    : !tokensResolved
      ? 'tokenAssignment'
      : !potionsResolved
        ? 'potionResolution'
        : 'finalTurnBehaviour';

  return {
    ...resolution,
    potionsResolved,
    stage,
    tokensResolved,
  };
}

export function createCaveRewardResolution({
  caveRewards = {},
  finalReturnBehaviour,
  playerId,
}) {
  return refreshResolution({
    finalReturnBehaviour,
    lootResolved: !caveRewards.hasLootChest,
    pendingPotions: caveRewards.potion
      ? [createQueuedReward('potion', 'cave', caveRewards.potion)]
      : [],
    pendingTokens: caveRewards.token
      ? [createQueuedReward('token', 'cave', caveRewards.token)]
      : [],
    playerId,
    potionsResolved: !caveRewards.potion,
    source: 'cave',
    stage: 'lootChest',
    tokensResolved: !caveRewards.token,
  });
}

export function addLootChestReward(resolution, reward) {
  if (!resolution || resolution.lootResolved || !reward?.itemType) {
    return resolution;
  }

  const nextResolution = {
    ...resolution,
    lootResolved: true,
    pendingPotions: [...resolution.pendingPotions],
    pendingTokens: [...resolution.pendingTokens],
  };

  if (reward.itemType === 'token' && reward.item) {
    nextResolution.pendingTokens.unshift(
      createQueuedReward('token', 'lootChest', reward.item, reward)
    );
  } else if (reward.itemType === 'potion' && reward.item) {
    nextResolution.pendingPotions.unshift(
      createQueuedReward('potion', 'lootChest', reward.item, reward)
    );
  }

  return refreshResolution(nextResolution);
}

export function getNextPendingCaveReward(resolution) {
  if (!resolution?.lootResolved) {
    return null;
  }

  return (
    resolution.pendingTokens.find(({ status }) => status === PENDING_STATUS) ??
    resolution.pendingPotions.find(({ status }) => status === PENDING_STATUS) ??
    null
  );
}

export function resolvePendingCaveReward(
  resolution,
  { destination, rewardType, source }
) {
  if (!resolution || !destination || !rewardType || !source) {
    return resolution;
  }

  const queueKey = rewardType === 'token' ? 'pendingTokens' : 'pendingPotions';
  const rewardIndex = resolution[queueKey].findIndex(
    (reward) => reward.source === source && reward.status === PENDING_STATUS
  );

  if (rewardIndex < 0) {
    return resolution;
  }

  return refreshResolution({
    ...resolution,
    [queueKey]: resolution[queueKey].map((reward, index) =>
      index === rewardIndex
        ? { ...reward, destination, status: 'resolved' }
        : reward
    ),
  });
}
