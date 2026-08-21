function createSpellEntry(type, count) {
  return { count, type };
}

function createTokenSlot(...entries) {
  return {
    kind: 'tokens',
    entries,
  };
}

function createMissSlot() {
  return {
    kind: 'miss',
  };
}

function createEnemySpellSlot(enemyId, slotIndex, slotData) {
  const baseSlot = {
    id: `${enemyId}-slot-${slotIndex + 1}`,
    maxTokens: 5,
    tokens: [],
  };

  if (slotData.kind === 'miss') {
    return baseSlot;
  }

  return {
    ...baseSlot,
    tokens: slotData.entries.flatMap(({ count, type }) =>
      Array.from({ length: count }, (_, tokenIndex) => ({
        committed: true,
        id: `${enemyId}-slot-${slotIndex + 1}-${type}-${tokenIndex + 1}`,
        type,
      }))
    ),
  };
}

const ENEMY_DEFINITIONS = [
  {
    englishName: 'Vilewhisker Rat',
    id: 'vilewhisker-rat',
    imageFileName: 'VR.png',
    japaneseName: '毒ヒゲネズミ',
    level: 1,
    maxHealth: 25,
    spellSlots: [
      createMissSlot(),
      createTokenSlot(createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('orange', 2)),
      createMissSlot(),
    ],
  },
  {
    englishName: 'Emberhorn Imp',
    id: 'emberhorn-imp',
    imageFileName: 'EI.png',
    japaneseName: '火角インプ',
    level: 1,
    maxHealth: 25,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 2)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 1)),
      createMissSlot(),
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 2)),
    ],
  },
  {
    englishName: 'Boneveil Acolyte',
    id: 'boneveil-acolyte',
    imageFileName: 'BA.png',
    japaneseName: '骨衣の使徒',
    level: 1,
    maxHealth: 25,
    spellSlots: [
      createTokenSlot(createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('blue', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('green', 1)),
    ],
  },
  {
    englishName: 'Nightplume Raven',
    id: 'nightplume-raven',
    imageFileName: 'NR.png',
    japaneseName: '夜羽ガラス',
    level: 1,
    maxHealth: 25,
    spellSlots: [
      createTokenSlot(createSpellEntry('blue', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('purple', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createMissSlot(),
      createMissSlot(),
    ],
  },
  {
    englishName: 'Flaskwick Goblin',
    id: 'flaskwick-goblin',
    imageFileName: 'FG.png',
    japaneseName: '薬瓶ゴブリン',
    level: 1,
    maxHealth: 25,
    spellSlots: [
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('orange', 2)),
      createTokenSlot(createSpellEntry('red', 1)),
      createMissSlot(),
    ],
  },
  {
    englishName: 'Hexmaw Hag',
    id: 'hexmaw-hag',
    imageFileName: 'HH.png',
    japaneseName: '呪牙の魔女',
    level: 2,
    maxHealth: 35,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('purple', 2)),
      createTokenSlot(createSpellEntry('blue', 1)),
      createTokenSlot(createSpellEntry('blue', 1)),
      createTokenSlot(createSpellEntry('purple', 2)),
      createTokenSlot(createSpellEntry('red', 1)),
    ],
  },
  {
    englishName: 'Runefang Wolf',
    id: 'runefang-wolf',
    imageFileName: 'RW.png',
    japaneseName: '魔紋狼',
    level: 2,
    maxHealth: 35,
    spellSlots: [
      createTokenSlot(createSpellEntry('orange', 2)),
      createTokenSlot(createSpellEntry('blue', 1), createSpellEntry('orange', 2)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('orange', 2)),
      createTokenSlot(createSpellEntry('red', 1)),
    ],
  },
  {
    englishName: 'Frostwisp Spirit',
    id: 'frostwisp-spirit',
    imageFileName: 'FS.png',
    japaneseName: '氷霊ウィスプ',
    level: 2,
    maxHealth: 35,
    spellSlots: [
      createMissSlot(),
      createTokenSlot(createSpellEntry('blue', 1), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('light-blue', 1)),
      createTokenSlot(createSpellEntry('blue', 1), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('orange', 1)),
    ],
  },
  {
    englishName: 'Harvestrot Scarecrow',
    id: 'harvestrot-scarecrow',
    imageFileName: 'HS.png',
    japaneseName: '腐れ案山子',
    level: 2,
    maxHealth: 35,
    spellSlots: [
      createTokenSlot(createSpellEntry('blue', 1), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('yellow', 2)),
      createTokenSlot(createSpellEntry('blue', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('blue', 1), createSpellEntry('green', 1)),
    ],
  },
  {
    englishName: 'Wartback Brute',
    id: 'wartback-brute',
    imageFileName: 'WB.png',
    japaneseName: 'イボ背の巨漢',
    level: 2,
    maxHealth: 35,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 3)),
      createTokenSlot(createSpellEntry('green', 1)),
      createMissSlot(),
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 3)),
      createTokenSlot(createSpellEntry('green', 1)),
    ],
  },
  {
    englishName: 'Gravechant Necromancer',
    id: 'gravechant-necromancer',
    imageFileName: 'GN.png',
    japaneseName: '墓歌の屍術師',
    level: 3,
    maxHealth: 50,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('purple', 3), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('purple', 3), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('red', 1)),
    ],
  },
  {
    englishName: 'Dreadsteel Knight',
    id: 'dreadsteel-knight',
    imageFileName: 'DK.png',
    japaneseName: '恐鋼の騎士',
    level: 3,
    maxHealth: 50,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 4)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('orange', 1)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('red', 4)),
    ],
  },
  {
    englishName: 'Skullclub Warlord',
    id: 'skullclub-warlord',
    imageFileName: 'SW.png',
    japaneseName: '髑髏棍の戦王',
    level: 3,
    maxHealth: 50,
    spellSlots: [
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('green', 1), createSpellEntry('orange', 2)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('green', 1), createSpellEntry('orange', 2)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('orange', 1)),
    ],
  },
  {
    englishName: 'Venomglyph Serpent',
    id: 'venomglyph-serpent',
    imageFileName: 'VS.png',
    japaneseName: '毒紋の大蛇',
    level: 3,
    maxHealth: 50,
    spellSlots: [
      createTokenSlot(createSpellEntry('light-blue', 2)),
      createTokenSlot(createSpellEntry('orange', 1), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('orange', 1), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('light-blue', 2)),
    ],
  },
  {
    englishName: 'Cinderveil Demon',
    id: 'cinderveil-demon',
    imageFileName: 'CD.png',
    japaneseName: '炎灰の悪魔',
    level: 3,
    maxHealth: 50,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 2), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('yellow', 1)),
      createTokenSlot(createSpellEntry('red', 1), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('red', 1), createSpellEntry('orange', 1)),
      createTokenSlot(createSpellEntry('yellow', 1)),
      createTokenSlot(createSpellEntry('red', 2), createSpellEntry('orange', 1)),
    ],
  },
  {
    englishName: 'Crowned Lichlord',
    id: 'crowned-lichlord',
    imageFileName: 'CL.png',
    japaneseName: '冠のリッチ王',
    level: 4,
    maxHealth: 85,
    mergedColumns: [
      { activeColumn: 1, columns: [1, 2], removedColumn: 2 },
    ],
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 2), createSpellEntry('orange', 2)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('purple', 3)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('green', 1)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('green', 1)),
    ],
  },
  {
    englishName: 'Amethyst Ogre',
    id: 'amethyst-ogre',
    imageFileName: 'AO.png',
    japaneseName: '紫晶のオーガ',
    level: 4,
    maxHealth: 85,
    spellSlots: [
      createTokenSlot(createSpellEntry('red', 4)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('green', 2)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('green', 2)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('red', 4)),
      createTokenSlot(createSpellEntry('red', 2)),
    ],
  },
  {
    englishName: 'Mossroot Elder',
    id: 'mossroot-elder',
    imageFileName: 'ME.png',
    japaneseName: '苔根の古老',
    level: 4,
    maxHealth: 85,
    spellSlots: [
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('yellow', 2)),
      createTokenSlot(createSpellEntry('red', 1), createSpellEntry('orange', 3)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('red', 1)),
      createTokenSlot(createSpellEntry('red', 1), createSpellEntry('orange', 3)),
      createTokenSlot(createSpellEntry('blue', 2), createSpellEntry('yellow', 2)),
    ],
  },
  {
    englishName: 'Duskwyrm Warlock',
    id: 'duskwyrm-warlock',
    imageFileName: 'DW.png',
    japaneseName: '黄昏竜の魔導士',
    level: 4,
    maxHealth: 85,
    spellSlots: [
      createTokenSlot(createSpellEntry('light-blue', 1), createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('blue', 3)),
      createTokenSlot(createSpellEntry('light-blue', 1), createSpellEntry('orange', 3)),
      createTokenSlot(createSpellEntry('red', 2)),
      createTokenSlot(createSpellEntry('light-blue', 1), createSpellEntry('blue', 3)),
      createTokenSlot(createSpellEntry('light-blue', 1), createSpellEntry('orange', 3)),
    ],
  },
  {
    englishName: 'Hellcrown Reaper',
    id: 'hellcrown-reaper',
    imageFileName: 'HR.png',
    japaneseName: '地獄冠の死神',
    level: 4,
    maxHealth: 85,
    mergedColumns: [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
      { activeColumn: 5, columns: [5, 6], removedColumn: 6 },
    ],
    spellSlots: [
      createTokenSlot(createSpellEntry('blue', 4)),
      createTokenSlot(createSpellEntry('red', 2), createSpellEntry('green', 2)),
      createMissSlot(),
      createTokenSlot(createSpellEntry('purple', 2)),
      createTokenSlot(createSpellEntry('red', 2), createSpellEntry('green', 2)),
      createMissSlot(),
    ],
  },
];

export const ENEMIES = ENEMY_DEFINITIONS.map((enemy) => ({
  ...enemy,
  currentHealth: enemy.maxHealth,
  spellSlots: enemy.spellSlots.map((slotData, slotIndex) =>
    createEnemySpellSlot(enemy.id, slotIndex, slotData)
  ),
}));

export function getEnemyById(enemyId) {
  return ENEMIES.find((enemy) => enemy.id === enemyId) ?? null;
}

export function getEnemiesForLevel(level) {
  return ENEMIES.filter((enemy) => enemy.level === level);
}

export function selectRandomEnemyForLevel(
  level,
  randomFn = Math.random,
  previousEnemyId = null
) {
  const enemies = getEnemiesForLevel(level);

  if (enemies.length === 0) {
    return null;
  }

  const eligibleEnemies =
    enemies.length > 1
      ? enemies.filter(({ id }) => id !== previousEnemyId)
      : enemies;

  const rawIndex = Math.floor(randomFn() * eligibleEnemies.length);
  const clampedIndex = Math.min(
    Math.max(rawIndex, 0),
    eligibleEnemies.length - 1
  );

  return eligibleEnemies[clampedIndex];
}
