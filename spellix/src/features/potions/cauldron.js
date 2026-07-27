import { POTION_DEFINITIONS } from '../../data/potions';

function getRandomIndex(length, randomFn) {
  return Math.min(Math.floor(randomFn() * length), length - 1);
}

export function generateCauldronPotionChoices(randomFn = Math.random) {
  const remainingPotions = [...POTION_DEFINITIONS];

  return Array.from({ length: 3 }, () => {
    const selectedIndex = getRandomIndex(remainingPotions.length, randomFn);
    const [selectedPotion] = remainingPotions.splice(selectedIndex, 1);

    return selectedPotion;
  });
}
