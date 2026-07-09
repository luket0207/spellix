import { fireEvent, render, screen } from '@testing-library/react';
import DebugModal from './DebugModal';

function createCurrentPlayer(overrides = {}) {
  return {
    colour: 'red',
    hasCommittedInitialSpells: true,
    id: 'player-1',
    tokenBag: [
      { id: 'player-1-red-1', type: 'red', committed: false },
      { id: 'player-1-blue-1', type: 'blue', committed: false },
    ],
    ...overrides,
  };
}

describe('DebugModal', () => {
  test('renders the debug token controls for a committed current player', () => {
    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        isOpen
        message=""
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(screen.getByRole('dialog', { name: /debug/i })).toBeInTheDocument();
    expect(screen.getByText(/current player: red/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token type/i)).toHaveValue('red');
    expect(screen.getByRole('button', { name: /give token/i })).toBeEnabled();
    expect(screen.getByRole('dialog', { name: /debug/i })).toHaveClass('debug-modal-panel');
  });

  test('shows the replacement flow when a pending token needs a bag discard choice', () => {
    const handleReplacementChange = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        isOpen
        message="The red player's token bag is full."
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onPendingTokenReplacementChange={handleReplacementChange}
        onReplacePendingToken={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType="purple"
        selectedReplacementTokenId="player-1-red-1"
        selectedTokenType="red"
      />
    );

    expect(screen.getByText(/new token: purple/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard new token/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace selected token/i })).toBeEnabled();

    fireEvent.click(screen.getByDisplayValue('player-1-blue-1'));

    expect(handleReplacementChange).toHaveBeenCalledWith('player-1-blue-1');
  });

  test('disables token-giving controls until the current player finishes initial spell setup', () => {
    render(
      <DebugModal
        currentPlayer={createCurrentPlayer({ hasCommittedInitialSpells: false })}
        isOpen
        message=""
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(
      screen.getByText(/finish the current player's initial spell setup before using debug token tools/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /give token/i })).toBeDisabled();
    expect(screen.getByLabelText(/token type/i)).toBeDisabled();
  });
});
