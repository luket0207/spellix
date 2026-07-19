import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import {
  CAVE_REWARD_TYPES,
  createCaveRewards,
  selectCaveOutcome,
} from '../../features/miniGames/caveMiniGame';
import {
  getCaveMiniGameTranslations,
  getGameplayLanguage,
} from '../../i18n/translations';
import './CaveMiniGame.css';

function CaveMiniGame() {
  const navigate = useNavigate();
  const {
    completeMiniGame,
    currentPlayer,
    gameSetup,
    miniGameResult,
    returnFromMiniGame,
  } = useGameSetup();
  const [acquiredRewards, setAcquiredRewards] = useState(createCaveRewards);
  const [messageKey, setMessageKey] = useState('initial');
  const [phase, setPhase] = useState('playing');
  const [step, setStep] = useState(1);
  const miniGamePlayer =
    gameSetup?.players?.find((player) => player.id === miniGameResult?.playerId) ??
    currentPlayer;
  const currentLanguage = getGameplayLanguage(miniGamePlayer?.language);
  const translations = getCaveMiniGameTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const foundRewardTypes = CAVE_REWARD_TYPES.filter(
    (rewardType) => acquiredRewards[rewardType]
  );

  const handleGoDeeper = () => {
    if (phase !== 'playing') {
      return;
    }

    const outcome = selectCaveOutcome(step, acquiredRewards);

    setMessageKey(outcome);

    if (outcome === 'ogre') {
      setAcquiredRewards(createCaveRewards());
      setPhase('ogre');
      completeMiniGame('loss');
      return;
    }

    if (CAVE_REWARD_TYPES.includes(outcome)) {
      setAcquiredRewards((currentRewards) => ({
        ...currentRewards,
        [outcome]: true,
      }));
    }

    setStep((currentStep) => Math.min(currentStep + 1, 16));
  };

  const handleRetreat = () => {
    if (phase !== 'playing') {
      return;
    }

    setMessageKey('retreated');
    setPhase('retreated');
    completeMiniGame('win', { rollAgain: acquiredRewards.rollAgain });
  };

  const handleContinue = () => {
    if (phase === 'ogre') {
      navigate('/mini-game/lose');
      return;
    }

    if (phase === 'retreated') {
      returnFromMiniGame();
      navigate('/gameplay', { replace: true });
    }
  };

  return (
    <main className="cave-mini-game-page">
      <section className="cave-mini-game-layout">
        <div className="cave-mini-game-text-box">
          <p aria-live="polite" className={languageClassName}>
            {translations.messages[messageKey]}
          </p>

          {phase === 'retreated' ? (
            <div className={`cave-reward-summary ${languageClassName}`}>
              <p>{translations.summary.title}</p>
              {foundRewardTypes.length > 0 ? (
                foundRewardTypes.map((rewardType) => (
                  <div key={rewardType}>{translations.summary[rewardType]}</div>
                ))
              ) : (
                <div>{translations.summary.none}</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="cave-mini-game-actions">
          {phase === 'playing' ? (
            <>
              <Button className={languageClassName} type="button" onClick={handleGoDeeper}>
                {translations.goDeeper}
              </Button>
              <Button
                className={languageClassName}
                type="button"
                variant="secondary"
                onClick={handleRetreat}
              >
                {translations.retreat}
              </Button>
            </>
          ) : (
            <Button className={languageClassName} type="button" onClick={handleContinue}>
              {translations.continue}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

export default CaveMiniGame;
