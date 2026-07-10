import { createPlayers } from '../gameSetup/gameSetup';
import {
  BOARD_HEIGHT,
  BOARD_SQUARE_SIZE,
  BOARD_WIDTH,
  assignStartingPositions,
  balanceEasySectionWoodsCoverage,
  balanceHardSectionForestCoverage,
  createBoard,
} from './board';

const WATER_ENVIRONMENT_TYPES = ['stream', 'river'];
const ORTHOGONAL_OFFSETS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

function getSquare(board, x, y) {
  return board.squares.find((square) => square.x === x && square.y === y);
}

function getSquareKey(x, y) {
  return `${x}-${y}`;
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

function createSeededRandomFn(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createGenerationSquare({
  x,
  y,
  section = 'easy',
  environmentType = 'field',
  areaType = 'normal',
  featureId = null,
  isFixedArea = false,
  isProtectedStartFieldZone = false,
}) {
  return {
    id: `square-${x}-${y}`,
    x,
    y,
    section,
    areaType,
    environmentType,
    environmentVariation: null,
    featureId,
    isFixedArea,
    isProtectedStartFieldZone,
  };
}

function getOrthogonalWaterNeighbors(square, squareLookup) {
  return ORTHOGONAL_OFFSETS.map((offset) =>
    squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y))
  ).filter(
    (adjacentSquare) =>
      adjacentSquare && WATER_ENVIRONMENT_TYPES.includes(adjacentSquare.environmentType)
  );
}

function getConnectedWaterComponent(startSquare, squareLookup) {
  const visitedSquareKeys = new Set();
  const componentSquares = [];
  const squareQueue = [startSquare];

  while (squareQueue.length > 0) {
    const currentSquare = squareQueue.shift();
    const currentSquareKey = getSquareKey(currentSquare.x, currentSquare.y);

    if (visitedSquareKeys.has(currentSquareKey)) {
      continue;
    }

    visitedSquareKeys.add(currentSquareKey);
    componentSquares.push(currentSquare);

    getOrthogonalWaterNeighbors(currentSquare, squareLookup)
      .filter((adjacentSquare) => adjacentSquare.environmentType === currentSquare.environmentType)
      .forEach((adjacentSquare) => {
        if (!visitedSquareKeys.has(getSquareKey(adjacentSquare.x, adjacentSquare.y))) {
          squareQueue.push(adjacentSquare);
        }
      });
  }

  return componentSquares;
}

function expectSimpleWaterPathComponent(componentSquares, squareLookup) {
  const sameTypeNeighborCounts = componentSquares.map(
    (square) =>
      getOrthogonalWaterNeighbors(square, squareLookup).filter(
        (adjacentSquare) => adjacentSquare.environmentType === square.environmentType
      ).length
  );

  sameTypeNeighborCounts.forEach((neighborCount) => {
    expect(neighborCount).toBeLessThanOrEqual(2);
  });

  if (componentSquares.length === 1) {
    expect(sameTypeNeighborCounts).toEqual([0]);
    return;
  }

  expect(sameTypeNeighborCounts.filter((neighborCount) => neighborCount === 1)).toHaveLength(2);
  expect(sameTypeNeighborCounts.filter((neighborCount) => neighborCount === 2)).toHaveLength(
    componentSquares.length - 2
  );
}

