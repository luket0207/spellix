import { gainPotion, resolvePendingPotion } from '../potions/potionCapacity';

const CAVE_TOKEN_REWARD_CHOICE_ID = 'cave-token-reward';

export function createCaveTokenRewardAssignment(playerId, token) {
  if (!playerId || !token?.type) {
    return null;
  }

  return {
    environment: 'fields',
    phase: 'reward',
    playerId,
    rewardChoices: [
      {
        category: `${token.rarity ?? 'Common'} Token`,
        id: CAVE_TOKEN_REWARD_CHOICE_ID,
        item: { ...token },
        itemType: 'token',
      },
    ],
    selectedRewardChoiceId: CAVE_TOKEN_REWARD_CHOICE_ID,
    source: 'cave',
  };
}

export function createCaveRewardGrant(player, caveRewards = {}) {
  let nextPlayer = {
    ...player,
    potions: (player.potions ?? []).map((potion) => ({ ...potion })),
    tokenBag: (player.tokenBag ?? []).map((token) => ({ ...token })),
  };
  const rewardGrant = { potion: null, token: null };

  if (caveRewards.token) {
    rewardGrant.token = {
      item: { ...caveRewards.token },
      status: 'pendingAssignment',
    };
  }

  if (caveRewards.potion) {
    const potionResult = gainPotion(nextPlayer.potions, caveRewards.potion);

    rewardGrant.potion = {
      item: { ...caveRewards.potion },
      status: potionResult.pendingPotion ? 'pending' : 'added',
    };
    nextPlayer = { ...nextPlayer, potions: potionResult.potions };
  }

  return { player: nextPlayer, rewardGrant };
}

export function getPendingCaveReward(rewardGrant) {
  if (rewardGrant?.token?.status === 'pendingAssignment') {
    return { ...rewardGrant.token, type: 'token' };
  }

  if (rewardGrant?.potion?.status === 'pending') {
    return { ...rewardGrant.potion, type: 'potion' };
  }

  return null;
}

export function resolveCavePotionReward({
  player,
  replacedPotionIndex,
  rewardGrant,
}) {
  const pendingPotion = rewardGrant?.potion;
  const isDiscarding = replacedPotionIndex === undefined;
  const canReplace =
    Number.isInteger(replacedPotionIndex) &&
    replacedPotionIndex >= 0 &&
    replacedPotionIndex < player.potions.length;

  if (pendingPotion?.status !== 'pending' || (!isDiscarding && !canReplace)) {
    return null;
  }

  return {
    player: isDiscarding
      ? player
      : {
          ...player,
          potions: resolvePendingPotion({
            pendingPotion: pendingPotion.item,
            potions: player.potions,
            replacedPotionIndex,
          }),
        },
    rewardGrant: {
      ...rewardGrant,
      potion: {
        ...pendingPotion,
        status: isDiscarding ? 'discarded' : 'replaced',
      },
    },
  };
}
