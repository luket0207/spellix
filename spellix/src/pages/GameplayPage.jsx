import { useEffect, useState } from 'react';
import Button from '../components/common/Button/Button';
import DiceRoll from '../components/dice/DiceRoll';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
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
import ActivePotionSection from '../features/potions/ActivePotionSection';
import PotionUseConfirmationModal from '../features/potions/PotionUseConfirmationModal';
import CommittedSpellSlots from '../features/spells/CommittedSpellSlots';
import SpellMergeConfirmationModal from '../features/spells/SpellMergeConfirmationModal';
import SpellsModal from '../features/spells/SpellsModal';
import {
  createCommittedSpellData,
  hasDraftSpellChanges,
  isStartingSpellSetupComplete,
  moveSpellTokenInDraft,
} from '../features/spells/spellSetup';
import {
  applyColumnMerge,
  findNextColumnMerge,
  getOverCapacityColumnNumbers,
} from '../features/spells/nonBattleSpellEffects';
import {
  getCaveMiniGameTranslations,
  getGameplayLanguage,
  getGameplayTranslations,
  getNextTurnMessage,
  getPotionUsageTranslations,
  getRiverMiniGameTranslations,
  getSpellAssignmentTranslations,
} from '../i18n/translations';
import './GameplayPage.css';

