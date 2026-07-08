import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import BoardGrid from '../features/gameBoard/BoardGrid';
import { getHighlightedNodeIds, getMovementNodeIdFromCoordinates } from '../features/gameBoard/movement';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import './GameplayPage.css';

function GameplayPage() {
  const {
    advanceTurn,
    currentPlayer,
    gameSetup,
    initializeBoard,
    initializeTurnOrder,
    setPlayerPosition,
  } = useGameSetup();
  const [currentDiceRoll, setCurrentDiceRoll] = useState(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState([]);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showTurnModal, setShowTurnModal] = useState(false);

  useEffect(() => {
    if (gameSetup.turnOrder.length === 0 && gameSetup.players.length > 0) {
      initializeTurnOrder();
    }
  }, [gameSetup.players.length, gameSetup.turnOrder.length, initializeTurnOrder]);

  useEffect(() => {
    if (!gameSetup.board && gameSetup.players.length > 0) {
      initializeBoard();
    }
  }, [gameSetup.board, gameSetup.players.length, initializeBoard]);

  const handleRollDice = () => {
    if (!currentPlayer || showDiceModal || showTurnModal || currentDiceRoll) {
      return;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;

    setCurrentDiceRoll(diceRoll);
    setHighlightedNodeIds(getHighlightedNodeIds(gameSetup.board, currentPlayer.position, diceRoll));
    setShowDiceModal(true);
  };

  const handleSquareClick = (square) => {
    if (!currentPlayer || showDiceModal || showTurnModal || currentDiceRoll === null) {
      return;
    }

    const destinationNodeId = getMovementNodeIdFromCoordinates(square.x, square.y);

    if (!highlightedNodeIds.includes(destinationNodeId)) {
      return;
    }

    setPlayerPosition(currentPlayer.id, { x: square.x, y: square.y });
    setCurrentDiceRoll(null);
    setHighlightedNodeIds([]);
    advanceTurn();
    setShowTurnModal(true);
  };

  return (
    <main className="gameplay-layout">
      {gameSetup.board ? (
        <BoardGrid
          board={gameSetup.board}
          highlightedColour={currentPlayer?.colour ?? ''}
          highlightedNodeIds={highlightedNodeIds}
          onSquareClick={handleSquareClick}
          players={gameSetup.players}
        />
      ) : null}

      <section aria-label="Gameplay panel" className="gameplay-sidebar">
        <section>
          <h2>Current turn</h2>
          <p>
            {currentPlayer
              ? `It is currently ${currentPlayer.colour} player's turn.`
              : 'Preparing turn order.'}
          </p>
        </section>

        <button
          type="button"
          disabled={showDiceModal || showTurnModal || currentDiceRoll !== null}
          onClick={handleRollDice}
        >
          Roll Dice
        </button>

        <p>{`Player count: ${gameSetup.playerCount}`}</p>
        <ul aria-label="Player setup">
          {gameSetup.players.map((player, index) => (
            <li key={player.id}>
              {`Player ${index + 1}: ${player.colour}`}
              {player.position ? ` at ${player.position.x}, ${player.position.y}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <Modal
        actions={
          <button type="button" onClick={() => setShowDiceModal(false)}>
            OK
          </button>
        }
        ariaLabel="Dice result"
        isOpen={showDiceModal}
      >
        <p>{`Dice result: ${currentDiceRoll}`}</p>
      </Modal>

      {currentPlayer ? (
        <Modal
          actions={
            <button type="button" onClick={() => setShowTurnModal(false)}>
              OK
            </button>
          }
          ariaLabel="Turn change"
          isOpen={showTurnModal}
        >
          <p>{`It is now ${currentPlayer.colour} player's turn.`}</p>
        </Modal>
      ) : null}
    </main>
  );
}

export default GameplayPage;
