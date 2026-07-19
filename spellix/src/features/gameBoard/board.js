export const BOARD_WIDTH = 31;
export const BOARD_HEIGHT = 31;
export const BOARD_SQUARE_SIZE = 30;
const BOSS_BATTLE_MOUNTAIN_MINIMUM_SIZE = 15;
const BOSS_BATTLE_MOUNTAIN_MAXIMUM_SIZE = 20;
const BOSS_BATTLE_MOUNTAIN_REQUIRED_COORDINATES = [
  { x: 27, y: 0 },
  { x: 28, y: 0 },
  { x: 27, y: 1 },
  { x: 28, y: 1 },
  { x: 27, y: 2 },
  { x: 28, y: 2 },
  { x: 27, y: 3 },
  { x: 28, y: 3 },
  { x: 29, y: 2 },
  { x: 30, y: 2 },
  { x: 29, y: 3 },
  { x: 30, y: 3 },
];

export const LAND_ENVIRONMENT_CONFIGS = [
  {
    environmentType: 'hills',
    sections: ['easy'],
    minimumClusterCount: 2,
    maximumClusterCount: 5,
    minimumClusterSize: 5,
    maximumClusterSize: 50,
  },
  {
    environmentType: 'gravel',
    sections: ['easy'],
    minimumClusterCount: 2,
    maximumClusterCount: 5,
    minimumClusterSize: 5,
    maximumClusterSize: 30,
  },
  {
    environmentType: 'mud',
    sections: ['easy', 'hard'],
    minimumClusterCount: 2,
    maximumClusterCount: 5,
    minimumClusterSize: 5,
    maximumClusterSize: 30,
  },
  {
    environmentType: 'woods',
    sections: ['easy', 'hard'],
    minimumClusterCount: 5,
    maximumClusterCount: 10,
    minimumClusterSize: 5,
    maximumClusterSize: 30,
  },
  {
    environmentType: 'forest',
    sections: ['hard'],
    minimumClusterCount: 3,
    maximumClusterCount: 8,
    minimumClusterSize: 10,
    maximumClusterSize: 40,
  },
  {
    environmentType: 'mountains',
    sections: ['hard'],
    minimumClusterCount: 5,
    maximumClusterCount: 10,
    minimumClusterSize: 5,
    maximumClusterSize: 20,
  },
];

export const WATER_ENVIRONMENT_CONFIGS = [
  {
    environmentType: 'stream',
    sections: ['easy', 'hard'],
    originEnvironmentTypes: ['hills', 'mountains'],
    avoidEnvironmentTypes: ['mountains'],
    minimumPathCount: 2,
    maximumPathCount: 5,
    minimumPathLength: 3,
    maximumPathLength: 10,
  },
  {
    environmentType: 'river',
    sections: ['hard'],
    originEnvironmentTypes: ['mountains'],
    avoidEnvironmentTypes: ['mountains'],
    edgeInset: 3,
    minimumPathCount: 2,
    maximumPathCount: 2,
    minimumPathLength: 8,
    maximumPathLength: 20,
  },
];

const FEATURE_AREA_CONFIGS = [
  { section: 'easy', count: 1 },
  { section: 'hard', count: 1 },
];
const FEATURE_AREA_WIDTH = 2;
const FEATURE_AREA_HEIGHT = 2;
const FEATURE_AREA_EDGE_INSET = 7;
const FEATURE_AREA_MINIMUM_SQUARE_DISTANCE = 7;
const FEATURE_AREA_MAXIMUM_RANDOM_ATTEMPTS = 50;
const EASY_SECTION_MINIMUM_WOODS_SQUARES = 150;
const HARD_SECTION_MINIMUM_FOREST_SQUARES = 150;

const ORTHOGONAL_DIRECTIONS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];
const ENVIRONMENT_VARIATION_VALUES = [1, 2, 3, 4, 5, 6];

const FIXED_FEATURE_IMAGE_AREAS = {
  start: { id: 'start', imageName: 'home.png', x: 0, y: 29, width: 2, height: 2 },
  boss: { id: 'boss', imageName: 'boss-castle.png', x: 29, y: 0, width: 2, height: 2 },
};
const ELITE_FEATURE_IMAGE_NAMES = [
  'elite-tower-gravel.png',
  'elite-tower-woods.png',
];

const START_AREA_POSITION_SEQUENCE = [
  { x: 0, y: 29 },
  { x: 1, y: 29 },
  { x: 0, y: 30 },
  { x: 1, y: 30 },
  { x: 0, y: 29 },
  { x: 1, y: 29 },
];

