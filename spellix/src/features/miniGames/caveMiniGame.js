export const CAVE_STEP_PROBABILITIES = [
  { nothing: 97.5, token: 0, loot: 0.5, potion: 0, rollAgain: 2, ogre: 0 },
  { nothing: 96.5, token: 0, loot: 0.5, potion: 0.5, rollAgain: 2, ogre: 0.5 },
  { nothing: 88.5, token: 0, loot: 5, potion: 0.5, rollAgain: 5, ogre: 1 },
  { nothing: 84, token: 0, loot: 5, potion: 1, rollAgain: 5, ogre: 5 },
  { nothing: 69, token: 1, loot: 10, potion: 5, rollAgain: 5, ogre: 10 },
  { nothing: 64, token: 1, loot: 10, potion: 5, rollAgain: 5, ogre: 15 },
  { nothing: 43, token: 2, loot: 20, potion: 10, rollAgain: 5, ogre: 20 },
  { nothing: 41, token: 2, loot: 20, potion: 10, rollAgain: 2, ogre: 25 },
  { nothing: 18, token: 5, loot: 30, potion: 15, rollAgain: 2, ogre: 30 },
  { nothing: 8, token: 5, loot: 30, potion: 15, rollAgain: 2, ogre: 40 },
  { nothing: 5, token: 15, loot: 20, potion: 10, rollAgain: 0, ogre: 50 },
  { nothing: 3, token: 15, loot: 10, potion: 12, rollAgain: 0, ogre: 60 },
  { nothing: 1, token: 15, loot: 5, potion: 9, rollAgain: 0, ogre: 70 },
  { nothing: 0, token: 15, loot: 0, potion: 5, rollAgain: 0, ogre: 80 },
  { nothing: 0, token: 15, loot: 0, potion: 0, rollAgain: 0, ogre: 85 },
  { nothing: 0, token: 0, loot: 0, potion: 0, rollAgain: 0, ogre: 100 },
];

const CAVE_OUTCOMES = ['nothing', 'token', 'loot', 'potion', 'rollAgain', 'ogre'];
export const CAVE_REWARD_TYPES = ['token', 'loot', 'potion', 'rollAgain'];

export function createCaveRewards() {
  return {
    token: false,
    loot: false,
    potion: false,
    rollAgain: false,
  };
}

export function getAdjustedCaveProbabilities(step, acquiredRewards = createCaveRewards()) {
  const normalizedStep = Math.min(
    Math.max(Number.isFinite(step) ? Math.floor(step) : 1, 1),
    CAVE_STEP_PROBABILITIES.length
  );
  const adjusted = { ...CAVE_STEP_PROBABILITIES[normalizedStep - 1] };

  CAVE_REWARD_TYPES.forEach((rewardType) => {
    if (acquiredRewards[rewardType]) {
      adjusted.ogre += adjusted[rewardType];
      adjusted[rewardType] = 0;
    }
  });

  return adjusted;
}

export function selectCaveOutcome(step, acquiredRewards, randomFn = Math.random) {
  const probabilities = getAdjustedCaveProbabilities(step, acquiredRewards);
  const roll = Math.min(Math.max(randomFn(), 0), 1) * 100;
  let cumulativeChance = 0;

  for (const outcome of CAVE_OUTCOMES) {
    cumulativeChance += probabilities[outcome];

    if (roll < cumulativeChance) {
      return outcome;
    }
  }

  return 'ogre';
}
