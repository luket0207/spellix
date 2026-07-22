import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import {
  getGameplayLanguage,
  getSpellAssignmentTranslations,
} from '../../i18n/translations';

function SpellMergeConfirmationModal({
  isOpen,
  language,
  merge,
  onCancel,
  onConfirm,
}) {
  const currentLanguage = getGameplayLanguage(language);
  const translations = getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const [firstColumn, secondColumn] = merge?.columns ?? [];

  return (
    <Modal
      actions={
        <>
          <Button
            className={languageClassName}
            onClick={onConfirm}
            type="button"
            variant="secondary"
          >
            {translations.yes}
          </Button>
          <Button
            className={languageClassName}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {translations.no}
          </Button>
        </>
      }
      ariaLabel="Merge columns confirmation"
      isOpen={isOpen && Boolean(merge)}
      panelClassName={languageClassName}
    >
      {merge ? (
        <p className={`larger-text ${languageClassName}`}>
          {translations.mergeConfirmation(
            firstColumn,
            secondColumn,
            merge.removedColumn
          )}
        </p>
      ) : null}
    </Modal>
  );
}

export default SpellMergeConfirmationModal;
