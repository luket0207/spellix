import { ENEMIES, getEnemyById, getEnemiesForLevel, selectRandomEnemyForLevel } from './enemies';

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
      'red',
      'green',
      'green',
    ]);
    expect(hellcrownReaper.spellSlots[2].tokens).toEqual([]);
    expect(hellcrownReaper.spellSlots[4].tokens.map(({ type }) => type)).toEqual([
      'red',
      'red',
      'red',
      'green',
      'green',
    ]);
    expect(hellcrownReaper.spellSlots[5].tokens).toEqual([]);
    expect(JSON.stringify([crownedLichlord, hellcrownReaper])).not.toContain('"J"');
    expect(vilewhiskerRat.spellSlots[0].tokens).toEqual([]);
  });

  test('groups enemies by level with five enemies in each level band', () => {
    expect(getEnemiesForLevel(1)).toHaveLength(5);
    expect(getEnemiesForLevel(2)).toHaveLength(5);
    expect(getEnemiesForLevel(3)).toHaveLength(5);
    expect(getEnemiesForLevel(4)).toHaveLength(5);
  });
});
