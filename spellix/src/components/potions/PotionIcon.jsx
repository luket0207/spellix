import { useId } from 'react';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './potionIcon.css';

function PotionIcon({ focusable = true, potion }) {
  const descriptionId = useId();

  return (
    <span
      aria-describedby={descriptionId}
      aria-label={`${potion.name} potion`}
      className={`potion-icon potion-icon--glow potion-icon--${potion.colour}`}
      role="group"
      tabIndex={focusable ? 0 : undefined}
    >
      <span aria-hidden="true" className="potion-icon-flask potion-icon-flask--glow">
        <FontAwesomeIcon icon={faFlask} />
      </span>
      <span className="potion-icon-name">{potion.name}</span>
      <span className="potion-icon-tooltip" id={descriptionId} role="tooltip">
        {potion.description}
      </span>
    </span>
  );
}

export default PotionIcon;
