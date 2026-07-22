import {
  applyColumnMerge,
  applyLightGreenHealthBonus,
  findNextColumnMerge,
  getAdjacentEffectiveSpellColumnGroups,
  getEffectiveSpellColumnGroups,
  getEffectiveSpellColumnIndex,
  getOverCapacityColumnNumbers,
  getSpellColumnCapacity,
  getSpellColumnCapacities,
} from './nonBattleSpellEffects';

function createToken(id, type) {
  return { committed: true, id, type };
}

function createSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

describe('non-battle spell effects', () => {
  test('adds current and max health for newly committed Light Green tokens', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [
      createToken('light-green-1', 'light-green'),
      createToken('light-green-2', 'light-green'),
    ];

    expect(
      applyLightGreenHealthBonus(
        { baseMaxHealth: 100, currentHealth: 90, maxHealth: 100 },
        spellSlots
      )
    ).toMatchObject({ currentHealth: 100, maxHealth: 110 });

    spellSlots[0].tokens = [createToken('light-green-1', 'light-green')];
    expect(
      applyLightGreenHealthBonus(
        { baseMaxHealth: 100, currentHealth: 90, maxHealth: 100 },
        spellSlots
      )
    ).toMatchObject({ currentHealth: 95, maxHealth: 105 });
    expect(
      applyLightGreenHealthBonus(
        { baseMaxHealth: 100, currentHealth: 100, maxHealth: 100 },
        spellSlots
      )
    ).toMatchObject({ currentHealth: 105, maxHealth: 105 });
  });

  test('does not heal for existing Light Green bonuses and clamps on removal', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [createToken('light-green-1', 'light-green')];

    expect(
      applyLightGreenHealthBonus(
        { baseMaxHealth: 100, currentHealth: 90, maxHealth: 105 },
        spellSlots
      )
    ).toMatchObject({ currentHealth: 90, maxHealth: 105 });
    expect(
      applyLightGreenHealthBonus(
        { baseMaxHealth: 100, currentHealth: 108, maxHealth: 110 },
        createSpellSlots()
      )
    ).toMatchObject({ currentHealth: 100, maxHealth: 100 });
  });

  test('stacks Grey capacity only into physically adjacent columns', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [createToken('grey-edge-left', 'grey')];
    spellSlots[1].tokens = [
      createToken('grey-middle-1', 'grey'),
      createToken('grey-middle-2', 'grey'),
    ];
    spellSlots[5].tokens = [createToken('grey-edge-right', 'grey')];

    expect(getSpellColumnCapacities(spellSlots)).toEqual([7, 6, 7, 5, 6, 5]);
  });

  test('ignores uncommitted Grey tokens when calculating column capacity', () => {
    const spellSlots = createSpellSlots();
    spellSlots[1].tokens = [
      { ...createToken('grey-committed', 'grey'), committed: true },
      { ...createToken('grey-draft', 'grey'), committed: false },
    ];

    expect(getSpellColumnCapacities(spellSlots)).toEqual([6, 5, 6, 5, 5, 5]);
  });

  test('reports columns over their Grey-adjusted capacity', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = Array.from({ length: 6 }, (_, index) =>
      createToken(`red-${index}`, 'red')
    );
    spellSlots[1].tokens = [createToken('grey-1', 'grey')];

    expect(getOverCapacityColumnNumbers(spellSlots)).toEqual([]);
    spellSlots[1].tokens = [];
    expect(getOverCapacityColumnNumbers(spellSlots)).toEqual([1]);
  });

  test('detects only adjacent unused White pairs and stops after two merges', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [createToken('white-1', 'white')];
    spellSlots[2].tokens = [createToken('white-3', 'white')];

    expect(findNextColumnMerge({ spellSlots })).toBeNull();

    spellSlots[1].tokens = [createToken('white-2', 'white')];
    expect(findNextColumnMerge({ spellSlots })).toMatchObject({
      columns: [1, 2],
    });
    expect(
      findNextColumnMerge({
        columnMergesUsed: 2,
        spellSlots,
      })
    ).toBeNull();
    expect(
      findNextColumnMerge({
        mergedColumns: [{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }],
        spellSlots,
      })
    ).toBeNull();

    spellSlots[4].tokens = [createToken('white-5', 'white')];
    spellSlots[5].tokens = [createToken('white-6', 'white')];
    expect(
      findNextColumnMerge({
        mergedColumns: [{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }],
        spellSlots,
      })
    ).toMatchObject({ columns: [5, 6] });
  });

  test('groups merged assignment columns around the retained active slot', () => {
    const spellSlots = createSpellSlots();
    const groups = getEffectiveSpellColumnGroups(spellSlots, [
      { activeColumn: 3, columns: [2, 3], removedColumn: 2 },
    ]);

    expect(groups.map(({ label }) => label)).toEqual(['1', '2+3', '4', '5', '6']);
    expect(groups[1]).toMatchObject({
      columns: [2, 3],
      isMerged: true,
      slot: spellSlots[2],
      slotIndex: 2,
    });
  });

  test.each([
    [[1, 2], ['3']],
    [[2, 3], ['1', '4']],
    [[3, 4], ['2', '5']],
    [[4, 5], ['3', '6']],
    [[5, 6], ['4']],
  ])('resolves neighbours around merged effective column %j', (columns, expectedLabels) => {
    const spellSlots = createSpellSlots();
    const groups = getEffectiveSpellColumnGroups(spellSlots, [
      { activeColumn: columns[0], columns, removedColumn: columns[1] },
    ]);
    const mergedGroupIndex = groups.findIndex((group) => group.isMerged);

    expect(
      getAdjacentEffectiveSpellColumnGroups(groups, mergedGroupIndex).map(
        ({ label }) => label
      )
    ).toEqual(expectedLabels);
  });

  test('calculates committed Grey capacity across effective merged neighbours', () => {
    const spellSlots = createSpellSlots();
    const mergedColumns = [
      { activeColumn: 1, columns: [1, 2], removedColumn: 2 },
    ];
    spellSlots[0].tokens = Array.from({ length: 6 }, (_, index) =>
      createToken(`red-${index + 1}`, 'red')
    );
    spellSlots[2].tokens = [createToken('grey-3', 'grey')];

    expect(getSpellColumnCapacity(spellSlots, 0, mergedColumns)).toBe(6);
    expect(getOverCapacityColumnNumbers(spellSlots, mergedColumns)).toEqual([]);

    spellSlots[2].tokens[0].committed = false;
    expect(getSpellColumnCapacity(spellSlots, 0, mergedColumns)).toBe(5);
    expect(getOverCapacityColumnNumbers(spellSlots, mergedColumns)).toEqual(['1+2']);
  });

  test('applies Grey inside a merged group once to both effective neighbours', () => {
    const spellSlots = createSpellSlots();
    const mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];
    spellSlots[1].tokens = [createToken('grey-merged', 'grey')];

    expect(getSpellColumnCapacity(spellSlots, 0, mergedColumns)).toBe(6);
    expect(getSpellColumnCapacity(spellSlots, 3, mergedColumns)).toBe(6);
  });

  test('stacks Grey from both effective neighbours into a merged group', () => {
    const spellSlots = createSpellSlots();
    const mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];
    spellSlots[0].tokens = [createToken('grey-1', 'grey')];
    spellSlots[3].tokens = [createToken('grey-4', 'grey')];

    expect(getSpellColumnCapacity(spellSlots, 1, mergedColumns)).toBe(7);
    expect(getSpellColumnCapacity(spellSlots, 2, mergedColumns)).toBe(7);
  });

  test('selects the losing merge column by total tokens, rare tokens, then random tie-break', () => {
    const fewerTokens = createSpellSlots();
    fewerTokens[1].tokens = [
      createToken('white-2', 'white'),
      createToken('red-2', 'red'),
    ];
    fewerTokens[2].tokens = [createToken('white-3', 'white')];

    expect(findNextColumnMerge({ spellSlots: fewerTokens })).toMatchObject({
      activeColumn: 2,
      removedColumn: 3,
    });

    const fewerRare = createSpellSlots();
    fewerRare[1].tokens = [
      createToken('white-2', 'white'),
      createToken('red-2', 'red'),
    ];
    fewerRare[2].tokens = [
      createToken('white-3-a', 'white'),
      createToken('white-3-b', 'white'),
    ];

    expect(findNextColumnMerge({ spellSlots: fewerRare })).toMatchObject({
      activeColumn: 3,
      removedColumn: 2,
    });

    const tied = createSpellSlots();
    tied[3].tokens = [createToken('white-4', 'white')];
    tied[4].tokens = [createToken('white-5', 'white')];

    expect(findNextColumnMerge({ randomFn: () => 0, spellSlots: tied })).toMatchObject({
      activeColumn: 5,
      removedColumn: 4,
    });
    expect(findNextColumnMerge({ randomFn: () => 0.99, spellSlots: tied })).toMatchObject({
      activeColumn: 4,
      removedColumn: 5,
    });
  });

  test('consumes both merge White tokens and resolves either roll to the retained column', () => {
    const spellSlots = createSpellSlots();
    spellSlots[1].tokens = [createToken('white-2', 'white'), createToken('red-2', 'red')];
    spellSlots[2].tokens = [createToken('white-3', 'white')];
    const merge = findNextColumnMerge({ spellSlots });
    const mergedSpellSlots = applyColumnMerge(spellSlots, merge);

    expect(mergedSpellSlots[1].tokens).toEqual([
      createToken('red-2', 'red'),
    ]);
    expect(mergedSpellSlots[2].tokens).toEqual([]);
    expect(spellSlots[1].tokens).toHaveLength(2);
    expect(spellSlots[2].tokens).toHaveLength(1);
    expect(getEffectiveSpellColumnIndex([merge], 2)).toBe(1);
    expect(getEffectiveSpellColumnIndex([merge], 3)).toBe(1);
    expect(getEffectiveSpellColumnIndex([merge], 6)).toBe(5);
  });

  test.each([
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ])('resolves both rolls in merged pair %i+%i to either retained side', (first, second) => {
    [first, second].forEach((activeColumn) => {
      const merge = {
        activeColumn,
        columns: [first, second],
        removedColumn: activeColumn === first ? second : first,
      };

      expect(getEffectiveSpellColumnIndex([merge], first)).toBe(activeColumn - 1);
      expect(getEffectiveSpellColumnIndex([merge], second)).toBe(activeColumn - 1);
    });
  });
});
