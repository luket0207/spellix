import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getGameplayLanguage } from '../../i18n/translations';

function StormMasterResultModal({
  isOpen,
  language = 'en',
  onContinue,
  resultType,
}) {
  const currentLanguage = getGameplayLanguage(language);
  const isJapanese = currentLanguage === 'jp';
  const languageClassName = `language-${currentLanguage}`;
  const isMovementBlocked = resultType === 'movement-blocked';

  return (
    <Modal
      actions={
        <Button
          className={languageClassName}
          type="button"
          variant="secondary"
          onClick={onContinue}
        >
          {isJapanese ? '続ける' : 'Continue'}
        </Button>
      }
      ariaLabel="Storm Master result"
      isOpen={isOpen}
    >
      <p className={`larger-text ${languageClassName}`}>
        {isJapanese
          ? isMovementBlocked
            ? '嵐のせいで移動できません。'
            : '嵐の標的になりました。'
          : isMovementBlocked
            ? 'The storm prevents you from moving'
            : 'The storm targeted you'}
      </p>
    </Modal>
  );
}

export default StormMasterResultModal;
