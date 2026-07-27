export const TARGET_PLAYER_POTION_IDS = [
  'spellbound',
  'heavy-weight',
  'troublemaker',
];

export function isTargetPlayerPotion(potion) {
  return TARGET_PLAYER_POTION_IDS.includes(potion?.id);
}

export function getHeavyWeightBoardRoll(originalRoll) {
  return Math.ceil(originalRoll / 2);
}

export function blocksBoardPotionUse(activePotion) {
  return TARGET_PLAYER_POTION_IDS.includes(activePotion?.id);
}
