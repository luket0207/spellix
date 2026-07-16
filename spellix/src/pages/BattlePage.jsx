import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faSnowflake } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DiceRoll from '../components/dice/DiceRoll';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import CommittedSpellSlotList from '../components/spells/CommittedSpellSlotList';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { getEnemyImageSource } from '../features/battle/enemyImages';
import DeathResult from '../features/death/DeathResult';
import { getFirstStartAreaPosition } from '../features/gameBoard/board';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import './BattlePage.css';

const FREEZE_OVERLAY_ANIMATION_MS = 200;

function BattleActorImage({ children, frozen, frozenLabel, guard, guardAmountLabel, guardLabel, side }) {
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
    finalizeBattleEffects,
    gameSetup,
    resolveBattleFreezeCheck,
    setActiveBattlePhase,
    setPlayerHealth,
    setPlayerPosition,
  } = useGameSetup();
  const lastDiceRollRef = useRef(null);
  const turnTransitionTimeoutRef = useRef(null);
  const advanceBattleTurnRef = useRef(advanceBattleTurn);
  const applyBattleEffectRef = useRef(applyBattleEffect);
  const finalizeBattleEffectsRef = useRef(finalizeBattleEffects);
  const [activeBattleEffect, setActiveBattleEffect] = useState(null);
  const [closedTurnModalActor, setClosedTurnModalActor] = useState(null);
  const [enemyAutoRollRequestId, setEnemyAutoRollRequestId] = useState(0);
  const [forcedRollRequest, setForcedRollRequest] = useState(null);
  const [isBattleDiceRolling, setIsBattleDiceRolling] = useState(false);
  const [pendingEnemyAttackAfterFreeze, setPendingEnemyAttackAfterFreeze] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const hasBattleContext = Boolean(activeBattle && battleEnemy && battlePlayer);
  const isActiveBattle = Boolean(activeBattle?.phase === 'active' && battlePlayer);
  const [showTurnModal, setShowTurnModal] = useState(isActiveBattle);

  advanceBattleTurnRef.current = advanceBattleTurn;
  applyBattleEffectRef.current = applyBattleEffect;
  finalizeBattleEffectsRef.current = finalizeBattleEffects;

  useEffect(() => {
    if (!hasBattleContext) {
      navigate('/gameplay', { replace: true });
    }
  }, [hasBattleContext, navigate]);

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
    }
  }, [activeBattle?.phase, navigate]);

  if (!hasBattleContext) {
    return null;
  }

  const enemyImageSource = getEnemyImageSource(battleEnemy.imageFileName);
  const pieceImageSource = getPieceImageSource(battlePlayer.pieceImage);
  const isPlayerTurn = activeBattle.currentBattleActor !== 'enemy';
  const isFreezeCheck = isPlayerTurn ? activeBattle.playerFrozen : activeBattle.enemyFrozen;
  const isBattleDiceDisabled = Boolean(
    showTurnModal ||
      activeBattle.isResolvingTurn ||
      !isActiveBattle ||
      !isPlayerTurn ||
      isBattleDiceRolling
  );
  const turnActorName = isPlayerTurn
    ? `${battlePlayer.colour.charAt(0).toUpperCase()}${battlePlayer.colour.slice(1)}`
    : battleEnemy.englishName;
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
    navigate('/reward');
  };

  const handleLose = () => {
    setActiveBattlePhase('lost');
    setShowLoseModal(true);
  };

  const handleRespawn = () => {
    setPlayerPosition(battlePlayer.id, getFirstStartAreaPosition(gameSetup.board), {
      currentHealth: battlePlayer.maxHealth,
    });
    clearActiveBattle();
    advanceTurn();
    setShowLoseModal(false);
    navigate('/gameplay');
  };

  const handleDiceRollComplete = (result) => {
    setIsBattleDiceRolling(false);
    lastDiceRollRef.current = result;

    if (isFreezeCheck) {
      resolveBattleFreezeCheck(result);

      if (!isPlayerTurn && result % 2 === 0) {
        setPendingEnemyAttackAfterFreeze(true);
      }

      return;
    }

    applyBattleDiceResult(result);
  };

  const handleDiceSequenceComplete = () => {
    if (!pendingEnemyAttackAfterFreeze) {
      return;
    }

    setPendingEnemyAttackAfterFreeze(false);
    setEnemyAutoRollRequestId((requestId) => requestId + 1);
  };

  const handleForcedBattleRoll = (value) => {
    setForcedRollRequest((currentRequest) => ({
      id: (currentRequest?.id ?? 0) + 1,
      value,
    }));
  };

  return (
    <main
      className="battle-page"
      style={{ backgroundImage: `url(${getBattleBackgroundSource(activeBattle.environment)})` }}
    >
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
          </BattleActorImage>
          <HealthBar currentHealth={battlePlayer.currentHealth} maxHealth={battlePlayer.maxHealth} />
          <CommittedSpellSlotList
            lightBlueUses={activeBattle.playerFreezeUses}
            purpleBuffs={activeBattle.playerPurpleBuffs}
            spellSlots={battlePlayer.spellSlots}
            title=""
            yellowCharged={activeBattle.playerCharged}
            yellowUses={activeBattle.playerChargeUses}
          />
        </section>

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
            side="enemy"
          >
            {enemyImageSource ? (
              <img
                alt={`Battle enemy ${battleEnemy.englishName}`}
                aria-label={`Battle enemy ${battleEnemy.englishName}`}
                className="battle-enemy-piece"
                src={enemyImageSource}
              />
            ) : (
              <p aria-label="Battle enemy fallback">{battleEnemy.englishName}</p>
            )}
          </BattleActorImage>
          <HealthBar currentHealth={battleEnemy.currentHealth} maxHealth={battleEnemy.maxHealth} />
          <CommittedSpellSlotList
            lightBlueUses={activeBattle.enemyFreezeUses}
            purpleBuffs={activeBattle.enemyPurpleBuffs}
            spellSlots={battleEnemy.spellSlots}
            title=""
            yellowCharged={activeBattle.enemyCharged}
            yellowUses={activeBattle.enemyChargeUses}
          />
        </section>
      </div>

      <div className="battle-dice">
        {isFreezeCheck && !showTurnModal ? <p>Roll to see if you unfreeze</p> : null}
        <DiceRoll
          autoRoll={shouldAutoRollEnemy}
          autoRollRequestId={enemyAutoRollRequestId}
          disabled={isBattleDiceDisabled}
          forcedRollRequest={forcedRollRequest}
          mode="persistent"
          onRollComplete={handleDiceRollComplete}
          onSequenceComplete={handleDiceSequenceComplete}
          onRollStart={() => setIsBattleDiceRolling(true)}
        />
      </div>

      {/* DEBUG ONLY: Floating battle debug controls. Remove before production. */}
      <div className="battle-debug-controls">
        <button type="button" disabled={!isActiveBattle} onClick={handleRemoveHealth}>
          Remove 5 health
        </button>
        <button type="button" disabled={!isActiveBattle} onClick={handleWin}>
          Win
        </button>
        <button type="button" disabled={!isActiveBattle} onClick={handleLose}>
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
      >
        <p>{`${turnActorName}'s Turn`}</p>
        {turnActorImageSource ? (
          <img
            alt={`${turnActorName}'s turn`}
            aria-label="Battle turn actor"
            src={turnActorImageSource}
            style={{ height: '150px', width: 'auto' }}
          />
        ) : null}
      </Modal>

      <Modal
        actions={
          <button type="button" onClick={handleRespawn}>
            Respawn
          </button>
        }
        ariaLabel="Battle lost"
        isOpen={showLoseModal}
      >
        <p>The player has lost.</p>
        <DeathResult removedTokens={activeBattle.deathPenalty?.removedTokens} />
      </Modal>
    </main>
  );
}

export default BattlePage;
