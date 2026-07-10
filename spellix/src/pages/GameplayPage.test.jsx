import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createPlayers } from '../features/gameSetup/gameSetup';
import { GameSetupProvider } from '../features/gameSetup/GameSetupContext';
import GameplayPage from './GameplayPage';

const mockGetAnywhereModeHighlightedNodeIds = jest.fn();
const mockGetHighlightedNodeIds = jest.fn();

jest.mock('../features/gameBoard/BoardGrid', () => ({ currentPlayerId, onSquareClick }) => (
  <div aria-label="game board">
    <p>{`Current board player: ${currentPlayerId}`}</p>
    <button type="button" onClick={() => onSquareClick({ x: 1, y: 28 })}>
      Move to square 1, 28
    </button>
  </div>
));

jest.mock('../features/gameBoard/movement', () => ({
  getAnywhereModeHighlightedNodeIds: (...args) => mockGetAnywhereModeHighlightedNodeIds(...args),
  getHighlightedNodeIds: (...args) => mockGetHighlightedNodeIds(...args),
  getMovementNodeIdFromCoordinates: (x, y) =>
    x >= 0 && x <= 1 && y >= 29 && y <= 30 ? 'start-area' : `square-${x}-${y}`,
}));

jest.mock('../features/gameBoard/board', () => ({
  assignStartingPositions: (players) =>
    players.map((player, index) => ({
      ...player,
      position: { x: index, y: 29 },
    })),
  createBoard: () => ({
    height: 0,
    squares: [],
    width: 0,
  }),
}));

function createCommittedGameplaySetup() {
  const players = createPlayers(2).map((player) => {
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));

    spellSlots[0].tokens = player.tokenBag
      .filter((token) => token.type === 'red')
      .map((token) => ({ ...token, committed: true }));
    spellSlots[1].tokens = player.tokenBag
      .filter((token) => token.type === 'blue')
      .map((token) => ({ ...token, committed: true }));

    return {
      ...player,
      hasCommittedInitialSpells: true,
      spellSlots,
      tokenBag: [],
    };
  });

  players[1] = {
    ...players[1],
    currentHealth: 15,
  };

  return {
    board: null,
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

beforeEach(() => {
  mockGetAnywhereModeHighlightedNodeIds.mockReset();
  mockGetAnywhereModeHighlightedNodeIds.mockReturnValue(['square-1-28']);
  mockGetHighlightedNodeIds.mockReset();
  mockGetHighlightedNodeIds.mockReturnValue(['square-1-28']);
});

function renderGameplayPage() {
  return render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <GameplayPage />
    </GameSetupProvider>
  );
}

describe('GameplayPage spell modal unsaved change behavior', () => {
  test('shows the current player piece in the sidebar and the next player piece in the turn-change modal', async () => {
    renderGameplayPage();

    expect(screen.getByText(/^Current board player: player-1$/i)).toBeInTheDocument();
    expect(screen.queryByText(/it is currently .* player's turn/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/current player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByLabelText(/current player piece/i)).not.toHaveClass('battle-player-piece');
    expect(screen.getByLabelText(/current player piece/i)).toHaveStyle({ height: '150px' });
    expect(screen.getByLabelText(/current player piece/i)).toHaveStyle({
      alignSelf: 'flex-start',
      width: 'auto',
    });
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100 / 100')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
    expect(screen.getByText(/it is now blue player's turn\./i)).toBeInTheDocument();
    expect(screen.getByText(/^Current board player: player-2$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByLabelText(/turn change player piece/i)).not.toHaveClass(
      'battle-player-piece'
    );
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveStyle({ height: '150px' });

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText(/current player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByText('15 / 100')).toBeInTheDocument();
  });

  test('disables save and closes immediately on cancel when no spell changes were made', async () => {
    renderGameplayPage();

    fireEvent.click(screen.getByRole('button', { name: /spells/i }));

    const spellsDialog = screen.getByRole('dialog', { name: /spells/i });

    expect(spellsDialog).toBeInTheDocument();
    expect(within(spellsDialog).getByRole('heading', { name: /^spells$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/spell player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByLabelText(/spell player piece/i)).not.toHaveClass('battle-player-piece');
    expect(screen.getByLabelText(/spell player piece/i)).toHaveStyle({ height: '100px' });
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('dialog', { name: /cancel spells confirmation/i })).not.toBeInTheDocument();
  });

  test('blocks the start area only for a player who has already left it', async () => {
    renderGameplayPage();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      { x: 0, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      { x: 1, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      3,
      expect.any(Object),
      { x: 1, y: 28 },
      expect.any(Number),
      { blockedNodeIds: ['start-area'] }
    );
  });

  test('uses anywhere mode movement once and then consumes it for that player', async () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      anywhereMode: true,
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(mockGetAnywhereModeHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 }
    );
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /dice result/i })).toHaveTextContent(/anywhere mode/i);

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 1, y: 28 },
      expect.any(Number),
      { blockedNodeIds: ['start-area'] }
    );
  });
});
