import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './HealingPotionAnimation.css';

function HealingPotionAnimation({ className = '', onAnimationEnd }) {
  return (
    <FontAwesomeIcon
      aria-label="Healing potion animation"
      className={`healing-potion-animation${className ? ` ${className}` : ''}`}
      icon={faFlask}
      onAnimationEnd={onAnimationEnd}
    />
  );
}

export default HealingPotionAnimation;