function isStartAreaSquare(x, y) {
  return x >= 0 && x <= 1 && y >= 29 && y <= 30;
}

function isProtectedStartFieldSquare(x, y) {
  return x >= 0 && x <= 4 && y >= 26 && y <= 30 && !isStartAreaSquare(x, y);
}

function isTopLeftEliteBattleSquare(x, y) {
  return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

function isBottomRightEliteBattleSquare(x, y) {
  return x >= 29 && x <= 30 && y >= 29 && y <= 30;
}

function isBossBattleSquare(x, y) {
  return x >= 29 && x <= 30 && y >= 0 && y <= 1;
}

function getSquareKey(x, y) {
  return `${x}-${y}`;
}

function getRandomInteger(minimum, maximum, randomFn) {
  return Math.floor(randomFn() * (maximum - minimum + 1)) + minimum;
}

function getAdjacentSquares(square, squareLookup) {
  return ORTHOGONAL_DIRECTIONS.map((direction) =>
    squareLookup.get(getSquareKey(square.x + direction.x, square.y + direction.y))
  ).filter(Boolean);
}

function isEnvironmentSquare(square) {
  return square.environmentType !== null;
}

function canAssignEnvironment(square, allowedSections) {
  return (
    square &&
    !square.isFixedArea &&
    !square.isProtectedStartFieldZone &&
    square.environmentType === null &&
    allowedSections.includes(square.section)
  );
}

function isEasySectionWoodsSquare(square) {
  return square.section === 'easy' && square.environmentType === 'woods';
}

function countEasySectionWoodsSquares(squares) {
  return squares.filter(isEasySectionWoodsSquare).length;
}

function isHardSectionForestSquare(square) {
  return square.section === 'hard' && square.environmentType === 'forest';
}

function countHardSectionForestSquares(squares) {
  return squares.filter(isHardSectionForestSquare).length;
}

function isWithinEdgeInset(square, edgeInset) {
  return (
    square.x >= edgeInset &&
    square.x <= BOARD_WIDTH - 1 - edgeInset &&
    square.y >= edgeInset &&
    square.y <= BOARD_HEIGHT - 1 - edgeInset
  );
}

function isWaterEnvironmentType(environmentType) {
  return environmentType === 'stream' || environmentType === 'river';
}

function canOverwriteWithWater(square, allowedSections) {
  return (
    square &&
    !square.isFixedArea &&
    !square.isProtectedStartFieldZone &&
    square.featureId === null &&
    !isWaterEnvironmentType(square.environmentType) &&
    allowedSections.includes(square.section)
  );
}

function hasAdjacentEnvironment(square, squareLookup, environmentTypes) {
  return getAdjacentSquares(square, squareLookup).some((adjacentSquare) =>
    environmentTypes.includes(adjacentSquare.environmentType)
  );
}

function countAdjacentEnvironmentSquares(square, squareLookup, environmentTypes) {
  return getAdjacentSquares(square, squareLookup).filter((adjacentSquare) =>
    environmentTypes.includes(adjacentSquare.environmentType)
  ).length;
}

function isWaterSquare(square, pathWaterKeys = new Set()) {
  return (
    square &&
    (isWaterEnvironmentType(square.environmentType) || pathWaterKeys.has(getSquareKey(square.x, square.y)))
  );
}

function countAdjacentWaterSquares(square, squareLookup, pathWaterKeys) {
  return getAdjacentSquares(square, squareLookup).filter((adjacentSquare) =>
    isWaterSquare(adjacentSquare, pathWaterKeys)
  ).length;
}

function isOrderedWaterPath(pathKeys, squareLookup) {
  const pathWaterKeys = new Set(pathKeys);

  return pathKeys.every((pathKey, index) => {
    const square = squareLookup.get(pathKey);

    if (!square) {
      return false;
    }

    const allowedAdjacentKeys = new Set();

    if (index > 0) {
      allowedAdjacentKeys.add(pathKeys[index - 1]);
    }

    if (index < pathKeys.length - 1) {
      allowedAdjacentKeys.add(pathKeys[index + 1]);
    }

    const adjacentWaterKeys = getAdjacentSquares(square, squareLookup)
      .filter((adjacentSquare) => isWaterSquare(adjacentSquare, pathWaterKeys))
      .map((adjacentSquare) => getSquareKey(adjacentSquare.x, adjacentSquare.y));

    return (
      adjacentWaterKeys.length === allowedAdjacentKeys.size &&
      adjacentWaterKeys.every((adjacentKey) => allowedAdjacentKeys.has(adjacentKey)) &&
      !createsTwoByTwoWaterBlock(square, squareLookup, pathWaterKeys)
    );
  });
}

function createsTwoByTwoWaterBlock(square, squareLookup, pathWaterKeys) {
  const blockOffsets = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
  ];

  return blockOffsets.some((offset) => {
    const blockSquares = [
      squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y)),
      squareLookup.get(getSquareKey(square.x + offset.x + 1, square.y + offset.y)),
      squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y + 1)),
      squareLookup.get(getSquareKey(square.x + offset.x + 1, square.y + offset.y + 1)),
    ];

    return (
      blockSquares.every(Boolean) &&
      blockSquares.every((blockSquare) => isWaterSquare(blockSquare, pathWaterKeys))
    );
  });
}

