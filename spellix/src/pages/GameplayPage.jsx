import { useEffect, useState } from 'react';
import Button from '../components/common/Button/Button';
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
import PotionList from '../features/potions/PotionList';
import CommittedSpellSlots from '../features/spells/CommittedSpellSlots';
import SpellsModal from '../features/spells/SpellsModal';
import {
  createCommittedSpellData,
  hasDraftSpellChanges,
  isStartingSpellSetupComplete,
  moveSpellTokenInDraft,
} from '../features/spells/spellSetup';
import {
  getGameplayLanguage,
  getGameplayTranslations,
  getNextTurnMessage,
  getSpellAssignmentTranslations,
} from '../i18n/translations';
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
  const currentLanguage = getGameplayLanguage(currentPlayer?.language);
  const gameplayTranslations = getGameplayTranslations(currentLanguage);
  const spellAssignmentTranslations = getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
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
  const isStartingSetupComplete = isStartingSpellSetupComplete({
    spellSlots: draftSpellSlots,
    tokenBag: draftTokenBag,
  });
  const isSpellSaveDisabled = isForcedSpellSetup
    ? !isStartingSetupComplete
    : !hasUnsavedSpellChanges;

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
    if (!currentPlayer || (!isForcedSpellSetup && !hasUnsavedSpellChanges)) {
      return;
    }

    if (isForcedSpellSetup && !isStartingSetupComplete) {
      setSpellValidationMessage(spellAssignmentTranslations.startingTokenWarning);
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
                alignSelf: 'center',
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

        <Button
          className={languageClassName}
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
          {gameplayTranslations.rollDice}
        </Button>

        <Button
          className={languageClassName}
          disabled={!currentPlayer || showDiceModal || showSpellsModal || showTurnModal}
          type="button"
          onClick={() => setShowSpellsModal(true)}
        >
          {gameplayTranslations.spells}
        </Button>

        {currentPlayer?.hasCommittedInitialSpells ? (
          <CommittedSpellSlots
            language={currentLanguage}
            spellSlots={currentPlayer.spellSlots}
            title={gameplayTranslations.spells}
            titleClassName={languageClassName}
          />
        ) : null}

        <PotionList
          language={currentLanguage}
          languageClassName={languageClassName}
          potions={currentPlayer?.potions ?? []}
          title={gameplayTranslations.potions}
        />
      </section>

      <SpellsModal
        currentPlayer={currentPlayer}
        draftSpellSlots={draftSpellSlots}
        draftTokenBag={draftTokenBag}
        isForcedSetup={isForcedSpellSetup}
        isOpen={showSpellsModal}
        onCancel={handleSpellCancelRequest}
        onSave={handleSpellSaveRequest}
        isSaveDisabled={isSpellSaveDisabled}
        onTokenDrop={handleSpellTokenDrop}
        validationMessage={spellValidationMessage}
      />

      <Modal
        actions={
          <>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={handleConfirmSpellCancel}
            >
              {spellAssignmentTranslations.yes}
            </Button>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={() => setShowSpellCancelConfirmation(false)}
            >
              {spellAssignmentTranslations.no}
            </Button>
          </>
        }
        ariaLabel="Cancel spells confirmation"
        isOpen={showSpellCancelConfirmation}
      >
        <p className={languageClassName}>{spellAssignmentTranslations.cancelConfirmation}</p>
      </Modal>

      <Modal
        actions={
          <>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={handleConfirmSpellSave}
            >
              {spellAssignmentTranslations.yes}
            </Button>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={() => setShowSpellSaveConfirmation(false)}
            >
              {spellAssignmentTranslations.no}
            </Button>
          </>
        }
        ariaLabel="Save spells confirmation"
        isOpen={showSpellSaveConfirmation}
      >
        <p className={`larger-text ${languageClassName}`}>{spellAssignmentTranslations.saveConfirmation}</p>
      </Modal>

      <Modal
        ariaLabel="Dice result"
        isOpen={showDiceModal}
        variant="dice"
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTurnModal(false)}
            >
              OK
            </Button>
          }
          ariaLabel="Turn change"
          isOpen={showTurnModal}
        >
          <div className="turn-change-modal-content">
          <h1 className={languageClassName}>
            {getNextTurnMessage(currentLanguage, currentPlayer.colour)}
          </h1>
          {renderPlayerPiece({
            ariaLabel: 'Turn change player piece',
            className: 'turn-change-player-piece',
            height: '200px',
            player: currentPlayer,
          })}
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default GameplayPage;
