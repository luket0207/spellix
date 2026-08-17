import {
  ENVIRONMENT_EVENT_TABLE,
  ENVIRONMENT_EVENT_TYPES,
  getAvailableEventsForEnvironment,
  getBattleEnvironmentForBoardEnvironment,
  selectEventForEnvironment,
} from './environmentEvents';

const EXPECTED_EVENT_TABLE = {
  field: [30, 35, 0, 0, 0, 0, 15, 5, 5, 10],
  hills: [25, 35, 0, 0, 0, 15, 10, 5, 5, 5],
  gravel: [25, 30, 5, 0, 0, 0, 15, 15, 5, 5],
  mud: [25, 30, 5, 0, 0, 0, 15, 15, 5, 5],
  stream: [15, 10, 0, 0, 60, 0, 0, 10, 5, 0],
  river: [0, 0, 0, 0, 90, 0, 0, 5, 5, 0],
  woods: [0, 45, 40, 0, 0, 0, 5, 5, 5, 0],
  forest: [0, 0, 40, 40, 0, 0, 5, 10, 5, 0],
  mountains: [0, 0, 25, 30, 0, 25, 5, 10, 5, 0],
};

test('stores every event row with the exact required percentages', () => {
  expect(Object.keys(ENVIRONMENT_EVENT_TABLE)).toEqual(
    Object.keys(EXPECTED_EVENT_TABLE)
  );

  Object.entries(EXPECTED_EVENT_TABLE).forEach(
    ([environment, expectedWeights]) => {
      expect(
        ENVIRONMENT_EVENT_TYPES.map(
          (eventType) => ENVIRONMENT_EVENT_TABLE[environment][eventType]
        )
      ).toEqual(expectedWeights);
      expect(expectedWeights.reduce((total, weight) => total + weight, 0)).toBe(
        100
      );
    }
  );
});

test.each([
  ['field', ['nothing', 'level1Battle', 'decision', 'hazard', 'lootChest', 'rollAgain']],
  ['stream', ['nothing', 'level1Battle', 'riverMiniGame', 'hazard', 'lootChest']],
  ['river', ['riverMiniGame', 'hazard', 'lootChest']],
  ['woods', ['level1Battle', 'level2Battle', 'decision', 'hazard', 'lootChest']],
  ['mountains', ['level2Battle', 'level3Battle', 'caveMiniGame', 'decision', 'hazard', 'lootChest']],
])('excludes zero-weight %s events', (environment, expectedEventTypes) => {
  expect(
    getAvailableEventsForEnvironment(environment).map(({ eventType }) => eventType)
  ).toEqual(expectedEventTypes);
});

test('selects events at exact weighted boundaries', () => {
  expect(selectEventForEnvironment('field', () => 0)).toBe('nothing');
  expect(selectEventForEnvironment('field', () => 0.29999)).toBe('nothing');
  expect(selectEventForEnvironment('field', () => 0.3)).toBe('level1Battle');
  expect(selectEventForEnvironment('field', () => 0.64999)).toBe('level1Battle');
  expect(selectEventForEnvironment('field', () => 0.65)).toBe('decision');
  expect(selectEventForEnvironment('field', () => 0.8)).toBe('hazard');
  expect(selectEventForEnvironment('field', () => 0.85)).toBe('lootChest');
  expect(selectEventForEnvironment('field', () => 0.9)).toBe('rollAgain');
});

test.each([
  ['field', ['nothing', 'decision', 'hazard', 'lootChest', 'rollAgain']],
  ['woods', ['decision', 'hazard', 'lootChest']],
  ['forest', ['decision', 'hazard', 'lootChest']],
])(
  'excludes random battles and keeps only positive-weight %s events',
  (environment, expectedEventTypes) => {
    expect(
      getAvailableEventsForEnvironment(environment, [
        'level1Battle',
        'level2Battle',
        'level3Battle',
      ]).map(({ eventType }) => eventType)
    ).toEqual(expectedEventTypes);
  }
);

test('reweights the remaining Smokescreen events without a probability gap', () => {
  const excludedBattleEvents = [
    'level1Battle',
    'level2Battle',
    'level3Battle',
  ];

  expect(
    selectEventForEnvironment('field', () => 0.46, excludedBattleEvents)
  ).toBe('nothing');
  expect(
    selectEventForEnvironment('field', () => 0.47, excludedBattleEvents)
  ).toBe('decision');
  expect(
    selectEventForEnvironment('field', () => 0.9999, excludedBattleEvents)
  ).toBe('rollAgain');
  expect(
    selectEventForEnvironment('woods', () => 0, excludedBattleEvents)
  ).toBe('decision');
  expect(
    selectEventForEnvironment('forest', () => 0.9999, excludedBattleEvents)
  ).toBe('lootChest');
});

test('handles unsupported environments and battle field naming', () => {
  expect(getAvailableEventsForEnvironment('unsupported')).toEqual([]);
  expect(selectEventForEnvironment('unsupported', () => 0)).toBeNull();
  expect(getBattleEnvironmentForBoardEnvironment('field')).toBe('fields');
  expect(getBattleEnvironmentForBoardEnvironment('mountains')).toBe(
    'mountains'
  );
});
