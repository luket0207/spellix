import {
  createVillageProgress,
  createVillageVisit,
  FIELD_VILLAGE,
  FOREST_VILLAGE,
  getDefeatedEliteTowerCount,
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

test('offers only the current village tier and skips a claimed tier', () => {
  const firstVisit = createVillageVisit({
    assignments,
    player: createPlayer(),
    villageId: FIELD_VILLAGE,
  });
  const repeatedVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      villageProgress: createVillageProgress({
        [FIELD_VILLAGE]: { claimedEliteCounts: [0] },
      }),
    }),
    villageId: FIELD_VILLAGE,
  });

  expect(firstVisit).toMatchObject({
    defeatedEliteCount: 0,
    phase: 'reward',
    rewardType: 'lootChest',
  });
  expect(repeatedVisit).toMatchObject({
    defeatedEliteCount: 0,
    phase: 'heal',
    rewardType: null,
  });
});

test('does not backfill missed rewards and tracks villages independently', () => {
  const player = createPlayer({
    eliteProgress: {
      eliteTowerGravel: true,
      eliteTowerWoods: true,
    },
    villageProgress: createVillageProgress({
      [FIELD_VILLAGE]: { claimedEliteCounts: [2] },
    }),
  });

  expect(
    createVillageVisit({
      assignments,
      player,
      randomFn: () => 0,
      villageId: FIELD_VILLAGE,
    })
  ).toMatchObject({ phase: 'heal', rewardType: null });
  expect(
    createVillageVisit({
      assignments,
      player,
      randomFn: () => 0,
      villageId: FOREST_VILLAGE,
    })
  ).toMatchObject({
    defeatedEliteCount: 2,
    phase: 'reward',
    rewardType: 'token',
  });
});

test('locks the defeated enemy and generates potion and token rewards', () => {
  const potionVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: false,
      },
    }),
    randomFn: () => 0,
    villageId: FIELD_VILLAGE,
  });
  const tokenVisit = createVillageVisit({
    assignments,
    player: createPlayer({
      eliteProgress: {
        eliteTowerGravel: true,
        eliteTowerWoods: true,
      },
    }),
    randomFn: () => 0,
    villageId: FOREST_VILLAGE,
  });

  expect(potionVisit).toMatchObject({
    defeatedEnemyId: 'crowned-lichlord',
    rewardType: 'potion',
  });
  expect(potionVisit.rewardItem).toBeTruthy();
  expect(tokenVisit).toMatchObject({
    defeatedEnemyId: null,
    rewardType: 'token',
  });
  expect(tokenVisit.rewardItem).toBeTruthy();
});
