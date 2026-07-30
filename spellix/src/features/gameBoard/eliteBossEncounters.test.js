import { ENEMIES } from '../battle/enemies';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
  getEliteBossEncounterType,
  hasCompletedEliteTowers,
  selectEliteBossEnemyAssignments,
} from './eliteBossEncounters';

describe('elite tower and boss encounter setup', () => {
  test('assigns three distinct level 4 enemies', () => {
    const assignments = selectEliteBossEnemyAssignments(ENEMIES, () => 0);
    const assignedIds = Object.values(assignments);
    const levelFourIds = new Set(
      ENEMIES.filter(({ level }) => level === 4).map(({ id }) => id)
    );

    expect(assignedIds).toHaveLength(3);
    expect(new Set(assignedIds).size).toBe(3);
    assignedIds.forEach((enemyId) => {
      expect(levelFourIds.has(enemyId)).toBe(true);
    });
  });

  test('resolves the generated image identity for each elite tower', () => {
    const board = {
      featureImages: [
        {
          id: 'elite-top-left',
          imageName: 'elite-tower-woods.png',
        },
        {
          id: 'elite-bottom-right',
          imageName: 'elite-tower-gravel.png',
        },
      ],
    };

    expect(
      getEliteBossEncounterType(board, 'elite-battle-top-left')
    ).toBe(ELITE_TOWER_WOODS);
    expect(
      getEliteBossEncounterType(board, 'elite-battle-bottom-right')
    ).toBe(ELITE_TOWER_GRAVEL);
    expect(getEliteBossEncounterType(board, 'boss-battle')).toBe(
      BOSS_BATTLE
    );
    expect(getEliteBossEncounterType(board, 'square-2-2')).toBeNull();
  });

  test('requires both elite victories for boss access', () => {
    expect(
      hasCompletedEliteTowers({
        eliteProgress: {
          eliteTowerGravel: true,
          eliteTowerWoods: false,
        },
      })
    ).toBe(false);
    expect(
      hasCompletedEliteTowers({
        eliteProgress: {
          eliteTowerGravel: true,
          eliteTowerWoods: true,
        },
      })
    ).toBe(true);
  });
});
