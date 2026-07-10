import Token from '../tokens/Token';
import './committedSpellSlotList.css';

function consolidateSlotTokens(tokens = []) {
  const consolidatedTokens = new Map();

  tokens.forEach((token) => {
    const entry = consolidatedTokens.get(token.type);

    if (entry) {
      entry.count += 1;
      return;
    }

    consolidatedTokens.set(token.type, {
      count: 1,
      tokenType: token.type,
    });
  });

  return Array.from(consolidatedTokens.values());
}

function CommittedSpellSlotList({ spellSlots, title = 'Spells' }) {
  return (
    <section aria-label="Committed spell slots" className="committed-spell-slot-display">
      <p className="committed-spell-slot-display-title">{title}</p>
      <ul className="committed-spell-slot-list">
        {spellSlots.map((slot, index) => {
          const consolidatedTokens = consolidateSlotTokens(slot.tokens);

          return (
            <li key={slot.id} className="committed-spell-slot-item">
              <div className="committed-spell-slot-column">
                <span className="committed-spell-slot-number">{index + 1}</span>
                <div className="committed-spell-token-stack">
                  {consolidatedTokens.map(({ count, tokenType }) => (
                    <Token
                      key={`${slot.id}-${tokenType}`}
                      ariaLabel={`${count > 1 ? `${count} ` : ''}${tokenType} token${
                        count > 1 ? 's' : ''
                      } in slot ${index + 1}`}
                      count={count}
                      tokenType={tokenType}
                    />
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CommittedSpellSlotList;
