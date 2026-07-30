import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getGameplayLanguage } from '../../i18n/translations';
import './RollAgainEventModal.css';

const ROLL_AGAIN_EVENT_TEXT = {
  en: {
    continue: 'Continue',
    message: 'You still have energy, roll again to continue onward',
  },
  jp: {
    continue: '\u7d9a\u3051\u308b',
    message:
      '\u307e\u3060\u4f53\u529b\u304c\u6b8b\u3063\u3066\u3044\u307e\u3059\u3002\u3082\u3046\u4e00\u5ea6\u30b5\u30a4\u30b3\u30ed\u3092\u632f\u3063\u3066\u3001\u5148\u3078\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002',
  },
};

function RollAgainEventModal({
  isOpen,
  language = 'en',
  onContinue = () => {},
}) {
  const normalizedLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${normalizedLanguage}`;
  const text = ROLL_AGAIN_EVENT_TEXT[normalizedLanguage];

  return (
    <Modal
      actions={
        <Button
          className={languageClassName}
          type="button"
          variant="secondary"
          onClick={onContinue}
        >
          {text.continue}
        </Button>
      }
      ariaLabel="Roll Again Event"
      isOpen={isOpen}
      panelClassName={`roll-again-event-modal ${languageClassName}`}
    >
      <div className="roll-again-event-modal-content">
        <p
          className={`roll-again-event-message larger-text ${languageClassName}`}
        >
          {text.message}
        </p>
      </div>
    </Modal>
  );
}

export default RollAgainEventModal;
