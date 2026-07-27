import { useEffect, useState } from 'react';
import { POTION_DEFINITIONS } from '../data/potions';
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
import HeavyWeightDiceResult from '../features/potions/HeavyWeightDiceResult';
import HealingPotionAnimation from '../features/potions/HealingPotionAnimation';
import MultiDiceRoll from '../features/potions/MultiDiceRoll';
import PotionUseConfirmationModal from '../features/potions/PotionUseConfirmationModal';
import RollChoiceModal from '../features/potions/RollChoiceModal';
import StormMasterResultModal from '../features/potions/StormMasterResultModal';
import BuyAndSellModal from '../features/potions/BuyAndSellModal';
import CauldronChoiceModal from '../features/potions/CauldronChoiceModal';
import CopyPasteModal from '../features/potions/CopyPasteModal';
import DevineChanceResultModal from '../features/potions/DevineChanceResultModal';
import OtherPlayerChooser from '../features/potions/OtherPlayerChooser';
import TokensmithModal from '../features/potions/TokensmithModal';
import TroublemakerResultModal from '../features/potions/TroublemakerResultModal';
import { createCopyPasteDuplicate } from '../features/potions/copyPaste';
import { isHealingPotion } from '../features/potions/potionUsage';
import {
  blocksBoardPotionUse,
  getHeavyWeightBoardRoll,
  isTargetPlayerPotion,
} from '../features/potions/targetPlayerPotions';
import { canAddTokenToBag } from '../features/debug/tokenBagAdmin';
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
    clearPlayerBoardDiceEffect,
    clearPlayerForcedRoll,
    completeStormMasterForcedTurn,
    completeBuyAndSell,
    currentPlayer,
    dismissDevineChanceResult,
    dismissTroublemakerResult,
    dismissMiniGameReturnNotice,
    dismissNextTurnModal,
    gameSetup,
    initializeBoard,
    initializeTurnOrder,
    markPlayerTokenBagSeen,
    miniGameReturnNotice,
    pendingNextTurnModal,
    setPlayerPosition,
    updatePlayerSpells,
    consumePlayerPotion,
    resolveCopyPastePotion,
    resolveBuyAndSellPotion,
    resolveCauldronChoice,
    resolveDevineChanceRoll,
    resolveStormMasterRoll,
    resolveTargetPlayerPotion,
    resolveTroublemakerRoll,
    resolveTokensmithPotion,
    startBuyAndSell,
    startCauldronChoice,
    startStormMasterBlockedTurn,
  } = useGameSetup();
  const [currentDiceRoll, setCurrentDiceRoll] = useState(null);
  const [diceCountForCurrentRoll, setDiceCountForCurrentRoll] = useState(1);
  const [draftSpellSlots, setDraftSpellSlots] = useState([]);
  const [draftTokenBag, setDraftTokenBag] = useState([]);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState([]);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showSpellsModal, setShowSpellsModal] = useState(false);
  const [isRedoMode, setIsRedoMode] = useState(false);
  const [showSpellCancelConfirmation, setShowSpellCancelConfirmation] = useState(false);
  const [showSpellSaveConfirmation, setShowSpellSaveConfirmation] = useState(false);
  const [spellValidationMessage, setSpellValidationMessage] = useState('');
  const [mergeSaveDraft, setMergeSaveDraft] = useState(null);
  const [pendingPotionUse, setPendingPotionUse] = useState(null);
  const [pendingBuyAndSellUse, setPendingBuyAndSellUse] = useState(null);
  const [pendingCopyPasteUse, setPendingCopyPasteUse] = useState(null);
  const [pendingCopyPasteDuplicate, setPendingCopyPasteDuplicate] = useState(null);
  const [pendingRollChoiceUse, setPendingRollChoiceUse] = useState(null);
  const [pendingTargetPlayerPotionUse, setPendingTargetPlayerPotionUse] =
    useState(null);
  const [pendingTokensmithUse, setPendingTokensmithUse] = useState(null);
  const [showHealingPotionAnimation, setShowHealingPotionAnimation] = useState(false);
  const currentLanguage = getGameplayLanguage(currentPlayer?.language);
  const gameplayTranslations = getGameplayTranslations(currentLanguage);
  const caveMiniGameTranslations = getCaveMiniGameTranslations(currentLanguage);
  const riverMiniGameTranslations = getRiverMiniGameTranslations(currentLanguage);
  const spellAssignmentTranslations = getSpellAssignmentTranslations(currentLanguage);
  const potionUsageTranslations = getPotionUsageTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const isForcedSpellSetup = Boolean(currentPlayer && !currentPlayer.hasCommittedInitialSpells);
  const showSpellsNotification = Boolean(
    currentPlayer?.hasUnseenTokenBagTokens &&
      currentPlayer.tokenBag?.length
  );
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
  const validationSpellSlots = isRedoMode
    ? createCommittedSpellData({
        spellSlots: draftSpellSlots,
        tokenBag: draftTokenBag,
      }).spellSlots
    : draftSpellSlots;
  const overCapacityColumns = getOverCapacityColumnNumbers(
    validationSpellSlots,
    currentPlayer?.mergedColumns
  );
  const capacityValidationMessage =
    overCapacityColumns.length > 0
      ? spellAssignmentTranslations.overCapacity(overCapacityColumns)
      : '';
  const isSpellSaveDisabled = isForcedSpellSetup
    ? !isStartingSetupComplete || overCapacityColumns.length > 0
    : !hasUnsavedSpellChanges || overCapacityColumns.length > 0;
  const isHeavyWeightActive = currentPlayer?.activePotion?.id === 'heavy-weight';
  const isDevineChanceActive =
    currentPlayer?.activePotion?.id === 'devine-chance';
  const isTroublemakerActive =
    currentPlayer?.activePotion?.id === 'troublemaker';
  const nextBoardDiceCount = currentPlayer?.nextBoardDiceCount ?? 1;
  const devineChanceResult = gameSetup.devineChanceResult ?? null;
  const troublemakerResult = gameSetup.troublemakerResult ?? null;
  const stormMasterResult = gameSetup.stormMasterResult ?? null;
  const isStormMasterPending =
    gameSetup.stormMasterPendingPlayerId === currentPlayer?.id;
  const isStormMasterBlocked = Boolean(
    currentPlayer &&
      gameSetup.stormMasterEffect?.affectedPlayerIds.includes(currentPlayer.id)
  );
  const troublemakerLosingPlayer = gameSetup.players.find(
    ({ id }) => id === troublemakerResult?.losingPlayerId
  );
  const buyAndSellTransaction = gameSetup.buyAndSellTransaction ?? null;
  const cauldronChoiceState = gameSetup.cauldronChoiceState ?? null;
  const cauldronChoices =
    cauldronChoiceState?.potionIds
      .map((potionId) =>
        POTION_DEFINITIONS.find(({ id }) => id === potionId)
      )
      .filter(Boolean) ?? [];

  const handleConfirmPotionUse = () => {
    if (pendingPotionUse) {
      if (pendingPotionUse.potion.id === 'cauldron') {
        startCauldronChoice(
          pendingPotionUse.playerId,
          pendingPotionUse.potionIndex
        );
        setPendingPotionUse(null);
        return;
      }

      if (pendingPotionUse.potion.id === 'buy-and-sell') {
        setPendingBuyAndSellUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      if (pendingPotionUse.potion.id === 'roll-choice') {
        setPendingRollChoiceUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      if (pendingPotionUse.potion.id === 'copy-and-paste') {
        setPendingCopyPasteUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      if (pendingPotionUse.potion.id === 'tokensmith') {
        setPendingTokensmithUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      if (isTargetPlayerPotion(pendingPotionUse.potion)) {
        setPendingTargetPlayerPotionUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      if (pendingPotionUse.potion.id === 'redo') {
        consumePlayerPotion(
          pendingPotionUse.playerId,
          pendingPotionUse.potionIndex,
          'board'
        );
        markPlayerTokenBagSeen(pendingPotionUse.playerId);
        setIsRedoMode(true);
        setShowSpellsModal(true);
        setPendingPotionUse(null);
        return;
      }

      consumePlayerPotion(
        pendingPotionUse.playerId,
        pendingPotionUse.potionIndex,
        'board'
      );

      if (isHealingPotion(pendingPotionUse.potion)) {
        setShowHealingPotionAnimation(true);
      }
    }

    setPendingPotionUse(null);
  };

  const handleSelectRollChoice = (value) => {
    if (pendingRollChoiceUse) {
      consumePlayerPotion(
        pendingRollChoiceUse.playerId,
        pendingRollChoiceUse.potionIndex,
        'board',
        { forcedRollValue: value }
      );
    }

    setPendingRollChoiceUse(null);
  };

  const closeCopyPasteModal = () => {
    setPendingCopyPasteUse(null);
    setPendingCopyPasteDuplicate(null);
  };

  const closeBuyAndSellModal = () => {
    setPendingBuyAndSellUse(null);
  };

  const handleDiscardBuyAndSellTokens = (
    selectedTokenIds,
    rewardTokenTypes
  ) => {
    if (!pendingBuyAndSellUse) {
      return;
    }

    startBuyAndSell(
      pendingBuyAndSellUse.playerId,
      pendingBuyAndSellUse.potionIndex,
      selectedTokenIds,
      rewardTokenTypes
    );
  };

  const handleChooseBuyAndSellReward = (tokenType) => {
    const playerId =
      buyAndSellTransaction?.playerId ?? pendingBuyAndSellUse?.playerId;

    if (playerId) {
      resolveBuyAndSellPotion(playerId, tokenType);
    }
  };

  const handleCompleteBuyAndSell = () => {
    const playerId =
      buyAndSellTransaction?.playerId ?? pendingBuyAndSellUse?.playerId;

    if (playerId) {
      completeBuyAndSell(playerId);
    }

    setPendingBuyAndSellUse(null);
  };

  const handleChooseCauldronPotion = (potion) => {
    if (cauldronChoiceState) {
      resolveCauldronChoice(cauldronChoiceState.playerId, potion.id);
    }
  };

  const handleDuplicateToken = (token) => {
    if (!pendingCopyPasteUse || !currentPlayer) {
      return;
    }

    if (canAddTokenToBag(currentPlayer.tokenBag)) {
      resolveCopyPastePotion(
        pendingCopyPasteUse.playerId,
        pendingCopyPasteUse.potionIndex,
        token.id
      );
      closeCopyPasteModal();
      return;
    }

    setPendingCopyPasteDuplicate({
      sourceTokenId: token.id,
      token: createCopyPasteDuplicate(currentPlayer, token),
    });
  };

  const handleDiscardCopyPasteDuplicate = () => {
    if (!pendingCopyPasteUse || !pendingCopyPasteDuplicate) {
      return;
    }

    resolveCopyPastePotion(
      pendingCopyPasteUse.playerId,
      pendingCopyPasteUse.potionIndex,
      pendingCopyPasteDuplicate.sourceTokenId,
      { discardDuplicate: true }
    );
    closeCopyPasteModal();
  };

  const handleReplaceTokenWithDuplicate = (token) => {
    if (!pendingCopyPasteUse || !pendingCopyPasteDuplicate) {
      return;
    }

    resolveCopyPastePotion(
      pendingCopyPasteUse.playerId,
      pendingCopyPasteUse.potionIndex,
      pendingCopyPasteDuplicate.sourceTokenId,
      { replacedTokenId: token.id }
    );
    closeCopyPasteModal();
  };

  const handleConfirmTokensmith = (tokenId) => {
    if (pendingTokensmithUse) {
      resolveTokensmithPotion(
        pendingTokensmithUse.playerId,
        pendingTokensmithUse.potionIndex,
        tokenId
      );
    }

    setPendingTokensmithUse(null);
  };

  const handleChooseTargetPlayer = (targetPlayer) => {
    if (pendingTargetPlayerPotionUse) {
      resolveTargetPlayerPotion(
        pendingTargetPlayerPotionUse.playerId,
        pendingTargetPlayerPotionUse.potionIndex,
        targetPlayer.id
      );
    }

    setPendingTargetPlayerPotionUse(null);
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
      markPlayerTokenBagSeen(currentPlayer.id);
      setShowSpellsModal(true);
    }
  }, [
    currentPlayer,
    isForcedSpellSetup,
    markPlayerTokenBagSeen,
    pendingNextTurnModal,
  ]);

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
      stormMasterResult ||
      currentDiceRoll !== null
    ) {
      return;
    }

    setDiceCountForCurrentRoll(nextBoardDiceCount);
    setShowDiceModal(true);
  };

  const handleOpenSpellsModal = () => {
    if (!currentPlayer) {
      return;
    }

    markPlayerTokenBagSeen(currentPlayer.id);
    setIsRedoMode(false);
    setShowSpellsModal(true);
  };

  const prepareBoardMovement = (diceRoll) => {
    if (currentPlayer.anywhereMode) {
      setHighlightedNodeIds(
        getAnywhereModeHighlightedNodeIds(
          gameSetup.board,
          currentPlayer.position
        )
      );
      return;
    }

    setHighlightedNodeIds(
      getHighlightedNodeIds(
        gameSetup.board,
        currentPlayer.position,
        diceRoll,
        {
          blockedNodeIds: currentPlayer.hasLeftStartArea
            ? ['start-area']
            : [],
        }
      )
    );
  };

  const continueAfterRollDependentEffects = (diceRoll) => {
    if (!currentPlayer) {
      return;
    }

    if (isStormMasterPending) {
      resolveStormMasterRoll(currentPlayer.id, diceRoll);

      if (diceRoll % 2 !== 0) {
        return;
      }
    }

    if (isStormMasterBlocked) {
      startStormMasterBlockedTurn(currentPlayer.id, diceRoll);
      return;
    }

    prepareBoardMovement(diceRoll);
  };

  const handleDiceRollComplete = (originalDiceRoll) => {
    if (!currentPlayer) {
      return;
    }

    const diceRoll = isHeavyWeightActive
      ? getHeavyWeightBoardRoll(originalDiceRoll)
      : originalDiceRoll;

    setCurrentDiceRoll(diceRoll);

    if (currentPlayer.nextForcedRoll) {
      clearPlayerForcedRoll(currentPlayer.id);
    }

    if (diceCountForCurrentRoll > 1) {
      clearPlayerBoardDiceEffect(currentPlayer.id);
    }

    if (isTroublemakerActive) {
      resolveTroublemakerRoll(currentPlayer.id, originalDiceRoll);
      return;
    }

    if (isDevineChanceActive) {
      resolveDevineChanceRoll(currentPlayer.id, originalDiceRoll);
      return;
    }

    continueAfterRollDependentEffects(diceRoll);
  };

  const handleDiceSequenceComplete = () => {
    setShowDiceModal(false);
    setDiceCountForCurrentRoll(1);
  };

  const handleSquareClick = (square) => {
    if (
      !currentPlayer ||
      showDiceModal ||
      showSpellsModal ||
      pendingNextTurnModal ||
      devineChanceResult ||
      stormMasterResult ||
      troublemakerResult ||
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

  const handleContinueTroublemakerResult = () => {
    if (!currentPlayer || currentDiceRoll === null || !troublemakerResult) {
      return;
    }

    dismissTroublemakerResult(currentPlayer.id);
    continueAfterRollDependentEffects(currentDiceRoll);
  };

  const handleContinueDevineChanceResult = () => {
    if (!currentPlayer || currentDiceRoll === null || !devineChanceResult) {
      return;
    }

    dismissDevineChanceResult(currentPlayer.id);
    continueAfterRollDependentEffects(currentDiceRoll);
  };

  const handleContinueStormMasterResult = () => {
    if (!currentPlayer || !stormMasterResult) {
      return;
    }

    setCurrentDiceRoll(null);
    setHighlightedNodeIds([]);
    completeStormMasterForcedTurn(currentPlayer.id);
  };

  const handleSpellTokenDrop = (tokenId, destinationId) => {
    const movementResult = moveSpellTokenInDraft({
      allowCommittedTokenMovement: isRedoMode,
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
      setIsRedoMode(false);
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
    setIsRedoMode(false);
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
    setIsRedoMode(false);
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
            <div className="gameplay-current-player-image">
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
              {showHealingPotionAnimation ? (
                <HealingPotionAnimation
                  onAnimationEnd={() => setShowHealingPotionAnimation(false)}
                />
              ) : null}
            </div>
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
            devineChanceResult ||
            stormMasterResult ||
            troublemakerResult ||
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
            onClick={handleOpenSpellsModal}
          >
            {gameplayTranslations.spells}
          </Button>
          {showSpellsNotification ? (
            <span
              aria-label="New token bag tokens available"
              className={`spells-button-notification ${languageClassName}`}
            >
              {gameplayTranslations.spellsNew}
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
            currentPlayer?.turnPotionUsage?.boardPotionUsedThisTurn ||
              blocksBoardPotionUse(currentPlayer?.activePotion)
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
      <RollChoiceModal
        isOpen={Boolean(pendingRollChoiceUse)}
        language={currentLanguage}
        onSelect={handleSelectRollChoice}
      />
      <BuyAndSellModal
        isOpen={Boolean(
          pendingBuyAndSellUse || buyAndSellTransaction
        )}
        language={currentLanguage}
        onChoose={handleChooseBuyAndSellReward}
        onClose={closeBuyAndSellModal}
        onComplete={handleCompleteBuyAndSell}
        onDiscard={handleDiscardBuyAndSellTokens}
        tokenBag={currentPlayer?.tokenBag ?? []}
        transaction={buyAndSellTransaction}
      />
      <CauldronChoiceModal
        choices={cauldronChoices}
        isOpen={Boolean(cauldronChoiceState)}
        language={currentLanguage}
        onChoose={handleChooseCauldronPotion}
      />
      <CopyPasteModal
        duplicateToken={pendingCopyPasteDuplicate?.token}
        isOpen={Boolean(pendingCopyPasteUse)}
        language={currentLanguage}
        onClose={closeCopyPasteModal}
        onDiscardDuplicate={handleDiscardCopyPasteDuplicate}
        onDuplicate={handleDuplicateToken}
        onReplaceToken={handleReplaceTokenWithDuplicate}
        tokenBag={currentPlayer?.tokenBag ?? []}
      />
      <TokensmithModal
        isOpen={Boolean(pendingTokensmithUse)}
        language={currentLanguage}
        mergedColumns={currentPlayer?.mergedColumns ?? []}
        onClose={() => setPendingTokensmithUse(null)}
        onConfirm={handleConfirmTokensmith}
        spellSlots={currentPlayer?.spellSlots ?? []}
        tokenBag={currentPlayer?.tokenBag ?? []}
      />
      <OtherPlayerChooser
        currentPlayerId={currentPlayer?.id ?? ''}
        isOpen={Boolean(pendingTargetPlayerPotionUse)}
        language={currentLanguage}
        onChoosePlayer={handleChooseTargetPlayer}
        players={gameSetup.players}
      />
      <TroublemakerResultModal
        isOpen={Boolean(troublemakerResult) && !showDiceModal}
        language={troublemakerLosingPlayer?.language ?? currentLanguage}
        onContinue={handleContinueTroublemakerResult}
        player={troublemakerLosingPlayer}
        removedTokens={troublemakerResult?.removedTokens ?? []}
      />
      <DevineChanceResultModal
        healedGroup={devineChanceResult?.healedGroup}
        isOpen={Boolean(devineChanceResult) && !showDiceModal}
        language={currentLanguage}
        onContinue={handleContinueDevineChanceResult}
      />
      <StormMasterResultModal
        isOpen={Boolean(stormMasterResult) && !showDiceModal}
        language={currentLanguage}
        onContinue={handleContinueStormMasterResult}
        resultType={stormMasterResult?.resultType}
      />

      <SpellsModal
        currentPlayer={currentPlayer}
        draftSpellSlots={draftSpellSlots}
        draftTokenBag={draftTokenBag}
        isForcedSetup={isForcedSpellSetup}
        isOpen={showSpellsModal}
        isRedoMode={isRedoMode}
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
        {diceCountForCurrentRoll > 1 ? (
          <MultiDiceRoll
            aggregateResultText={
              isHeavyWeightActive
                ? (total) => (
                    <HeavyWeightDiceResult
                      language={currentLanguage}
                      roll={getHeavyWeightBoardRoll(total)}
                    />
                  )
                : null
            }
            diceCount={diceCountForCurrentRoll}
            forcedFirstResult={currentPlayer?.nextForcedRoll?.value ?? null}
            onRollComplete={handleDiceRollComplete}
            onSequenceComplete={handleDiceSequenceComplete}
            resultDurationExtensionMs={isHeavyWeightActive ? 1000 : 0}
          />
        ) : (
          <DiceRoll
            forcedResult={currentPlayer?.nextForcedRoll?.value ?? null}
            mode="temporary"
            onRollComplete={handleDiceRollComplete}
            onSequenceComplete={handleDiceSequenceComplete}
            resultDurationExtensionMs={isHeavyWeightActive ? 1000 : 0}
            resultText={
              isHeavyWeightActive
                ? (originalRoll) => (
                    <HeavyWeightDiceResult
                      language={currentLanguage}
                      roll={getHeavyWeightBoardRoll(originalRoll)}
                    />
                  )
                : null
            }
          />
        )}
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
