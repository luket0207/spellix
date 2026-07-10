import './token.css';

function Token({ ariaLabel, count = null, tokenType }) {
  const hasCount = typeof count === 'number' && count > 1;

  return (
    <span
      aria-label={ariaLabel}
      className={`token-display token-display--${tokenType}`}
      role="img"
    >
      {hasCount ? <span className="token-display-count">{count}</span> : null}
    </span>
  );
}

export default Token;
