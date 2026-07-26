import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './HealingPotionAnimation.css';

function HealingPotionAnimation({ onAnimationEnd }) {
  return (
    <FontAwesomeIcon
      aria-label="Healing potion animation"
      className="healing-potion-animation"
      icon={faFlask}
      onAnimationEnd={onAnimationEnd}
    />
  );
}

export default HealingPotionAnimation;
