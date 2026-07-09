import SpellToken from './SpellToken';
import './spells.css';

function CommittedSpellSlots({ spellSlots }) {
  return (
    <section aria-label="Committed spell slots" className="committed-spells">
      <p>Spells</p>
      <ul className="committed-spell-slot-list">
        {spellSlots.map((slot, index) => (
          <li key={slot.id} className="committed-spell-slot-item">
            <div className="spell-drop-zone spell-drop-zone--read-only committed-spell-drop-zone">
              <span className="committed-spell-slot-number">{index + 1}</span>
              {slot.tokens.length > 0 ? (
                slot.tokens.map((token) => (
                  <SpellToken
                    key={token.id}
                    ariaLabel={`${token.type} token in slot ${index + 1}`}
                    isLocked
                    tokenType={token.type}
                  />
                ))
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CommittedSpellSlots;
