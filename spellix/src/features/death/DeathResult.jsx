import Token from '../../components/tokens/Token';
import { getTokenName } from '../../data/tokens';
import './DeathResult.css';

function formatTokenType(tokenType) {
  return tokenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DeathResult({ language = 'en', removedTokens = [] }) {
  const currentLanguage = language === 'jp' ? 'jp' : 'en';
  const isJapanese = currentLanguage === 'jp';
  const languageClassName = `language-${currentLanguage}`;

  if (removedTokens.length === 0) {
    return (
      <p className={`death-result-empty ${languageClassName}`}>
        {isJapanese
          ? '初期トークンしか残っていないため、トークンは取り除かれませんでした。'
          : 'No tokens were removed because only starting tokens remained.'}
      </p>
    );
  }

  return (
    <div
      aria-label={isJapanese ? '取り除かれたトークン' : 'Removed tokens'}
      className={`death-result-token-list ${languageClassName}`}
    >
      {removedTokens.map(({ columnNumber, token }, index) => (
        <div
          className="death-result-token-row"
          data-testid="death-result-token-row"
          key={`${token.id}-${index}`}
        >
          <Token
            ariaLabel={`${formatTokenType(token.type)} removed token`}
            focusable={false}
            language={currentLanguage}
            showName={false}
            showTooltip={false}
            tokenType={token.type}
          />
          <div className={`death-result-token-text ${languageClassName}`}>
            {isJapanese
              ? `${getTokenName(token.type, currentLanguage)}トークンが列${columnNumber}から取り除かれました。`
              : `A ${formatTokenType(token.type)} token was removed from column ${columnNumber}.`}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DeathResult;
