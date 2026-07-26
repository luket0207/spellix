const CONTEXT_AVAILABILITY = {
  battle: ['Battle', 'Both'],
  board: ['Board', 'Both'],
  mini: ['Mini'],
};

const HEALING_POTION_PERCENTAGES = {
  'first-aid': 0.5,
  heal: 0.6,
  'small-heal': 0.3,
};

export function canUsePotionInContext(potion, context) {
  return CONTEXT_AVAILABILITY[context]?.includes(potion?.availability) ?? false;
}

export function getPotionHealAmount(maxHealth, percentage) {
  return Math.round((maxHealth * percentage) / 5) * 5;
}

export function isHealingPotion(potion) {
  return HEALING_POTION_PERCENTAGES[potion?.id] !== undefined;
}

export function applyHealingPotionEffect(player, potion) {
  const percentage = HEALING_POTION_PERCENTAGES[potion?.id];

  if (percentage === undefined) {
    return player;
  }

  const healAmount = getPotionHealAmount(player.maxHealth, percentage);

  return {
    ...player,
    currentHealth: Math.min(player.currentHealth + healAmount, player.maxHealth),
  };
}
