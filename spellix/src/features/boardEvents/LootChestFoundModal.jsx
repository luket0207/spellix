import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getGameplayLanguage } from '../../i18n/translations';
import './LootChestFoundModal.css';

const LOOT_CHEST_FOUND_TEXT = {
  en: {
    message: 'You found a Loot Chest!',
    open: 'Open Chest',
  },
  jp: {
    message: '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u898b\u3064\u3051\u307e\u3057\u305f\uff01',
    open: '\u5b9d\u7bb1\u3092\u958b\u3051\u308b',
  },
};

function LootChestFoundModal({
  isOpen,
  language = 'en',
  onOpen = () => {},
}) {
  const normalizedLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${normalizedLanguage}`;
  const text = LOOT_CHEST_FOUND_TEXT[normalizedLanguage];

  return (
    <Modal
      actions={
        <Button
          className={languageClassName}
          type="button"
          variant="secondary"
          onClick={onOpen}
        >
          {text.open}
        </Button>
      }
      ariaLabel="Loot Chest Found"
      isOpen={isOpen}
      panelClassName={`loot-chest-found-modal ${languageClassName}`}
    >
      <div className="loot-chest-found-modal-content">
        <p
          className={`loot-chest-found-message larger-text ${languageClassName}`}
        >
          {text.message}
        </p>
      </div>
    </Modal>
  );
}

export default LootChestFoundModal;
