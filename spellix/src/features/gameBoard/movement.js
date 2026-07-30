const GROUPED_AREA_NODE_IDS = {
  startArea: 'start-area',
  topLeftEliteBattle: 'elite-battle-top-left',
  bottomRightEliteBattle: 'elite-battle-bottom-right',
  bossBattle: 'boss-battle',
};

function getGroupedAreaNodeId(x, y) {
  if (x >= 0 && x <= 1 && y >= 29 && y <= 30) {
    return GROUPED_AREA_NODE_IDS.startArea;
  }

  if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    return GROUPED_AREA_NODE_IDS.topLeftEliteBattle;
  }

  if (x >= 29 && x <= 30 && y >= 29 && y <= 30) {
    return GROUPED_AREA_NODE_IDS.bottomRightEliteBattle;
  }

  if (x >= 29 && x <= 30 && y >= 0 && y <= 1) {
    return GROUPED_AREA_NODE_IDS.bossBattle;
  }

  return null;
}

function getAdjacentCoordinates(x, y, board) {
  const adjacentCoordinates = [];

  if (x > 0) {
    adjacentCoordinates.push({ x: x - 1, y });
  }

  if (x < board.width - 1) {
    adjacentCoordinates.push({ x: x + 1, y });
  }

  if (y > 0) {
    adjacentCoordinates.push({ x, y: y - 1 });
  }

  if (y < board.height - 1) {
    adjacentCoordinates.push({ x, y: y + 1 });
  }

  return adjacentCoordinates;
}

function getConnectedRiverNodeIds(startingNodeId, adjacentRiverNodeIdsByNodeId) {
  if (!startingNodeId) {
    return new Set();
  }

  const connectedRiverNodeIds = new Set();
  const pendingNodeIds = [startingNodeId];

  while (pendingNodeIds.length > 0) {
    const nodeId = pendingNodeIds.pop();

    if (connectedRiverNodeIds.has(nodeId)) {
      continue;
    }

    connectedRiverNodeIds.add(nodeId);

    const adjacentRiverNodeIds = adjacentRiverNodeIdsByNodeId.get(nodeId) ?? new Set();

    adjacentRiverNodeIds.forEach((adjacentNodeId) => {
      if (!connectedRiverNodeIds.has(adjacentNodeId)) {
        pendingNodeIds.push(adjacentNodeId);
      }
    });
  }

  return connectedRiverNodeIds;
}

export function getMovementNodeIdFromCoordinates(x, y, board) {
  const square = board?.squares?.find(
    (candidateSquare) => candidateSquare.x === x && candidateSquare.y === y
  );

  if (square) {
    return getMovementNodeIdFromSquare(square);
  }

  const groupedAreaNodeId = getGroupedAreaNodeId(x, y);

  if (groupedAreaNodeId) {
    return groupedAreaNodeId;
  }

  return `square-${x}-${y}`;
}

export function getMovementNodeIdFromSquare(square) {
  const groupedAreaNodeId = getGroupedAreaNodeId(square.x, square.y);

  if (groupedAreaNodeId) {
    return groupedAreaNodeId;
  }

  return square.featureId
    ? `board-feature-${square.featureId}`
    : `square-${square.x}-${square.y}`;
}

export function getMovementNodeIdFromPosition(position, board) {
  if (position.type === 'feature' && position.featureId) {
    return position.featureId;
  }

  return getMovementNodeIdFromCoordinates(position.x, position.y, board);
}

export function getAnywhereModeHighlightedNodeIds(board, position) {
  if (!board || !position) {
    return [];
  }

  const startingNodeId = getMovementNodeIdFromPosition(position, board);

  return Array.from(
    new Set(
      board.squares.map(getMovementNodeIdFromSquare)
    )
  ).filter((nodeId) => nodeId !== startingNodeId);
}

export function getHighlightedNodeIds(board, position, steps, options = {}) {
  if (!board || !position || steps < 1) {
    return [];
  }

  const { blockedNodeIds = [] } = options;
  const startingNodeId = getMovementNodeIdFromPosition(position, board);
  const squareByCoordinateKey = new Map(
    board.squares.map((square) => [`${square.x}-${square.y}`, square])
  );
  const adjacencyByNodeId = new Map();
  const adjacentRiverNodeIdsByNodeId = new Map();
  const blockedNodeIdSet = new Set(blockedNodeIds.filter((nodeId) => nodeId !== startingNodeId));
  const riverNodeIds = new Set();

  board.squares.forEach((square) => {
    const nodeId = getMovementNodeIdFromSquare(square);

    if (!adjacencyByNodeId.has(nodeId)) {
      adjacencyByNodeId.set(nodeId, new Set());
    }

    if (square.environmentType === 'river') {
      riverNodeIds.add(nodeId);
      if (!adjacentRiverNodeIdsByNodeId.has(nodeId)) {
        adjacentRiverNodeIdsByNodeId.set(nodeId, new Set());
      }
    }

    getAdjacentCoordinates(square.x, square.y, board).forEach((adjacentCoordinate) => {
      const adjacentSquare = squareByCoordinateKey.get(
        `${adjacentCoordinate.x}-${adjacentCoordinate.y}`
      );
      const adjacentNodeId = adjacentSquare
        ? getMovementNodeIdFromSquare(adjacentSquare)
        : getMovementNodeIdFromCoordinates(
            adjacentCoordinate.x,
            adjacentCoordinate.y
          );

      if (adjacentNodeId !== nodeId) {
        adjacencyByNodeId.get(nodeId).add(adjacentNodeId);
      }

      if (
        square.environmentType === 'river' &&
        adjacentSquare?.environmentType === 'river' &&
        adjacentNodeId !== nodeId
      ) {
        adjacentRiverNodeIdsByNodeId.get(nodeId)?.add(adjacentNodeId);
      }
    });
  });

  const startsOnRiver = riverNodeIds.has(startingNodeId);
  const nonBlockingRiverNodeIds = startsOnRiver
    ? getConnectedRiverNodeIds(startingNodeId, adjacentRiverNodeIdsByNodeId)
    : new Set();
  let currentNodeIds = new Set([startingNodeId]);

  for (let step = 0; step < steps; step += 1) {
    const nextNodeIds = new Set();

    currentNodeIds.forEach((nodeId) => {
      const isBlockingRiverNode =
        riverNodeIds.has(nodeId) && !nonBlockingRiverNodeIds.has(nodeId);

      if (nodeId !== startingNodeId && isBlockingRiverNode) {
        return;
      }

      const adjacentNodeIds = adjacencyByNodeId.get(nodeId) ?? new Set();

      adjacentNodeIds.forEach((adjacentNodeId) => {
        if (!blockedNodeIdSet.has(adjacentNodeId)) {
          nextNodeIds.add(adjacentNodeId);
        }
      });
    });

    currentNodeIds = nextNodeIds;
  }

  return Array.from(currentNodeIds).filter((nodeId) => nodeId !== startingNodeId);
}
