import {
  ENVIRONMENT_EVENT_TABLE,
  ENVIRONMENT_EVENT_TYPES,
  getAvailableEventsForEnvironment,
  getBattleEnvironmentForBoardEnvironment,
  selectEventForEnvironment,
} from './environmentEvents';

const EXPECTED_EVENT_TABLE = {
  field: [55, 15, 0, 0, 0, 0, 15, 5, 5, 5],
  hills: [35, 20, 0, 0, 0, 15, 15, 5, 5, 5],
  gravel: [25, 30, 5, 0, 0, 0, 15, 15, 5, 5],
  mud: [25, 30, 5, 0, 0, 0, 15, 15, 5, 5],
  stream: [20, 0, 0, 0, 60, 0, 0, 10, 5, 5],
  river: [0, 0, 0, 0, 90, 0, 0, 5, 5, 0],
  woods: [0, 40, 40, 0, 0, 0, 5, 10, 5, 0],
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
  expect(selectEventForEnvironment('field', () => 0.54999)).toBe('nothing');
  expect(selectEventForEnvironment('field', () => 0.55)).toBe('level1Battle');
  expect(selectEventForEnvironment('field', () => 0.7)).toBe('decision');
  expect(selectEventForEnvironment('field', () => 0.85)).toBe('hazard');
  expect(selectEventForEnvironment('field', () => 0.9)).toBe('lootChest');
  expect(selectEventForEnvironment('field', () => 0.95)).toBe('rollAgain');
});

test('handles unsupported environments and battle field naming', () => {
  expect(getAvailableEventsForEnvironment('unsupported')).toEqual([]);
  expect(selectEventForEnvironment('unsupported', () => 0)).toBeNull();
  expect(getBattleEnvironmentForBoardEnvironment('field')).toBe('fields');
  expect(getBattleEnvironmentForBoardEnvironment('mountains')).toBe(
    'mountains'
  );
});
