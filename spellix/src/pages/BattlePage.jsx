import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faBolt,
  faGavel,
  faShield,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import DiceRoll from '../components/dice/DiceRoll';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import CommittedSpellSlotList from '../components/spells/CommittedSpellSlotList';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { getEnemyImageSource } from '../features/battle/enemyImages';
import DeathResult from '../features/death/DeathResult';
import { getFirstStartAreaPosition } from '../features/gameBoard/board';
import { getFeatureBackgroundSource } from '../features/gameBoard/featureBackgrounds';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import BattlePotionList from '../features/potions/BattlePotionList';
import HealingPotionAnimation from '../features/potions/HealingPotionAnimation';
import PotionUseConfirmationModal from '../features/potions/PotionUseConfirmationModal';
import RollChoiceModal from '../features/potions/RollChoiceModal';
import { isHealingPotion } from '../features/potions/potionUsage';
import {
  getBattleLossMessage,
  getBattleTitle,
  getBattleTurnMessage,
  getEnemyDisplayName,
  getGameplayLanguage,
  getGameplayTranslations,
  getMiniGameFailureTranslations,
  getPlayerColourDisplayName,
  getPotionUsageTranslations,
} from '../i18n/translations';
import './BattlePage.css';

const FREEZE_OVERLAY_ANIMATION_MS = 200;
const BATTLE_DICE_FADE_MS = 350;

