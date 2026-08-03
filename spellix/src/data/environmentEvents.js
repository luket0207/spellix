export const ENVIRONMENT_EVENT_TYPES = [
  'nothing',
  'level1Battle',
  'level2Battle',
  'level3Battle',
  'riverMiniGame',
  'caveMiniGame',
  'decision',
  'hazard',
  'lootChest',
  'rollAgain',
];

export const ENVIRONMENT_EVENT_TABLE = {
  field: {
    nothing: 30,
    level1Battle: 35,
    level2Battle: 0,
    level3Battle: 0,
    riverMiniGame: 0,
    caveMiniGame: 0,
    decision: 15,
    hazard: 5,
    lootChest: 5,
    rollAgain: 10,
  },
  hills: {
    nothing: 25,
    level1Battle: 35,
    level2Battle: 0,
    level3Battle: 0,
    riverMiniGame: 0,
    caveMiniGame: 15,
    decision: 10,
    hazard: 5,
    lootChest: 5,
    rollAgain: 5,
  },
  gravel: {
    nothing: 25,
    level1Battle: 30,
    level2Battle: 5,
    level3Battle: 0,
    riverMiniGame: 0,
    caveMiniGame: 0,
    decision: 15,
    hazard: 15,
    lootChest: 5,
    rollAgain: 5,
  },
  mud: {
    nothing: 25,
    level1Battle: 30,
    level2Battle: 5,
    level3Battle: 0,
    riverMiniGame: 0,
    caveMiniGame: 0,
    decision: 15,
    hazard: 15,
    lootChest: 5,
    rollAgain: 5,
  },
  stream: {
    nothing: 15,
    level1Battle: 10,
    level2Battle: 0,
    level3Battle: 0,
    riverMiniGame: 60,
    caveMiniGame: 0,
    decision: 0,
    hazard: 10,
    lootChest: 5,
    rollAgain: 0,
  },
  river: {
    nothing: 0,
    level1Battle: 0,
    level2Battle: 0,
    level3Battle: 0,
    riverMiniGame: 90,
    caveMiniGame: 0,
    decision: 0,
    hazard: 5,
    lootChest: 5,
    rollAgain: 0,
  },
  woods: {
    nothing: 0,
    level1Battle: 45,
    level2Battle: 40,
    level3Battle: 0,
    riverMiniGame: 0,
    caveMiniGame: 0,
    decision: 5,
    hazard: 5,
    lootChest: 5,
    rollAgain: 0,
  },
  forest: {
    nothing: 0,
    level1Battle: 0,
    level2Battle: 40,
    level3Battle: 40,
    riverMiniGame: 0,
    caveMiniGame: 0,
    decision: 5,
    hazard: 10,
    lootChest: 5,
    rollAgain: 0,
  },
  mountains: {
    nothing: 0,
    level1Battle: 0,
    level2Battle: 25,
    level3Battle: 30,
    riverMiniGame: 0,
    caveMiniGame: 25,
    decision: 5,
    hazard: 10,
    lootChest: 5,
    rollAgain: 0,
  },
};

export function getAvailableEventsForEnvironment(environment) {
  const eventWeights = ENVIRONMENT_EVENT_TABLE[environment];

  if (!eventWeights) {
    return [];
  }

  return ENVIRONMENT_EVENT_TYPES
    .map((eventType) => ({
      eventType,
      weight: eventWeights[eventType],
    }))
    .filter(({ weight }) => weight > 0);
}

export function selectEventForEnvironment(
  environment,
  randomFn = Math.random
) {
  const availableEvents = getAvailableEventsForEnvironment(environment);
  const totalWeight = availableEvents.reduce(
    (total, { weight }) => total + weight,
    0
  );

  if (totalWeight <= 0) {
    return null;
  }

  const roll = randomFn() * totalWeight;
  let runningTotal = 0;

  for (const event of availableEvents) {
    runningTotal += event.weight;

    if (roll < runningTotal) {
      return event.eventType;
    }
  }

  return availableEvents[availableEvents.length - 1].eventType;
}

export function getBattleEnvironmentForBoardEnvironment(environment) {
  return environment === 'field' ? 'fields' : environment;
}
