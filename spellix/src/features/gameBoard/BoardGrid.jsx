import { getMovementNodeIdFromCoordinates } from './movement';
import './BoardGrid.css';

const PLAYER_MARKER_POSITIONS = [
  { left: 0, top: 0 },
  { left: 8, top: 0 },
  { left: 16, top: 0 },
  { left: 0, top: 10 },
  { left: 8, top: 10 },
  { left: 16, top: 10 },
];

function getSquareKey(x, y) {
  return `${x}-${y}`;
}

function getGroupedBorderClasses(square, squareLookup) {
  if (square.areaType === 'normal') {
    return '';
  }

  const groupedBorderClasses = [];
  const adjacentSquares = {
    top: squareLookup.get(getSquareKey(square.x, square.y - 1)),
    right: squareLookup.get(getSquareKey(square.x + 1, square.y)),
    bottom: squareLookup.get(getSquareKey(square.x, square.y + 1)),
    left: squareLookup.get(getSquareKey(square.x - 1, square.y)),
  };

  if (adjacentSquares.top?.areaType === square.areaType) {
    groupedBorderClasses.push('board-square--hide-top-border');
  }

  if (adjacentSquares.right?.areaType === square.areaType) {
    groupedBorderClasses.push('board-square--hide-right-border');
  }

  if (adjacentSquares.bottom?.areaType === square.areaType) {
    groupedBorderClasses.push('board-square--hide-bottom-border');
  }

  if (adjacentSquares.left?.areaType === square.areaType) {
    groupedBorderClasses.push('board-square--hide-left-border');
  }

  return groupedBorderClasses.join(' ');
}

function BoardGrid({ board, highlightedColour, highlightedNodeIds, onSquareClick, players }) {
  const playerLookup = new Map();
  const squareLookup = new Map(board.squares.map((square) => [getSquareKey(square.x, square.y), square]));

  players
    .filter((player) => player.position)
    .forEach((player) => {
      const squareKey = getSquareKey(player.position.x, player.position.y);
      const squarePlayers = playerLookup.get(squareKey) ?? [];

      squarePlayers.push(player);
      playerLookup.set(squareKey, squarePlayers);
    });

  const highlightedNodeIdSet = new Set(highlightedNodeIds);

  return (
    <section aria-label="Board panel" className="board-panel">
      <div
        aria-label="Game board"
        className="board-grid"
        style={{
          gridTemplateColumns: `repeat(${board.width}, ${board.squareSize}px)`,
          gridTemplateRows: `repeat(${board.height}, ${board.squareSize}px)`,
          width: `${board.width * board.squareSize}px`,
          height: `${board.height * board.squareSize}px`,
        }}
      >
        {board.squares.map((square) => {
          const squarePlayers = playerLookup.get(getSquareKey(square.x, square.y)) ?? [];
          const nodeId = getMovementNodeIdFromCoordinates(square.x, square.y);
          const isHighlighted = highlightedNodeIdSet.has(nodeId);
          const groupedBorderClasses = getGroupedBorderClasses(square, squareLookup);

          return (
            <div
              key={square.id}
              aria-label={`Square ${square.x}, ${square.y}`}
              className={`board-square board-square--${square.areaType}${
                isHighlighted ? ' board-square--highlighted' : ''
              } ${groupedBorderClasses}`.trim()}
              data-area-type={square.areaType}
              data-highlight-colour={isHighlighted ? highlightedColour : ''}
              data-highlight-opacity={isHighlighted ? '0.5' : ''}
              data-highlighted={isHighlighted ? 'true' : 'false'}
              data-x={square.x}
              data-y={square.y}
              role="button"
              tabIndex={isHighlighted ? 0 : -1}
              onClick={() => onSquareClick(square)}
              onKeyDown={(event) => {
                if (isHighlighted && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onSquareClick(square);
                }
              }}
            >
              {isHighlighted ? (
                <div
                  aria-hidden="true"
                  className="board-square-highlight"
                  style={{
                    backgroundColor: highlightedColour,
                    opacity: 0.5,
                  }}
                />
              ) : null}
              {squarePlayers.map((player, index) => (
                <div
                  key={player.id}
                  aria-label={`${player.colour} player piece`}
                  className="board-player-marker"
                  style={{
                    backgroundColor: player.colour,
                    height: '14px',
                    left: `${PLAYER_MARKER_POSITIONS[index]?.left ?? 0}px`,
                    top: `${PLAYER_MARKER_POSITIONS[index]?.top ?? 0}px`,
                    width: '14px',
                    zIndex: index + 1,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BoardGrid;
