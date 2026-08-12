import { TOKEN_DEFINITIONS } from '../../data/tokens';

export const MAX_COLUMN_MERGES = 2;
const HEALTH_BONUS_BY_TOKEN_TYPE = {
  'light-green': 5,
  'light-green-yellow-outline': 10,
};

function countTokensByType(tokens = [], tokenType) {
  return tokens.filter((token) => token?.type === tokenType).length;
}

function countCommittedTokensByType(tokens = [], tokenType) {
  return tokens.filter(
    (token) => token?.committed && token.type === tokenType
  ).length;
}

function countRareTokens(tokens = []) {
  return tokens.filter(
    (token) => TOKEN_DEFINITIONS[token.type]?.rarity?.toLowerCase() === 'rare'
  ).length;
}

function cloneSpellSlots(spellSlots = []) {
  return spellSlots.map((slot) => ({
    ...slot,
    tokens: (slot.tokens ?? []).map((token) => ({ ...token })),
  }));
}

export function applyLightGreenHealthBonus(player, spellSlots = player?.spellSlots ?? []) {
  const baseMaxHealth = player?.baseMaxHealth ?? player?.maxHealth ?? 100;
  const nextHealthBonus = spellSlots.reduce(
    (total, slot) =>
      total +
      (slot.tokens ?? []).reduce(
        (slotTotal, token) =>
          slotTotal +
          (token.committed ? HEALTH_BONUS_BY_TOKEN_TYPE[token.type] ?? 0 : 0),
        0
      ),
    0
  );
  const previousHealthBonus = Math.max(
    0,
    (player?.maxHealth ?? baseMaxHealth) - baseMaxHealth
  );
  const addedHealth = Math.max(0, nextHealthBonus - previousHealthBonus);
  const maxHealth = baseMaxHealth + nextHealthBonus;

  return {
    ...player,
    baseMaxHealth,
    currentHealth: Math.min(
      (player?.currentHealth ?? maxHealth) + addedHealth,
      maxHealth
    ),
    maxHealth,
    spellSlots,
  };
}

export function getEffectiveSpellColumnGroups(spellSlots = [], mergedColumns = []) {
  const groupedColumns = new Set();

  return spellSlots.flatMap((slot, index) => {
    const columnNumber = index + 1;

    if (groupedColumns.has(columnNumber)) {
      return [];
    }

    const merge = mergedColumns.find(({ columns = [] }) =>
      columns.includes(columnNumber)
    );
    const activeSlot = merge ? spellSlots[merge.activeColumn - 1] : slot;

    if (!merge || !activeSlot) {
      groupedColumns.add(columnNumber);
      return [{
        columns: [columnNumber],
        isMerged: false,
        label: String(columnNumber),
        slot,
        slotIndex: index,
      }];
    }

    const columns = [...merge.columns].sort((first, second) => first - second);
    columns.forEach((column) => groupedColumns.add(column));

    return [{
      columns,
      isMerged: true,
      label: columns.join('+'),
      slot: activeSlot,
      slotIndex: merge.activeColumn - 1,
    }];
  });
}

export function getAdjacentEffectiveSpellColumnGroups(groups = [], groupIndex) {
  if (!groups[groupIndex]) {
    return [];
  }

  return [groups[groupIndex - 1], groups[groupIndex + 1]].filter(Boolean);
}

function getEffectiveGroupCapacity(groups, groupIndex) {
  const group = groups[groupIndex];

  if (!group) {
    return 0;
  }

  const adjacentGreyCount = getAdjacentEffectiveSpellColumnGroups(
    groups,
    groupIndex
  ).reduce(
    (total, adjacentGroup) =>
      total + countCommittedTokensByType(adjacentGroup.slot?.tokens, 'grey'),
    0
  );

  return (group.slot.maxTokens ?? 5) + adjacentGreyCount;
}

export function getEffectiveSpellColumnCapacities(
  spellSlots = [],
  mergedColumns = []
) {
  const groups = getEffectiveSpellColumnGroups(spellSlots, mergedColumns);

  return groups.map((group, index) => getEffectiveGroupCapacity(groups, index));
}

