import {
  advanceVillageVisitReward,
  createVillageActionState,
  createVillageProgress,
  createVillageVisit,
  FIELD_VILLAGE,
  FOREST_VILLAGE,
  getDefeatedEliteTowerCount,
  getNearestVillageDestination,
  getVillageIdFromDestination,
} from './villageVisits';

const assignments = {
  eliteTowerGravel: 'crowned-lichlord',
  eliteTowerWoods: 'amethyst-ogre',
};

function createPlayer(overrides = {}) {
  return {
    eliteProgress: {
      eliteTowerGravel: false,
      eliteTowerWoods: false,
    },
    id: 'player-1',
    villageProgress: createVillageProgress(),
    ...overrides,
  };
}

test('identifies each generated village from its feature image', () => {
  const board = {
    featureImages: [
      { id: 'feature-1', imageName: 'village-field.png' },
      { id: 'feature-2', imageName: 'village-forest.png' },
    ],
  };

  expect(
    getVillageIdFromDestination(board, 'board-feature-feature-1')
  ).toBe(FIELD_VILLAGE);
  expect(
    getVillageIdFromDestination(board, 'board-feature-feature-2')
  ).toBe(FOREST_VILLAGE);
  expect(getVillageIdFromDestination(board, 'square-1-1')).toBeNull();
});

test('finds the nearest generated village by orthogonal distance to its footprint', () => {
  const board = {
    featureImages: [
      { id: 'feature-1', imageName: 'village-field.png' },
      { id: 'feature-2', imageName: 'village-forest.png' },
    ],
    squares: [
      { featureId: 'feature-1', x: 2, y: 2 },
      { featureId: 'feature-1', x: 3, y: 2 },
      { featureId: 'feature-2', x: 9, y: 9 },
      { featureId: 'feature-2', x: 10, y: 9 },
    ],
  };

  expect(
    getNearestVillageDestination(board, { x: 7, y: 9 })
  ).toMatchObject({
    destinationNodeId: 'board-feature-feature-2',
    destinationSquare: { featureId: 'feature-2', x: 9, y: 9 },
    villageId: FOREST_VILLAGE,
  });
});

test('uses logical village identity and randomly resolves ties across all generated villages', () => {
  const board = {
    featureImages: [
      { id: 'feature-1', imageName: 'village-field.png' },
      { id: 'feature-2', imageName: 'village-forest.png' },
      { id: 'feature-3', imageName: 'village-field.png' },
      { id: 'feature-4', imageName: 'village-forest.png' },
    ],
    squares: [
      { featureId: 'feature-1', x: 0, y: 2 },
      { featureId: 'feature-2', x: 2, y: 0 },
      { featureId: 'feature-3', x: 20, y: 20 },
      { featureId: 'feature-4', x: 25, y: 25 },
    ],
  };

  expect(
    getNearestVillageDestination(board, { x: 0, y: 0 }, () => 0)
      .destinationNodeId
  ).toBe('board-feature-feature-1');
  expect(
    getNearestVillageDestination(board, { x: 0, y: 0 }, () => 0.999999)
      .destinationNodeId
  ).toBe('board-feature-feature-2');
  expect(
    getNearestVillageDestination(board, {
      featureId: 'board-feature-feature-4',
      type: 'feature',
      x: 0,
      y: 0,
    }).destinationNodeId
  ).toBe('board-feature-feature-4');
});

test('returns no SOS destination when the board has no generated villages', () => {
  expect(
    getNearestVillageDestination(
      { featureImages: [], squares: [] },
      { x: 0, y: 0 }
    )
  ).toBeNull();
});

test('counts only the current player elite tower victories', () => {
  expect(getDefeatedEliteTowerCount(createPlayer())).toBe(0);
  expect(
    getDefeatedEliteTowerCount(
      createPlayer({
        eliteProgress: {
          eliteTowerGravel: true,
          eliteTowerWoods: false,
        },
      })
    )
  ).toBe(1);
  expect(
    getDefeatedEliteTowerCount(
      createPlayer({
        eliteProgress: {
          eliteTowerGravel: true,
          eliteTowerWoods: true,
        },
      })
    )
  ).toBe(2);
});

test('offers each village-type Loot Chest once for the current player', () => {
  const firstVisit = createVillageVisit({
    assignments,
    player: createPlayer(),
    villageId: FIELD_VILLAGE,
  });
  const repeatedVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      villageProgress: createVillageProgress({
        fieldVillageLootClaimed: true,
      }),
    }),
    villageId: FIELD_VILLAGE,
  });

  expect(firstVisit).toMatchObject({
    defeatedEliteCount: 0,
    phase: 'reward',
    rewardClaimKey: 'fieldVillageLootClaimed',
    rewardType: 'lootChest',
  });
  expect(repeatedVisit).toMatchObject({
    defeatedEliteCount: 0,
    phase: 'choice',
    rewardType: null,
  });
});

