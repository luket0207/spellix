import { render, screen, within } from '@testing-library/react';
import CommittedSpellSlotList from '../../components/spells/CommittedSpellSlotList';
import CommittedSpellSlots from './CommittedSpellSlots';
import { applyColumnMerge } from './nonBattleSpellEffects';

function createSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens:
      index === 0
        ? [
            { id: 'red-1', type: 'red', committed: true },
            { id: 'blue-1', type: 'blue', committed: true },
          ]
        : [],
  }));
}

describe('CommittedSpellSlots', () => {
  test('renders the committed spells display through the reusable shared component with six numbered slots', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const display = container.querySelector('.committed-spell-slot-display');
    const slotNumbers = Array.from(container.querySelectorAll('.committed-spell-slot-number'));

    expect(display).not.toBeNull();
    expect(display).toHaveClass('committed-spell-slot-display');
    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(screen.queryByText(/Committed spell slots/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Slot [1-6]$/i)).not.toBeInTheDocument();
    expect(slotNumbers).toHaveLength(6);
    expect(slotNumbers.map((slotNumber) => slotNumber.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  test('consolidates duplicate committed tokens by type without mutating slot data', () => {
    const spellSlots = createSpellSlots();

    spellSlots[0].tokens.push({ id: 'red-2', type: 'red', committed: true });

    const { container } = render(<CommittedSpellSlots spellSlots={spellSlots} />);

    const committedDisplay = container.querySelector('.committed-spell-slot-display');
    const slotList = container.querySelector('.committed-spell-slot-list');
    const firstSlot = container.querySelector('.committed-spell-slot-item');
    const firstColumn = container.querySelector('.committed-spell-slot-column');

    expect(committedDisplay).toHaveClass('committed-spell-slot-display');
    expect(slotList).toHaveClass('committed-spell-slot-list');
    expect(firstSlot).toHaveClass('committed-spell-slot-item');
    expect(firstColumn).toHaveClass('committed-spell-slot-column');
    expect(firstColumn.querySelector('.committed-spell-slot-number')).not.toBeNull();
    expect(screen.getByLabelText('2 red tokens in slot 1')).toBeInTheDocument();
    expect(screen.getByLabelText('blue token in slot 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('red token in slot 1')).not.toBeInTheDocument();
    expect(spellSlots[0].tokens).toHaveLength(3);
  });

  test('can render up to seven consolidated token entries inside one committed slot', () => {
    const spellSlots = createSpellSlots();

    spellSlots[0].tokens = [
      { id: 'red-1', type: 'red', committed: true },
      { id: 'blue-1', type: 'blue', committed: true },
      { id: 'orange-1', type: 'orange', committed: true },
      { id: 'green-1', type: 'green', committed: true },
      { id: 'purple-1', type: 'purple', committed: true },
      { id: 'yellow-1', type: 'yellow', committed: true },
      { id: 'grey-1', type: 'grey', committed: true },
    ];

    const { container } = render(<CommittedSpellSlots spellSlots={spellSlots} />);
    const firstStack = container.querySelector('.committed-spell-token-stack');

    expect(firstStack.querySelectorAll('.token-display')).toHaveLength(7);
    expect(spellSlots[0].tokens).toHaveLength(7);
  });

  test('keeps no-effect battle token colours visible in committed spell slots', () => {
    const spellSlots = createSpellSlots();
    const noEffectTokenTypes = ['light-green', 'black', 'white', 'grey'];

    spellSlots[0].tokens = noEffectTokenTypes.map((type) => ({
      committed: true,
      id: `${type}-1`,
      type,
    }));

    render(<CommittedSpellSlots spellSlots={spellSlots} />);

    noEffectTokenTypes.forEach((type) => {
      expect(screen.getByLabelText(`${type} token in slot 1`)).toBeInTheDocument();
    });
  });

  test('localizes committed token tooltips without showing token names', () => {
    render(<CommittedSpellSlots language="jp" spellSlots={createSpellSlots()} />);

    expect(screen.getByLabelText('red token in slot 1')).toHaveAttribute(
      'title',
      'ダメージ\nダメージ＋10'
    );
    expect(screen.queryByText('ダメージ')).not.toBeInTheDocument();
    expect(screen.queryByText('ガード')).not.toBeInTheDocument();
  });

  test('keeps empty committed spell slots visible without placeholder text', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const columns = container.querySelectorAll('.committed-spell-slot-column');

    expect(screen.queryByText(/No committed tokens/i)).not.toBeInTheDocument();
    expect(columns).toHaveLength(6);
    expect(columns[1].querySelector('.committed-spell-slot-number')).not.toBeNull();
    expect(columns[1].querySelector('.token-display')).toBeNull();
  });

  test('renders a merged column across two original tracks with the retained tokens', () => {
    const draftSpellSlots = createSpellSlots();
    draftSpellSlots[1].tokens = [
      { committed: true, id: 'white-2', type: 'white' },
      { committed: true, id: 'red-2', type: 'red' },
    ];
    draftSpellSlots[2].tokens = [
      { committed: true, id: 'white-3', type: 'white' },
    ];
    const mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];
    const spellSlots = applyColumnMerge(draftSpellSlots, mergedColumns[0]);
    const { container } = render(
      <CommittedSpellSlots mergedColumns={mergedColumns} spellSlots={spellSlots} />
    );

    const mergedColumn = screen.getByText('2+3').closest('.committed-spell-slot-item');

    expect(mergedColumn).toHaveClass('committed-spell-slot-item--merged');
    expect(mergedColumn).toHaveAttribute('data-column-span', '2');
    expect(within(mergedColumn).getByLabelText('red token in slot 2 and 3')).toBeInTheDocument();
    expect(within(mergedColumn).queryByLabelText('white token in slot 2 and 3')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.committed-spell-slot-item')).toHaveLength(5);
  });

  test('optionally marks only Purple-buffed columns without changing the default display', () => {
    const spellSlots = createSpellSlots();
    const { container, rerender } = render(
      <CommittedSpellSlotList purpleBuffs={[5, 0, 10, 0, 0, 0]} spellSlots={spellSlots} />
    );

    const markedColumns = container.querySelectorAll(
      '.committed-spell-slot-column--purple-buffed'
    );

    expect(markedColumns).toHaveLength(2);
    expect(markedColumns[0]).toHaveTextContent('1');
    expect(markedColumns[1]).toHaveTextContent('3');

    rerender(<CommittedSpellSlots spellSlots={spellSlots} />);
    expect(container.querySelector('.committed-spell-slot-column--purple-buffed')).toBeNull();
  });

  test('marks a Purple-buffed merged column once from its active slot', () => {
    const spellSlots = createSpellSlots();
    const mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];
    const { container } = render(
      <CommittedSpellSlotList
        mergedColumns={mergedColumns}
        purpleBuffs={[0, 5, 0, 0, 0, 0]}
        spellSlots={spellSlots}
      />
    );

    const markedColumns = container.querySelectorAll(
      '.committed-spell-slot-column--purple-buffed'
    );

    expect(markedColumns).toHaveLength(1);
    expect(markedColumns[0]).toHaveTextContent('2+3');
  });

  test('optionally marks all Yellow-charged columns and supports a Purple overlap', () => {
    const spellSlots = createSpellSlots();
    const { container, rerender } = render(
      <CommittedSpellSlotList
        purpleBuffs={[5, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowCharged
      />
    );
    const columns = container.querySelectorAll('.committed-spell-slot-column');

    expect(container.querySelectorAll('.committed-spell-slot-column--yellow-charged')).toHaveLength(
      6
    );
    expect(columns[0]).toHaveClass('committed-spell-slot-column--purple-buffed');
    expect(columns[0]).toHaveClass('committed-spell-slot-column--yellow-charged');

    rerender(<CommittedSpellSlots spellSlots={spellSlots} />);
    expect(container.querySelector('.committed-spell-slot-column--yellow-charged')).toBeNull();
  });

  test('optionally fades exhausted limited-use tokens without changing the default display', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [
      { id: 'light-blue-1', type: 'light-blue', committed: true },
      { id: 'light-blue-2', type: 'light-blue', committed: true },
      { id: 'yellow-1', type: 'yellow', committed: true },
    ];
    const { rerender } = render(
      <CommittedSpellSlotList
        lightBlueUses={[1, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowUses={[0, 0, 0, 0, 0, 0]}
      />
    );

    expect(screen.getByLabelText(/light-blue token in slot 1/i)).not.toHaveClass(
      'token-display--faded'
    );
    expect(screen.getByLabelText(/yellow token in slot 1/i)).toHaveClass(
      'token-display--faded'
    );

    rerender(
      <CommittedSpellSlotList
        lightBlueUses={[0, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowUses={[0, 0, 0, 0, 0, 0]}
      />
    );
    expect(screen.getByLabelText(/light-blue token in slot 1/i)).toHaveClass(
      'token-display--faded'
    );

    rerender(<CommittedSpellSlots spellSlots={spellSlots} />);
    expect(screen.getByLabelText(/2 light-blue tokens in slot 1/i)).not.toHaveClass(
      'token-display--faded'
    );
    expect(screen.getByLabelText(/yellow token in slot 1/i)).not.toHaveClass(
      'token-display--faded'
    );
  });

  test('shows remaining limited-use counts during battle without mutating default counts', () => {
    const spellSlots = createSpellSlots();
    spellSlots[0].tokens = [
      ...Array.from({ length: 3 }, (_, index) => ({
        committed: true,
        id: `light-blue-${index + 1}`,
        type: 'light-blue',
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        committed: true,
        id: `yellow-${index + 1}`,
        type: 'yellow',
      })),
    ];
    const { rerender } = render(
      <CommittedSpellSlotList
        lightBlueUses={[3, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowUses={[3, 0, 0, 0, 0, 0]}
      />
    );

    expect(screen.getByLabelText(/3 light-blue tokens in slot 1/i)).toHaveTextContent('3');
    expect(screen.getByLabelText(/3 yellow tokens in slot 1/i)).toHaveTextContent('3');

    rerender(
      <CommittedSpellSlotList
        lightBlueUses={[2, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowUses={[1, 0, 0, 0, 0, 0]}
      />
    );
    expect(screen.getByLabelText(/2 light-blue tokens in slot 1/i)).toHaveTextContent('2');
    expect(screen.getByLabelText(/yellow token in slot 1/i)).not.toHaveTextContent('1');
    expect(screen.queryByLabelText(/3 yellow tokens in slot 1/i)).not.toBeInTheDocument();

    rerender(
      <CommittedSpellSlotList
        lightBlueUses={[1, 0, 0, 0, 0, 0]}
        spellSlots={spellSlots}
        yellowUses={[0, 0, 0, 0, 0, 0]}
      />
    );
    expect(screen.getByLabelText(/light-blue token in slot 1/i)).not.toHaveTextContent('1');
    expect(screen.getByLabelText(/yellow token in slot 1/i)).toHaveClass(
      'token-display--faded'
    );

    rerender(<CommittedSpellSlots spellSlots={spellSlots} />);
    expect(screen.getByLabelText(/3 light-blue tokens in slot 1/i)).toHaveTextContent('3');
    expect(screen.getByLabelText(/3 yellow tokens in slot 1/i)).toHaveTextContent('3');
    expect(spellSlots[0].tokens).toHaveLength(6);
  });

});
