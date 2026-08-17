import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getAvailableEventsForEnvironment } from '../../data/environmentEvents';
import { getGameplayLanguage } from '../../i18n/translations';
import './ChooseEventModal.css';

const CHOOSE_EVENT_TEXT = {
  en: {
    title: 'Choose Event',
    events: {
      nothing: 'Nothing',
      level1Battle: 'Level 1 Battle',
      level2Battle: 'Level 2 Battle',
      level3Battle: 'Level 3 Battle',
      riverMiniGame: 'River Mini Game',
      caveMiniGame: 'Cave Mini Game',
      decision: 'Decision',
      hazard: 'Hazard',
      lootChest: 'Loot Chest',
      rollAgain: 'Roll Again',
    },
  },
  jp: {
    title: '\u30a4\u30d9\u30f3\u30c8\u3092\u9078\u629e',
    events: {
      nothing: '\u4f55\u3082\u8d77\u3053\u3089\u306a\u3044',
      level1Battle: '\u30ec\u30d9\u30eb1\u30d0\u30c8\u30eb',
      level2Battle: '\u30ec\u30d9\u30eb2\u30d0\u30c8\u30eb',
      level3Battle: '\u30ec\u30d9\u30eb3\u30d0\u30c8\u30eb',
      riverMiniGame: '\u5ddd\u306e\u30df\u30cb\u30b2\u30fc\u30e0',
      caveMiniGame: '\u6d1e\u7a9f\u306e\u30df\u30cb\u30b2\u30fc\u30e0',
      decision: '\u6c7a\u65ad',
      hazard: '\u30cf\u30b6\u30fc\u30c9',
      lootChest: '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1',
      rollAgain: '\u3082\u3046\u4e00\u5ea6\u30b5\u30a4\u30b3\u30ed',
    },
  },
};

function ChooseEventModal({
  environment,
  excludedEventTypes = [],
  isOpen,
  language = 'en',
  onChoose = () => {},
}) {
  const normalizedLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${normalizedLanguage}`;
  const text = CHOOSE_EVENT_TEXT[normalizedLanguage];
  const availableEvents = getAvailableEventsForEnvironment(
    environment,
    excludedEventTypes
  );

  return (
    <Modal
      ariaLabel={text.title}
      isOpen={isOpen}
      panelClassName={`choose-event-modal ${languageClassName}`}
    >
      <p className={`choose-event-title larger-text ${languageClassName}`}>
        {text.title}
      </p>
      <div className="choose-event-button-grid">
        {availableEvents.map(({ eventType }) => (
          <Button
            className={`choose-event-button ${languageClassName}`}
            key={eventType}
            type="button"
            variant="secondary"
            onClick={() => onChoose(eventType)}
          >
            {text.events[eventType]}
          </Button>
        ))}
      </div>
    </Modal>
  );
}

export default ChooseEventModal;
