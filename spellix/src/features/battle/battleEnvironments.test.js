import {
  BATTLE_ENVIRONMENTS,
  getBattleBackgroundSource,
  normalizeBattleEnvironment,
} from './battleEnvironments';

test.each(BATTLE_ENVIRONMENTS)('resolves the %s battle environment image', (environment) => {
  expect(getBattleBackgroundSource(environment)).toContain(`${environment}.png`);
  expect(normalizeBattleEnvironment(environment)).toBe(environment);
});

test('falls back to fields for an unknown battle environment', () => {
  expect(getBattleBackgroundSource('unknown')).toContain('fields.png');
  expect(normalizeBattleEnvironment('unknown')).toBe('fields');
});

test.each(['stream', 'river'])('resolves the %s hazard background image', (environment) => {
  expect(getBattleBackgroundSource(environment)).toContain(`${environment}.png`);
  expect(normalizeBattleEnvironment(environment)).toBe(environment);
});
