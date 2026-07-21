function formatTokenType(tokenType) {
  return tokenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DeathResult({ language = 'en', removedTokens = [] }) {
  const isJapanese = language === 'jp';

  if (removedTokens.length === 0) {
    return (
      <p>
        {isJapanese
          ? '初期トークンしか残っていないため、トークンは取り除かれませんでした。'
          : 'No tokens were removed because only starting tokens remained.'}
      </p>
    );
  }

  return (
    <ul aria-label={isJapanese ? '取り除かれたトークン' : 'Removed tokens'}>
      {removedTokens.map(({ columnNumber, token }, index) => (
        <li key={`${token.id}-${index}`}>
          {isJapanese
            ? `${formatTokenType(token.type)}トークンが列${columnNumber}から取り除かれました。`
            : `A ${formatTokenType(token.type)} token was removed from column ${columnNumber}.`}
        </li>
      ))}
    </ul>
  );
}

export default DeathResult;
