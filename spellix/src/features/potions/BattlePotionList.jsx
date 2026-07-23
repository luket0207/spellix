import Button from '../../components/common/Button/Button';
import PotionIcon from '../../components/potions/PotionIcon';
import { getPotionName } from '../../data/potions';
import { getGameplayLanguage } from '../../i18n/translations';
import { canUsePotionInContext } from './potionUsage';
import './PotionUsage.css';

function BattlePotionList({
  disabled = false,
  language = 'en',
  onUsePotion,
  potions = [],
  useText = 'Use',
}) {
  const activeLanguage = getGameplayLanguage(language);
  const usablePotions = potions
    .map((potion, index) => ({ index, potion }))
    .filter(({ potion }) => canUsePotionInContext(potion, 'battle'));

  if (usablePotions.length === 0) {
    return null;
  }

  return (
    <section aria-label="Battle potions" className="battle-potion-section">
      {usablePotions.map(({ index, potion }) => (
        <div className="battle-potion-card" key={`${potion.id}-${index}`}>
          <div className="battle-potion-icon-row">
            <PotionIcon
              language={activeLanguage}
              potion={potion}
              showName={false}
            />
          </div>
          <div className={`battle-potion-name language-${activeLanguage}`}>
            {getPotionName(potion, activeLanguage)}
          </div>
          <div className="battle-potion-button-row">
            <Button
              className={`language-${activeLanguage}`}
              disabled={disabled}
              type="button"
              onClick={() => onUsePotion(potion, index)}
            >
              {useText}
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}

export default BattlePotionList;
