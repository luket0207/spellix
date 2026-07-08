export const BOARD_WIDTH = 31;
export const BOARD_HEIGHT = 31;
export const BOARD_SQUARE_SIZE = 30;

const START_AREA_POSITION_SEQUENCE = [
  { x: 0, y: 28 },
  { x: 1, y: 28 },
  { x: 2, y: 28 },
  { x: 0, y: 29 },
  { x: 1, y: 29 },
  { x: 2, y: 29 },
  { x: 0, y: 30 },
  { x: 1, y: 30 },
  { x: 2, y: 30 },
];

function isStartAreaSquare(x, y) {
  return x >= 0 && x <= 2 && y >= 28 && y <= 30;
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

export function createBoard() {
  const squares = [];

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      squares.push({
        id: `square-${x}-${y}`,
        x,
        y,
        areaType: getAreaType(x, y),
      });
    }
  }

  return {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    squareSize: BOARD_SQUARE_SIZE,
    squares,
  };
}

export function assignStartingPositions(players) {
  return players.map((player, index) => ({
    ...player,
    position: START_AREA_POSITION_SEQUENCE[index],
  }));
}