function BattleActorImage({ children, frozen, frozenLabel, guard, guardAmountLabel, guardLabel, showWeakness, side }) {
  const [isFreezeOverlayMounted, setIsFreezeOverlayMounted] = useState(frozen);
  const [freezeAnimation, setFreezeAnimation] = useState(frozen ? 'enter' : null);

  useEffect(() => {
    if (frozen) {
      setIsFreezeOverlayMounted(true);
      setFreezeAnimation('enter');
      return undefined;
    }

    if (!isFreezeOverlayMounted) {
      return undefined;
    }

    setFreezeAnimation('exit');
    const timeoutId = window.setTimeout(() => {
      setIsFreezeOverlayMounted(false);
    }, FREEZE_OVERLAY_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [frozen, isFreezeOverlayMounted]);

  return (
    <div className={`battle-actor-image battle-actor-image--${side}`}>
      {children}
      {showWeakness ? (
        <FontAwesomeIcon
          aria-label="Weakness ban animation"
          className="battle-weakness-ban"
          icon={faBan}
        />
      ) : null}
      {guard > 0 ? (
        <span className="battle-guard-indicator">
          <FontAwesomeIcon
            aria-label={guardLabel}
            className="battle-guard-shield"
            icon={faShield}
            style={{ opacity: 0.6 }}
          />
          <span aria-label={guardAmountLabel} className="battle-guard-amount">
            {guard}
          </span>
        </span>
      ) : null}
      {isFreezeOverlayMounted ? (
        <FontAwesomeIcon
          aria-label={frozenLabel}
          className={`battle-freeze-indicator battle-freeze-indicator--${freezeAnimation}`}
          icon={faSnowflake}
          style={{ opacity: 0.6 }}
        />
      ) : null}
    </div>
  );
}

function BattlePage() {
  const navigate = useNavigate();
  const {
    activeBattle,
    advanceBattleTurn,
    advanceTurn,
    applyBattleEffect,
    applyBattleDiceResult,
    battleEnemy,
    battlePlayer,
    clearActiveBattle,
    clearPlayerForcedRoll,
    finalizeBattleEffects,
    gameSetup,
    resolveCosmicIntervention,
    resolveShieldsDown,
    resolveBattleFreezeCheck,
    setActiveBattlePhase,
    setPlayerHealth,
    setPlayerPosition,
    consumePlayerPotion,
  } = useGameSetup();
  const freezeCheckFadeTimeoutRef = useRef(null);
  const lastDiceRollRef = useRef(null);
  const turnTransitionTimeoutRef = useRef(null);
  const advanceBattleTurnRef = useRef(advanceBattleTurn);
  const applyBattleEffectRef = useRef(applyBattleEffect);
  const finalizeBattleEffectsRef = useRef(finalizeBattleEffects);
  const [activeBattleEffect, setActiveBattleEffect] = useState(null);
  const [closedTurnModalActor, setClosedTurnModalActor] = useState(null);
  const [enemyAutoRollRequestId, setEnemyAutoRollRequestId] = useState(0);
  const [forcedRollRequest, setForcedRollRequest] = useState(null);
  const [isBattleDiceHidden, setIsBattleDiceHidden] = useState(false);
  const [isBattleDiceRolling, setIsBattleDiceRolling] = useState(false);
  const [isBattleDiceSequenceComplete, setIsBattleDiceSequenceComplete] =
    useState(true);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [pendingPotionUse, setPendingPotionUse] = useState(null);
  const [pendingRollChoiceUse, setPendingRollChoiceUse] = useState(null);
  const [showHealingPotionAnimation, setShowHealingPotionAnimation] = useState(false);
  const hasBattleContext = Boolean(activeBattle && battleEnemy && battlePlayer);
  const isActiveBattle = Boolean(activeBattle?.phase === 'active' && battlePlayer);
  const [showTurnModal, setShowTurnModal] = useState(isActiveBattle);
  const currentLanguage = getGameplayLanguage(battlePlayer?.language);
  const gameplayTranslations = getGameplayTranslations(currentLanguage);
  const failureTranslations = getMiniGameFailureTranslations(currentLanguage);
  const potionUsageTranslations = getPotionUsageTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;

  advanceBattleTurnRef.current = advanceBattleTurn;
  applyBattleEffectRef.current = applyBattleEffect;
  finalizeBattleEffectsRef.current = finalizeBattleEffects;

  useEffect(() => {
    if (!hasBattleContext) {
      navigate('/gameplay', { replace: true });
    }
  }, [hasBattleContext, navigate]);

  useEffect(
    () => () => window.clearTimeout(freezeCheckFadeTimeoutRef.current),
    []
  );

  useEffect(() => {
    if (!isActiveBattle) {
      setClosedTurnModalActor(null);
      setShowTurnModal(false);
      return undefined;
    }

    const modalActor = activeBattle.currentBattleActor;

    setClosedTurnModalActor(null);
    setShowTurnModal(true);
    const timeoutId = window.setTimeout(() => {
      setClosedTurnModalActor(modalActor);
      setShowTurnModal(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [activeBattle?.currentBattleActor, isActiveBattle]);

  useEffect(() => {
    window.clearTimeout(turnTransitionTimeoutRef.current);

    if (!activeBattle?.isResolvingTurn) {
      setActiveBattleEffect(null);
      return undefined;
    }

    const supportedEffects = (activeBattle.pendingEffects ?? []).filter(
      ({ type }) =>
        type === 'redDamage' ||
        type === 'greenReduction' ||
        type === 'blueGuard' ||
        type === 'orangeCounter'
    );
    let effectIndex = 0;
    let previousEffect = null;

    const runNextEffect = () => {
      if (previousEffect) {
        applyBattleEffectRef.current(previousEffect);
        previousEffect = null;
      }

      if (effectIndex < supportedEffects.length) {
        previousEffect = supportedEffects[effectIndex];
        setActiveBattleEffect(previousEffect);
        effectIndex += 1;
        turnTransitionTimeoutRef.current = window.setTimeout(runNextEffect, 1000);
        return;
      }

      setActiveBattleEffect(null);
      finalizeBattleEffectsRef.current();

      turnTransitionTimeoutRef.current = window.setTimeout(() => {
        advanceBattleTurnRef.current();
      }, 1000);
    };

    runNextEffect();

    return () => {
      window.clearTimeout(turnTransitionTimeoutRef.current);
    };
  }, [activeBattle?.isResolvingTurn, activeBattle?.pendingEffects]);

  useEffect(() => {
    if (activeBattle?.phase === 'reward') {
      navigate('/reward');
    } else if (activeBattle?.phase === 'lost') {
      setShowLoseModal(true);
    } else if (activeBattle?.phase === 'wonGame') {
      navigate('/winner');
    }
  }, [activeBattle?.phase, navigate]);

  useEffect(() => {
    if (
      !isBattleDiceHidden ||
      !isBattleDiceSequenceComplete ||
      activeBattle?.isResolvingTurn ||
      activeBattle?.cosmicInterventionPending ||
      activeBattle?.shieldsDownPending ||
      activeBattle?.phase !== 'active'
    ) {
      return;
    }

    setIsBattleDiceHidden(false);
  }, [
    activeBattle?.cosmicInterventionPending,
    activeBattle?.isResolvingTurn,
    activeBattle?.phase,
    activeBattle?.shieldsDownPending,
    isBattleDiceHidden,
    isBattleDiceSequenceComplete,
  ]);

  if (!hasBattleContext) {
    return null;
  }

  const enemyImageSource = getEnemyImageSource(battleEnemy.imageFileName);
  const pieceImageSource = getPieceImageSource(battlePlayer.pieceImage);
  const enemyDisplayName = getEnemyDisplayName(currentLanguage, battleEnemy);
  const battleTitle = getBattleTitle(currentLanguage, battleEnemy);
  const isPlayerTurn = activeBattle.currentBattleActor !== 'enemy';
  const isFreezeCheck = isPlayerTurn ? activeBattle.playerFrozen : activeBattle.enemyFrozen;
  const isCosmicInterventionPending = Boolean(
    activeBattle.cosmicInterventionPending
  );
  const isShieldsDownPending = Boolean(activeBattle.shieldsDownPending);
  const isPotionAnimationPending =
    isCosmicInterventionPending || isShieldsDownPending;
  const isBattleDiceDisabled = Boolean(
    showTurnModal ||
      activeBattle.isResolvingTurn ||
      isPotionAnimationPending ||
      !isActiveBattle ||
      !isPlayerTurn ||
      isBattleDiceRolling ||
      isBattleDiceHidden
  );
  const areBattlePotionsDisabled = Boolean(
    showTurnModal ||
      activeBattle.isResolvingTurn ||
      isPotionAnimationPending ||
      activeBattle.playerPotionUsedThisTurn ||
      !isActiveBattle ||
      !isPlayerTurn ||
      isBattleDiceRolling ||
      isBattleDiceHidden
  );
  const turnActorName = isPlayerTurn
    ? getPlayerColourDisplayName(currentLanguage, battlePlayer.colour)
    : enemyDisplayName;
  const battleTurnMessage = getBattleTurnMessage(currentLanguage, turnActorName);
  const turnActorImageSource = isPlayerTurn ? pieceImageSource : enemyImageSource;
  const shouldAutoRollEnemy = Boolean(
    isActiveBattle &&
      !isPlayerTurn &&
      !showTurnModal &&
      closedTurnModalActor === activeBattle.currentBattleActor &&
      !activeBattle.isResolvingTurn
  );
  const isEffectTargetPlayer = activeBattleEffect
    ? activeBattleEffect.target === 'currentActor'
      ? isPlayerTurn
      : !isPlayerTurn
    : false;
  const isEffectSourcePlayer = activeBattleEffect
    ? activeBattleEffect.source === 'currentActor'
      ? isPlayerTurn
      : !isPlayerTurn
    : false;

  const handleRemoveHealth = () => {
    const nextHealth = Math.max(0, battlePlayer.currentHealth - 5);

    setPlayerHealth(battlePlayer.id, nextHealth);

    if (nextHealth <= 0) {
      handleLose();
    }
  };

  const handleWin = () => {
    setActiveBattlePhase('reward');
  };

  const handleLose = () => {
    setActiveBattlePhase('lost');
    setShowLoseModal(true);
  };

  const handleRespawn = () => {
    setPlayerPosition(battlePlayer.id, getFirstStartAreaPosition(gameSetup.board), {
      currentHealth: battlePlayer.maxHealth,
      diedLastTurn: false,
    });
    clearActiveBattle();
    advanceTurn();
    setShowLoseModal(false);
    navigate('/gameplay');
  };

  const handleDiceRollComplete = (result) => {
    lastDiceRollRef.current = result;
  };

  const handleDiceSequenceComplete = (result) => {
    setIsBattleDiceRolling(false);
    setIsBattleDiceHidden(true);

    if (isPlayerTurn && battlePlayer.nextForcedRoll) {
      clearPlayerForcedRoll(battlePlayer.id);
    }

    if (isFreezeCheck) {
      resolveBattleFreezeCheck(result);

      window.clearTimeout(freezeCheckFadeTimeoutRef.current);
      freezeCheckFadeTimeoutRef.current = window.setTimeout(() => {
        setIsBattleDiceSequenceComplete(true);

        if (!isPlayerTurn && result % 2 === 0) {
          setEnemyAutoRollRequestId((requestId) => requestId + 1);
        }
      }, BATTLE_DICE_FADE_MS);
      return;
    }

    setIsBattleDiceSequenceComplete(true);
    applyBattleDiceResult(result);
  };

  const handleDiceRollStart = () => {
    setIsBattleDiceHidden(false);
    setIsBattleDiceRolling(true);
    setIsBattleDiceSequenceComplete(false);
  };

  const handleForcedBattleRoll = (value) => {
    setForcedRollRequest((currentRequest) => ({
      id: (currentRequest?.id ?? 0) + 1,
      value,
    }));
  };

  const handleConfirmPotionUse = () => {
    if (pendingPotionUse) {
      if (pendingPotionUse.potion.id === 'roll-choice') {
        setPendingRollChoiceUse(pendingPotionUse);
        setPendingPotionUse(null);
        return;
      }

      consumePlayerPotion(
        battlePlayer.id,
        pendingPotionUse.potionIndex,
        'battle'
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
        battlePlayer.id,
        pendingRollChoiceUse.potionIndex,
        'battle',
        { forcedRollValue: value }
      );
    }

    setPendingRollChoiceUse(null);
  };

  return (
    <main
      className="battle-page"
      style={{
        backgroundImage: `url(${
          getFeatureBackgroundSource(activeBattle.encounterType) ||
          getBattleBackgroundSource(activeBattle.environment)
        })`,
      }}
    >
      <div className="battle-title-potions-panel">
        <h1 className={`battle-title ${languageClassName}`}>{battleTitle}</h1>
        <div className="battle-potions-bar">
          <BattlePotionList
            disabled={areBattlePotionsDisabled}
            emptyText={potionUsageTranslations.noBattlePotions}
            isPotionDisabled={(potion) =>
              (potion.id === 'charger' && activeBattle.playerCharged) ||
              (potion.id === 'shields-down' &&
                (activeBattle.enemyGuard ?? 0) <= 0) ||
              (potion.id === 'thaw' && !activeBattle.playerFrozen)
            }
            language={currentLanguage}
            onUsePotion={(potion, potionIndex) =>
              setPendingPotionUse({ potion, potionIndex })
            }
            potions={battlePlayer.potions}
            useText={potionUsageTranslations.use}
          />
        </div>
      </div>

      <div className="battle-display">
        {activeBattleEffect?.type === 'redDamage' ? (
          <span
            aria-label="Red damage animation"
            className={`battle-red-effect battle-red-effect--${
              isPlayerTurn ? 'player-to-enemy' : 'enemy-to-player'
            }`}
          />
        ) : null}
        {activeBattleEffect?.type === 'orangeCounter' ? (
          <span
            aria-label="Orange counter animation"
            className={`battle-orange-effect battle-orange-effect--${
              isEffectSourcePlayer ? 'player-to-enemy' : 'enemy-to-player'
            }`}
          />
        ) : null}
        <section aria-label="Battle player panel" className="battle-side battle-side--player">
          {activeBattleEffect?.type === 'greenReduction' && isEffectTargetPlayer ? (
            <span
              aria-label="Green reduction animation"
              className="battle-radiating-effect battle-green-effect battle-radiating-effect--player"
            />
          ) : null}
          {activeBattleEffect?.type === 'blueGuard' && isEffectTargetPlayer ? (
            <span
              aria-label="Blue guard animation"
              className="battle-radiating-effect battle-blue-effect battle-radiating-effect--player"
            />
          ) : null}
          <BattleActorImage
            frozen={activeBattle.playerFrozen}
            frozenLabel="Player frozen"
            guard={activeBattle.playerGuard}
            guardAmountLabel="Player guard amount"
            guardLabel="Player guard shield"
            showWeakness={
              activeBattleEffect?.type === 'greenReduction' &&
              isEffectTargetPlayer
            }
            side="player"
          >
            {pieceImageSource ? (
              <img
                alt="Battle player piece"
                aria-label="Battle player piece"
                className="battle-player-piece"
                src={pieceImageSource}
                style={{ alignSelf: 'flex-start', width: 'auto' }}
              />
            ) : (
              <p aria-label="Battle player piece">{battlePlayer.colour}</p>
            )}
            {showHealingPotionAnimation ? (
              <HealingPotionAnimation
                onAnimationEnd={() => setShowHealingPotionAnimation(false)}
              />
            ) : null}
          </BattleActorImage>
          <HealthBar currentHealth={battlePlayer.currentHealth} maxHealth={battlePlayer.maxHealth} />
          <CommittedSpellSlotList
            language={currentLanguage}
            lightBlueUses={activeBattle.playerFreezeUses}
            mergedColumns={battlePlayer.mergedColumns}
            purpleBuffs={activeBattle.playerPurpleBuffs}
            spellSlots={battlePlayer.spellSlots}
            title=""
            yellowCharged={activeBattle.playerCharged}
            yellowUses={activeBattle.playerChargeUses}
          />
        </section>

        <div
          className={`battle-dice${
            isBattleDiceHidden ? ' battle-dice--hidden' : ''
          }`}
        >
          {isFreezeCheck && !showTurnModal ? (
            <p className={`battle-unfreeze-prompt ${languageClassName}`}>
              {gameplayTranslations.rollEvenToUnfreeze}
            </p>
          ) : null}
          <DiceRoll
            autoRoll={shouldAutoRollEnemy}
            autoRollRequestId={enemyAutoRollRequestId}
            disabled={isBattleDiceDisabled}
            forcedResult={isPlayerTurn ? battlePlayer.nextForcedRoll?.value ?? null : null}
            forcedRollRequest={forcedRollRequest}
            mode="persistent"
            onRollComplete={handleDiceRollComplete}
            onSequenceComplete={handleDiceSequenceComplete}
            onRollStart={handleDiceRollStart}
            rollButtonClassName={languageClassName}
            rollButtonLabel={gameplayTranslations.rollDice}
          />
        </div>

        <section aria-label="Battle enemy panel" className="battle-side battle-side--enemy">
          {activeBattleEffect?.type === 'greenReduction' && !isEffectTargetPlayer ? (
            <span
              aria-label="Green reduction animation"
              className="battle-radiating-effect battle-green-effect battle-radiating-effect--enemy"
            />
          ) : null}
          {activeBattleEffect?.type === 'blueGuard' && !isEffectTargetPlayer ? (
            <span
              aria-label="Blue guard animation"
              className="battle-radiating-effect battle-blue-effect battle-radiating-effect--enemy"
            />
          ) : null}
          <BattleActorImage
            frozen={activeBattle.enemyFrozen}
            frozenLabel="Enemy frozen"
            guard={activeBattle.enemyGuard}
            guardAmountLabel="Enemy guard amount"
            guardLabel="Enemy guard shield"
            showWeakness={
              activeBattleEffect?.type === 'greenReduction' &&
              !isEffectTargetPlayer
            }
            side="enemy"
          >
            {enemyImageSource ? (
              <img
                alt={`Battle enemy ${enemyDisplayName}`}
                aria-label={`Battle enemy ${enemyDisplayName}`}
                className="battle-enemy-piece"
                src={enemyImageSource}
              />
            ) : (
              <p aria-label="Battle enemy fallback">{enemyDisplayName}</p>
            )}
            {isCosmicInterventionPending ? (
              <FontAwesomeIcon
                aria-label="Cosmic Intervention animation"
                className="cosmic-intervention-bolt"
                icon={faBolt}
                onAnimationEnd={resolveCosmicIntervention}
              />
            ) : null}
            {isShieldsDownPending ? (
              <FontAwesomeIcon
                aria-label="Shields Down animation"
                className="shields-down-gavel"
                icon={faGavel}
                onAnimationEnd={resolveShieldsDown}
              />
            ) : null}
          </BattleActorImage>
          <HealthBar currentHealth={battleEnemy.currentHealth} maxHealth={battleEnemy.maxHealth} />
          <CommittedSpellSlotList
            language={currentLanguage}
            lightBlueUses={activeBattle.enemyFreezeUses}
            mergedColumns={battleEnemy.mergedColumns}
            purpleBuffs={activeBattle.enemyPurpleBuffs}
            spellSlots={battleEnemy.spellSlots}
            title=""
            yellowCharged={activeBattle.enemyCharged}
            yellowUses={activeBattle.enemyChargeUses}
          />
        </section>
      </div>

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

      {/* DEBUG ONLY: Floating battle debug controls. Remove before production. */}
      <div className="battle-debug-controls">
        <button
          type="button"
          disabled={!isActiveBattle || isPotionAnimationPending}
          onClick={handleRemoveHealth}
        >
          Remove 5 health
        </button>
        <button
          type="button"
          disabled={!isActiveBattle || isPotionAnimationPending}
          onClick={handleWin}
        >
          Win
        </button>
        <button
          type="button"
          disabled={!isActiveBattle || isPotionAnimationPending}
          onClick={handleLose}
        >
          Lose
        </button>
        {/* DEBUG ONLY: Forced dice roll buttons for battle testing. Remove before production. */}
        {[1, 2, 3, 4, 5, 6].map((value) => (
          <button
            disabled={isBattleDiceDisabled}
            key={value}
            type="button"
            onClick={() => handleForcedBattleRoll(value)}
          >
            {`Force ${value}`}
          </button>
        ))}
      </div>

      <Modal
        ariaLabel="Battle turn"
        isOpen={showTurnModal}
        panelClassName={`battle-turn-modal ${languageClassName}`}
      >
        <div className="battle-turn-modal-content">
          {turnActorImageSource ? (
            <img
              alt={battleTurnMessage}
              aria-label="Battle turn actor"
              className="battle-turn-modal-image"
              src={turnActorImageSource}
            />
          ) : null}
          <p className={`larger-text ${languageClassName}`}>{battleTurnMessage}</p>
        </div>
      </Modal>

      <Modal
        actions={
          <Button
            className={languageClassName}
            type="button"
            variant="secondary"
            onClick={handleRespawn}
          >
            {failureTranslations.respawn}
          </Button>
        }
        ariaLabel="Battle lost"
        isOpen={showLoseModal}
        panelClassName={`battle-loss-modal ${languageClassName}`}
      >
        <p className={`battle-loss-message larger-text ${languageClassName}`}>
          {getBattleLossMessage(currentLanguage)}
        </p>
        <DeathResult
          language={currentLanguage}
          removedTokens={activeBattle.deathPenalty?.removedTokens}
        />
      </Modal>
    </main>
  );
}

export default BattlePage;
