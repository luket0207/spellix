import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import PotionIcon from '../../components/potions/PotionIcon';
import { getGameplayLanguage } from '../../i18n/translations';
import './CauldronChoiceModal.css';

function CauldronChoiceModal({
  choices = [],
  isOpen,
  language = 'en',
  onChoose,
}) {
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;

  return (
    <Modal ariaLabel="Cauldron choices" isOpen={isOpen}>
      <p className={`cauldron-choice-title larger-text ${languageClassName}`}>
        {activeLanguage === 'jp'
          ? '獲得する新しいポーションを選んでください。'
          : 'Choose a new potion to gain'}
      </p>
      <div className="cauldron-choice-list">
        {choices.map((potion, index) => (
          <div
            aria-label={`Cauldron potion option ${index + 1}`}
            className="cauldron-choice-card"
            key={potion.id}
            role="group"
          >
            <PotionIcon language={activeLanguage} potion={potion} />
            <Button
              className={languageClassName}
              type="button"
              onClick={() => onChoose?.(potion)}
            >
              {activeLanguage === 'jp' ? '選ぶ' : 'Choose'}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default CauldronChoiceModal;
