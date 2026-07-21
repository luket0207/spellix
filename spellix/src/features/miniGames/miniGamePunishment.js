export const MINI_GAME_PUNISHMENTS = Object.freeze([
  { healthLost: 10, weight: 20 },
  { healthLost: 15, weight: 18 },
  { healthLost: 20, weight: 16 },
  { healthLost: 25, weight: 12 },
  { healthLost: 30, weight: 10 },
  { healthLost: 35, weight: 9 },
  { healthLost: 40, weight: 7 },
  { healthLost: 45, weight: 5 },
  { healthLost: 50, weight: 3 },
]);

export function selectMiniGameHealthLoss(randomFn = Math.random) {
  const randomValue = Math.min(Math.max(Number(randomFn()) || 0, 0), 0.999999);
  const weightedRoll = randomValue * 100;
  let cumulativeWeight = 0;

  for (const punishment of MINI_GAME_PUNISHMENTS) {
    cumulativeWeight += punishment.weight;

    if (weightedRoll < cumulativeWeight) {
      return punishment.healthLost;
    }
  }

  return MINI_GAME_PUNISHMENTS[MINI_GAME_PUNISHMENTS.length - 1].healthLost;
}
