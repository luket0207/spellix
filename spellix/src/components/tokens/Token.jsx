import { useId } from 'react';
import { getTokenDescription, getTokenName } from '../../data/tokens';
import './token.css';

function Token({
  ariaLabel,
  committed = false,
  count = null,
  descriptionId: providedDescriptionId,
  faded = false,
  focusable = true,
  language,
  showName = false,
  showTooltip = true,
  tokenType,
}) {
  const generatedDescriptionId = useId();
  const descriptionId = providedDescriptionId ?? generatedDescriptionId;
  const normalizedLanguage = language === 'jp' ? 'jp' : 'en';
  const description = getTokenDescription(tokenType, normalizedLanguage);
  const tooltipDescription = showTooltip ? description : '';
  const name = getTokenName(tokenType, normalizedLanguage);
  const hasCount = typeof count === 'number' && count > 1;

  return (
    <span className="token-display-wrapper">
      <span
        aria-describedby={tooltipDescription ? descriptionId : undefined}
        aria-label={ariaLabel}
        className={`token-display token-display--glow token-display--${tokenType}${
          committed ? ' token-display--committed' : ''
        }${
          faded ? ' token-display--faded' : ''
        }`}
        role="img"
        style={faded ? { opacity: 0.5 } : undefined}
        tabIndex={tooltipDescription && focusable ? 0 : undefined}
        title={tooltipDescription || undefined}
      >
        {hasCount ? <span className="token-display-count">{count}</span> : null}
      </span>
      {showName && name ? (
        <span className={`token-display-name language-${normalizedLanguage}`}>{name}</span>
      ) : null}
      {tooltipDescription ? (
        <span className="token-display-description" id={descriptionId}>
          {tooltipDescription}
        </span>
      ) : null}
    </span>
  );
}

export default Token;
