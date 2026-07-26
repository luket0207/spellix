import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import {
  getGameplayLanguage,
  getPotionUsageTranslations,
} from '../../i18n/translations';
import './RollChoiceModal.css';

function RollChoiceModal({ isOpen, language = 'en', onSelect }) {
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;
  const translations = getPotionUsageTranslations(activeLanguage);

  return (
    <Modal ariaLabel="Roll Choice" isOpen={isOpen}>
      <p className={`larger-text ${languageClassName}`}>
        {translations.rollChoiceQuestion}
      </p>
      <div className="roll-choice-buttons">
        {[1, 2, 3, 4, 5, 6].map((value) => (
          <Button
            className="language-en"
            key={value}
            type="button"
            onClick={() => onSelect(value)}
          >
            {value}
          </Button>
        ))}
      </div>
    </Modal>
  );
}

export default RollChoiceModal;
