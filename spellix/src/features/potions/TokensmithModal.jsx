import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import Token from '../../components/tokens/Token';
import CommittedSpellSlots from '../spells/CommittedSpellSlots';
import {
  getGameplayLanguage,
  getPotionUsageTranslations,
} from '../../i18n/translations';
import { canAddTokenToBag } from '../debug/tokenBagAdmin';
import { createTokensmithMove } from './tokensmith';

function TokensmithModal({
  isOpen,
  language = 'en',
  mergedColumns = [],
  onClose,
  onConfirm,
  spellSlots = [],
  tokenBag = [],
}) {
  const [hasInvalidSpellState, setHasInvalidSpellState] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;
  const translations = getPotionUsageTranslations(activeLanguage);
  const hasAssignedTokens = spellSlots.some((slot) =>
    (slot.tokens ?? []).some((token) => token.committed)
  );
  const closeModal = () => {
    setHasInvalidSpellState(false);
    setSelectedToken(null);
    onClose?.();
  };
  const returnToSelection = () => {
    setHasInvalidSpellState(false);
    setSelectedToken(null);
  };
  const confirmSelection = () => {
    const move = createTokensmithMove({
      mergedColumns,
      spellSlots,
      tokenBag,
      tokenId: selectedToken?.id,
    });

    if (move.status === 'invalid-spell-state') {
      setSelectedToken(null);
      setHasInvalidSpellState(true);
      return;
    }

    if (move.status !== 'moved') {
      closeModal();
      return;
    }

    const tokenId = selectedToken.id;
    setSelectedToken(null);
    onConfirm?.(tokenId);
  };
  const okAction = (onClick) => (
    <Button
      className={languageClassName}
      type="button"
      variant="secondary"
      onClick={onClick}
    >
      OK
    </Button>
  );

  if (!canAddTokenToBag(tokenBag)) {
    return (
      <Modal
        actions={okAction(closeModal)}
        ariaLabel="Tokensmith"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {translations.tokensmithFullBag}
        </p>
      </Modal>
    );
  }

  if (!hasAssignedTokens) {
    return (
      <Modal
        actions={okAction(closeModal)}
        ariaLabel="Tokensmith"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {translations.tokensmithNoAssignedTokens}
        </p>
      </Modal>
    );
  }

  if (hasInvalidSpellState) {
    return (
      <Modal
        actions={okAction(returnToSelection)}
        ariaLabel="Tokensmith invalid spell state"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {translations.tokensmithInvalidSpellState}
        </p>
      </Modal>
    );
  }

  if (selectedToken) {
    return (
      <Modal
        actions={
          <>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={confirmSelection}
            >
              {translations.yes}
            </Button>
            <Button
              className={languageClassName}
              type="button"
              variant="secondary"
              onClick={returnToSelection}
            >
              {translations.no}
            </Button>
          </>
        }
        ariaLabel="Tokensmith confirmation"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {translations.tokensmithConfirmation}
        </p>
        <Token
          ariaLabel={`selected ${selectedToken.type} token`}
          committed
          language={activeLanguage}
          showName
          tokenType={selectedToken.type}
        />
      </Modal>
    );
  }

  return (
    <Modal ariaLabel="Tokensmith" isOpen={isOpen}>
      <p className={`larger-text ${languageClassName}`}>
        {translations.tokensmithInstruction}
      </p>
      <CommittedSpellSlots
        language={activeLanguage}
        mergedColumns={mergedColumns}
        onTokenClick={setSelectedToken}
        showOnlyFilledSlots
        spellSlots={spellSlots}
        title=""
      />
    </Modal>
  );
}

export default TokensmithModal;
