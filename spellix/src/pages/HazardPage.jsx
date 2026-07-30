import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import { HAZARD_ENVIRONMENTS } from '../data/hazards';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import {
  getGameplayLanguage,
  getHazardTranslations,
} from '../i18n/translations';
import './HazardPage.css';

function HazardPage({ encounter, onComplete = () => {} }) {
  const navigate = useNavigate();
  const {
    advanceTurn,
    gameSetup,
    markPlayerToSkipNextTurn,
    setPlayerHealth,
  } = useGameSetup();
  const [hazardPlayerId] = useState(() => encounter?.playerId ?? '');
  const hazardPlayer =
    gameSetup.players.find(({ id }) => id === hazardPlayerId) ?? null;
  const [startingHealth] = useState(() => hazardPlayer?.currentHealth ?? 0);
  const [displayedHealth, setDisplayedHealth] = useState(startingHealth);
  const isHealthLoss = encounter?.hazard?.effect?.type === 'loseHealth';
  const [isEffectResolved, setIsEffectResolved] = useState(!isHealthLoss);
  const skipEffectStartedRef = useRef(false);
  const markPlayerToSkipNextTurnRef = useRef(markPlayerToSkipNextTurn);
  const setPlayerHealthRef = useRef(setPlayerHealth);
  const effectType = encounter?.hazard?.effect?.type;
  const effectAmount = encounter?.hazard?.effect?.amount;

  markPlayerToSkipNextTurnRef.current = markPlayerToSkipNextTurn;
  setPlayerHealthRef.current = setPlayerHealth;

  useEffect(() => {
    if (encounter && hazardPlayer) {
      return;
    }

    navigate('/gameplay', { replace: true });
  }, [encounter, hazardPlayer, navigate]);

  useEffect(() => {
    if (
      effectType !== 'skipNextTurn' ||
      !hazardPlayerId ||
      skipEffectStartedRef.current
    ) {
      return;
    }

    skipEffectStartedRef.current = true;
    markPlayerToSkipNextTurnRef.current(hazardPlayerId);
  }, [effectType, hazardPlayerId]);

  useEffect(() => {
    if (
      effectType !== 'loseHealth' ||
      !hazardPlayerId ||
      isEffectResolved
    ) {
      return undefined;
    }

    const timerId = setTimeout(() => {
      const nextHealth = Math.max(0, startingHealth - effectAmount);

      setPlayerHealthRef.current(hazardPlayerId, nextHealth);
      setDisplayedHealth(nextHealth);
      setIsEffectResolved(true);
    }, 1000);

    return () => {
      clearTimeout(timerId);
    };
  }, [
    effectAmount,
    effectType,
    hazardPlayerId,
    isEffectResolved,
    startingHealth,
  ]);

  if (!encounter?.hazard || !hazardPlayer) {
    return null;
  }

  const language = getGameplayLanguage(hazardPlayer.language);
  const translations = getHazardTranslations(language);
  const languageClassName = `language-${language}`;
  const environment =
    HAZARD_ENVIRONMENTS.find(({ id }) => id === encounter.environment) ??
    HAZARD_ENVIRONMENTS[0];
  const playerImageSource = getPieceImageSource(hazardPlayer.pieceImage);
  const hazardName =
    encounter.hazard.name[language] ?? encounter.hazard.name.en;
  const effectText = isHealthLoss
    ? translations.loseHealth(encounter.hazard.effect.amount)
    : translations.loseNextTurn;

  const finishHazard = () => {
    if (!isEffectResolved) {
      return;
    }

    advanceTurn();
    navigate('/gameplay', { replace: true });
    onComplete();
  };

  return (
    <main
      className="hazard-page"
      data-testid="hazard-page"
      style={{
        backgroundImage: `url(${getBattleBackgroundSource(
          environment.background
        )})`,
      }}
    >
      <Modal
        actions={
          <Button
            className={languageClassName}
            disabled={!isEffectResolved}
            type="button"
            variant="secondary"
            onClick={finishHazard}
          >
            OK
          </Button>
        }
        ariaLabel={translations.hazard}
        isOpen
        panelClassName={`hazard-modal ${languageClassName}`}
      >
        <div className="hazard-modal-content">
          <div className="hazard-title-row larger-text">
            <FontAwesomeIcon
              aria-label="Hazard warning"
              className="hazard-title-icon"
              icon={faTriangleExclamation}
            />
            <span
              className={`hazard-title-text larger-text ${languageClassName}`}
            >
              {translations.hazard}
            </span>
            <FontAwesomeIcon
              aria-label="Hazard warning"
              className="hazard-title-icon"
              icon={faTriangleExclamation}
            />
          </div>

          <p className={`hazard-name ${languageClassName}`}>{hazardName}</p>
          <p className={`hazard-effect ${languageClassName}`}>{effectText}</p>

          {isHealthLoss ? (
            <div className="hazard-player-status">
              {playerImageSource ? (
                <img
                  alt="Hazard player"
                  className="hazard-player-image"
                  src={playerImageSource}
                />
              ) : null}
              <HealthBar
                currentHealth={displayedHealth}
                maxHealth={hazardPlayer.maxHealth}
              />
            </div>
          ) : null}
        </div>
      </Modal>
    </main>
  );
}

export default HazardPage;
