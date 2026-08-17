import { REWARD_CATEGORIES } from '../rewards/battleRewards';
import { generateRewardItem } from '../rewards/rewardItems';

export const FIELD_VILLAGE = 'fieldVillage';
export const FOREST_VILLAGE = 'forestVillage';

const VILLAGE_IMAGE_NAMES = {
  'village-field.png': FIELD_VILLAGE,
  'village-forest.png': FOREST_VILLAGE,
};

export function createVillageActionState(state = {}) {
  return {
    currentVillageLockId:
      typeof state.currentVillageLockId === 'string'
        ? state.currentVillageLockId
        : null,
    usedActionsForCurrentVillage: {
      rest: Boolean(state.usedActionsForCurrentVillage?.rest),
      wandsmith: Boolean(state.usedActionsForCurrentVillage?.wandsmith),
    },
  };
}

export function enterVillageActionLock(state, villageFeatureId) {
  const currentState = createVillageActionState(state);

  if (
    !villageFeatureId ||
    currentState.currentVillageLockId === villageFeatureId
  ) {
    return currentState;
  }

  return {
    currentVillageLockId: villageFeatureId,
    usedActionsForCurrentVillage: {
      rest: false,
      wandsmith: false,
    },
  };
}

export function recordVillageAction(state, villageFeatureId, action) {
  const currentState = enterVillageActionLock(state, villageFeatureId);

  if (!['rest', 'wandsmith'].includes(action)) {
    return currentState;
  }

  return {
    ...currentState,
    usedActionsForCurrentVillage: {
      ...currentState.usedActionsForCurrentVillage,
      [action]: true,
    },
  };
}

