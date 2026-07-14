import { useEffect, useState } from 'react';
import DiceRoll from '../components/dice/DiceRoll';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import BoardGrid from '../features/gameBoard/BoardGrid';
import {
  getAnywhereModeHighlightedNodeIds,
  getHighlightedNodeIds,
  getMovementNodeIdFromCoordinates,
} from '../features/gameBoard/movement';
import { cloneSpellSlots, cloneTokenBag } from '../features/gameSetup/gameSetup';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import CommittedSpellSlots from '../features/spells/CommittedSpellSlots';
import SpellsModal from '../features/spells/SpellsModal';
import {
  createCommittedSpellData,
  hasDraftSpellChanges,
  moveSpellTokenInDraft,
} from '../features/spells/spellSetup';
import './GameplayPage.css';

function GameplayPage() {
  const {
    advanceTurn,
    currentPlayer,
    gameSetup,
    initializeBoard,
    initializeTurnOrder,
    setPlayerPosition,
    updatePlayerSpells,
  } = useGameSetup();
  const [currentDiceRoll, setCurrentDiceRoll] = useState(null);
  const [draftSpellSlots, setDraftSpellSlots] = useState([]);
  const [draftTokenBag, setDraftTokenBag] = useState([]);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState([]);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showSpellsModal, setShowSpellsModal] = useState(false);
  const [showSpellCancelConfirmation, setShowSpellCancelConfirmation] = useState(false);
  const [showSpellSaveConfirmation, setShowSpellSaveConfirmation] = useState(false);
  const [spellValidationMessage, setSpellValidationMessage] = useState('');
  const [showTurnModal, setShowTurnModal] = useState(false);
  const isForcedSpellSetup = Boolean(currentPlayer && !currentPlayer.hasCommittedInitialSpells);
  const hasUnsavedSpellChanges = Boolean(
    currentPlayer &&
      hasDraftSpellChanges({
        draftSpellSlots,
        draftTokenBag,
        savedSpellSlots: currentPlayer.spellSlots,
        savedTokenBag: currentPlayer.tokenBag,
      })
  );

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

  useEffect(() => {
    if (currentPlayer && isForcedSpellSetup) {
      setShowSpellsModal(true);
    }
  }, [currentPlayer, isForcedSpellSetup]);

  useEffect(() => {
    if (!showSpellsModal || !currentPlayer) {
      return;
    }

    setDraftTokenBag(cloneTokenBag(currentPlayer.tokenBag));
    setDraftSpellSlots(cloneSpellSlots(currentPlayer.spellSlots));
    setShowSpellCancelConfirmation(false);
    setShowSpellSaveConfirmation(false);
    setSpellValidationMessage('');
  }, [currentPlayer, showSpellsModal]);

  const handleRollDice = () => {
    if (
      !currentPlayer ||
      !currentPlayer.hasCommittedInitialSpells ||
      showDiceModal ||
      showSpellsModal ||
      showTurnModal ||
      currentDiceRoll !== null
    ) {
      return;
    }

    setShowDiceModal(true);
  };

  const handleDiceRollComplete = (diceRoll) => {
    if (!currentPlayer) {
      return;
    }

    setCurrentDiceRoll(diceRoll);

    if (currentPlayer.anywhereMode) {
      setHighlightedNodeIds(getAnywhereModeHighlightedNodeIds(gameSetup.board, currentPlayer.position));
      return;
    }

    setHighlightedNodeIds(
      getHighlightedNodeIds(gameSetup.board, currentPlayer.position, diceRoll, {
        blockedNodeIds: currentPlayer.hasLeftStartArea ? ['start-area'] : [],
      })
    );
  };

  const handleDiceSequenceComplete = () => {
    setShowDiceModal(false);
  };

  const handleSquareClick = (square) => {
    if (!currentPlayer || showDiceModal || showSpellsModal || showTurnModal || currentDiceRoll === null) {
      return;
    }

    const destinationNodeId = getMovementNodeIdFromCoordinates(square.x, square.y);
    const currentNodeId = getMovementNodeIdFromCoordinates(
      currentPlayer.position.x,
      currentPlayer.position.y
    );

    if (!highlightedNodeIds.includes(destinationNodeId)) {
      return;
    }

    const nextTurnIndex = (gameSetup.currentTurnIndex + 1) % gameSetup.turnOrder.length;
    const nextPlayerId = gameSetup.turnOrder[nextTurnIndex];
    const nextPlayer = gameSetup.players.find((player) => player.id === nextPlayerId) ?? null;
    const hasLeftStartArea =
      currentPlayer.hasLeftStartArea ||
      (currentNodeId === 'start-area' && destinationNodeId !== 'start-area');

    setPlayerPosition(
      currentPlayer.id,
      { x: square.x, y: square.y },
      {
        anywhereMode: false,
        hasLeftStartArea,
      }
    );
    setCurrentDiceRoll(null);
    setHighlightedNodeIds([]);
    advanceTurn();
    setShowTurnModal(Boolean(nextPlayer?.hasCommittedInitialSpells));
  };

  const handleSpellTokenDrop = (tokenId, destinationId) => {
    const movementResult = moveSpellTokenInDraft({
      destinationId,
      spellSlots: draftSpellSlots,
      tokenBag: draftTokenBag,
      tokenId,
    });

    if (!movementResult.didMove) {
      return;
    }

    setDraftTokenBag(movementResult.tokenBag);
    setDraftSpellSlots(movementResult.spellSlots);
    setSpellValidationMessage('');
  };

  const handleSpellCancelRequest = () => {
    if (isForcedSpellSetup) {
      return;
    }

    if (!hasUnsavedSpellChanges) {
      setShowSpellsModal(false);
      return;
    }

    setShowSpellCancelConfirmation(true);
  };

  const handleSpellSaveRequest = () => {
    if (!currentPlayer || !hasUnsavedSpellChanges) {
      return;
    }

    if (isForcedSpellSetup && draftTokenBag.length > 0) {
      setSpellValidationMessage('Place all 7 starting tokens into spell slots before saving.');
      return;
    }

    setShowSpellSaveConfirmation(true);
  };

  const handleConfirmSpellSave = () => {
    if (!currentPlayer) {
      return;
    }

    updatePlayerSpells(currentPlayer.id, {
      ...createCommittedSpellData({
        spellSlots: draftSpellSlots,
        tokenBag: draftTokenBag,
      }),
      hasCommittedInitialSpells: true,
    });
    setShowSpellSaveConfirmation(false);
    setShowSpellsModal(false);
    setSpellValidationMessage('');
  };

  const handleConfirmSpellCancel = () => {
    setShowSpellCancelConfirmation(false);
    setShowSpellsModal(false);
    setSpellValidationMessage('');
  };

  const renderPlayerPiece = ({ ariaLabel, className, height, player, style = {} }) => {
    const pieceImageSource = player ? getPieceImageSource(player.pieceImage) : '';

    if (pieceImageSource) {
      return (
        <img
          alt={ariaLabel}
          aria-label={ariaLabel}
          className={className}
          src={pieceImageSource}
          style={{ height, ...style }}
        />
      );
    }

    return player ? <span aria-label={ariaLabel}>{player.colour}</span> : null;
  };

  return (
    <main className="gameplay-layout">
      {gameSetup.board ? (
        <BoardGrid
          board={gameSetup.board}
          currentPlayerId={currentPlayer?.id ?? ''}
          highlightedColour={currentPlayer?.colour ?? ''}
          highlightedNodeIds={highlightedNodeIds}
          onSquareClick={handleSquareClick}
          players={gameSetup.players}
        />
      ) : null}

      <section aria-label="Gameplay panel" className="gameplay-sidebar">
        {currentPlayer ? (
          <div className="gameplay-current-player-summary">
            {renderPlayerPiece({
              ariaLabel: 'Current player piece',
              className: 'gameplay-current-player-piece',
              height: '150px',
              player: currentPlayer,
              style: {
                alignSelf: 'flex-start',
                width: 'auto',
              },
            })}
            <HealthBar
              currentHealth={currentPlayer.currentHealth}
              maxHealth={currentPlayer.maxHealth}
            />
          </div>
        ) : (
          <p>Preparing turn order.</p>
        )}

        <button
          type="button"
          disabled={
            !currentPlayer?.hasCommittedInitialSpells ||
            showDiceModal ||
            showSpellsModal ||
            showTurnModal ||
            currentDiceRoll !== null
          }
          onClick={handleRollDice}
        >
          Roll Dice
        </button>

        <button
          disabled={!currentPlayer || showDiceModal || showSpellsModal || showTurnModal}
          type="button"
          onClick={() => setShowSpellsModal(true)}
        >
          Spells
        </button>

        {currentPlayer?.hasCommittedInitialSpells ? (
          <CommittedSpellSlots spellSlots={currentPlayer.spellSlots} />
        ) : null}
      </section>

      <SpellsModal
        currentPlayer={currentPlayer}
        draftSpellSlots={draftSpellSlots}
        draftTokenBag={draftTokenBag}
        isForcedSetup={isForcedSpellSetup}
        isOpen={showSpellsModal}
        onCancel={handleSpellCancelRequest}
        onSave={handleSpellSaveRequest}
        isSaveDisabled={!hasUnsavedSpellChanges}
        onTokenDrop={handleSpellTokenDrop}
        validationMessage={spellValidationMessage}
      />

      <Modal
        actions={
          <>
            <button type="button" onClick={handleConfirmSpellCancel}>
              Yes
            </button>
            <button type="button" onClick={() => setShowSpellCancelConfirmation(false)}>
              No
            </button>
          </>
        }
        ariaLabel="Cancel spells confirmation"
        isOpen={showSpellCancelConfirmation}
      >
        <p>Are you sure you want to cancel? All changes to your spell slots will be lost</p>
      </Modal>

      <Modal
        actions={
          <>
            <button type="button" onClick={handleConfirmSpellSave}>
              Yes
            </button>
            <button type="button" onClick={() => setShowSpellSaveConfirmation(false)}>
              No
            </button>
          </>
        }
        ariaLabel="Save spells confirmation"
        isOpen={showSpellSaveConfirmation}
      >
        <p>
          Are you sure you want to commit your tokens to these spell slots? This cannot be changed
          without using potions once they are saved.
        </p>
      </Modal>

      <Modal
        ariaLabel="Dice result"
        isOpen={showDiceModal}
      >
        {currentPlayer?.anywhereMode ? <p>Anywhere Mode</p> : null}
        <DiceRoll
          mode="temporary"
          onRollComplete={handleDiceRollComplete}
          onSequenceComplete={handleDiceSequenceComplete}
        />
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
          {renderPlayerPiece({
            ariaLabel: 'Turn change player piece',
            className: 'turn-change-player-piece',
            height: '150px',
            player: currentPlayer,
          })}
        </Modal>
      ) : null}
    </main>
  );
}

export default GameplayPage;