test('queues village Loot, first-Elite common, and second-Elite rare rewards in order', () => {
  const player = createPlayer({
    eliteProgress: {
      eliteTowerGravel: true,
      eliteTowerWoods: true,
    },
  });
  const visit = createVillageVisit({
    assignments,
    player,
    randomFn: () => 0,
    villageId: FOREST_VILLAGE,
  });

  expect(visit).toMatchObject({
    defeatedEliteCount: 2,
    phase: 'reward',
    rewardClaimKey: 'forestVillageLootClaimed',
    rewardType: 'lootChest',
  });
  expect(visit.pendingRewards).toHaveLength(2);
  expect(visit.pendingRewards[0]).toMatchObject({
    rewardClaimKey: 'firstEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Common' },
    rewardType: 'token',
  });
  expect(visit.pendingRewards[1]).toMatchObject({
    rewardClaimKey: 'secondEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Rare' },
    rewardType: 'token',
  });
});

test('offers each Elite reward once regardless of village type', () => {
  const commonVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: false,
      },
      villageProgress: createVillageProgress({
        fieldVillageLootClaimed: true,
      }),
    }),
    randomFn: () => 0,
    villageId: FIELD_VILLAGE,
  });
  const rareVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: true,
      },
      villageProgress: createVillageProgress({
        firstEliteVillageRewardClaimed: true,
        forestVillageLootClaimed: true,
      }),
    }),
    randomFn: () => 0,
    villageId: FOREST_VILLAGE,
  });

  expect(commonVisit).toMatchObject({
    defeatedEnemyId: 'crowned-lichlord',
    rewardClaimKey: 'firstEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Common' },
    rewardType: 'token',
  });
  expect(rareVisit).toMatchObject({
    defeatedEnemyId: null,
    rewardClaimKey: 'secondEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Rare' },
    rewardType: 'token',
  });
});

test('can grant Shiny Buff as the second-Elite village rare token', () => {
  const visit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: true,
      },
      villageProgress: createVillageProgress({
        firstEliteVillageRewardClaimed: true,
        forestVillageLootClaimed: true,
      }),
    }),
    randomFn: () => 0.9999,
    villageId: FOREST_VILLAGE,
  });

  expect(visit).toMatchObject({
    rewardClaimKey: 'secondEliteVillageRewardClaimed',
    rewardItem: {
      rarity: 'Rare',
      type: 'purple-yellow-outline',
    },
    rewardType: 'token',
  });
});

test('advances queued rewards before the village action choice', () => {
  const visit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: true,
      },
    }),
    randomFn: () => 0,
    villageId: FIELD_VILLAGE,
  });
  const commonRewardVisit = advanceVillageVisitReward(visit);
  const rareRewardVisit = advanceVillageVisitReward(commonRewardVisit);
  const choiceVisit = advanceVillageVisitReward(rareRewardVisit);

  expect(commonRewardVisit).toMatchObject({
    phase: 'reward',
    rewardClaimKey: 'firstEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Common' },
  });
  expect(rareRewardVisit).toMatchObject({
    phase: 'reward',
    rewardClaimKey: 'secondEliteVillageRewardClaimed',
    rewardItem: { rarity: 'Rare' },
  });
  expect(choiceVisit).toMatchObject({
    phase: 'choice',
    rewardClaimKey: null,
    rewardItem: null,
    rewardType: null,
  });
});

test('keeps the physical village identity separate from its reward type', () => {
  const visit = createVillageVisit({
    assignments,
    player: createPlayer(),
    villageFeatureId: 'board-feature-village-field-2',
    villageId: FIELD_VILLAGE,
  });

  expect(visit).toMatchObject({
    villageFeatureId: 'board-feature-village-field-2',
    villageId: FIELD_VILLAGE,
  });
});

test('normalizes village action locks without sharing mutable state', () => {
  const existingState = {
    currentVillageLockId: 'board-feature-village-field-1',
    usedActionsForCurrentVillage: {
      rest: true,
      wandsmith: false,
    },
  };
  const actionState = createVillageActionState(existingState);

  expect(actionState).toEqual(existingState);
  expect(actionState).not.toBe(existingState);
  expect(actionState.usedActionsForCurrentVillage).not.toBe(
    existingState.usedActionsForCurrentVillage
  );
});

test('migrates legacy claims into lifetime per-player reward flags', () => {
  expect(
    createVillageProgress({
      [FIELD_VILLAGE]: { claimedEliteCounts: [0, 1] },
      [FOREST_VILLAGE]: { claimedEliteCounts: [0, 2] },
    })
  ).toEqual({
    fieldVillageLootClaimed: true,
    firstEliteVillageRewardClaimed: true,
    forestVillageLootClaimed: true,
    secondEliteVillageRewardClaimed: true,
  });
});
