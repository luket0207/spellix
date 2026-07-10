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

  test('stores joined spell columns as display-only J slots and miss slots without tokens', () => {
    const crownedLichlord = getEnemyById('crowned-lichlord');
    const hellcrownReaper = getEnemyById('hellcrown-reaper');
    const vilewhiskerRat = getEnemyById('vilewhisker-rat');

    expect(crownedLichlord.spellSlots[1]).toMatchObject({
      displayLabel: 'J',
      joinedWith: 1,
      tokens: [],
    });
    expect(hellcrownReaper.spellSlots[2]).toMatchObject({
      displayLabel: 'J',
      joinedWith: 2,
      tokens: [],
    });
    expect(hellcrownReaper.spellSlots[5]).toMatchObject({
      displayLabel: 'J',
      joinedWith: 5,
      tokens: [],
    });
    expect(vilewhiskerRat.spellSlots[0].tokens).toEqual([]);
  });

  test('groups enemies by level with five enemies in each level band', () => {
    expect(getEnemiesForLevel(1)).toHaveLength(5);
    expect(getEnemiesForLevel(2)).toHaveLength(5);
    expect(getEnemiesForLevel(3)).toHaveLength(5);
    expect(getEnemiesForLevel(4)).toHaveLength(5);
  });
});
