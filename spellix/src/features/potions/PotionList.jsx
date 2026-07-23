import Button from '../../components/common/Button/Button';
import PotionIcon from '../../components/potions/PotionIcon';
import { POTION_MAX_CAPACITY } from './potionCapacity';
import { canUsePotionInContext } from './potionUsage';
import './PotionList.css';

function PotionList({
  context,
  language = 'en',
  languageClassName = '',
  onUsePotion,
  potions = [],
  title = 'Potions',
  useText = 'Use',
}) {
  return (
    <section aria-label={title} className="potions-area">
      <div className="potions-area-header">
        <h2 className={languageClassName}>{title}</h2>
        <span className="potions-capacity">{`${potions.length}/${POTION_MAX_CAPACITY}`}</span>
      </div>

      <div className="potions-list">
        {potions.map((potion, index) => (
          <div className="potion-slot" key={`${potion.id}-${index}`}>
            <PotionIcon language={language} potion={potion} />
            {context ? (
              <div className="potion-use-button-space">
                {canUsePotionInContext(potion, context) ? (
                  <Button
                    className={languageClassName}
                    type="button"
                    onClick={() => onUsePotion(potion, index)}
                  >
                    {useText}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PotionList;
