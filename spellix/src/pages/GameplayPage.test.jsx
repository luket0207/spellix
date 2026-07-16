import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../data/potions';
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
  jest.useFakeTimers();
  mockGetAnywhereModeHighlightedNodeIds.mockReset();
  mockGetAnywhereModeHighlightedNodeIds.mockReturnValue(['square-1-28']);
  mockGetHighlightedNodeIds.mockReset();
  mockGetHighlightedNodeIds.mockReturnValue(['square-1-28']);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function finishDiceSequence() {
  act(() => {
    jest.advanceTimersByTime(3000);
  });
}

function renderGameplayPage() {
  return render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <GameplayPage />
    </GameSetupProvider>
  );
}

describe('GameplayPage spell modal unsaved change behavior', () => {
  test('shows no potions for an empty collection', () => {
    renderGameplayPage();

    expect(screen.getByRole('region', { name: /potions/i })).toHaveTextContent('No potions');
  });

  test('shows the current player potions and updates them when the turn changes', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    ];
    initialGameSetup.players[1].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const firstPlayerPotions = screen.getByRole('region', { name: /potions/i });

    expect(within(firstPlayerPotions).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(firstPlayerPotions).getByText('Rare | Both')).toBeInTheDocument();
    expect(
      within(firstPlayerPotions).getByRole('group', { name: /roll choice potion/i })
    ).toHaveClass('potion-icon--blue');
    expect(within(firstPlayerPotions).queryByText('Small Heal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    const secondPlayerPotions = screen.getByRole('region', { name: /potions/i });

    expect(within(secondPlayerPotions).getByText('Small Heal')).toBeInTheDocument();
    expect(within(secondPlayerPotions).getByText('Common | Both')).toBeInTheDocument();
    expect(
      within(secondPlayerPotions).getByRole('group', { name: /small heal potion/i })
    ).toHaveClass('potion-icon--green');
    expect(within(secondPlayerPotions).queryByText('Roll Choice')).not.toBeInTheDocument();
  });

  test('locks the temporary dice modal for the full sequence and uses its result for movement', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    renderGameplayPage();

    expect(screen.queryByRole('button', { name: /force [1-6]/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    const diceDialog = screen.getByRole('dialog', { name: /dice result/i });

    expect(within(diceDialog).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('modal-overlay'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('img', { name: /dice face 4/i })).toBeInTheDocument();
    expect(screen.getByText(/dice result: 4/i)).toHaveClass('dice-roll-result--visible');
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      4,
      { blockedNodeIds: [] }
    );
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('dialog', { name: /dice result/i })).not.toBeInTheDocument();
  });

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
    finishDiceSequence();
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

    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

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

    expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();

    expect(screen.queryByRole('dialog', { name: /cancel spells confirmation/i })).not.toBeInTheDocument();
  });

  test('blocks the start area only for a player who has already left it', async () => {
    renderGameplayPage();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      { x: 0, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      { x: 1, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
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

    expect(screen.getByRole('dialog', { name: /dice result/i })).toHaveTextContent(/anywhere mode/i);
    expect(mockGetAnywhereModeHighlightedNodeIds).not.toHaveBeenCalled();

    finishDiceSequence();

    expect(mockGetAnywhereModeHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 }
    );
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();

    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 1, y: 28 },
      expect.any(Number),
      { blockedNodeIds: ['start-area'] }
    );
  });
});
