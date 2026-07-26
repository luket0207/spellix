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
  language,
  lightBlueUses = null,
  mergedColumns = [],
  onTokenClick = null,
  purpleBuffs = [],
  showOnlyFilledSlots = false,
  spellSlots,
  title = 'Spells',
  titleClassName = '',
  yellowCharged = false,
  yellowUses = null,
}) {
  return (
    <section aria-label="Committed spell slots" className="committed-spell-slot-display">
      {title ? (
        <p
          className={`committed-spell-slot-display-title${
            titleClassName ? ` ${titleClassName}` : ''
          }`}
        >
          {title}
        </p>
      ) : null}
      <ul className="committed-spell-slot-list">
        {spellSlots.map((slot, index) => {
          const columnNumber = index + 1;
          const merge = mergedColumns.find(({ columns = [] }) =>
            columns.includes(columnNumber)
          );

          if (merge?.removedColumn === columnNumber) {
            return null;
          }

          const activeIndex = merge ? merge.activeColumn - 1 : index;
          const activeSlot = spellSlots[activeIndex] ?? slot;
          const displayedColumns = merge?.columns ?? [columnNumber];
          const slotLabel = displayedColumns.join(' and ');
          const consolidatedTokens = consolidateSlotTokens(activeSlot.tokens);
          const isPurpleBuffed = displayedColumns.some(
            (displayedColumn) => purpleBuffs[displayedColumn - 1] > 0
          );

          if (
            showOnlyFilledSlots &&
            !(activeSlot.tokens ?? []).some((token) => token.committed)
          ) {
            return null;
          }

          return (
            <li
              data-column-span={merge ? '2' : '1'}
              key={merge ? `merged-${displayedColumns.join('-')}` : slot.id}
              className={`committed-spell-slot-item${
                merge ? ' committed-spell-slot-item--merged' : ''
              }`}
            >
              <div
                className={`committed-spell-slot-column${
                  isPurpleBuffed ? ' committed-spell-slot-column--purple-buffed' : ''
                }${
                  yellowCharged ? ' committed-spell-slot-column--yellow-charged' : ''
                }`}
              >
                <span className="committed-spell-slot-number">
                  {displayedColumns.join('+')}
                </span>
                <div className="committed-spell-token-stack">
                  {activeSlot.displayLabel ? (
                    <span className="committed-spell-slot-text">{activeSlot.displayLabel}</span>
                  ) : null}
                  {onTokenClick
                    ? (activeSlot.tokens ?? [])
                        .filter((token) => token.committed)
                        .map((token) => (
                          <button
                            aria-label={`Select ${token.type} token ${token.id} in slot ${slotLabel}`}
                            key={token.id}
                            type="button"
                            onClick={() => onTokenClick(token)}
                          >
                            <Token
                              ariaLabel={`${token.type} token in slot ${slotLabel}`}
                              committed
                              focusable={false}
                              language={language}
                              tokenType={token.type}
                            />
                          </button>
                        ))
                    : consolidatedTokens.map(({ count, tokenType }) => {
                    const uses =
                      tokenType === 'light-blue'
                        ? lightBlueUses
                        : tokenType === 'yellow'
                          ? yellowUses
                          : null;
                    const displayCount = Array.isArray(uses)
                      ? Math.max(0, uses[activeIndex] ?? 0)
                      : count;

                    return (
                      <Token
                        key={`${activeSlot.id}-${tokenType}`}
                        ariaLabel={`${displayCount > 1 ? `${displayCount} ` : ''}${tokenType} token${
                          displayCount > 1 ? 's' : ''
                        } in slot ${slotLabel}`}
                        count={displayCount}
                        faded={Array.isArray(uses) && displayCount === 0}
                        language={language}
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
