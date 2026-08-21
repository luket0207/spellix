import { useState } from 'react';
import Field from './components/environments/field/field';
import Forest from './components/environments/forest/forest';
import Gravel from './components/environments/gravel/gravel';
import Hills from './components/environments/hills/hills';
import Mountains from './components/environments/mountains/mountains';
import Mud from './components/environments/mud/mud';
import River from './components/environments/river/river';
import Stream from './components/environments/stream/stream';
import Woods from './components/environments/woods/woods';
import { getPieceImageSource } from '../gameSetup/pieceImages';
import { getMovementNodeIdFromSquare } from './movement';
import {
  getBoardHoverEnemyName,
  getBoardHoverLabel,
  getBoardHoverLabelPosition,
} from './boardHoverLabels';
import bossCastleImage from '../../images/features/boss-castle.png';
import eliteTowerGravelImage from '../../images/features/elite-tower-gravel.png';
import eliteTowerWoodsImage from '../../images/features/elite-tower-woods.png';
import homeImage from '../../images/features/home.png';
import villageFieldImage from '../../images/features/village-field.png';
import villageForestImage from '../../images/features/village-forest.png';
import './BoardGrid.css';

const PLAYER_MARKER_POSITIONS = [
  { bottom: 0, left: 0 },
  { bottom: 0, left: 8 },
  { bottom: 0, left: 16 },
  { bottom: 8, left: 0 },
  { bottom: 8, left: 8 },
  { bottom: 8, left: 16 },
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

const FEATURE_IMAGE_SOURCES = {
  'boss-castle.png': bossCastleImage,
  'elite-tower-gravel.png': eliteTowerGravelImage,
  'elite-tower-woods.png': eliteTowerWoodsImage,
  'home.png': homeImage,
  'village-field.png': villageFieldImage,
  'village-forest.png': villageForestImage,
};

function getSquareKey(x, y) {
  return `${x}-${y}`;
}

function BoardGrid({
  board,
  currentPlayerId = '',
  eliteBossEnemyAssignments,
  highlightedColour,
  highlightedNodeIds,
  language = 'en',
  objectiveHighlightMode = null,
  onSquareClick,
  players,
}) {
  const [hoveredSquare, setHoveredSquare] = useState(null);
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
  const objectiveFeatureImages = (board.featureImages ?? []).filter(
    ({ imageName }) =>
      (objectiveHighlightMode === 'eliteTowers' &&
        imageName.startsWith('elite-tower-')) ||
      (objectiveHighlightMode === 'bossBattle' &&
        imageName === 'boss-castle.png')
  );
  const hoveredLabel = hoveredSquare
    ? getBoardHoverLabel({ board, language, square: hoveredSquare })
    : '';
  const hoveredEnemyName = hoveredSquare
    ? getBoardHoverEnemyName({
        assignments: eliteBossEnemyAssignments,
        board,
        language,
        square: hoveredSquare,
      })
    : '';
  const hoveredLabelPosition = hoveredLabel
    ? getBoardHoverLabelPosition(board, hoveredSquare)
    : '';

  const renderEnvironment = (square) => {
    const EnvironmentComponent = ENVIRONMENT_COMPONENTS[square.environmentType];

    return EnvironmentComponent ? (
      <EnvironmentComponent variation={square.environmentVariation} />
    ) : null;
  };

  const renderPlayerMarker = (player, index) => {
    const pieceImageSource = getPieceImageSource(player.pieceImage);
    const isCurrentPlayer = player.id === currentPlayerId;

    return (
      <div
        key={player.id}
        className={`board-player-marker${
          isCurrentPlayer ? ' board-player-marker--current' : ''
        }`.trim()}
        data-is-current-player={isCurrentPlayer ? 'true' : 'false'}
        style={{
          bottom: `${PLAYER_MARKER_POSITIONS[index]?.bottom ?? 0}px`,
          left: `${PLAYER_MARKER_POSITIONS[index]?.left ?? 0}px`,
          zIndex: isCurrentPlayer ? PLAYER_MARKER_POSITIONS.length + 3 : index + 3,
        }}
      >
        {isCurrentPlayer ? <span aria-hidden="true" className="board-player-marker-glow" /> : null}
        {pieceImageSource ? (
          <img
            alt={`${player.colour} player piece`}
            aria-label={`${player.colour} player piece`}
            className="board-player-marker-image"
            src={pieceImageSource}
            style={{ height: '40px' }}
          />
        ) : (
          <span aria-label={`${player.colour} player piece`}>{player.colour}</span>
        )}
      </div>
    );
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
          position: 'relative',
        }}
      >
        {board.squares.map((square) => {
          const squarePlayers = playerLookup.get(getSquareKey(square.x, square.y)) ?? [];
          const nodeId = getMovementNodeIdFromSquare(square);
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
              onMouseEnter={() => setHoveredSquare(square)}
              onMouseLeave={() => setHoveredSquare(null)}
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
              {squarePlayers.map(renderPlayerMarker)}
            </div>
          );
        })}
        <div
          className="board-feature-overlay-layer"
          data-testid="board-feature-overlay-layer"
          style={{
            width: `${board.width * board.squareSize}px`,
            height: `${board.height * board.squareSize}px`,
            inset: 0,
            pointerEvents: 'none',
            position: 'absolute',
            zIndex: 1,
          }}
        >
          {objectiveFeatureImages.map((featureImage) => (
            <span
              key={`objective-${featureImage.id}`}
              aria-hidden="true"
              className="board-feature-objective-glow"
              data-testid={`board-objective-glow-${featureImage.id}`}
              style={{
                height: `${featureImage.height * board.squareSize + 12}px`,
                left: `${featureImage.x * board.squareSize - 6}px`,
                top: `${featureImage.y * board.squareSize - 6}px`,
                width: `${featureImage.width * board.squareSize + 12}px`,
              }}
            />
          ))}
          {(board.featureImages ?? []).map((featureImage) => (
            <img
              key={featureImage.id}
              alt={`${featureImage.id} board feature`}
              className="board-feature-image"
              data-testid={`board-feature-${featureImage.id}`}
              src={FEATURE_IMAGE_SOURCES[featureImage.imageName]}
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                left: `${featureImage.x * board.squareSize}px`,
                top: `${featureImage.y * board.squareSize}px`,
                width: `${featureImage.width * board.squareSize}px`,
                height: `${featureImage.height * board.squareSize}px`,
              }}
            />
          ))}
        </div>
        {hoveredLabel ? (
          <div
            className={`board-hover-label board-hover-label--${hoveredLabelPosition} larger-text language-${
              language === 'jp' ? 'jp' : 'en'
            }`}
          >
            {hoveredEnemyName ? (
              <>
                <span className="board-hover-label-feature-name">{hoveredLabel}</span>
                <span className="board-hover-label-enemy-name">{hoveredEnemyName}</span>
              </>
            ) : (
              hoveredLabel
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BoardGrid;
