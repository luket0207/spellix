import './spells.css';

function SpellToken({ ariaLabel, isLocked = false, tokenType }) {
  return (
    <span
      aria-label={ariaLabel}
      className={`spell-token spell-token--${tokenType}${isLocked ? ' spell-token--locked' : ''}`}
      role="img"
    />
  );
}

export default SpellToken;
