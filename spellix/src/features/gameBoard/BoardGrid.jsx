import Field from './components/environments/field/field';
import Forest from './components/environments/forest/forest';
import Gravel from './components/environments/gravel/gravel';
import Hills from './components/environments/hills/hills';
import Mountains from './components/environments/mountains/mountains';
import Mud from './components/environments/mud/mud';
import River from './components/environments/river/river';
import Stream from './components/environments/stream/stream';
import Woods from './components/environments/woods/woods';
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

const ENVIRONMENT_COMPONENTS = {
  field: Field,
  forest: Forest,
  gravel: Gravel,
  hills: Hills,
  mountains: Mountains,
  mud: Mud,
  river: River,
  stream: Stream,
  woods: Woods,
};

function getSquareKey(x, y) {
  return `${x}-${y}`;
}

function BoardGrid({ board, highlightedColour, highlightedNodeIds, onSquareClick, players }) {
  const playerLookup = new Map();

  players
    .filter((player) => player.position)
    .forEach((player) => {
      const squareKey = getSquareKey(player.position.x, player.position.y);
      const squarePlayers = playerLookup.get(squareKey) ?? [];

      squarePlayers.push(player);
      playerLookup.set(squareKey, squarePlayers);
    });

  const highlightedNodeIdSet = new Set(highlightedNodeIds);

  const renderEnvironment = (square) => {
    const EnvironmentComponent = ENVIRONMENT_COMPONENTS[square.environmentType];

    return EnvironmentComponent ? (
      <EnvironmentComponent variation={square.environmentVariation} />
    ) : null;
  };

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

          return (
            <div
              key={square.id}
              aria-label={`Square ${square.x}, ${square.y}`}
              className={`board-square board-square--${square.areaType}${
                isHighlighted ? ' board-square--highlighted' : ''
              }`.trim()}
              data-area-type={square.areaType}
              data-environment-type={square.environmentType ?? ''}
              data-environment-variation={
                square.environmentVariation !== null ? square.environmentVariation : ''
              }
              data-highlight-colour={isHighlighted ? highlightedColour : ''}
              data-highlight-opacity={isHighlighted ? '0.5' : ''}
              data-highlighted={isHighlighted ? 'true' : 'false'}
              data-is-fixed-area={square.isFixedArea ? 'true' : 'false'}
              data-section={square.section}
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
              {renderEnvironment(square)}
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
