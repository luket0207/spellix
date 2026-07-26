import PotionIcon from '../../components/potions/PotionIcon';
import './PotionList.css';

function ActivePotionSection({
  activePotion,
  language = 'en',
  languageClassName = '',
  title = 'Active Potion',
}) {
  if (!activePotion) {
    return null;
  }

  return (
    <section aria-label={title} className="active-potion-section">
      <h2 className={`active-potion-title ${languageClassName}`}>{title}</h2>
      <div className="active-potion-content">
        <PotionIcon
          iconOverlay={
            activePotion.id === 'roll-choice' &&
            Number.isInteger(activePotion.chosenRoll) ? (
              <span
                aria-label={`Chosen roll ${activePotion.chosenRoll}`}
                className="active-potion-chosen-roll language-en"
              >
                {activePotion.chosenRoll}
              </span>
            ) : null
          }
          language={language}
          potion={activePotion}
        />
      </div>
    </section>
  );
}

export default ActivePotionSection;
