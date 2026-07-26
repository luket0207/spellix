import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import Token from '../../components/tokens/Token';
import {
  getGameplayLanguage,
  getPotionUsageTranslations,
} from '../../i18n/translations';
import './CopyPasteModal.css';

function CopyPasteTokenOption({
  buttonText,
  language,
  onClick,
  token,
  tokenAriaLabel,
}) {
  return (
    <div className="copy-paste-token-option">
      <Token
        ariaLabel={tokenAriaLabel ?? `${token.type} token`}
        language={language}
        showName
        tokenType={token.type}
      />
      <Button
        className={`language-${language}`}
        type="button"
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </div>
  );
}

function CopyPasteModal({
  duplicateToken = null,
  isOpen,
  language = 'en',
  onClose,
  onDiscardDuplicate,
  onDuplicate,
  onReplaceToken,
  tokenBag = [],
}) {
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;
  const translations = getPotionUsageTranslations(activeLanguage);

  if (tokenBag.length === 0) {
    return (
      <Modal
        actions={
          <Button
            className={languageClassName}
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            OK
          </Button>
        }
        ariaLabel="Copy and Paste"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {translations.copyPasteEmptyBag}
        </p>
      </Modal>
    );
  }

  return (
    <Modal ariaLabel="Copy and Paste" isOpen={isOpen}>
      <div className="copy-paste-token-modal-content">
        <div className="copy-paste-token-list">
          {duplicateToken ? (
            <>
              <CopyPasteTokenOption
                buttonText={translations.copyPasteDiscardDuplicate}
                language={activeLanguage}
                onClick={onDiscardDuplicate}
                token={duplicateToken}
                tokenAriaLabel={`${duplicateToken.type} token duplicate`}
              />
              {tokenBag.map((token) => (
                <CopyPasteTokenOption
                  buttonText={translations.copyPasteDiscardExisting}
                  key={token.id}
                  language={activeLanguage}
                  onClick={() => onReplaceToken(token)}
                  token={token}
                />
              ))}
            </>
          ) : (
            tokenBag.map((token) => (
              <CopyPasteTokenOption
                buttonText={translations.copyPasteDuplicate}
                key={token.id}
                language={activeLanguage}
                onClick={() => onDuplicate(token)}
                token={token}
              />
            ))
          )}
        </div>
        <div className="copy-paste-cancel-row">
          <Button
            className={languageClassName}
            type="button"
            onClick={onClose}
          >
            {translations.copyPasteCancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CopyPasteModal;