describe('board start area and protected field zone', () => {
  test('creates a 31x31 board with a 2x2 start area in the bottom-left corner', () => {
    const board = createBoard(() => 0);
    const startAreaCoordinates = [
      { x: 0, y: 29 },
      { x: 1, y: 29 },
      { x: 0, y: 30 },
      { x: 1, y: 30 },
    ];

    expect(board.width).toBe(BOARD_WIDTH);
    expect(board.height).toBe(BOARD_HEIGHT);
    expect(board.squareSize).toBe(BOARD_SQUARE_SIZE);

    startAreaCoordinates.forEach(({ x, y }) => {
      expect(getSquare(board, x, y)).toMatchObject({
        areaType: 'start-area',
        isFixedArea: true,
        x,
        y,
      });
    });

    expect(getSquare(board, 2, 29)).not.toMatchObject({ areaType: 'start-area' });
    expect(getSquare(board, 0, 28)).not.toMatchObject({ areaType: 'start-area' });
  });

  test('keeps the 5x5 zone around the start area as protected field terrain', () => {
    const board = createBoard(() => 0);

    for (let y = 26; y <= 30; y += 1) {
      for (let x = 0; x <= 4; x += 1) {
        const square = getSquare(board, x, y);

        if (x <= 1 && y >= 29) {
          expect(square.areaType).toBe('start-area');
          continue;
        }

        expect(square).toMatchObject({
          areaType: 'normal',
          environmentType: 'field',
          featureId: null,
          isProtectedStartFieldZone: true,
          x,
          y,
        });
      }
    }
  });

  test('assigns 1 to 6 players only to the 2x2 start area and stacks extras on existing squares', () => {
    const positionedPlayers = assignStartingPositions(createPlayers(6));
    const positionKeys = positionedPlayers.map((player) => `${player.position.x}-${player.position.y}`);

    expect(positionKeys).toEqual([
      '0-29',
      '1-29',
      '0-30',
      '1-30',
      '0-29',
      '1-29',
    ]);
    expect(new Set(positionKeys.slice(0, 4)).size).toBe(4);
    expect(new Set(positionKeys).size).toBe(4);
  });

  test('generates 3 easy features and 3 hard features with the stricter spacing rules', () => {
    const board = createBoard(() => 0);
    const fixedSquares = board.squares.filter((square) => square.isFixedArea);

    expect(board.features).toHaveLength(6);
    expect(board.features.filter((feature) => feature.section === 'easy')).toHaveLength(3);
    expect(board.features.filter((feature) => feature.section === 'hard')).toHaveLength(3);

    board.features.forEach((feature) => {
      const featureSquares = board.squares.filter((square) => square.featureId === feature.id);

      expect(featureSquares).toHaveLength(4);
      expect(feature.x).toBeGreaterThanOrEqual(2);
      expect(feature.y).toBeGreaterThanOrEqual(2);
      expect(feature.x).toBeLessThanOrEqual(27);
      expect(feature.y).toBeLessThanOrEqual(27);
      expect(
        getMinimumDistanceBetweenSquareSets(featureSquares, fixedSquares)
      ).toBeGreaterThanOrEqual(5);
      expect(
        featureSquares.every((square) => !square.isProtectedStartFieldZone && square.section === feature.section)
      ).toBe(true);
    });

    board.features.forEach((feature, featureIndex) => {
      const featureSquares = board.squares.filter((square) => square.featureId === feature.id);

      board.features.slice(featureIndex + 1).forEach((otherFeature) => {
        const otherFeatureSquares = board.squares.filter((square) => square.featureId === otherFeature.id);

        expect(
          getMinimumDistanceBetweenSquareSets(featureSquares, otherFeatureSquares)
        ).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

describe('board water path generation', () => {
  test('builds rivers and streams as simple non-looping water paths across repeated boards', () => {
    let hasGeneratedStream = false;
    let hasGeneratedRiver = false;

    for (let seed = 1; seed <= 25; seed += 1) {
      const board = createBoard(createSeededRandomFn(seed));
      const squareLookup = new Map(
        board.squares.map((square) => [getSquareKey(square.x, square.y), square])
      );
      const waterSquares = board.squares.filter((square) =>
        WATER_ENVIRONMENT_TYPES.includes(square.environmentType)
      );
      const visitedSquareKeys = new Set();

      waterSquares.forEach((square) => {
        if (square.environmentType === 'stream') {
          hasGeneratedStream = true;
        }

        if (square.environmentType === 'river') {
          hasGeneratedRiver = true;
          expect(square.section).toBe('hard');
        }

        expect(square.isFixedArea).toBe(false);

        getOrthogonalWaterNeighbors(square, squareLookup).forEach((adjacentSquare) => {
          expect(adjacentSquare.environmentType).toBe(square.environmentType);
        });
      });

      waterSquares.forEach((square) => {
        const squareKey = getSquareKey(square.x, square.y);

        if (visitedSquareKeys.has(squareKey)) {
          return;
        }

        const componentSquares = getConnectedWaterComponent(square, squareLookup);

        componentSquares.forEach((componentSquare) => {
          visitedSquareKeys.add(getSquareKey(componentSquare.x, componentSquare.y));
        });

        expectSimpleWaterPathComponent(componentSquares, squareLookup);
      });
    }

    expect(hasGeneratedStream).toBe(true);
    expect(hasGeneratedRiver).toBe(true);
  });
});

describe('easy section woods balancing', () => {
  test('keeps at least 150 woods squares in the easy section across repeated boards', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const board = createBoard(createSeededRandomFn(seed));
      const easyWoodsSquares = board.squares.filter(
        (square) => square.section === 'easy' && square.environmentType === 'woods'
      );

      expect(easyWoodsSquares.length).toBeGreaterThanOrEqual(150);
    }
  });

  test('prefers replacing field squares before gravel when enough field squares exist', () => {
    const squares = [
      ...Array.from({ length: 149 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          environmentType: 'woods',
        })
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        createGenerationSquare({
          x: index,
          y: 10,
          environmentType: 'field',
        })
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        createGenerationSquare({
          x: index + 6,
          y: 10,
          environmentType: 'gravel',
        })
      ),
    ];

    balanceEasySectionWoodsCoverage(squares, () => 0);

    expect(
      squares.filter((square) => square.environmentType === 'woods' && square.y === 10)
    ).toHaveLength(1);
    expect(
      squares.filter((square) => square.environmentType === 'gravel' && square.y === 10)
    ).toHaveLength(6);
  });

  test('can fall back to gravel squares when field squares alone are insufficient', () => {
    const squares = [
      ...Array.from({ length: 145 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          environmentType: 'woods',
        })
      ),
      createGenerationSquare({
        x: 0,
        y: 10,
        environmentType: 'field',
      }),
      ...Array.from({ length: 5 }, (_, index) =>
        createGenerationSquare({
          x: index + 1,
          y: 10,
          environmentType: 'gravel',
        })
      ),
    ];

    balanceEasySectionWoodsCoverage(squares, () => 0);

    expect(
      squares.filter((square) => square.environmentType === 'woods' && square.y === 10)
    ).toHaveLength(5);
    expect(
      squares.filter((square) => square.environmentType === 'gravel' && square.y === 10)
    ).toHaveLength(1);
  });

  test('does not replace protected or fixed easy-section squares during the balancing pass', () => {
    const squares = [
      ...Array.from({ length: 149 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          environmentType: 'woods',
        })
      ),
      createGenerationSquare({
        x: 0,
        y: 10,
        environmentType: 'field',
        isProtectedStartFieldZone: true,
      }),
      createGenerationSquare({
        x: 1,
        y: 10,
        environmentType: 'gravel',
        isFixedArea: true,
      }),
      createGenerationSquare({
        x: 2,
        y: 10,
        environmentType: 'field',
      }),
    ];

    balanceEasySectionWoodsCoverage(squares, () => 0);

    expect(squares.find((square) => square.x === 0 && square.y === 10).environmentType).toBe(
      'field'
    );
    expect(squares.find((square) => square.x === 1 && square.y === 10).environmentType).toBe(
      'gravel'
    );
    expect(squares.find((square) => square.x === 2 && square.y === 10).environmentType).toBe(
      'woods'
    );
  });
});

describe('hard section forest balancing', () => {
  test('keeps at least 150 forest squares in the hard section across repeated boards', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const board = createBoard(createSeededRandomFn(seed));
      const hardForestSquares = board.squares.filter(
        (square) => square.section === 'hard' && square.environmentType === 'forest'
      );
      const easyWoodsSquares = board.squares.filter(
        (square) => square.section === 'easy' && square.environmentType === 'woods'
      );

      expect(hardForestSquares.length).toBeGreaterThanOrEqual(150);
      expect(easyWoodsSquares.length).toBeGreaterThanOrEqual(150);
    }
  });

  test('prefers replacing hard-section field squares before woods when enough field squares exist', () => {
    const squares = [
      ...Array.from({ length: 149 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          section: 'hard',
          environmentType: 'forest',
        })
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        createGenerationSquare({
          x: index,
          y: 10,
          section: 'hard',
          environmentType: 'field',
        })
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        createGenerationSquare({
          x: index + 6,
          y: 10,
          section: 'hard',
          environmentType: 'woods',
        })
      ),
    ];

    balanceHardSectionForestCoverage(squares, () => 0);

    expect(
      squares.filter((square) => square.environmentType === 'forest' && square.y === 10)
    ).toHaveLength(1);
    expect(
      squares.filter((square) => square.environmentType === 'woods' && square.y === 10)
    ).toHaveLength(6);
  });

  test('can fall back to woods and then mud when higher-priority hard-section replacements are insufficient', () => {
    const squares = [
      ...Array.from({ length: 142 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          section: 'hard',
          environmentType: 'forest',
        })
      ),
      createGenerationSquare({
        x: 0,
        y: 10,
        section: 'hard',
        environmentType: 'field',
      }),
      ...Array.from({ length: 3 }, (_, index) =>
        createGenerationSquare({
          x: index + 1,
          y: 10,
          section: 'hard',
          environmentType: 'woods',
        })
      ),
      ...Array.from({ length: 4 }, (_, index) =>
        createGenerationSquare({
          x: index + 4,
          y: 10,
          section: 'hard',
          environmentType: 'mud',
        })
      ),
    ];

    balanceHardSectionForestCoverage(squares, () => 0);

    expect(
      squares.filter((square) => square.environmentType === 'forest' && square.y === 10)
    ).toHaveLength(8);
    expect(
      squares.filter((square) => square.environmentType === 'mud' && square.y === 10)
    ).toHaveLength(0);
  });

  test('does not replace protected, fixed, feature, water, or mountain hard-section squares during the balancing pass', () => {
    const squares = [
      ...Array.from({ length: 149 }, (_, index) =>
        createGenerationSquare({
          x: index % 20,
          y: Math.floor(index / 20),
          section: 'hard',
          environmentType: 'forest',
        })
      ),
      createGenerationSquare({
        x: 0,
        y: 10,
        section: 'hard',
        environmentType: 'field',
        isProtectedStartFieldZone: true,
      }),
      createGenerationSquare({
        x: 1,
        y: 10,
        section: 'hard',
        environmentType: 'woods',
        isFixedArea: true,
      }),
      createGenerationSquare({
        x: 2,
        y: 10,
        section: 'hard',
        environmentType: 'mountains',
      }),
      createGenerationSquare({
        x: 3,
        y: 10,
        section: 'hard',
        environmentType: 'river',
      }),
      createGenerationSquare({
        x: 4,
        y: 10,
        section: 'hard',
        environmentType: 'field',
        featureId: 'feature-1',
      }),
      createGenerationSquare({
        x: 5,
        y: 10,
        section: 'hard',
        environmentType: 'field',
      }),
    ];

    balanceHardSectionForestCoverage(squares, () => 0);

    expect(squares.find((square) => square.x === 0 && square.y === 10).environmentType).toBe(
      'field'
    );
    expect(squares.find((square) => square.x === 1 && square.y === 10).environmentType).toBe(
      'woods'
    );
    expect(squares.find((square) => square.x === 2 && square.y === 10).environmentType).toBe(
      'mountains'
    );
    expect(squares.find((square) => square.x === 3 && square.y === 10).environmentType).toBe(
      'river'
    );
    expect(squares.find((square) => square.x === 4 && square.y === 10).environmentType).toBe(
      'field'
    );
    expect(squares.find((square) => square.x === 5 && square.y === 10).environmentType).toBe(
      'forest'
    );
  });
});