export function getSpellColumnCapacity(
  spellSlots = [],
  columnIndex,
  mergedColumns = []
) {
  const groups = getEffectiveSpellColumnGroups(spellSlots, mergedColumns);
  const groupIndex = groups.findIndex(({ columns }) =>
    columns.includes(columnIndex + 1)
  );

  return getEffectiveGroupCapacity(groups, groupIndex);
}

export function getSpellColumnCapacities(spellSlots = [], mergedColumns = []) {
  return spellSlots.map((slot, index) =>
    getSpellColumnCapacity(spellSlots, index, mergedColumns)
  );
}

export function getOverCapacityColumnNumbers(spellSlots = [], mergedColumns = []) {
  const groups = getEffectiveSpellColumnGroups(spellSlots, mergedColumns);

  return groups.flatMap((group, index) =>
    (group.slot.tokens ?? []).length > getEffectiveGroupCapacity(groups, index)
      ? [group.isMerged ? group.label : group.columns[0]]
      : []
  );
}

function selectMergeColumns(firstColumn, secondColumn, spellSlots, randomFn) {
  const firstTokens = spellSlots[firstColumn - 1]?.tokens ?? [];
  const secondTokens = spellSlots[secondColumn - 1]?.tokens ?? [];
  let removedColumn;

  if (firstTokens.length !== secondTokens.length) {
    removedColumn = firstTokens.length < secondTokens.length ? firstColumn : secondColumn;
  } else {
    const firstRareCount = countRareTokens(firstTokens);
    const secondRareCount = countRareTokens(secondTokens);

    if (firstRareCount !== secondRareCount) {
      removedColumn = firstRareCount < secondRareCount ? firstColumn : secondColumn;
    } else {
      removedColumn = randomFn() < 0.5 ? firstColumn : secondColumn;
    }
  }

  return {
    activeColumn: removedColumn === firstColumn ? secondColumn : firstColumn,
    columns: [firstColumn, secondColumn],
    removedColumn,
  };
}

export function findNextColumnMerge({
  columnMergesUsed,
  mergedColumns = [],
  randomFn = Math.random,
  spellSlots = [],
} = {}) {
  const mergesUsed = Math.max(columnMergesUsed ?? 0, mergedColumns.length);

  if (mergesUsed >= MAX_COLUMN_MERGES) {
    return null;
  }

  const usedColumns = new Set(
    mergedColumns.flatMap((merge) => merge.columns ?? [])
  );

  for (let index = 0; index < spellSlots.length - 1; index += 1) {
    const firstColumn = index + 1;
    const secondColumn = index + 2;
    const firstHasWhite = countTokensByType(spellSlots[index]?.tokens, 'white') > 0;
    const secondHasWhite = countTokensByType(spellSlots[index + 1]?.tokens, 'white') > 0;

    if (
      firstHasWhite &&
      secondHasWhite &&
      !usedColumns.has(firstColumn) &&
      !usedColumns.has(secondColumn)
    ) {
      return selectMergeColumns(firstColumn, secondColumn, spellSlots, randomFn);
    }
  }

  return null;
}

export function applyColumnMerge(spellSlots = [], merge) {
  const nextSpellSlots = cloneSpellSlots(spellSlots);

  if (!merge?.removedColumn || !nextSpellSlots[merge.removedColumn - 1]) {
    return nextSpellSlots;
  }

  const activeTokens = nextSpellSlots[merge.activeColumn - 1]?.tokens;
  const activeWhiteIndex = activeTokens?.findIndex(
    (token) => token.type === 'white'
  );

  if (activeWhiteIndex >= 0) {
    activeTokens.splice(activeWhiteIndex, 1);
  }

  nextSpellSlots[merge.removedColumn - 1].tokens = [];
  return nextSpellSlots;
}

export function getEffectiveSpellColumnIndex(mergedColumns = [], columnNumber) {
  const merge = mergedColumns.find(({ columns = [] }) => columns.includes(columnNumber));

  return (merge?.activeColumn ?? columnNumber) - 1;
}
