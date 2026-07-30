import {
  getAnywhereModeHighlightedNodeIds,
  getHighlightedNodeIds,
  getMovementNodeIdFromCoordinates,
  getMovementNodeIdFromSquare,
} from './movement';

function createBoardSquare({
  x,
  y,
  environmentType = 'field',
  featureId = null,
}) {
  return {
    id: `square-${x}-${y}`,
    x,
    y,
    environmentType,
    featureId,
  };
}

function createBoard(width, height, squareOverrides = []) {
  const squareOverridesByKey = new Map(
    squareOverrides.map((square) => [`${square.x}-${square.y}`, square])
  );
  const squares = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      squares.push(
        squareOverridesByKey.get(`${x}-${y}`) ??
          createBoardSquare({
            x,
            y,
          })
      );
    }
  }

  return {
    width,
    height,
    squares,
  };
}

describe('movement start area grouping', () => {
  test('groups only the new 2x2 start area squares under the start-area node id', () => {
    expect(getMovementNodeIdFromCoordinates(0, 29)).toBe('start-area');
    expect(getMovementNodeIdFromCoordinates(1, 29)).toBe('start-area');
    expect(getMovementNodeIdFromCoordinates(0, 30)).toBe('start-area');
    expect(getMovementNodeIdFromCoordinates(1, 30)).toBe('start-area');

    expect(getMovementNodeIdFromCoordinates(2, 29)).toBe('square-2-29');
    expect(getMovementNodeIdFromCoordinates(0, 28)).toBe('square-0-28');
  });

  test('can block the grouped start-area node from movement destinations and paths', () => {
    const board = createBoard(31, 31);

    expect(getHighlightedNodeIds(board, { x: 2, y: 29 }, 1)).toContain('start-area');
    expect(
      getHighlightedNodeIds(board, { x: 2, y: 29 }, 1, {
        blockedNodeIds: ['start-area'],
      })
    ).not.toContain('start-area');
    expect(
      getHighlightedNodeIds(board, { x: 2, y: 29 }, 2, {
        blockedNodeIds: ['start-area'],
      })
    ).not.toContain('square-0-28');
  });

  test('returns every other board node for anywhere mode destinations', () => {
    const board = createBoard(31, 31, [
      createBoardSquare({ x: 4, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 6, y: 3, environmentType: 'stream' }),
    ]);

    const anywhereNodeIds = getAnywhereModeHighlightedNodeIds(board, { x: 2, y: 29 });

    expect(anywhereNodeIds).toContain('start-area');
    expect(anywhereNodeIds).toContain('square-4-3');
    expect(anywhereNodeIds).toContain('square-6-3');
    expect(anywhereNodeIds).not.toContain('square-2-29');
  });
});

describe('river movement blocking', () => {
  test('allows landing on a river square but does not highlight squares beyond it on the same path', () => {
    const board = createBoard(7, 7, [
      createBoardSquare({ x: 4, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 2)).toContain('square-4-3');
    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 3)).not.toContain('square-5-3');
  });

  test('still highlights a destination beyond a river if another non-river path can reach it', () => {
    const board = createBoard(7, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 4)).toContain('square-4-3');
  });

  test('does not let a later river in the path continue expanding, but streams remain passable', () => {
    const board = createBoard(8, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'stream' }),
      createBoardSquare({ x: 5, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 2)).toContain('square-4-3');
    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 3)).toContain('square-5-3');
    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 4)).not.toContain('square-6-3');
  });

  test('allows a player starting on a river square to move away from it normally', () => {
    const board = createBoard(8, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 5, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 1).sort()).toEqual([
      'square-2-3',
      'square-3-2',
      'square-3-4',
      'square-4-3',
    ].sort());
    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 2)).toContain('square-5-3');
    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 3)).not.toContain('square-6-3');
  });

  test('allows movement through the same connected river chain the player starts on', () => {
    const board = createBoard(8, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 4, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 5, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 3)).toContain('square-6-3');
  });

  test('still blocks a different river chain when the player starts on a river', () => {
    const board = createBoard(9, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 4, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 6, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 3)).toContain('square-6-3');
    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 4)).not.toContain('square-7-3');
  });

  test('does not merge separate river chains through diagonal contact', () => {
    const board = createBoard(8, 8, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'river' }),
      createBoardSquare({ x: 4, y: 4, environmentType: 'river' }),
      createBoardSquare({ x: 3, y: 5, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 2)).toContain('square-4-4');
    expect(getHighlightedNodeIds(board, { x: 3, y: 3 }, 3)).not.toContain('square-4-5');
  });

  test('still blocks river crossing when the player starts on a non-river square, even if the path first passes through a stream', () => {
    const board = createBoard(8, 7, [
      createBoardSquare({ x: 3, y: 3, environmentType: 'stream' }),
      createBoardSquare({ x: 4, y: 3, environmentType: 'river' }),
    ]);

    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 2)).toContain('square-4-3');
    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 3)).not.toContain('square-5-3');
  });
});

describe('multi-square logical feature movement', () => {
  const villageSquares = [
    createBoardSquare({ x: 3, y: 3, environmentType: null, featureId: 'village-1' }),
    createBoardSquare({ x: 4, y: 3, environmentType: null, featureId: 'village-1' }),
    createBoardSquare({ x: 3, y: 4, environmentType: null, featureId: 'village-1' }),
    createBoardSquare({ x: 4, y: 4, environmentType: null, featureId: 'village-1' }),
  ];

  test('groups every generated feature cell under one movement node', () => {
    expect(villageSquares.map(getMovementNodeIdFromSquare)).toEqual([
      'board-feature-village-1',
      'board-feature-village-1',
      'board-feature-village-1',
      'board-feature-village-1',
    ]);
  });

  test('highlights the logical feature when any footprint cell is reachable', () => {
    const board = createBoard(8, 8, villageSquares);

    expect(getHighlightedNodeIds(board, { x: 2, y: 3 }, 1)).toContain(
      'board-feature-village-1'
    );
  });

  test('leaves a 2x2 feature from every outer edge for one movement', () => {
    const board = createBoard(8, 8, villageSquares);

    expect(
      getHighlightedNodeIds(
        board,
        {
          featureId: 'board-feature-village-1',
          type: 'feature',
          x: 3,
          y: 3,
        },
        1
      ).sort()
    ).toEqual(
      [
        'square-2-3',
        'square-2-4',
        'square-3-2',
        'square-3-5',
        'square-4-2',
        'square-4-5',
        'square-5-3',
        'square-5-4',
      ].sort()
    );
  });

  test('keeps fixed elite and boss corner footprints as logical movement nodes', () => {
    const board = createBoard(31, 31);

    expect(
      getHighlightedNodeIds(
        board,
        {
          featureId: 'elite-battle-top-left',
          type: 'feature',
          x: 0,
          y: 0,
        },
        1
      ).sort()
    ).toEqual(
      ['square-0-2', 'square-1-2', 'square-2-0', 'square-2-1'].sort()
    );
    expect(getMovementNodeIdFromCoordinates(29, 29, board)).toBe(
      'elite-battle-bottom-right'
    );
    expect(getMovementNodeIdFromCoordinates(30, 30, board)).toBe(
      'elite-battle-bottom-right'
    );
    expect(getMovementNodeIdFromCoordinates(29, 0, board)).toBe('boss-battle');
    expect(getMovementNodeIdFromCoordinates(30, 1, board)).toBe('boss-battle');
  });
});
