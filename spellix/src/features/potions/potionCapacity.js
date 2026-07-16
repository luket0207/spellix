export const POTION_MAX_CAPACITY = 3;

function clonePotions(potions = []) {
  return potions.map((potion) => ({ ...potion }));
}

export function gainPotion(potions = [], newPotion) {
  const nextPotions = clonePotions(potions);

  if (nextPotions.length >= POTION_MAX_CAPACITY) {
    return {
      pendingPotion: { ...newPotion },
      potions: nextPotions,
    };
  }

  return {
    pendingPotion: null,
    potions: [...nextPotions, { ...newPotion }],
  };
}

export function resolvePendingPotion({
  pendingPotion,
  potions = [],
  replacedPotionIndex,
}) {
  const nextPotions = clonePotions(potions);

  if (
    !Number.isInteger(replacedPotionIndex) ||
    replacedPotionIndex < 0 ||
    replacedPotionIndex >= nextPotions.length
  ) {
    return nextPotions;
  }

  nextPotions.splice(replacedPotionIndex, 1, { ...pendingPotion });

  return nextPotions;
}
