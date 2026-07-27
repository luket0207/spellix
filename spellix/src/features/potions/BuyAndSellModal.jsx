import { useState } from 'react';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import Token from '../../components/tokens/Token';
import { getGameplayLanguage } from '../../i18n/translations';
import { generateBuyAndSellTokenChoices } from './buyAndSell';
import './BuyAndSellModal.css';

function BuyAndSellModal({
  isOpen,
  language = 'en',
  onChoose,
  onClose,
  onComplete,
  onDiscard,
  tokenBag = [],
  transaction = null,
}) {
  const [selectedTokenIds, setSelectedTokenIds] = useState([]);
  const activeLanguage = getGameplayLanguage(language);
  const isJapanese = activeLanguage === 'jp';
  const languageClassName = `language-${activeLanguage}`;

  const closeSelection = () => {
    setSelectedTokenIds([]);
    onClose?.();
  };
  const toggleToken = (tokenId) => {
    setSelectedTokenIds((currentIds) =>
      currentIds.includes(tokenId)
        ? currentIds.filter((currentId) => currentId !== tokenId)
        : currentIds.length < 3
          ? [...currentIds, tokenId]
          : currentIds
    );
  };
  const discardSelectedTokens = () => {
    if (selectedTokenIds.length !== 3) {
      return;
    }

    onDiscard?.(
      selectedTokenIds,
      generateBuyAndSellTokenChoices()
    );
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

  if (transaction?.status === 'success') {
    return (
      <Modal
        actions={okAction(onComplete)}
        ariaLabel="Buy and Sell"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {isJapanese
            ? 'トークンがトークンバッグに追加されました。'
            : 'The token was added to your token bag'}
        </p>
      </Modal>
    );
  }

  if (transaction?.status === 'choosing') {
    return (
      <Modal ariaLabel="Buy and Sell" isOpen={isOpen}>
        <p className={`buy-and-sell-reward-instruction larger-text ${languageClassName}`}>
          {isJapanese
            ? 'トークンバッグに追加するトークンを選んでください。'
            : 'Choose a token to add to your token bag'}
        </p>
        <div className="buy-and-sell-reward-grid">
          {transaction.rewardTokenTypes.map((tokenType, index) => (
            <div
              aria-label={`Reward token option ${index + 1}`}
              className="buy-and-sell-reward-option"
              key={tokenType}
              role="group"
            >
              <Token
                ariaLabel={`${tokenType} reward token`}
                language={activeLanguage}
                showName
                tokenType={tokenType}
              />
              <Button
                className={languageClassName}
                type="button"
                onClick={() => onChoose?.(tokenType)}
              >
                {isJapanese ? '選ぶ' : 'Choose'}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  if (tokenBag.length < 3) {
    return (
      <Modal
        actions={okAction(closeSelection)}
        ariaLabel="Buy and Sell"
        isOpen={isOpen}
      >
        <p className={`larger-text ${languageClassName}`}>
          {isJapanese
            ? 'トークンバッグのトークンが足りないため、このポーションは使用できません。'
            : 'You do not have enough tokens in your token bag to cast this potion'}
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      actions={
        <>
          <Button
            className={languageClassName}
            disabled={selectedTokenIds.length !== 3}
            type="button"
            variant="secondary"
            onClick={discardSelectedTokens}
          >
            {isJapanese ? '捨てる' : 'Discard'}
          </Button>
          <Button
            className={languageClassName}
            type="button"
            variant="secondary"
            onClick={closeSelection}
          >
            {isJapanese ? 'キャンセル' : 'Cancel'}
          </Button>
        </>
      }
      ariaLabel="Buy and Sell"
      isOpen={isOpen}
    >
      <p className={`larger-text ${languageClassName}`}>
        {isJapanese
          ? 'トークンバッグからトークンを3個捨てて、新しいトークンを1個獲得してください。'
          : 'Discard 3 tokens from your token bag to receive a new token'}
      </p>
      <div className="buy-and-sell-token-grid">
        {tokenBag.map((token) => {
          const isSelected = selectedTokenIds.includes(token.id);

          return (
            <button
              aria-label={`Select ${token.type} bag token ${token.id}`}
              aria-pressed={isSelected}
              className={`buy-and-sell-token-select${
                isSelected ? ' is-selected' : ''
              }`}
              disabled={!isSelected && selectedTokenIds.length === 3}
              key={token.id}
              type="button"
              onClick={() => toggleToken(token.id)}
            >
              <Token
                ariaLabel={`${token.type} bag token`}
                focusable={false}
                language={activeLanguage}
                showName
                showTooltip={false}
                tokenType={token.type}
              />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export default BuyAndSellModal;
