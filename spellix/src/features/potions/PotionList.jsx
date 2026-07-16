import PotionIcon from '../../components/potions/PotionIcon';

function PotionList({ language = 'en', languageClassName = '', potions = [], title = 'Potions' }) {
  return (
    <section aria-label={title}>
      <h2 className={languageClassName}>{title}</h2>
      {potions.length === 0 ? (
        <p>No potions</p>
      ) : (
        <ul>
          {potions.map((potion, index) => (
            <li key={`${potion.id}-${index}`}>
              <PotionIcon language={language} potion={potion} />
              <p>{`${potion.rarity} | ${potion.availability}`}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PotionList;