function canPlaceWaterSquare(square, squareLookup, pathKeys, config) {
  if (!canOverwriteWithWater(square, config.sections)) {
    return false;
  }

  if (config.edgeInset !== undefined && !isWithinEdgeInset(square, config.edgeInset)) {
    return false;
  }

  const previousSquareKey = pathKeys[pathKeys.length - 1] ?? null;
  const nextPathKeys = [...pathKeys, getSquareKey(square.x, square.y)];
  const nextPathWaterKeys = new Set(nextPathKeys);
  const adjacentWaterSquares = getAdjacentSquares(square, squareLookup).filter((adjacentSquare) =>
    isWaterSquare(adjacentSquare, nextPathWaterKeys)
  );

  if (previousSquareKey === null) {
    if (adjacentWaterSquares.length !== 0) {
      return false;
    }
  } else if (
    adjacentWaterSquares.length !== 1 ||
    getSquareKey(adjacentWaterSquares[0].x, adjacentWaterSquares[0].y) !== previousSquareKey
  ) {
    return false;
  }

  if (createsTwoByTwoWaterBlock(square, squareLookup, nextPathWaterKeys)) {
    return false;
  }

  return (
    countAdjacentWaterSquares(square, squareLookup, nextPathWaterKeys) <=
      (previousSquareKey === null ? 0 : 1) &&
    adjacentWaterSquares.every(
      (adjacentSquare) =>
        countAdjacentWaterSquares(adjacentSquare, squareLookup, nextPathWaterKeys) <= 2
    ) &&
    isOrderedWaterPath(nextPathKeys, squareLookup)
  );
}

export function selectPreferredWaterCandidate(candidates, squareLookup, config, randomFn) {
  if (candidates.length === 0) {
    return null;
  }

  const avoidEnvironmentTypes = config.avoidEnvironmentTypes ?? [];
  const scoredCandidates = candidates.map((square) => ({
    square,
    overwritesAvoidedEnvironment: avoidEnvironmentTypes.includes(square.environmentType) ? 1 : 0,
    adjacentAvoidedEnvironmentCount:
      avoidEnvironmentTypes.length === 0
        ? 0
        : countAdjacentEnvironmentSquares(square, squareLookup, avoidEnvironmentTypes),
  }));
  const lowestOverwritePenalty = Math.min(
    ...scoredCandidates.map((candidate) => candidate.overwritesAvoidedEnvironment)
  );
  const lowestAdjacentAvoidedEnvironmentCount = Math.min(
    ...scoredCandidates
      .filter((candidate) => candidate.overwritesAvoidedEnvironment === lowestOverwritePenalty)
      .map((candidate) => candidate.adjacentAvoidedEnvironmentCount)
  );
  const preferredCandidates = scoredCandidates
    .filter(
      (candidate) =>
        candidate.overwritesAvoidedEnvironment === lowestOverwritePenalty &&
        candidate.adjacentAvoidedEnvironmentCount === lowestAdjacentAvoidedEnvironmentCount
    )
    .map((candidate) => candidate.square);

  return preferredCandidates[getRandomInteger(0, preferredCandidates.length - 1, randomFn)];
}

function getSquareDistance(firstSquare, secondSquare) {
  return Math.max(
    Math.abs(firstSquare.x - secondSquare.x),
    Math.abs(firstSquare.y - secondSquare.y)
  );
}

function getMinimumDistanceBetweenSquareSets(firstSquares, secondSquares) {
  return firstSquares.reduce(
    (minimumDistance, firstSquare) =>
      Math.min(
        minimumDistance,
        secondSquares.reduce(
          (currentMinimumDistance, secondSquare) =>
            Math.min(currentMinimumDistance, getSquareDistance(firstSquare, secondSquare)),
          Number.POSITIVE_INFINITY
        )
      ),
    Number.POSITIVE_INFINITY
  );
}

