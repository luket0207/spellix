import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import Modal from '../components/Modal';
import { NOTHING_EVENT_CONTINUE_TEXT } from '../data/nothingEvents';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getGameplayLanguage } from '../i18n/translations';
import './NothingEventPage.css';

function NothingEventPage({ encounter, onComplete = () => {} }) {
  const navigate = useNavigate();
  const { advanceTurn, gameSetup } = useGameSetup();
  const [eventPlayerId] = useState(() => encounter?.playerId ?? '');
  const eventPlayer =
    gameSetup.players.find(({ id }) => id === eventPlayerId) ?? null;

  useEffect(() => {
    if (encounter?.event && eventPlayer) {
      return;
    }

    navigate('/gameplay', { replace: true });
  }, [encounter, eventPlayer, navigate]);

  if (!encounter?.event || !eventPlayer) {
    return null;
  }

  const language = getGameplayLanguage(eventPlayer.language);
  const languageClassName = `language-${language}`;
  const eventText =
    encounter.event.text[language] ?? encounter.event.text.en;

  const finishNothingEvent = () => {
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
        </div>
      </Modal>
    </main>
  );
}

export default NothingEventPage;
