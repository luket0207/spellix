import {
  HAZARDS,
  HAZARD_ENVIRONMENTS,
  selectHazardForEnvironment,
} from './hazards';

const EXPECTED_HAZARDS = [
  ['landslide', 'Landslide', '土砂崩れ', [0, 12, 8, 3, 0, 0, 0, 0, 18], ['loseHealth', 10]],
  ['rockfall', 'Rockfall', '落石', [0, 10, 20, 0, 0, 0, 0, 0, 16], ['loseHealth', 10]],
  ['flash-flood', 'Flash Flood', '鉄砲水', [8, 8, 3, 10, 14, 18, 0, 0, 3], ['skipNextTurn']],
  ['quicksand', 'Quicksand', '流砂', [5, 2, 8, 22, 4, 2, 0, 2, 0], ['skipNextTurn']],
  ['thorn-snare', 'Thorn Snare', '茨の罠', [12, 8, 0, 4, 0, 0, 15, 18, 0], ['loseHealth', 10]],
  ['falling-branches', 'Falling Branches', '落下する枝', [2, 4, 0, 0, 0, 0, 18, 17, 2], ['loseHealth', 10]],
  ['wildfire', 'Wildfire', '山火事', [18, 12, 5, 0, 0, 0, 12, 8, 3], ['skipNextTurn']],
  ['poisonous-spores', 'Poisonous Spores', '毒胞子', [3, 3, 0, 12, 4, 0, 14, 18, 0], ['loseHealth', 10]],
  ['swamp-gas', 'Swamp Gas', '沼の毒ガス', [0, 0, 0, 15, 8, 5, 2, 5, 0], ['loseHealth', 10]],
  ['strong-current', 'Strong Current', '急流', [0, 0, 0, 0, 28, 40, 0, 0, 2], ['loseHealth', 10]],
  ['avalanche', 'Avalanche', '雪崩', [0, 2, 0, 0, 0, 0, 0, 0, 20], ['loseHealth', 10]],
  ['dense-enchanted-fog', 'Dense Enchanted Fog', '濃密な魔法の霧', [10, 8, 5, 8, 10, 8, 10, 8, 5], ['skipNextTurn']],
  ['lightning-strike', 'Lightning Strike', '落雷', [15, 10, 5, 2, 4, 4, 5, 3, 10], ['loseHealth', 10]],
  ['mudslide', 'Mudslide', '泥流', [0, 8, 5, 10, 5, 3, 0, 0, 6], ['loseHealth', 5]],
  ['hidden-sinkhole', 'Hidden Sinkhole', '隠れた陥没穴', [12, 5, 15, 5, 0, 0, 3, 2, 2], ['loseHealth', 5]],
  ['cursed-brambles', 'Cursed Brambles', '呪われた茨', [5, 3, 0, 3, 0, 0, 10, 12, 0], ['loseHealth', 10]],
  ["wandering-will-o'-wisps", "Wandering Will-o'-Wisps", 'さまよう鬼火', [3, 2, 0, 4, 10, 7, 4, 4, 0], ['loseHealth', 5]],
  ['frozen-ground', 'Frozen Ground', '凍った地面', [0, 1, 3, 0, 3, 3, 0, 0, 8], ['skipNextTurn']],
  ['mana-storm', 'Mana Storm', 'マナの嵐', [7, 1, 8, 2, 10, 10, 7, 3, 2], ['loseHealth', 5]],
  ['crumbling-cliff-edge', 'Crumbling Cliff Edge', '崩れかけた崖の縁', [0, 1, 15, 0, 0, 0, 0, 0, 3], ['skipNextTurn']],
];

test('defines every hazard environment and exact hazard table row', () => {
  expect(HAZARD_ENVIRONMENTS).toEqual([
    { background: 'fields', id: 'field', label: 'Field' },
    { background: 'hills', id: 'hills', label: 'Hills' },
    { background: 'gravel', id: 'gravel', label: 'Gravel' },
    { background: 'mud', id: 'mud', label: 'Mud' },
    { background: 'stream', id: 'stream', label: 'Stream' },
    { background: 'river', id: 'river', label: 'River' },
    { background: 'woods', id: 'woods', label: 'Woods' },
    { background: 'forest', id: 'forest', label: 'Forest' },
    { background: 'mountains', id: 'mountains', label: 'Mountains' },
  ]);

  expect(
    HAZARDS.map((hazard) => [
      hazard.id,
      hazard.name.en,
      hazard.name.jp,
      HAZARD_ENVIRONMENTS.map(({ id }) => hazard.chances[id]),
      [hazard.effect.type, hazard.effect.amount].filter((value) => value !== undefined),
    ])
  ).toEqual(EXPECTED_HAZARDS);
});

test('uses environment values as weights and never selects zero-weight hazards', () => {
  expect(selectHazardForEnvironment('field', HAZARDS, () => 0)?.id).toBe(
    'flash-flood'
  );
  expect(selectHazardForEnvironment('mountains', HAZARDS, () => 0)?.id).toBe(
    'landslide'
  );
  expect(selectHazardForEnvironment('river', HAZARDS, () => 0.999)?.chances.river)
    .toBeGreaterThan(0);
  expect(selectHazardForEnvironment('unknown', HAZARDS, () => 0)).toBeNull();
});

test('selects across cumulative weighted boundaries without requiring totals of 100', () => {
  const hazards = [
    { id: 'zero', chances: { field: 0 } },
    { id: 'first', chances: { field: 2 } },
    { id: 'second', chances: { field: 3 } },
  ];

  expect(selectHazardForEnvironment('field', hazards, () => 0)?.id).toBe('first');
  expect(selectHazardForEnvironment('field', hazards, () => 0.39)?.id).toBe('first');
  expect(selectHazardForEnvironment('field', hazards, () => 0.4)?.id).toBe('second');
  expect(selectHazardForEnvironment('field', hazards, () => 1)?.id).toBe('second');
});
