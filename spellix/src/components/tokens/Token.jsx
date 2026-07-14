import './token.css';

function Token({ ariaLabel, count = null, faded = false, tokenType }) {
  const hasCount = typeof count === 'number' && count > 1;

  return (
    <span
      aria-label={ariaLabel}
      className={`token-display token-display--${tokenType}${
        faded ? ' token-display--faded' : ''
      }`}
      role="img"
      style={faded ? { opacity: 0.5 } : undefined}
    >
      {hasCount ? <span className="token-display-count">{count}</span> : null}
    </span>
  );
}

export default Token;
