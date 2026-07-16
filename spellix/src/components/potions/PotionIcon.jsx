import { useId } from 'react';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getPotionDescription, getPotionName } from '../../data/potions';
import './potionIcon.css';

function PotionIcon({ focusable = true, language = 'en', potion }) {
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
      <span aria-hidden="true" className="potion-icon-flask potion-icon-flask--glow">
        <FontAwesomeIcon icon={faFlask} />
      </span>
      <span className={`potion-icon-name language-${activeLanguage}`}>{name}</span>
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
