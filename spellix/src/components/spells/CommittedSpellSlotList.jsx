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

function CommittedSpellSlotList({
  lightBlueUses = null,
  purpleBuffs = [],
  spellSlots,
  title = 'Spells',
  yellowCharged = false,
  yellowUses = null,
}) {
  return (
    <section aria-label="Committed spell slots" className="committed-spell-slot-display">
      {title ? <p className="committed-spell-slot-display-title">{title}</p> : null}
      <ul className="committed-spell-slot-list">
        {spellSlots.map((slot, index) => {
          const consolidatedTokens = consolidateSlotTokens(slot.tokens);

          return (
            <li key={slot.id} className="committed-spell-slot-item">
              <div
                className={`committed-spell-slot-column${
                  purpleBuffs[index] > 0 ? ' committed-spell-slot-column--purple-buffed' : ''
                }${
                  yellowCharged ? ' committed-spell-slot-column--yellow-charged' : ''
                }`}
              >
                <span className="committed-spell-slot-number">{index + 1}</span>
                <div className="committed-spell-token-stack">
                  {slot.displayLabel ? (
                    <span className="committed-spell-slot-text">{slot.displayLabel}</span>
                  ) : null}
                  {consolidatedTokens.map(({ count, tokenType }) => {
                    const uses =
                      tokenType === 'light-blue'
                        ? lightBlueUses
                        : tokenType === 'yellow'
                          ? yellowUses
                          : null;

                    return (
                      <Token
                        key={`${slot.id}-${tokenType}`}
                        ariaLabel={`${count > 1 ? `${count} ` : ''}${tokenType} token${
                          count > 1 ? 's' : ''
                        } in slot ${index + 1}`}
                        count={count}
                        faded={Array.isArray(uses) && (uses[index] ?? 0) <= 0}
                        tokenType={tokenType}
                      />
                    );
                  })}
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
