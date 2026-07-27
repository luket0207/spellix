import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import { getGameplayLanguage } from '../../i18n/translations';

function DevineChanceResultModal({
  healedGroup,
  isOpen,
  language = 'en',
  onContinue,
}) {
  const currentLanguage = getGameplayLanguage(language);
  const isJapanese = currentLanguage === 'jp';
  const languageClassName = `language-${currentLanguage}`;
  const healedOthers = healedGroup === 'others';

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
      ariaLabel="Devine Chance result"
      isOpen={isOpen}
    >
      <p className={`larger-text ${languageClassName}`}>
        {isJapanese
          ? healedOthers
            ? '他の全員のHPを回復させました。'
            : 'HPが全回復しました。'
          : healedOthers
            ? 'You helped everyone else recover'
            : 'You recovered all your health'}
      </p>
    </Modal>
  );
}

export default DevineChanceResultModal;
