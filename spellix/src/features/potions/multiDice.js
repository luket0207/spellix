const MULTI_DICE_COUNTS = {
  'double-dice': 2,
  'triple-dice': 3,
};

export function isMultiDicePotion(potion) {
  return Boolean(MULTI_DICE_COUNTS[potion?.id]);
}

export function getMultiDiceCount(potion) {
  return MULTI_DICE_COUNTS[potion?.id] ?? 1;
}
