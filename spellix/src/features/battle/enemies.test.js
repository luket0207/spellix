import { ENEMIES, getEnemyById, getEnemiesForLevel, selectRandomEnemyForLevel } from './enemies';

function getSpellSlotTypes(enemyId) {
  return getEnemyById(enemyId).spellSlots.map((slot) =>
    slot.tokens.map(({ type }) => type)
  );
}

const balancedEnemySpellSlots = {
  'gravechant-necromancer': [
    ['red'],
    ['purple', 'purple', 'purple', 'green'],
    ['red', 'red'],
    ['red', 'red'],
    ['purple', 'purple', 'purple', 'green'],
    ['red'],
  ],
  'dreadsteel-knight': [
    ['red', 'red', 'red', 'red'],
    [],
    ['blue', 'blue', 'orange'],
    ['blue', 'blue', 'orange'],
    [],
    ['red', 'red', 'red', 'red'],
  ],
  'skullclub-warlord': [
    ['blue', 'blue', 'orange'],
    ['green', 'orange', 'orange'],
    ['red', 'red'],
    ['red', 'red'],
    ['green', 'orange', 'orange'],
    ['blue', 'blue', 'orange'],
  ],
  'venomglyph-serpent': [
    ['light-blue', 'light-blue'],
    ['orange', 'green'],
    ['red', 'red'],
    ['red', 'red'],
    ['orange', 'green'],
    ['light-blue', 'light-blue'],
  ],
  'cinderveil-demon': [
    ['red', 'red', 'orange'],
    ['yellow'],
    ['red', 'orange'],
    ['red', 'orange'],
    ['yellow'],
    ['red', 'red', 'orange'],
  ],
  'crowned-lichlord': [
    ['red', 'red', 'orange', 'orange'],
    [],
    ['purple', 'purple', 'purple'],
    ['red', 'red'],
    ['blue', 'blue', 'green'],
    ['blue', 'blue', 'green'],
  ],
  'amethyst-ogre': [
    ['red', 'red', 'red', 'red'],
    ['blue', 'blue', 'green', 'green'],
    ['blue', 'blue', 'green', 'green'],
    ['red', 'red'],
    ['red', 'red', 'red', 'red'],
    ['red', 'red'],
  ],
  'mossroot-elder': [
    ['blue', 'blue', 'yellow', 'yellow'],
    ['red', 'orange', 'orange', 'orange'],
    ['blue', 'blue', 'red'],
    ['blue', 'blue', 'red'],
    ['red', 'orange', 'orange', 'orange'],
    ['blue', 'blue', 'yellow', 'yellow'],
  ],
  'duskwyrm-warlock': [
    ['light-blue', 'red', 'red'],
    ['blue', 'blue', 'blue'],
    ['light-blue', 'orange', 'orange', 'orange'],
    ['red', 'red'],
    ['light-blue', 'blue', 'blue', 'blue'],
    ['light-blue', 'orange', 'orange', 'orange'],
  ],
  'hellcrown-reaper': [
    ['blue', 'blue', 'blue', 'blue'],
    ['red', 'red', 'green', 'green'],
    [],
    ['purple', 'purple'],
    ['red', 'red', 'green', 'green'],
    [],
  ],
};

describe('battle enemy data', () => {
  test('defines all 20 enemies with japanese names, health, and six spell slots', () => {
    expect(ENEMIES).toHaveLength(20);

    ENEMIES.forEach((enemy) => {
      expect(enemy.englishName).toBeTruthy();
      expect(enemy.japaneseName).toBeTruthy();
      expect(enemy.imageFileName).toMatch(/^[A-Z]{2}\.png$/);
      expect(enemy.level).toBeGreaterThanOrEqual(1);
      expect(enemy.level).toBeLessThanOrEqual(4);
      expect(enemy.currentHealth).toBe(enemy.maxHealth);
      expect(enemy.spellSlots).toHaveLength(6);
    });
  });

  test('selects random enemies only from the requested level', () => {
    expect(selectRandomEnemyForLevel(1, () => 0).level).toBe(1);
    expect(selectRandomEnemyForLevel(2, () => 0.99).level).toBe(2);
    expect(selectRandomEnemyForLevel(3, () => 0.4).level).toBe(3);
    expect(selectRandomEnemyForLevel(4, () => 0.2).level).toBe(4);
    expect(selectRandomEnemyForLevel(9, () => 0)).toBeNull();
  });

  test.each([1, 2, 3])(
    'excludes the previous enemy for random level %i battles',
    (level) => {
      const levelEnemies = getEnemiesForLevel(level);
      const selectedEnemy = selectRandomEnemyForLevel(
        level,
        () => 0,
        levelEnemies[0].id
      );

      expect(selectedEnemy.id).toBe(levelEnemies[1].id);
    }
  );

  test.each([
    [1, 25],
    [2, 35],
    [3, 50],
    [4, 85],
  ])('gives every level %i enemy %i starting health', (level, health) => {
    getEnemiesForLevel(level).forEach((enemy) => {
      expect(enemy.maxHealth).toBe(health);
      expect(enemy.currentHealth).toBe(health);
    });
  });

  test.each(Object.entries(balancedEnemySpellSlots))(
    'uses the balanced source-of-truth spell slots for %s',
    (enemyId, spellSlots) => {
      expect(getSpellSlotTypes(enemyId)).toEqual(spellSlots);
    }
  );

  test('stores joined enemy spell columns as effective merged columns without placeholders', () => {
    const crownedLichlord = getEnemyById('crowned-lichlord');
    const hellcrownReaper = getEnemyById('hellcrown-reaper');
    const vilewhiskerRat = getEnemyById('vilewhisker-rat');

    expect(crownedLichlord.mergedColumns).toEqual([
      { activeColumn: 1, columns: [1, 2], removedColumn: 2 },
    ]);
    expect(crownedLichlord.spellSlots[0].tokens.map(({ type }) => type)).toEqual([
      'red',
      'red',
      'orange',
      'orange',
    ]);
    expect(crownedLichlord.spellSlots[1].tokens).toEqual([]);
    expect(hellcrownReaper.mergedColumns).toEqual([
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
      { activeColumn: 5, columns: [5, 6], removedColumn: 6 },
    ]);
    expect(hellcrownReaper.spellSlots[1].tokens.map(({ type }) => type)).toEqual([
      'red',
      'red',
      'green',
      'green',
    ]);
    expect(hellcrownReaper.spellSlots[2].tokens).toEqual([]);
    expect(hellcrownReaper.spellSlots[4].tokens.map(({ type }) => type)).toEqual([
      'red',
      'red',
      'green',
      'green',
    ]);
    expect(hellcrownReaper.spellSlots[5].tokens).toEqual([]);
    expect(JSON.stringify([crownedLichlord, hellcrownReaper])).not.toContain('"J"');
    expect(JSON.stringify(hellcrownReaper)).not.toContain('#');
    expect(vilewhiskerRat.spellSlots[0].tokens).toEqual([]);
  });

  test('groups enemies by level with five enemies in each level band', () => {
    expect(getEnemiesForLevel(1)).toHaveLength(5);
    expect(getEnemiesForLevel(2)).toHaveLength(5);
    expect(getEnemiesForLevel(3)).toHaveLength(5);
    expect(getEnemiesForLevel(4)).toHaveLength(5);
  });
});
