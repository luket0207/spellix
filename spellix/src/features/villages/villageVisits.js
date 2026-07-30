import {
  generateCavePotionReward,
  generateCaveTokenReward,
} from '../miniGames/caveMiniGame';

export const FIELD_VILLAGE = 'fieldVillage';
export const FOREST_VILLAGE = 'forestVillage';

const VILLAGE_IMAGE_NAMES = {
  'village-field.png': FIELD_VILLAGE,
  'village-forest.png': FOREST_VILLAGE,
};

const VILLAGE_REWARD_TYPES = ['lootChest', 'potion', 'token'];

export function createVillageProgress(progress = {}) {
  return {
    [FIELD_VILLAGE]: {
      claimedEliteCounts: [
        ...(progress[FIELD_VILLAGE]?.claimedEliteCounts ?? []),
      ],
    },
    [FOREST_VILLAGE]: {
      claimedEliteCounts: [
        ...(progress[FOREST_VILLAGE]?.claimedEliteCounts ?? []),
      ],
    },
  };
}

export function getDefeatedEliteTowerCount(player) {
  return [
    player?.eliteProgress?.eliteTowerGravel,
    player?.eliteProgress?.eliteTowerWoods,
  ].filter(Boolean).length;
}

export function getDefeatedEliteEnemyId(player, assignments) {
  if (player?.eliteProgress?.eliteTowerGravel) {
    return assignments?.eliteTowerGravel ?? null;
  }

  if (player?.eliteProgress?.eliteTowerWoods) {
    return assignments?.eliteTowerWoods ?? null;
  }

  return null;
}

export function getVillageIdFromDestination(board, destinationNodeId) {
  const featureId = destinationNodeId?.startsWith('board-feature-')
    ? destinationNodeId.slice('board-feature-'.length)
    : '';
  const featureImage = board?.featureImages?.find(({ id }) => id === featureId);

  return VILLAGE_IMAGE_NAMES[featureImage?.imageName] ?? null;
}

export function createVillageVisit({
  assignments,
  player,
  randomFn = Math.random,
  villageId,
}) {
  if (![FIELD_VILLAGE, FOREST_VILLAGE].includes(villageId) || !player) {
    return null;
  }

  const defeatedEliteCount = getDefeatedEliteTowerCount(player);
  const claimedEliteCounts =
    player.villageProgress?.[villageId]?.claimedEliteCounts ?? [];
  const rewardType = claimedEliteCounts.includes(defeatedEliteCount)
    ? null
    : VILLAGE_REWARD_TYPES[defeatedEliteCount];
  const rewardItem =
    rewardType === 'potion'
      ? generateCavePotionReward(randomFn)
      : rewardType === 'token'
        ? generateCaveTokenReward(randomFn)
        : null;

  return {
    defeatedEliteCount,
    defeatedEnemyId:
      defeatedEliteCount === 1
        ? getDefeatedEliteEnemyId(player, assignments)
        : null,
    phase: rewardType ? 'reward' : 'heal',
    playerId: player.id,
    rewardItem,
    rewardType,
    villageId,
  };
}
