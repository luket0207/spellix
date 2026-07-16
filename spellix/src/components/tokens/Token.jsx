import { useId } from 'react';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import './token.css';

function Token({
  ariaLabel,
  committed = false,
  count = null,
  descriptionId: providedDescriptionId,
  faded = false,
  focusable = true,
  tokenType,
}) {
  const generatedDescriptionId = useId();
  const descriptionId = providedDescriptionId ?? generatedDescriptionId;
  const description = TOKEN_DEFINITIONS[tokenType]?.description;
  const hasCount = typeof count === 'number' && count > 1;

  return (
    <>
      <span
        aria-describedby={description ? descriptionId : undefined}
        aria-label={ariaLabel}
        className={`token-display token-display--glow token-display--${tokenType}${
          committed ? ' token-display--committed' : ''
        }${
          faded ? ' token-display--faded' : ''
        }`}
        role="img"
        style={faded ? { opacity: 0.5 } : undefined}
        tabIndex={description && focusable ? 0 : undefined}
        title={description}
      >
        {hasCount ? <span className="token-display-count">{count}</span> : null}
      </span>
      {description ? (
        <span className="token-display-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
    </>
  );
}

export default Token;
