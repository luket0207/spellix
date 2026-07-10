import { render, screen } from '@testing-library/react';
import CommittedSpellSlots from './CommittedSpellSlots';

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

  test('keeps empty committed spell slots visible without placeholder text', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const columns = container.querySelectorAll('.committed-spell-slot-column');

    expect(screen.queryByText(/No committed tokens/i)).not.toBeInTheDocument();
    expect(columns).toHaveLength(6);
    expect(columns[1].querySelector('.committed-spell-slot-number')).not.toBeNull();
    expect(columns[1].querySelector('.token-display')).toBeNull();
  });
});
