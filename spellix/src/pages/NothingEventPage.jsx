import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import {
  NOTHING_EVENT_CONTINUE_TEXT,
  selectNothingEventHealAmount,
} from '../data/nothingEvents';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import { getGameplayLanguage } from '../i18n/translations';
import './NothingEventPage.css';

function NothingEventPage({
  encounter,
  onComplete = () => {},
  randomFn = Math.random,
}) {
  const navigate = useNavigate();
  const { advanceTurn, gameSetup, setPlayerHealth } = useGameSetup();
  const [eventPlayerId] = useState(() => encounter?.playerId ?? '');
  const [healAmount] = useState(() => selectNothingEventHealAmount(randomFn));
  const [isHealResolved, setIsHealResolved] = useState(false);
  const eventPlayer =
    gameSetup.players.find(({ id }) => id === eventPlayerId) ?? null;

  useEffect(() => {
    if (encounter?.event && eventPlayer) {
      return;
    }

    navigate('/gameplay', { replace: true });
  }, [encounter, eventPlayer, navigate]);

  useEffect(() => {
    if (!encounter?.event || !eventPlayer || isHealResolved) {
      return undefined;
    }

    const healedHealth = Math.min(
      eventPlayer.currentHealth + healAmount,
      eventPlayer.maxHealth
    );
    const timerId = window.setTimeout(() => {
      setPlayerHealth(eventPlayerId, healedHealth);
      setIsHealResolved(true);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [
    encounter?.event,
    eventPlayer,
    eventPlayerId,
    healAmount,
    isHealResolved,
    setPlayerHealth,
  ]);

  if (!encounter?.event || !eventPlayer) {
    return null;
  }

  const language = getGameplayLanguage(eventPlayer.language);
  const languageClassName = `language-${language}`;
  const eventText =
    encounter.event.text[language] ?? encounter.event.text.en;
  const playerImageSource = getPieceImageSource(eventPlayer.pieceImage);

  const finishNothingEvent = () => {
    if (!isHealResolved) {
      return;
    }

    advanceTurn();
    navigate('/gameplay', { replace: true });
    onComplete();
  };

  return (
    <main
      className="nothing-event-page"
      data-testid="nothing-event-page"
      style={{
        backgroundImage: `url(${getBattleBackgroundSource(
          encounter.event.background
        )})`,
      }}
    >
      <Modal
        actions={
          <Button
            className={languageClassName}
            disabled={!isHealResolved}
            type="button"
            variant="secondary"
            onClick={finishNothingEvent}
          >
            {NOTHING_EVENT_CONTINUE_TEXT[language]}
          </Button>
        }
        ariaLabel="Nothing Event"
        isOpen
        panelClassName={`nothing-event-modal ${languageClassName}`}
      >
        <div className="nothing-event-modal-content">
          <p
            className={`nothing-event-text larger-text ${languageClassName}`}
          >
            {eventText}
          </p>
          {playerImageSource ? (
            <img
              alt="Nothing event player"
              className="nothing-event-player-image"
              src={playerImageSource}
            />
          ) : (
            <p>{eventPlayer.colour}</p>
          )}
          <HealthBar
            currentHealth={eventPlayer.currentHealth}
            maxHealth={eventPlayer.maxHealth}
          />
        </div>
      </Modal>
    </main>
  );
}

export default NothingEventPage;
