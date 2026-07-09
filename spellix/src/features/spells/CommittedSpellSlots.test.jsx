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
  test('renders the compact committed spells display with the requested title and six slots', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const slotNumbers = Array.from(container.querySelectorAll('.committed-spell-slot-number'));

    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(screen.queryByText(/Committed spell slots/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Slot [1-6]$/i)).not.toBeInTheDocument();
    expect(slotNumbers).toHaveLength(6);
    expect(slotNumbers.map((slotNumber) => slotNumber.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  test('keeps committed tokens read-only inside vertically stacked narrow slots', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const committedDisplay = container.querySelector('.committed-spells');
    const slotList = container.querySelector('.committed-spell-slot-list');
    const firstSlot = container.querySelector('.committed-spell-slot-item');
    const firstDropZone = container.querySelector('.committed-spell-drop-zone');

    expect(committedDisplay).toHaveClass('committed-spells');
    expect(slotList).toHaveClass('committed-spell-slot-list');
    expect(firstSlot).toHaveClass('committed-spell-slot-item');
    expect(firstDropZone).toHaveClass('committed-spell-drop-zone');
    expect(firstDropZone.querySelector('.committed-spell-slot-number')).not.toBeNull();
    expect(screen.getByLabelText('red token in slot 1')).toBeInTheDocument();
    expect(screen.getByLabelText('blue token in slot 1')).toBeInTheDocument();
  });

  test('keeps empty committed spell slots visible without placeholder text', () => {
    const { container } = render(<CommittedSpellSlots spellSlots={createSpellSlots()} />);
    const dropZones = container.querySelectorAll('.committed-spell-drop-zone');

    expect(screen.queryByText(/No committed tokens/i)).not.toBeInTheDocument();
    expect(dropZones).toHaveLength(6);
    expect(dropZones[1].querySelector('.committed-spell-slot-number')).not.toBeNull();
    expect(dropZones[1].querySelector('.spell-token')).toBeNull();
  });
});
