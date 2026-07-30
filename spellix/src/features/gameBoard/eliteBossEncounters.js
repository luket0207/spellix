import { ENEMIES } from '../battle/enemies';

export const ELITE_TOWER_GRAVEL = 'eliteTowerGravel';
export const ELITE_TOWER_WOODS = 'eliteTowerWoods';
export const BOSS_BATTLE = 'bossBattle';

const ENCOUNTER_KEYS = [
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
  BOSS_BATTLE,
];

let randomSeed = Date.now() >>> 0;

function getRandomValue() {
  randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;

  return randomSeed / 4294967296;
}

export function selectEliteBossEnemyAssignments(
  enemies = ENEMIES,
  randomFn = getRandomValue
) {
  const candidates = enemies
    .filter(({ level }) => level === 4)
    .map(({ id }) => id);

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [
      candidates[swapIndex],
      candidates[index],
    ];
  }

  return ENCOUNTER_KEYS.reduce(
    (assignments, encounterKey, index) => ({
      ...assignments,
      [encounterKey]: candidates[index] ?? null,
    }),
    {}
  );
}

export function getEliteBossEncounterType(board, destinationNodeId) {
  if (destinationNodeId === 'boss-battle') {
    return BOSS_BATTLE;
  }

  const featureImageId =
    destinationNodeId === 'elite-battle-top-left'
      ? 'elite-top-left'
      : destinationNodeId === 'elite-battle-bottom-right'
        ? 'elite-bottom-right'
        : null;
  const featureImage = board?.featureImages?.find(
    ({ id }) => id === featureImageId
  );

  if (featureImage?.imageName === 'elite-tower-gravel.png') {
    return ELITE_TOWER_GRAVEL;
  }

  if (featureImage?.imageName === 'elite-tower-woods.png') {
    return ELITE_TOWER_WOODS;
  }

  return null;
}

export function hasCompletedEliteTowers(player) {
  return Boolean(
    player?.eliteProgress?.eliteTowerGravel &&
      player?.eliteProgress?.eliteTowerWoods
  );
}
