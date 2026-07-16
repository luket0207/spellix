import PotionIcon from '../../components/potions/PotionIcon';

function PotionList({ potions = [] }) {
  return (
    <section aria-label="Potions">
      <h2>Potions</h2>
      {potions.length === 0 ? (
        <p>No potions</p>
      ) : (
        <ul>
          {potions.map((potion, index) => (
            <li key={`${potion.id}-${index}`}>
              <PotionIcon potion={potion} />
              <p>{`${potion.rarity} | ${potion.availability}`}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PotionList;