function GameplayPage() {
  const {
    advanceTurn,
    currentPlayer,
    dismissMiniGameReturnNotice,
    dismissNextTurnModal,
    gameSetup,
    initializeBoard,
    initializeTurnOrder,
    miniGameReturnNotice,
    pendingNextTurnModal,
    setPlayerPosition,
    updatePlayerSpells,
    consumePlayerPotion,
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
  const [mergeSaveDraft, setMergeSaveDraft] = useState(null);
  const [pendingPotionUse, setPendingPotionUse] = useState(null);
  const currentLanguage = getGameplayLanguage(currentPlayer?.language);
  const gameplayTranslations = getGameplayTranslations(currentLanguage);
  const caveMiniGameTranslations = getCaveMiniGameTranslations(currentLanguage);
  const riverMiniGameTranslations = getRiverMiniGameTranslations(currentLanguage);
  const spellAssignmentTranslations = getSpellAssignmentTranslations(currentLanguage);
  const potionUsageTranslations = getPotionUsageTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const isForcedSpellSetup = Boolean(currentPlayer && !currentPlayer.hasCommittedInitialSpells);
  const showSpellsNotification = Boolean(currentPlayer?.tokenBag?.length);
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
  const overCapacityColumns = getOverCapacityColumnNumbers(
    draftSpellSlots,
    currentPlayer?.mergedColumns
  );
  const capacityValidationMessage =
    overCapacityColumns.length > 0
      ? spellAssignmentTranslations.overCapacity(overCapacityColumns)
      : '';
  const isSpellSaveDisabled = isForcedSpellSetup
    ? !isStartingSetupComplete || overCapacityColumns.length > 0
    : !hasUnsavedSpellChanges || overCapacityColumns.length > 0;

  const handleConfirmPotionUse = () => {
    if (pendingPotionUse) {
      consumePlayerPotion(
        pendingPotionUse.playerId,
        pendingPotionUse.potionIndex,
        'board'
      );
    }

    setPendingPotionUse(null);
  };

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
    if (currentPlayer && isForcedSpellSetup && !pendingNextTurnModal) {
      setShowSpellsModal(true);
    }
  }, [currentPlayer, isForcedSpellSetup, pendingNextTurnModal]);

  useEffect(() => {
    if (!showSpellsModal || !currentPlayer) {
      return;
    }

    setDraftTokenBag(cloneTokenBag(currentPlayer.tokenBag));
    setDraftSpellSlots(cloneSpellSlots(currentPlayer.spellSlots));
    setShowSpellCancelConfirmation(false);
    setShowSpellSaveConfirmation(false);
    setSpellValidationMessage('');
    setMergeSaveDraft(null);
  }, [currentPlayer, showSpellsModal]);

  const handleRollDice = () => {
    if (
      !currentPlayer ||
      !currentPlayer.hasCommittedInitialSpells ||
      showDiceModal ||
      showSpellsModal ||
      pendingNextTurnModal ||
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
    if (
      !currentPlayer ||
      showDiceModal ||
      showSpellsModal ||
      pendingNextTurnModal ||
      currentDiceRoll === null
    ) {
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
  };

  const handleSpellTokenDrop = (tokenId, destinationId) => {
    const movementResult = moveSpellTokenInDraft({
      destinationId,
      mergedColumns: currentPlayer.mergedColumns,
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

    if (overCapacityColumns.length > 0) {
      setSpellValidationMessage(capacityValidationMessage);
      return;
    }

    const mergedColumns = currentPlayer.mergedColumns ?? [];
    const columnMergesUsed = currentPlayer.columnMergesUsed ?? 0;
    const pendingMerge = findNextColumnMerge({
      columnMergesUsed,
      mergedColumns,
      spellSlots: draftSpellSlots,
    });

    if (pendingMerge) {
      setMergeSaveDraft({
        columnMergesUsed,
        mergedColumns,
        pendingMerge,
        spellSlots: draftSpellSlots,
        tokenBag: draftTokenBag,
      });
      return;
    }

    setShowSpellSaveConfirmation(true);
  };

  const commitSpellSave = ({
    columnMergesUsed = currentPlayer?.columnMergesUsed ?? 0,
    mergedColumns = currentPlayer?.mergedColumns ?? [],
    spellSlots = draftSpellSlots,
    tokenBag = draftTokenBag,
  } = {}) => {
    if (!currentPlayer) {
      return;
    }

    updatePlayerSpells(currentPlayer.id, {
      ...createCommittedSpellData({
        spellSlots,
        tokenBag,
      }),
      columnMergesUsed,
      hasCommittedInitialSpells: true,
      mergedColumns,
    });
    setShowSpellSaveConfirmation(false);
    setMergeSaveDraft(null);
    setShowSpellsModal(false);
    setSpellValidationMessage('');
  };

  const handleConfirmSpellSave = () => {
    commitSpellSave();
  };

  const handleConfirmColumnMerge = () => {
    if (!mergeSaveDraft?.pendingMerge) {
      return;
    }

    const spellSlots = applyColumnMerge(
      mergeSaveDraft.spellSlots,
      mergeSaveDraft.pendingMerge
    );
    const mergedColumns = [
      ...mergeSaveDraft.mergedColumns,
      mergeSaveDraft.pendingMerge,
    ];
    const columnMergesUsed = mergeSaveDraft.columnMergesUsed + 1;
    const pendingMerge = findNextColumnMerge({
      columnMergesUsed,
      mergedColumns,
      spellSlots,
    });

    if (pendingMerge) {
      setMergeSaveDraft({
        ...mergeSaveDraft,
        columnMergesUsed,
        mergedColumns,
        pendingMerge,
        spellSlots,
      });
      return;
    }

    commitSpellSave({
      columnMergesUsed,
      mergedColumns,
      spellSlots,
      tokenBag: mergeSaveDraft.tokenBag,
    });
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
      <MagicalNightSky />
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
            pendingNextTurnModal ||
            currentDiceRoll !== null
          }
          onClick={handleRollDice}
        >
          {gameplayTranslations.rollDice}
        </Button>

        <div className="spells-button-wrapper">
          <Button
            className={languageClassName}
            disabled={!currentPlayer || showDiceModal || showSpellsModal || pendingNextTurnModal}
            type="button"
            onClick={() => setShowSpellsModal(true)}
          >
            {gameplayTranslations.spells}
          </Button>
          {showSpellsNotification ? (
            <span
              aria-label="Uncommitted tokens available"
              className="spells-button-notification"
            >
              !
            </span>
          ) : null}
        </div>

        {currentPlayer?.hasCommittedInitialSpells ? (
          <CommittedSpellSlots
            language={currentLanguage}
            mergedColumns={currentPlayer.mergedColumns}
            spellSlots={currentPlayer.spellSlots}
            title={gameplayTranslations.spells}
            titleClassName={languageClassName}
          />
        ) : null}

        <PotionList
          context="board"
          disabled={Boolean(
            currentPlayer?.turnPotionUsage?.boardPotionUsedThisTurn
          )}
          language={currentLanguage}
          languageClassName={languageClassName}
          onUsePotion={(potion, potionIndex) =>
            setPendingPotionUse({
              playerId: currentPlayer.id,
              potion,
              potionIndex,
            })
          }
          potions={currentPlayer?.potions ?? []}
          title={gameplayTranslations.potions}
          useText={potionUsageTranslations.use}
        />
        <ActivePotionSection
          activePotion={currentPlayer?.activePotion}
          language={currentLanguage}
          languageClassName={languageClassName}
          title={potionUsageTranslations.activePotionTitle}
        />
      </section>

      <PotionUseConfirmationModal
        isOpen={Boolean(pendingPotionUse)}
        language={currentLanguage}
        onCancel={() => setPendingPotionUse(null)}
        onConfirm={handleConfirmPotionUse}
        potion={pendingPotionUse?.potion}
      />

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
        validationMessage={spellValidationMessage || capacityValidationMessage}
      />

      <SpellMergeConfirmationModal
        isOpen={Boolean(mergeSaveDraft?.pendingMerge)}
        language={currentLanguage}
        merge={mergeSaveDraft?.pendingMerge}
        onCancel={() => setMergeSaveDraft(null)}
        onConfirm={handleConfirmColumnMerge}
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
        <p className={`larger-text ${languageClassName}`}>{spellAssignmentTranslations.cancelConfirmation}</p>
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
              onClick={dismissNextTurnModal}
            >
              OK
            </Button>
          }
          ariaLabel="Turn change"
          isOpen={pendingNextTurnModal}
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

      <Modal
        actions={
          <Button type="button" variant="secondary" onClick={dismissMiniGameReturnNotice}>
            OK
          </Button>
        }
        ariaLabel="Mini game result"
        isOpen={Boolean(miniGameReturnNotice)}
      >
        <p className={`larger-text ${languageClassName}`}>
          {miniGameReturnNotice?.type === 'river'
            ? riverMiniGameTranslations.returnNotice
            : miniGameReturnNotice?.type === 'cave'
              ? caveMiniGameTranslations.rollAgainNotice
              : miniGameReturnNotice?.message}
        </p>
      </Modal>
    </main>
  );
}

export default GameplayPage;
