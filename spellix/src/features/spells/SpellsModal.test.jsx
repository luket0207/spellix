import { render, screen } from '@testing-library/react';
import SpellsModal from './SpellsModal';

function createDraftSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

function renderSpellsModal({ isForcedSetup = true } = {}) {
  return render(
    <SpellsModal
      currentPlayer={{
        id: 'player-1',
        colour: 'red',
      }}
      draftSpellSlots={createDraftSpellSlots()}
      draftTokenBag={[
        { id: 'red-1', type: 'red', committed: false },
        { id: 'blue-1', type: 'blue', committed: false },
      ]}
      isForcedSetup={isForcedSetup}
      isOpen
      onCancel={jest.fn()}
      onSave={jest.fn()}
      onTokenDrop={jest.fn()}
      validationMessage=""
    />
  );
}

describe('SpellsModal layout', () => {
  test('shows spell slots before the token source and labels forced setup tokens as starting tokens without count text', () => {
    renderSpellsModal({ isForcedSetup: true });

    const spellSlotsList = screen.getByLabelText(/^spell slots$/i);
    const startingTokensHeading = screen.getByText(/^Starting Tokens$/i);
    const spellSlotLabels = screen.getAllByText(/^Slot [1-6]: 0 of 5 tokens$/i);

    expect(spellSlotsList.compareDocumentPosition(startingTokensHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(spellSlotLabels).toHaveLength(6);
    expect(spellSlotLabels[0]).toHaveTextContent('Slot 1: 0 of 5 tokens');
    expect(spellSlotLabels[5]).toHaveTextContent('Slot 6: 0 of 5 tokens');
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });

  test('labels later-visit tokens as token bag without count text', () => {
    renderSpellsModal({ isForcedSetup: false });

    expect(screen.getByText(/^Token Bag$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Starting Tokens$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });
});
