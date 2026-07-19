import { RIVER_ROCK_IMAGES } from './riverRockImages';

const RIVER_ROW_SAFE_COUNTS = [2, 2, 1];

function shuffleItems(items, randomFn) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

export function createRiverRows(randomFn = Math.random) {
  return RIVER_ROW_SAFE_COUNTS.map((safeCount, rowIndex) => {
    const safeRockIndexes = new Set(
      shuffleItems([0, 1, 2], randomFn).slice(0, safeCount)
    );
    const selectedImages = shuffleItems(RIVER_ROCK_IMAGES, randomFn).slice(0, 3);

    return {
      row: rowIndex + 1,
      rocks: selectedImages.map((image, rockIndex) => ({
        id: `row-${rowIndex + 1}-rock-${rockIndex + 1}`,
        imageId: image.id,
        imageSrc: image.src,
        isSafe: safeRockIndexes.has(rockIndex),
      })),
    };
  });
}