function getFeatureSquares(originX, originY, squareLookup) {
  return [
    squareLookup.get(getSquareKey(originX, originY)),
    squareLookup.get(getSquareKey(originX + 1, originY)),
    squareLookup.get(getSquareKey(originX, originY + 1)),
    squareLookup.get(getSquareKey(originX + 1, originY + 1)),
  ];
}

function canPlaceFeatureArea(candidateSquares, section, fixedSquares, placedFeatures) {
  return (
    candidateSquares.every(
      (square) =>
        square &&
        !square.isFixedArea &&
        !square.isProtectedStartFieldZone &&
        square.areaType === 'normal' &&
        square.featureId === null &&
        square.section === section &&
        isWithinEdgeInset(square, FEATURE_AREA_EDGE_INSET)
    ) &&
    getMinimumDistanceBetweenSquareSets(candidateSquares, fixedSquares) >=
      FEATURE_AREA_MINIMUM_SQUARE_DISTANCE &&
    placedFeatures.every(
      (feature) =>
        getMinimumDistanceBetweenSquareSets(candidateSquares, feature.squares) >=
        FEATURE_AREA_MINIMUM_SQUARE_DISTANCE
    )
  );
}

function createFeatureAreas(squares, randomFn) {
  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));
  const fixedSquares = squares.filter((square) => square.isFixedArea);
  const placedFeatures = [];

  FEATURE_AREA_CONFIGS.forEach((config) => {
    const candidateOrigins = [];

    for (let y = FEATURE_AREA_EDGE_INSET; y <= BOARD_HEIGHT - FEATURE_AREA_HEIGHT - FEATURE_AREA_EDGE_INSET; y += 1) {
      for (let x = FEATURE_AREA_EDGE_INSET; x <= BOARD_WIDTH - FEATURE_AREA_WIDTH - FEATURE_AREA_EDGE_INSET; x += 1) {
        const candidateSquares = getFeatureSquares(x, y, squareLookup);

        if (
          candidateSquares.every(Boolean) &&
          candidateSquares.every((square) => square.section === config.section)
        ) {
          candidateOrigins.push({ x, y });
        }
      }
    }

    for (let featureIndex = 0; featureIndex < config.count && candidateOrigins.length > 0; featureIndex += 1) {
      let selectedOrigin = null;
      let attemptCount = 0;

      while (
        candidateOrigins.length > 0 &&
        !selectedOrigin &&
        attemptCount < FEATURE_AREA_MAXIMUM_RANDOM_ATTEMPTS
      ) {
        attemptCount += 1;
        const candidateIndex = getRandomInteger(0, candidateOrigins.length - 1, randomFn);
        const candidateOrigin = candidateOrigins.splice(candidateIndex, 1)[0];
        const candidateSquares = getFeatureSquares(candidateOrigin.x, candidateOrigin.y, squareLookup);

        if (canPlaceFeatureArea(candidateSquares, config.section, fixedSquares, placedFeatures)) {
          selectedOrigin = candidateOrigin;
        }
      }

      if (!selectedOrigin) {
        const fallbackIndex = candidateOrigins.findIndex((candidateOrigin) =>
          canPlaceFeatureArea(
            getFeatureSquares(candidateOrigin.x, candidateOrigin.y, squareLookup),
            config.section,
            fixedSquares,
            placedFeatures
          )
        );

        if (fallbackIndex >= 0) {
          selectedOrigin = candidateOrigins.splice(fallbackIndex, 1)[0];
        }
      }

      if (!selectedOrigin) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Unable to place a valid ${config.section} board feature.`);
        }

        continue;
      }

      const candidateSquares = getFeatureSquares(selectedOrigin.x, selectedOrigin.y, squareLookup);
      const feature = {
        id: `feature-${placedFeatures.length + 1}`,
        x: selectedOrigin.x,
        y: selectedOrigin.y,
        width: FEATURE_AREA_WIDTH,
        height: FEATURE_AREA_HEIGHT,
        section: config.section,
        areaType: 'feature',
        squares: candidateSquares,
      };

      candidateSquares.forEach((square) => {
        square.areaType = 'feature';
        square.environmentType = null;
        square.featureId = feature.id;
      });

      placedFeatures.push(feature);
    }
  });

  return placedFeatures.map(({ squares: _squares, ...feature }) => feature);
}

function getAvailableWaterNeighbors(
  currentSquare,
  squareLookup,
  pathKeys,
  config
) {
  return getAdjacentSquares(currentSquare, squareLookup).filter((neighborSquare) => {
    const neighborKey = getSquareKey(neighborSquare.x, neighborSquare.y);

    return (
      !pathKeys.includes(neighborKey) &&
      canPlaceWaterSquare(neighborSquare, squareLookup, pathKeys, config)
    );
  });
}

function getAdjacentValidReplacementSquares(
  clusterSquares,
  squareLookup,
  clusterKeys,
  isValidReplacementSquare
) {
  return Array.from(
    new Map(
      clusterSquares
        .flatMap((square) => getAdjacentSquares(square, squareLookup))
        .filter((square) => {
          const squareKey = getSquareKey(square.x, square.y);

          return !clusterKeys.has(squareKey) && isValidReplacementSquare(square);
        })
        .map((square) => [getSquareKey(square.x, square.y), square])
    ).values()
  );
}

function isValidEasySectionWoodsReplacementSquare(square) {
  return (
    square.section === 'easy' &&
    !square.isFixedArea &&
    !square.isProtectedStartFieldZone &&
    square.featureId === null &&
    ['field', 'gravel'].includes(square.environmentType)
  );
}

function isValidHardSectionForestReplacementSquare(square) {
  return (
    square.section === 'hard' &&
    !square.isFixedArea &&
    !square.isProtectedStartFieldZone &&
    square.featureId === null &&
    ['field', 'woods', 'mud'].includes(square.environmentType)
  );
}

export function balanceEasySectionWoodsCoverage(squares, randomFn = Math.random) {
  if (countEasySectionWoodsSquares(squares) >= EASY_SECTION_MINIMUM_WOODS_SQUARES) {
    return;
  }

  const woodsConfig = LAND_ENVIRONMENT_CONFIGS.find(
    (config) => config.environmentType === 'woods'
  );

  if (!woodsConfig) {
    return;
  }

  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));

  while (countEasySectionWoodsSquares(squares) < EASY_SECTION_MINIMUM_WOODS_SQUARES) {
    const remainingRequiredWoods =
      EASY_SECTION_MINIMUM_WOODS_SQUARES - countEasySectionWoodsSquares(squares);
    const fieldCandidates = squares.filter((square) =>
      isValidEasySectionWoodsReplacementSquare(square) && square.environmentType === 'field'
    );
    const gravelCandidates =
      fieldCandidates.length === 0
        ? squares.filter((square) =>
            isValidEasySectionWoodsReplacementSquare(square) && square.environmentType === 'gravel'
          )
        : [];
    const seedCandidates = fieldCandidates.length > 0 ? fieldCandidates : gravelCandidates;

    if (seedCandidates.length === 0) {
      return;
    }

    const startingSquare =
      seedCandidates[getRandomInteger(0, seedCandidates.length - 1, randomFn)];
    const clusterSquares = [startingSquare];
    const clusterKeys = new Set([getSquareKey(startingSquare.x, startingSquare.y)]);
    const targetClusterSize = Math.min(
      getRandomInteger(woodsConfig.minimumClusterSize, woodsConfig.maximumClusterSize, randomFn),
      remainingRequiredWoods
    );

    while (clusterSquares.length < targetClusterSize) {
      const expansionCandidates = getAdjacentValidReplacementSquares(
        clusterSquares,
        squareLookup,
        clusterKeys,
        isValidEasySectionWoodsReplacementSquare
      );
      const preferredExpansionCandidates = expansionCandidates.filter(
        (square) => square.environmentType === 'field'
      );
      const nextSquareCandidates =
        preferredExpansionCandidates.length > 0
          ? preferredExpansionCandidates
          : expansionCandidates.filter((square) => square.environmentType === 'gravel');

      if (nextSquareCandidates.length === 0) {
        break;
      }

      const nextSquare =
        nextSquareCandidates[getRandomInteger(0, nextSquareCandidates.length - 1, randomFn)];
      const nextSquareKey = getSquareKey(nextSquare.x, nextSquare.y);

      clusterKeys.add(nextSquareKey);
      clusterSquares.push(nextSquare);
    }

    clusterSquares.forEach((square) => {
      square.environmentType = 'woods';
    });
  }
}

export function balanceHardSectionForestCoverage(squares, randomFn = Math.random) {
  if (countHardSectionForestSquares(squares) >= HARD_SECTION_MINIMUM_FOREST_SQUARES) {
    return;
  }

  const forestConfig = LAND_ENVIRONMENT_CONFIGS.find(
    (config) => config.environmentType === 'forest'
  );

  if (!forestConfig) {
    return;
  }

  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));

  while (countHardSectionForestSquares(squares) < HARD_SECTION_MINIMUM_FOREST_SQUARES) {
    const remainingRequiredForest =
      HARD_SECTION_MINIMUM_FOREST_SQUARES - countHardSectionForestSquares(squares);
    const fieldCandidates = squares.filter((square) =>
      isValidHardSectionForestReplacementSquare(square) && square.environmentType === 'field'
    );
    const woodsCandidates =
      fieldCandidates.length === 0
        ? squares.filter((square) =>
            isValidHardSectionForestReplacementSquare(square) && square.environmentType === 'woods'
          )
        : [];
    const mudCandidates =
      fieldCandidates.length === 0 && woodsCandidates.length === 0
        ? squares.filter((square) =>
            isValidHardSectionForestReplacementSquare(square) && square.environmentType === 'mud'
          )
        : [];
    const seedCandidates =
      fieldCandidates.length > 0
        ? fieldCandidates
        : woodsCandidates.length > 0
          ? woodsCandidates
          : mudCandidates;

    if (seedCandidates.length === 0) {
      return;
    }

    const startingSquare =
      seedCandidates[getRandomInteger(0, seedCandidates.length - 1, randomFn)];
    const clusterSquares = [startingSquare];
    const clusterKeys = new Set([getSquareKey(startingSquare.x, startingSquare.y)]);
    const targetClusterSize = Math.min(
      getRandomInteger(forestConfig.minimumClusterSize, forestConfig.maximumClusterSize, randomFn),
      remainingRequiredForest
    );

    while (clusterSquares.length < targetClusterSize) {
      const expansionCandidates = getAdjacentValidReplacementSquares(
        clusterSquares,
        squareLookup,
        clusterKeys,
        isValidHardSectionForestReplacementSquare
      );
      const preferredFieldExpansionCandidates = expansionCandidates.filter(
        (square) => square.environmentType === 'field'
      );
      const preferredWoodsExpansionCandidates =
        preferredFieldExpansionCandidates.length === 0
          ? expansionCandidates.filter((square) => square.environmentType === 'woods')
          : [];
      const nextSquareCandidates =
        preferredFieldExpansionCandidates.length > 0
          ? preferredFieldExpansionCandidates
          : preferredWoodsExpansionCandidates.length > 0
            ? preferredWoodsExpansionCandidates
            : expansionCandidates.filter((square) => square.environmentType === 'mud');

      if (nextSquareCandidates.length === 0) {
        break;
      }

      const nextSquare =
        nextSquareCandidates[getRandomInteger(0, nextSquareCandidates.length - 1, randomFn)];
      const nextSquareKey = getSquareKey(nextSquare.x, nextSquare.y);

      clusterKeys.add(nextSquareKey);
      clusterSquares.push(nextSquare);
    }

    clusterSquares.forEach((square) => {
      square.environmentType = 'forest';
    });
  }
}

function createLandEnvironmentClusters(squares, randomFn) {
  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));
  const mountainConfig = LAND_ENVIRONMENT_CONFIGS.find(
    (config) => config.environmentType === 'mountains'
  );

  const isAdjacentToBlockedCluster = (square, blockedClusterKeys = new Set()) =>
    blockedClusterKeys.size > 0 &&
    getAdjacentSquares(square, squareLookup).some((adjacentSquare) =>
      blockedClusterKeys.has(getSquareKey(adjacentSquare.x, adjacentSquare.y))
    );

  const tryCreateCluster = (
    config,
    {
      blockedAdjacentClusterKeys = new Set(),
      maximumAttempts = 40,
      minimumRequiredSize = config.minimumClusterSize,
      seedSquares = null,
      targetSize = null,
    } = {}
  ) => {
    const isValidClusterSquare = (square) =>
      canAssignEnvironment(square, config.sections) &&
      !isAdjacentToBlockedCluster(square, blockedAdjacentClusterKeys);

    const candidateSquares = squares.filter(isValidClusterSquare);

    if (seedSquares) {
      if (seedSquares.length === 0 || !seedSquares.every((square) => canAssignEnvironment(square, config.sections))) {
        return [];
      }
    } else if (candidateSquares.length === 0) {
      return [];
    }

    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      const initialSquares =
        seedSquares ??
        [candidateSquares[getRandomInteger(0, candidateSquares.length - 1, randomFn)]];
      const resolvedTargetSize =
        targetSize ??
        getRandomInteger(config.minimumClusterSize, config.maximumClusterSize, randomFn);
      const clusterKeys = new Set(
        initialSquares.map((square) => getSquareKey(square.x, square.y))
      );

      while (clusterKeys.size < resolvedTargetSize) {
        const expansionCandidates = Array.from(clusterKeys).flatMap((clusterKey) =>
          getAdjacentSquares(squareLookup.get(clusterKey), squareLookup)
            .filter(
              (neighborSquare) =>
                isValidClusterSquare(neighborSquare) &&
                !clusterKeys.has(getSquareKey(neighborSquare.x, neighborSquare.y))
            )
            .map((neighborSquare) => getSquareKey(neighborSquare.x, neighborSquare.y))
        );
        const uniqueExpansionCandidates = Array.from(new Set(expansionCandidates));

        if (uniqueExpansionCandidates.length === 0) {
          break;
        }

        const nextSquareKey =
          uniqueExpansionCandidates[
            getRandomInteger(0, uniqueExpansionCandidates.length - 1, randomFn)
          ];

        clusterKeys.add(nextSquareKey);
      }

      if (clusterKeys.size >= minimumRequiredSize) {
        return Array.from(clusterKeys).map((squareKey) => squareLookup.get(squareKey));
      }
    }

    return [];
  };

  const createBossBattleMountainCluster = () => {
    if (!mountainConfig) {
      return [];
    }

    const requiredSquares = BOSS_BATTLE_MOUNTAIN_REQUIRED_COORDINATES.map(({ x, y }) =>
      squareLookup.get(getSquareKey(x, y))
    );
    const targetSize = getRandomInteger(
      BOSS_BATTLE_MOUNTAIN_MINIMUM_SIZE,
      BOSS_BATTLE_MOUNTAIN_MAXIMUM_SIZE,
      randomFn
    );

    return tryCreateCluster(mountainConfig, {
      maximumAttempts: 1,
      minimumRequiredSize: BOSS_BATTLE_MOUNTAIN_MINIMUM_SIZE,
      seedSquares: requiredSquares,
      targetSize,
    });
  };

  const bossBattleMountainClusterSquares = createBossBattleMountainCluster();
  const bossBattleMountainClusterKeys = new Set(
    bossBattleMountainClusterSquares.map((square) => getSquareKey(square.x, square.y))
  );

  bossBattleMountainClusterSquares.forEach((square) => {
    square.environmentType = mountainConfig.environmentType;
  });

  LAND_ENVIRONMENT_CONFIGS.forEach((config) => {
    const targetClusterCount = getRandomInteger(
      config.minimumClusterCount,
      config.maximumClusterCount,
      randomFn
    );
    const clusterCount =
      config.environmentType === 'mountains' && bossBattleMountainClusterKeys.size > 0
        ? Math.max(targetClusterCount - 1, 0)
        : targetClusterCount;

    for (let clusterIndex = 0; clusterIndex < clusterCount; clusterIndex += 1) {
      const clusterSquares = tryCreateCluster(config, {
        blockedAdjacentClusterKeys:
          config.environmentType === 'mountains' ? bossBattleMountainClusterKeys : new Set(),
      });

      clusterSquares.forEach((square) => {
        square.environmentType = config.environmentType;
      });
    }
  });
}

function createWaterEnvironmentPaths(squares, randomFn) {
  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));

  const tryCreatePath = (config) => {
    const originCandidates = squares.filter(
      (square) =>
        canPlaceWaterSquare(square, squareLookup, [], config) &&
        hasAdjacentEnvironment(square, squareLookup, config.originEnvironmentTypes)
    );

    if (originCandidates.length === 0) {
      return [];
    }

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const startingSquare = selectPreferredWaterCandidate(
        originCandidates,
        squareLookup,
        config,
        randomFn
      );
      const targetLength = getRandomInteger(
        config.minimumPathLength,
        config.maximumPathLength,
        randomFn
      );
      const pathKeys = [getSquareKey(startingSquare.x, startingSquare.y)];
      let currentSquare = startingSquare;

      while (pathKeys.length < targetLength) {
        const availableNeighbors = getAvailableWaterNeighbors(
          currentSquare,
          squareLookup,
          pathKeys,
          config
        );

        if (availableNeighbors.length === 0) {
          break;
        }

        const nextSquare = selectPreferredWaterCandidate(
          availableNeighbors,
          squareLookup,
          config,
          randomFn
        );
        const nextSquareKey = getSquareKey(nextSquare.x, nextSquare.y);

        currentSquare = nextSquare;
        pathKeys.push(nextSquareKey);
      }

      if (pathKeys.length >= config.minimumPathLength && isOrderedWaterPath(pathKeys, squareLookup)) {
        return pathKeys.map((squareKey) => squareLookup.get(squareKey));
      }
    }

    return [];
  };

  WATER_ENVIRONMENT_CONFIGS.forEach((config) => {
    const pathCount = getRandomInteger(config.minimumPathCount, config.maximumPathCount, randomFn);

    for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
      const pathSquares = tryCreatePath(config);

      pathSquares.forEach((square) => {
        square.environmentType = config.environmentType;
      });
    }
  });
}

function assignEnvironmentVariations(squares, randomFn) {
  const squareLookup = new Map(squares.map((square) => [getSquareKey(square.x, square.y), square]));

  squares.forEach((square) => {
    square.environmentVariation = null;
  });

  squares
    .filter((square) => isEnvironmentSquare(square))
    .forEach((square) => {
      const adjacentVariationValues = new Set(
        getAdjacentSquares(square, squareLookup)
          .filter((adjacentSquare) => isEnvironmentSquare(adjacentSquare))
          .map((adjacentSquare) => adjacentSquare.environmentVariation)
          .filter((variationValue) => variationValue !== null)
      );
      const availableVariationValues = ENVIRONMENT_VARIATION_VALUES.filter(
        (variationValue) => !adjacentVariationValues.has(variationValue)
      );
      const selectedVariationValue =
        availableVariationValues[
          getRandomInteger(0, availableVariationValues.length - 1, randomFn)
        ];

      square.environmentVariation = selectedVariationValue;
    });
}

export function getBoardSection(x, y) {
  return y >= x ? 'easy' : 'hard';
}

export function getAreaType(x, y) {
  if (isStartAreaSquare(x, y)) {
    return 'start-area';
  }

  if (isTopLeftEliteBattleSquare(x, y) || isBottomRightEliteBattleSquare(x, y)) {
    return 'elite-battle';
  }

  if (isBossBattleSquare(x, y)) {
    return 'boss-battle';
  }

  return 'normal';
}

function createFeatureImages(features, randomFn) {
  const eliteImageNames =
    randomFn() < 0.5
      ? ELITE_FEATURE_IMAGE_NAMES
      : [...ELITE_FEATURE_IMAGE_NAMES].reverse();
  const generatedFeatureImages = features.map((feature) => ({
    id: feature.id,
    imageName:
      feature.section === 'easy' ? 'village-field.png' : 'village-forest.png',
    x: feature.x,
    y: feature.y,
    width: feature.width,
    height: feature.height,
  }));

  return [
    FIXED_FEATURE_IMAGE_AREAS.start,
    {
      id: 'elite-top-left',
      imageName: eliteImageNames[0],
      x: 0,
      y: 0,
      width: 2,
      height: 2,
    },
    FIXED_FEATURE_IMAGE_AREAS.boss,
    {
      id: 'elite-bottom-right',
      imageName: eliteImageNames[1],
      x: 29,
      y: 29,
      width: 2,
      height: 2,
    },
    ...generatedFeatureImages,
  ];
}

export function createBoard(randomFn = Math.random) {
  const squares = [];

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const areaType = getAreaType(x, y);
      const isFixedArea = areaType !== 'normal';

      squares.push({
        id: `square-${x}-${y}`,
        x,
        y,
        section: getBoardSection(x, y),
        areaType,
        environmentType: null,
        environmentVariation: null,
        featureId: null,
        isFixedArea,
        isProtectedStartFieldZone: isProtectedStartFieldSquare(x, y),
      });
    }
  }

  createLandEnvironmentClusters(squares, randomFn);

  squares.forEach((square) => {
    if (!square.isFixedArea && square.environmentType === null) {
      square.environmentType = 'field';
    }
  });

  createWaterEnvironmentPaths(squares, randomFn);
  const features = createFeatureAreas(squares, randomFn);
  balanceEasySectionWoodsCoverage(squares, randomFn);
  balanceHardSectionForestCoverage(squares, randomFn);
  assignEnvironmentVariations(squares, randomFn);
  const featureImages = createFeatureImages(features, randomFn);

  return {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    squareSize: BOARD_SQUARE_SIZE,
    squares,
    features,
    featureImages,
  };
}

export function assignStartingPositions(players) {
  return players.map((player, index) => ({
    ...player,
    position: START_AREA_POSITION_SEQUENCE[index] ?? START_AREA_POSITION_SEQUENCE[index % 4],
  }));
}

export function getFirstStartAreaPosition(board) {
  const startAreaSquare = board?.squares?.find((square) => square.areaType === 'start-area');

  if (startAreaSquare) {
    return {
      x: startAreaSquare.x,
      y: startAreaSquare.y,
    };
  }

  return { ...START_AREA_POSITION_SEQUENCE[0] };
}