export function createVillageProgress(progress = {}) {
  const fieldLegacyClaims =
    progress[FIELD_VILLAGE]?.claimedEliteCounts ?? [];
  const forestLegacyClaims =
    progress[FOREST_VILLAGE]?.claimedEliteCounts ?? [];

  return {
    fieldVillageLootClaimed: Boolean(
      progress.fieldVillageLootClaimed || fieldLegacyClaims.includes(0)
    ),
    firstEliteVillageRewardClaimed: Boolean(
      progress.firstEliteVillageRewardClaimed ||
        fieldLegacyClaims.includes(1) ||
        forestLegacyClaims.includes(1)
    ),
    forestVillageLootClaimed: Boolean(
      progress.forestVillageLootClaimed || forestLegacyClaims.includes(0)
    ),
    secondEliteVillageRewardClaimed: Boolean(
      progress.secondEliteVillageRewardClaimed ||
        fieldLegacyClaims.includes(2) ||
        forestLegacyClaims.includes(2)
    ),
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

function getVillageFeatureSquares(board, featureImage) {
  const boardSquares = (board?.squares ?? []).filter(
    ({ featureId }) => featureId === featureImage.id
  );

  if (boardSquares.length > 0) {
    return boardSquares;
  }

  if (
    !Number.isInteger(featureImage.x) ||
    !Number.isInteger(featureImage.y) ||
    !Number.isInteger(featureImage.width) ||
    !Number.isInteger(featureImage.height)
  ) {
    return [];
  }

  const squares = [];

  for (let y = featureImage.y; y < featureImage.y + featureImage.height; y += 1) {
    for (let x = featureImage.x; x < featureImage.x + featureImage.width; x += 1) {
      squares.push({
        areaType: 'feature',
        featureId: featureImage.id,
        x,
        y,
      });
    }
  }

  return squares;
}

export function getNearestVillageDestination(
  board,
  playerPosition,
  randomFn = Math.random
) {
  if (!board || !playerPosition) {
    return null;
  }

  const destinations = (board.featureImages ?? [])
    .map((featureImage) => {
      const villageId = VILLAGE_IMAGE_NAMES[featureImage.imageName];
      const squares = villageId
        ? getVillageFeatureSquares(board, featureImage)
        : [];

      if (!villageId || squares.length === 0) {
        return null;
      }

      const destinationNodeId = `board-feature-${featureImage.id}`;
      const distance =
        playerPosition.type === 'feature' &&
        playerPosition.featureId === destinationNodeId
          ? 0
          : Math.min(
              ...squares.map(
                ({ x, y }) =>
                  Math.abs(playerPosition.x - x) +
                  Math.abs(playerPosition.y - y)
              )
            );

      return {
        destinationNodeId,
        destinationSquare: squares[0],
        distance,
        villageId,
      };
    })
    .filter(Boolean);

  if (destinations.length === 0) {
    return null;
  }

  const nearestDistance = Math.min(
    ...destinations.map(({ distance }) => distance)
  );
  const nearestDestinations = destinations.filter(
    ({ distance }) => distance === nearestDistance
  );
  const selectedIndex =
    nearestDestinations.length === 1
      ? 0
      : Math.min(
          Math.floor(randomFn() * nearestDestinations.length),
          nearestDestinations.length - 1
        );
  const { distance: _distance, ...destination } =
    nearestDestinations[selectedIndex];

  return destination;
}

export function createVillageVisit({
  assignments,
  player,
  randomFn = Math.random,
  villageFeatureId,
  villageId,
}) {
  if (![FIELD_VILLAGE, FOREST_VILLAGE].includes(villageId) || !player) {
    return null;
  }

  const defeatedEliteCount = getDefeatedEliteTowerCount(player);
  const villageProgress = createVillageProgress(player.villageProgress);
  const rewards = [];
  const villageLootClaimKey =
    villageId === FIELD_VILLAGE
      ? 'fieldVillageLootClaimed'
      : 'forestVillageLootClaimed';

  if (!villageProgress[villageLootClaimKey]) {
    rewards.push({
      rewardClaimKey: villageLootClaimKey,
      rewardItem: null,
      rewardType: 'lootChest',
    });
  }

  if (
    defeatedEliteCount >= 1 &&
    !villageProgress.firstEliteVillageRewardClaimed
  ) {
    rewards.push({
      rewardClaimKey: 'firstEliteVillageRewardClaimed',
      rewardItem:
        generateRewardItem(REWARD_CATEGORIES.COMMON_TOKEN, randomFn)?.item ??
        null,
      rewardType: 'token',
    });
  }

  if (
    defeatedEliteCount >= 2 &&
    !villageProgress.secondEliteVillageRewardClaimed
  ) {
    rewards.push({
      rewardClaimKey: 'secondEliteVillageRewardClaimed',
      rewardItem:
        generateRewardItem(REWARD_CATEGORIES.RARE_TOKEN, randomFn)?.item ??
        null,
      rewardType: 'token',
    });
  }

  const [currentReward = null, ...pendingRewards] = rewards;

  return {
    defeatedEliteCount,
    defeatedEnemyId:
      defeatedEliteCount === 1
        ? getDefeatedEliteEnemyId(player, assignments)
        : null,
    pendingRewards,
    phase: currentReward ? 'reward' : 'choice',
    playerId: player.id,
    rewardClaimKey: currentReward?.rewardClaimKey ?? null,
    rewardClaimKeys: rewards.map(({ rewardClaimKey }) => rewardClaimKey),
    rewardItem: currentReward?.rewardItem ?? null,
    rewardType: currentReward?.rewardType ?? null,
    villageFeatureId: villageFeatureId ?? villageId,
    villageId,
  };
}

export function advanceVillageVisitReward(villageVisit) {
  if (!villageVisit) {
    return villageVisit;
  }

  const [nextReward = null, ...pendingRewards] =
    villageVisit.pendingRewards ?? [];

  return {
    ...villageVisit,
    pendingRewards,
    phase: nextReward ? 'reward' : 'choice',
    rewardClaimKey: nextReward?.rewardClaimKey ?? null,
    rewardItem: nextReward?.rewardItem ?? null,
    rewardType: nextReward?.rewardType ?? null,
  };
}
