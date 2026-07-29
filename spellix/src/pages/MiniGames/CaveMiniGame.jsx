import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import PotionIcon from '../../components/potions/PotionIcon';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import {
  getPieceImageSource,
  getPlayerPieceImageName,
} from '../../features/gameSetup/pieceImages';
import {
  createCaveRewardState,
  generateCavePotionReward,
  generateCaveTokenReward,
  selectCaveOutcome,
} from '../../features/miniGames/caveMiniGame';
import { getPendingCaveReward } from '../../features/miniGames/caveRewardGrant';
import {
  getCaveMiniGameTranslations,
  getGameplayLanguage,
} from '../../i18n/translations';
import ogreImage from '../../images/enemies/AO.png';
import CaveRewardList from './CaveRewardList';
import './CaveMiniGame.css';

const CAVE_MAX_DEPTH = 16;
const MOVEMENT_DURATION = 500;
const OGRE_CHASE_DURATION = 1500;

function CaveMiniGame() {
  const navigate = useNavigate();
  const {
    completeMiniGame,
    currentPlayer,
    gameSetup,
    miniGameResult,
    removePlayerPotion,
    returnFromMiniGame,
  } = useGameSetup();
  const [caveRewards, setCaveRewards] = useState(() =>
    miniGameResult?.type === 'cave' && miniGameResult.result === 'win'
      ? { ...createCaveRewardState(), ...miniGameResult.caveRewards }
      : createCaveRewardState()
  );
  const [currentDepth, setCurrentDepth] = useState(0);
  const [messageKey, setMessageKey] = useState(() =>
    miniGameResult?.type === 'cave' && miniGameResult.result === 'win'
      ? 'retreated'
      : 'initial'
  );
  const [phase, setPhase] = useState(() =>
    miniGameResult?.type === 'cave' && miniGameResult.result === 'win'
      ? 'retreated'
      : 'playing'
  );
  const timersRef = useRef(new Set());
  const miniGamePlayer =
    gameSetup?.players?.find((player) => player.id === miniGameResult?.playerId) ??
    currentPlayer;
  const currentLanguage = getGameplayLanguage(miniGamePlayer?.language);
  const translations = getCaveMiniGameTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const acquiredRewards = {
    loot: caveRewards.hasLootChest,
    potion: Boolean(caveRewards.potion),
    rollAgain: caveRewards.hasRollAgainPotion,
    token: Boolean(caveRewards.token),
  };
  const playerPieceImage =
    miniGamePlayer?.pieceImage ||
    getPlayerPieceImageName({
      colour: miniGamePlayer?.colour,
      gender: miniGamePlayer?.gender,
    });
  const playerImageSource = getPieceImageSource(playerPieceImage);
  const progressPercent = (currentDepth / CAVE_MAX_DEPTH) * 100;
  const isDecisionPhase = phase === 'playing' || phase === 'moving' || phase === 'chasing';
  const decisionsDisabled = phase !== 'playing';
  const pendingCaveReward = getPendingCaveReward(miniGameResult?.caveRewardGrant);
  const hasUnopenedLootChest = Boolean(
    caveRewards.hasLootChest && !miniGameResult?.lootChestReward
  );
  const caveRunnerPotionIndex =
    miniGamePlayer?.potions?.findIndex(({ id }) => id === 'cave-runner') ?? -1;
  const caveRunnerPotion =
    caveRunnerPotionIndex >= 0
      ? miniGamePlayer.potions[caveRunnerPotionIndex]
      : null;

  const schedule = (callback, delay) => {
    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    },
    []
  );

  const startOgreChase = () => {
    setPhase('chasing');
    if (caveRunnerPotion && miniGamePlayer.currentHealth > 0) {
      removePlayerPotion(miniGamePlayer.id, caveRunnerPotionIndex);
      completeMiniGame('loss', { preventHealthLoss: true });
    } else {
      completeMiniGame('loss');
    }
    schedule(() => navigate('/mini-game/lose'), OGRE_CHASE_DURATION);
  };

  const handleGoDeeper = () => {
    if (phase !== 'playing') {
      return;
    }

    if (currentDepth >= CAVE_MAX_DEPTH) {
      setMessageKey('ogre');
      setCaveRewards(createCaveRewardState());
      startOgreChase();
      return;
    }

    const nextDepth = currentDepth + 1;
    const outcome = selectCaveOutcome(nextDepth, acquiredRewards);

    setCurrentDepth(nextDepth);
    setMessageKey(outcome);
    setPhase('moving');

    if (outcome === 'ogre') {
      setCaveRewards(createCaveRewardState());
      schedule(startOgreChase, MOVEMENT_DURATION);
      return;
    }

    if (outcome === 'token' && !caveRewards.token) {
      setCaveRewards((currentRewards) => ({
        ...currentRewards,
        token: generateCaveTokenReward(),
      }));
    } else if (outcome === 'potion' && !caveRewards.potion) {
      setCaveRewards((currentRewards) => ({
        ...currentRewards,
        potion: generateCavePotionReward(),
      }));
    } else if (outcome === 'loot' && !caveRewards.hasLootChest) {
      setCaveRewards((currentRewards) => ({
        ...currentRewards,
        hasLootChest: true,
      }));
    } else if (outcome === 'rollAgain' && !caveRewards.hasRollAgainPotion) {
      setCaveRewards((currentRewards) => ({
        ...currentRewards,
        hasRollAgainPotion: true,
      }));
    }

    schedule(() => setPhase('playing'), MOVEMENT_DURATION);
  };

  const handleRetreat = () => {
    if (phase !== 'playing' || currentDepth === 0) {
      return;
    }

    setMessageKey('retreated');
    setPhase('retreated');
    completeMiniGame('win', {
      caveRewards,
      rollAgain: caveRewards.hasRollAgainPotion,
    });

    if ((caveRewards.token || caveRewards.potion) && !hasUnopenedLootChest) {
      navigate('/reward');
    }
  };

  const handleDebugReward = (rewardType) => {
    if (phase !== 'playing' || acquiredRewards[rewardType]) {
      return;
    }

    if (rewardType === 'token') {
      const token = generateCaveTokenReward();

      if (token) {
        setCaveRewards((currentRewards) => ({ ...currentRewards, token }));
        setMessageKey('token');
      }
    } else if (rewardType === 'potion') {
      const potion = generateCavePotionReward();

      if (potion) {
        setCaveRewards((currentRewards) => ({ ...currentRewards, potion }));
        setMessageKey('potion');
      }
    } else if (rewardType === 'loot') {
      setCaveRewards((currentRewards) => ({ ...currentRewards, hasLootChest: true }));
      setMessageKey('loot');
    } else if (rewardType === 'rollAgain') {
      setCaveRewards((currentRewards) => ({
        ...currentRewards,
        hasRollAgainPotion: true,
      }));
      setMessageKey('rollAgain');
    }
  };

  const handleContinue = () => {
    if (phase === 'retreated') {
      if (hasUnopenedLootChest) {
        navigate('/mini-game/loot-chest');
        return;
      }

      if (!pendingCaveReward) {
        returnFromMiniGame();
        navigate('/gameplay', { replace: true });
      }
    }
  };

  return (
    <main className="cave-mini-game-page">
      <div className="cave-debug-rewards">
        <button
          disabled={decisionsDisabled || acquiredRewards.token}
          type="button"
          onClick={() => handleDebugReward('token')}
        >
          Debug: Add Token
        </button>
        <button
          disabled={decisionsDisabled || acquiredRewards.potion}
          type="button"
          onClick={() => handleDebugReward('potion')}
        >
          Debug: Add Potion
        </button>
        <button
          disabled={decisionsDisabled || acquiredRewards.loot}
          type="button"
          onClick={() => handleDebugReward('loot')}
        >
          Debug: Add Loot Chest
        </button>
        <button
          disabled={decisionsDisabled || acquiredRewards.rollAgain}
          type="button"
          onClick={() => handleDebugReward('rollAgain')}
        >
          Debug: Add Roll Again Potion
        </button>
      </div>
      <section className="cave-mini-game-layout">
        {playerImageSource ? (
          <div className="cave-progress-track">
            <div
              className={`cave-player-position${phase === 'chasing' ? ' is-chasing' : ''}`}
              data-depth={currentDepth}
              data-testid="cave-player-position"
              style={{ '--cave-progress': `${progressPercent}%` }}
            >
              <img
                alt="Current player character"
                className={`cave-player-image ${
                  phase === 'chasing' ? 'is-unflipped' : 'is-flipped'
                }`}
                draggable="false"
                src={playerImageSource}
              />
              {phase === 'chasing' ? (
                <img
                  alt="Ogre chasing the player"
                  className="cave-ogre-image"
                  draggable="false"
                  src={ogreImage}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="cave-mini-game-text-box">
          <p aria-live="polite" className={languageClassName}>
            {translations.messages[messageKey]}
          </p>

          {phase === 'retreated' ? (
            <CaveRewardList
              caveRewards={caveRewards}
              className="cave-reward-summary"
              language={currentLanguage}
              showEmpty
              translations={translations}
            />
          ) : null}
        </div>

        <div className="cave-mini-game-actions">
          {isDecisionPhase ? (
            <>
              <Button
                className={languageClassName}
                disabled={decisionsDisabled}
                type="button"
                onClick={handleGoDeeper}
              >
                {translations.goDeeper}
              </Button>
              <Button
                className={languageClassName}
                disabled={decisionsDisabled || currentDepth === 0}
                type="button"
                variant="secondary"
                onClick={handleRetreat}
              >
                {translations.retreat}
              </Button>
            </>
          ) : (
            <Button
              className={languageClassName}
              disabled={Boolean(pendingCaveReward && !hasUnopenedLootChest)}
              type="button"
              onClick={handleContinue}
            >
              {hasUnopenedLootChest ? translations.openLoot : translations.continue}
            </Button>
          )}
        </div>

        {caveRunnerPotion ? (
          <div
            className="cave-runner-active-potion"
            data-testid="cave-runner-active-potion"
          >
            <PotionIcon language={currentLanguage} potion={caveRunnerPotion} />
            <p className={`cave-runner-active-text ${languageClassName}`}>
              {translations.active}
            </p>
          </div>
        ) : null}

        {isDecisionPhase ? (
          <CaveRewardList
            caveRewards={caveRewards}
            className="cave-found-rewards"
            language={currentLanguage}
            testId="cave-found-rewards"
            translations={translations}
          />
        ) : null}
      </section>
    </main>
  );
}

export default CaveMiniGame;
