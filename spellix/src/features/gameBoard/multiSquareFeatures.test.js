import {
  chooseVisualPositionForFeature,
  getMultiSquareLogicalFeature,
} from './multiSquareFeatures';

function createBoard() {
  const squares = [];

  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const isVillage = x >= 2 && x <= 3 && y >= 2 && y <= 3;

      squares.push({
        featureId: isVillage ? 'village-1' : null,
        id: `square-${x}-${y}`,
        x,
        y,
      });
    }
  }

  return {
    height: 7,
    squares,
    width: 7,
  };
}

function createFullBoard() {
  const squares = [];

  for (let y = 0; y < 31; y += 1) {
    for (let x = 0; x < 31; x += 1) {
      squares.push({
        featureId: null,
        id: `square-${x}-${y}`,
        x,
        y,
      });
    }
  }

  return {
    height: 31,
    squares,
    width: 31,
  };
}

test('returns the complete logical footprint for a generated feature', () => {
  const board = createBoard();
  const feature = getMultiSquareLogicalFeature(board, board.squares[16]);

  expect(feature).toEqual({
    cells: [
      expect.objectContaining({ x: 2, y: 2 }),
      expect.objectContaining({ x: 3, y: 2 }),
      expect.objectContaining({ x: 2, y: 3 }),
      expect.objectContaining({ x: 3, y: 3 }),
    ],
    id: 'board-feature-village-1',
  });
});

test('chooses an unoccupied visual cell and stores logical feature identity', () => {
  const board = createBoard();
  const destinationSquare = board.squares.find(
    ({ x, y }) => x === 2 && y === 2
  );
  const players = [
    {
      id: 'player-2',
      position: {
        featureId: 'board-feature-village-1',
        type: 'feature',
        x: 2,
        y: 2,
      },
    },
    {
      id: 'player-3',
      position: {
        featureId: 'board-feature-village-1',
        type: 'feature',
        x: 3,
        y: 2,
      },
    },
  ];

  expect(
    chooseVisualPositionForFeature({
      board,
      destinationSquare,
      players,
      randomFn: () => 0,
    })
  ).toEqual({
    featureId: 'board-feature-village-1',
    type: 'feature',
    x: 2,
    y: 3,
  });
});

test('falls back to any footprint cell after every visual cell is occupied', () => {
  const board = createBoard();
  const destinationSquare = board.squares.find(
    ({ x, y }) => x === 3 && y === 3
  );
  const players = [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ].map(([x, y], index) => ({
    id: `player-${index + 2}`,
    position: {
      featureId: 'board-feature-village-1',
      type: 'feature',
      x,
      y,
    },
  }));

  expect(
    chooseVisualPositionForFeature({
      board,
      destinationSquare,
      players,
      randomFn: () => 0.99,
    })
  ).toEqual({
    featureId: 'board-feature-village-1',
    type: 'feature',
    x: 3,
    y: 3,
  });
});

test('keeps a normal one-square destination as a plain coordinate position', () => {
  const board = createBoard();
  const destinationSquare = board.squares.find(
    ({ x, y }) => x === 5 && y === 5
  );

  expect(
    chooseVisualPositionForFeature({
      board,
      destinationSquare,
      players: [],
      randomFn: () => 0,
    })
  ).toEqual({ x: 5, y: 5 });
});

test.each([
  [0, 0, 'elite-battle-top-left'],
  [29, 29, 'elite-battle-bottom-right'],
  [29, 0, 'boss-battle'],
])(
  'chooses a visual cell inside fixed feature %s,%s',
  (x, y, featureId) => {
    const board = createFullBoard();
    const destinationSquare = board.squares.find(
      (square) => square.x === x && square.y === y
    );
    const position = chooseVisualPositionForFeature({
      board,
      destinationSquare,
      players: [],
      randomFn: () => 0.99,
    });

    expect(position).toEqual(
      expect.objectContaining({
        featureId,
        type: 'feature',
      })
    );
    expect(
      getMultiSquareLogicalFeature(board, destinationSquare).cells
    ).toContainEqual(expect.objectContaining({ x: position.x, y: position.y }));
  }
);
