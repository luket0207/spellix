import { useId } from 'react';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getPotionDescription, getPotionName } from '../../data/potions';
import './potionIcon.css';

function PotionIcon({
  focusable = true,
  iconOverlay = null,
  language = 'en',
  potion,
  showName = true,
}) {
  const descriptionId = useId();
  const activeLanguage = language === 'jp' ? 'jp' : 'en';
  const description = getPotionDescription(potion, activeLanguage);
  const name = getPotionName(potion, activeLanguage);

  return (
    <span
      aria-describedby={descriptionId}
      aria-label={`${name} potion`}
      className={`potion-icon potion-icon--glow potion-icon--${potion.colour}`}
      role="group"
      tabIndex={focusable ? 0 : undefined}
    >
      <span
        aria-hidden={iconOverlay ? undefined : 'true'}
        className="potion-icon-flask potion-icon-flask--glow"
      >
        <FontAwesomeIcon icon={faFlask} />
        {iconOverlay}
      </span>
      {showName ? (
        <span className={`potion-icon-name language-${activeLanguage}`}>{name}</span>
      ) : null}
      <span
        className={`potion-icon-tooltip language-${activeLanguage}`}
        id={descriptionId}
        role="tooltip"
      >
        {description}
      </span>
    </span>
  );
}

export default PotionIcon;
