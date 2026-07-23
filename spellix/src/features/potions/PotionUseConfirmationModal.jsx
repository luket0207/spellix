import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getPotionDescription, getPotionName } from '../../data/potions';
import {
  getGameplayLanguage,
  getPotionUsageTranslations,
} from '../../i18n/translations';

function PotionUseConfirmationModal({
  isOpen,
  language = 'en',
  onCancel,
  onConfirm,
  potion,
}) {
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;
  const translations = getPotionUsageTranslations(activeLanguage);

  if (!potion) {
    return null;
  }

  const potionName = getPotionName(potion, activeLanguage);

  return (
    <Modal
      actions={
        <>
          <Button
            className={languageClassName}
            type="button"
            variant="secondary"
            onClick={onConfirm}
          >
            {translations.yes}
          </Button>
          <Button
            className={languageClassName}
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {translations.no}
          </Button>
        </>
      }
      ariaLabel="Use potion confirmation"
      isOpen={isOpen}
    >
      <p className={`larger-text ${languageClassName}`}>
        {translations.confirmUse(potionName)}
      </p>
      <p className={languageClassName}>{translations.descriptionTitle}</p>
      <p className={languageClassName}>
        {getPotionDescription(potion, activeLanguage)}
      </p>
    </Modal>
  );
}

export default PotionUseConfirmationModal;
