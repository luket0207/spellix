import { render, screen } from '@testing-library/react';
import { getPlayerPieceImageName } from '../gameSetup/pieceImages';
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
        pieceImage: getPlayerPieceImageName({ colour: 'red', gender: 'girl' }),
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
  test('shows a Spells title, the current player piece image, and forced setup tokens before the token source', () => {
    renderSpellsModal({ isForcedSetup: true });

    const spellSlotsList = screen.getByLabelText(/^spell slots$/i);
    const startingTokensHeading = screen.getByText(/^Starting Tokens$/i);
    const spellSlotLabels = screen.getAllByText(/^Slot [1-6]: 0 of 5 tokens$/i);
    const spellPlayerPiece = screen.getByRole('img', { name: /spell player piece/i });

    expect(spellSlotsList.compareDocumentPosition(startingTokensHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(spellPlayerPiece).toHaveAttribute('src', expect.stringContaining('f-red.png'));
    expect(spellPlayerPiece).not.toHaveClass('battle-player-piece');
    expect(spellPlayerPiece).toHaveStyle({ height: '100px' });
    expect(spellSlotLabels).toHaveLength(6);
    expect(spellSlotLabels[0]).toHaveTextContent('Slot 1: 0 of 5 tokens');
    expect(spellSlotLabels[5]).toHaveTextContent('Slot 6: 0 of 5 tokens');
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });

  test('keeps the current player piece image during later normal spells visits', () => {
    renderSpellsModal({ isForcedSetup: false });

    const spellPlayerPiece = screen.getByRole('img', { name: /spell player piece/i });

    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(spellPlayerPiece).toHaveAttribute('src', expect.stringContaining('f-red.png'));
    expect(spellPlayerPiece).not.toHaveClass('battle-player-piece');
    expect(spellPlayerPiece).toHaveStyle({ height: '100px' });
    expect(screen.getByText(/^Token Bag$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Starting Tokens$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });
});
