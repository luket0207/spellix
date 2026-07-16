function formatTokenType(tokenType) {
  return tokenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DeathResult({ removedTokens = [] }) {
  if (removedTokens.length === 0) {
    return <p>No tokens were removed because only starting tokens remained.</p>;
  }

  return (
    <ul aria-label="Removed tokens">
      {removedTokens.map(({ columnNumber, token }, index) => (
        <li key={`${token.id}-${index}`}>
          {`A ${formatTokenType(token.type)} token was removed from column ${columnNumber}.`}
        </li>
      ))}
    </ul>
  );
}

export default DeathResult;
