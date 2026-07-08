const GROUPED_AREA_NODE_IDS = {
  startArea: 'start-area',
  topLeftEliteBattle: 'elite-battle-top-left',
  bottomRightEliteBattle: 'elite-battle-bottom-right',
  bossBattle: 'boss-battle',
};

function getGroupedAreaNodeId(x, y) {
  if (x >= 0 && x <= 2 && y >= 28 && y <= 30) {
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

export function getMovementNodeIdFromCoordinates(x, y) {
  const groupedAreaNodeId = getGroupedAreaNodeId(x, y);

  if (groupedAreaNodeId) {
    return groupedAreaNodeId;
  }

  return `square-${x}-${y}`;
}

export function getMovementNodeIdFromPosition(position) {
  return getMovementNodeIdFromCoordinates(position.x, position.y);
}

export function getHighlightedNodeIds(board, position, steps) {
  if (!board || !position || steps < 1) {
    return [];
  }

  const startingNodeId = getMovementNodeIdFromPosition(position);
  const adjacencyByNodeId = new Map();

  board.squares.forEach((square) => {
    const nodeId = getMovementNodeIdFromCoordinates(square.x, square.y);

    if (!adjacencyByNodeId.has(nodeId)) {
      adjacencyByNodeId.set(nodeId, new Set());
    }

    getAdjacentCoordinates(square.x, square.y, board).forEach((adjacentCoordinate) => {
      const adjacentNodeId = getMovementNodeIdFromCoordinates(
        adjacentCoordinate.x,
        adjacentCoordinate.y
      );

      if (adjacentNodeId !== nodeId) {
        adjacencyByNodeId.get(nodeId).add(adjacentNodeId);
      }
    });
  });

  let currentNodeIds = new Set([startingNodeId]);

  for (let step = 0; step < steps; step += 1) {
    const nextNodeIds = new Set();

    currentNodeIds.forEach((nodeId) => {
      const adjacentNodeIds = adjacencyByNodeId.get(nodeId) ?? new Set();

      adjacentNodeIds.forEach((adjacentNodeId) => {
        nextNodeIds.add(adjacentNodeId);
      });
    });

    currentNodeIds = nextNodeIds;
  }

  return Array.from(currentNodeIds).filter((nodeId) => nodeId !== startingNodeId);
}
