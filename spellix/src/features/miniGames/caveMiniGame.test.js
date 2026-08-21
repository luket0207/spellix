import {
  CAVE_STEP_PROBABILITIES,
  createCaveRewardState,
  createCaveRewards,
  generateCavePotionReward,
  generateCaveTokenReward,
  getAdjustedCaveProbabilities,
  selectCaveOutcome,
} from './caveMiniGame';

const EXPECTED_ROWS = [
  [97.5, 0, 0.5, 0, 2, 0],
  [96.5, 0, 0.5, 0.5, 2, 0.5],
  [88.5, 0, 5, 0.5, 5, 1],
  [84, 0, 5, 1, 5, 5],
  [69, 1, 10, 5, 5, 10],
  [64, 1, 10, 5, 5, 15],
  [43, 2, 20, 10, 5, 20],
  [41, 2, 20, 10, 2, 25],
  [18, 5, 30, 15, 2, 30],
  [8, 5, 30, 15, 2, 40],
  [5, 15, 20, 10, 0, 50],
  [3, 15, 10, 12, 0, 60],
  [1, 15, 5, 9, 0, 70],
  [0, 15, 0, 5, 0, 80],
  [0, 15, 0, 0, 0, 85],
  [0, 0, 0, 0, 0, 100],
];

test('defines the exact sixteen Cave probability rows and each totals 100', () => {
  expect(CAVE_STEP_PROBABILITIES).toHaveLength(16);

  CAVE_STEP_PROBABILITIES.forEach((row, index) => {
    expect([
      row.nothing,
      row.token,
      row.loot,
      row.potion,
      row.rollAgain,
      row.ogre,
    ]).toEqual(EXPECTED_ROWS[index]);
    expect(Object.values(row).reduce((total, chance) => total + chance, 0)).toBe(100);
  });
});

test('moves acquired reward chances into ogre chance without mutating base data', () => {
  const rewards = { ...createCaveRewards(), loot: true };

  expect(getAdjustedCaveProbabilities(7, rewards)).toEqual({
    nothing: 43,
    token: 2,
    loot: 0,
    potion: 10,
    rollAgain: 5,
    ogre: 40,
  });
  expect(
    getAdjustedCaveProbabilities(8, { ...rewards, rollAgain: true })
  ).toEqual({
    nothing: 41,
    token: 2,
    loot: 0,
    potion: 10,
    rollAgain: 0,
    ogre: 47,
  });
  expect(CAVE_STEP_PROBABILITIES[6].loot).toBe(20);
});

test('selects each outcome from deterministic cumulative step chances', () => {
  const rewards = createCaveRewards();

  expect(selectCaveOutcome(5, rewards, () => 0.68)).toBe('nothing');
  expect(selectCaveOutcome(5, rewards, () => 0.695)).toBe('token');
  expect(selectCaveOutcome(5, rewards, () => 0.75)).toBe('loot');
  expect(selectCaveOutcome(5, rewards, () => 0.825)).toBe('potion');
  expect(selectCaveOutcome(5, rewards, () => 0.875)).toBe('rollAgain');
  expect(selectCaveOutcome(5, rewards, () => 0.95)).toBe('ogre');
});

test('forces an ogre at step sixteen and removes all previously acquired rewards', () => {
  const allRewards = {
    loot: true,
    potion: true,
    rollAgain: true,
    token: true,
  };

  expect(getAdjustedCaveProbabilities(16, allRewards)).toEqual({
    nothing: 0,
    token: 0,
    loot: 0,
    potion: 0,
    rollAgain: 0,
    ogre: 100,
  });
  expect(selectCaveOutcome(16, allRewards, () => 0)).toBe('ogre');
});

test('creates an empty actual Cave reward state', () => {
  expect(createCaveRewardState()).toEqual({
    hasLootChest: false,
    hasRollAgainPotion: false,
    potion: null,
    token: null,
  });
});

test('generates exact token objects with 10 percent rare and 90 percent common odds', () => {
  const rareRolls = [0.0999, 0];
  const commonRolls = [0.1, 0];
  const rareToken = generateCaveTokenReward(() => rareRolls.shift());
  const commonToken = generateCaveTokenReward(() => commonRolls.shift());

  expect(rareToken).toMatchObject({ rarity: 'Rare', type: expect.any(String) });
  expect(commonToken).toMatchObject({ rarity: 'Common', type: expect.any(String) });
  expect(rareToken).toHaveProperty('name.en');
  expect(commonToken).toHaveProperty('name.jp');
});

test('can award Shiny Buff from the rare cave token pool', () => {
  const rolls = [0.0999, 0.9999];

  expect(generateCaveTokenReward(() => rolls.shift())).toMatchObject({
    rarity: 'Rare',
    type: 'purple-yellow-outline',
  });
});

test('generates exact potion objects with 20 percent rare and 80 percent common odds', () => {
  const rareRolls = [0.1999, 0];
  const commonRolls = [0.2, 0];
  const rarePotion = generateCavePotionReward(() => rareRolls.shift());
  const commonPotion = generateCavePotionReward(() => commonRolls.shift());

  expect(rarePotion).toMatchObject({ id: expect.any(String), rarity: 'Rare' });
  expect(commonPotion).toMatchObject({ id: expect.any(String), rarity: 'Common' });
  expect(['Board', 'Both']).toContain(rarePotion.availability);
  expect(['Board', 'Both']).toContain(commonPotion.availability);
  expect(rarePotion).toHaveProperty('japaneseName');
  expect(commonPotion).toHaveProperty('name');
});
