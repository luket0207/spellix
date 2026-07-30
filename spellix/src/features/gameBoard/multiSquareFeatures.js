import {
  getMovementNodeIdFromPosition,
  getMovementNodeIdFromSquare,
} from './movement';

export function getMultiSquareLogicalFeature(board, destinationSquare) {
  if (!board || !destinationSquare) {
    return null;
  }

  const featureId = getMovementNodeIdFromSquare(destinationSquare);

  if (featureId === 'start-area' || featureId.startsWith('square-')) {
    return null;
  }

  const cells = board.squares.filter(
    (square) => getMovementNodeIdFromSquare(square) === featureId
  );

  return cells.length > 1 ? { cells, id: featureId } : null;
}

export function chooseVisualPositionForFeature({
  board,
  destinationSquare,
  players,
  randomFn = Math.random,
}) {
  const feature = getMultiSquareLogicalFeature(board, destinationSquare);

  if (!feature) {
    return {
      x: destinationSquare.x,
      y: destinationSquare.y,
    };
  }

  const occupiedCellKeys = new Set(
    players
      .filter(
        ({ position }) =>
          position &&
          getMovementNodeIdFromPosition(position, board) === feature.id
      )
      .map(({ position }) => `${position.x}-${position.y}`)
  );
  const availableCells = feature.cells.filter(
    ({ x, y }) => !occupiedCellKeys.has(`${x}-${y}`)
  );
  const candidateCells =
    availableCells.length > 0 ? availableCells : feature.cells;
  const selectedCell =
    candidateCells[
      Math.min(
        Math.floor(randomFn() * candidateCells.length),
        candidateCells.length - 1
      )
    ];

  return {
    featureId: feature.id,
    type: 'feature',
    x: selectedCell.x,
    y: selectedCell.y,
  };
}
