import PotionIcon from '../../components/potions/PotionIcon';
import { POTION_MAX_CAPACITY } from './potionCapacity';
import './PotionList.css';

function PotionList({ language = 'en', languageClassName = '', potions = [], title = 'Potions' }) {
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
          </div>
        ))}
      </div>
    </section>
  );
}

export default PotionList;
