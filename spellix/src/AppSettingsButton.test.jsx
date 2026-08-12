import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { POTION_DEFINITIONS } from './data/potions';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

jest.mock('./features/gameBoard/BoardGrid', () => ({ currentPlayerId, onSquareClick }) => (
  <div aria-label="game board">
    {`Current board player: ${currentPlayerId}`}
    <button
      type="button"
      onClick={() => onSquareClick({ areaType: 'start-area', x: 1, y: 28 })}
    >
      Move to safe square
    </button>
  </div>
));

jest.mock('./features/gameBoard/movement', () => ({
  getAnywhereModeHighlightedNodeIds: () => ['square-1-28'],
  getHighlightedNodeIds: () => ['square-1-28'],
  getMovementNodeIdFromCoordinates: (x, y) =>
    x === 0 && y === 29 ? 'start-area' : `square-${x}-${y}`,
  getMovementNodeIdFromSquare: ({ x, y }) =>
    x === 0 && y === 29 ? 'start-area' : `square-${x}-${y}`,
}));

function createGameplaySetup({
  debugMode = true,
  hasCommittedInitialSpells = true,
  playerCount = 2,
} = {}) {
  const players = createPlayers(playerCount).map((player, index) => {
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));

    const tokenBag = hasCommittedInitialSpells ? [] : player.tokenBag;

    if (hasCommittedInitialSpells) {
      spellSlots[0].tokens = player.tokenBag
        .filter((token) => token.type === 'red')
        .map((token) => ({ ...token, committed: true }));
      spellSlots[1].tokens = player.tokenBag
        .filter((token) => token.type === 'blue')
        .map((token) => ({ ...token, committed: true }));
    }

    return {
      ...player,
      hasCommittedInitialSpells,
      position: { x: index, y: 29 },
      spellSlots,
      tokenBag,
    };
  });

  return {
    board: {
      features: [],
      height: 0,
      squareSize: 30,
      squares: [],
      width: 0,
    },
    currentTurnIndex: 0,
    debugMode,
    playerCount,
    players,
    turnOrder: players.map((player) => player.id),
  };
}

function renderApp(initialRoute = '/gameplay', { initialGameSetup = null } = {}) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[initialRoute]}
      >
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('App gameplay settings button accessibility', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('hides Debug access from settings when Debug Mode is off', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ debugMode: false }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(screen.queryByRole('button', { name: /^debug$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /debug/i })).not.toBeInTheDocument();
  });

  test('opens the settings modal while the forced spells modal is already open', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: false }),
    });

    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  });

  test('hides settings as soon as the movement dice roll starts', () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open settings/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /save game/i })).toBeNull();
  });

  test('keeps settings hidden through movement and restores it after the next-turn modal', () => {
    jest.useFakeTimers();
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.queryByRole('button', { name: /open settings/i })).toBeNull();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole('button', { name: /open settings/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Move to safe square' }));

    const turnModal = screen.getByRole('dialog', { name: 'Turn change' });

    expect(screen.queryByRole('button', { name: /open settings/i })).toBeNull();
    fireEvent.click(within(turnModal).getByRole('button', { name: 'OK' }));

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
  });

  test('reaches the settings modal from the debug modal by closing debug first', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));

    expect(screen.getByRole('dialog', { name: /debug/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /debug/i })).not.toBeInTheDocument();
    });
  });

  test('enables anywhere mode for only the current player from the debug modal', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));

    expect(screen.getByText(/current player: red/i)).toBeInTheDocument();
    expect(screen.getByText(/anywhere mode: disabled/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /enable anywhere mode/i }));

    expect(screen.getByText(/anywhere mode: enabled/i)).toBeInTheDocument();
    expect(
      screen.getByText(/anywhere mode enabled for the red player/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable anywhere mode/i })).toBeDisabled();
  });

  test('starts a level 3 debug battle for the current player', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^level 3$/i }));

    expect(screen.getByRole('heading', { name: /battle/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/battle player panel/i)).toBeInTheDocument();
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(enemyPanel).toBeInTheDocument();
    expect(within(enemyPanel).getByText('50 / 50')).toBeInTheDocument();
    expect(screen.getByLabelText(/battle player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByLabelText(/battle player piece/i)).toHaveClass('battle-player-piece');
    expect(screen.getByLabelText(/battle player piece/i)).toHaveStyle({
      alignSelf: 'flex-start',
      width: 'auto',
    });
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/battle player panel/i)).getByLabelText('5 red tokens in slot 1')
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/battle player panel/i)).getByLabelText('2 blue tokens in slot 2')
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /battle enemy/i })).toHaveClass('battle-enemy-piece');
  });

  test('starts a manual battle with the selected enemy from the debug modal', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/enemy/i), 'hellcrown-reaper');
    await userEvent.click(screen.getByRole('button', { name: /start selected enemy battle/i }));

    expect(
      screen.getByRole('heading', { name: 'Hellcrown Reaper Battle' })
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /hellcrown reaper/i })).toHaveClass(
      'battle-enemy-piece'
    );
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(within(enemyPanel).getByText('100 / 100')).toBeInTheDocument();
    expect(within(enemyPanel).getByText('2+3')).toBeInTheDocument();
    expect(within(enemyPanel).getByText('5+6')).toBeInTheDocument();
    expect(within(enemyPanel).queryByText('J')).not.toBeInTheDocument();
  });

  test('grants the selected potion to the selected player from debug controls', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/potion target player/i), 'player-2');
    await userEvent.selectOptions(screen.getByLabelText(/potion type/i), 'small-heal');
    await userEvent.click(screen.getByRole('button', { name: /give potion/i }));

    expect(screen.getByText(/added small heal to the blue player's potions/i)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/potion target player/i), 'player-1');
    await userEvent.click(screen.getByRole('button', { name: /give potion/i }));

    expect(screen.getByText(/added small heal to the red player's potions/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /potions/i })).toHaveTextContent('Small Heal');
  });

  test('forces a full-capacity potion grant to be discarded or replace one current potion', async () => {
    const initialGameSetup = createGameplaySetup({ hasCommittedInitialSpells: true });
    initialGameSetup.players[0].potions = POTION_DEFINITIONS.slice(0, 3);

    renderApp('/gameplay', { initialGameSetup });

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    await userEvent.click(screen.getByRole('button', { name: /^debug$/i }));
    await userEvent.selectOptions(screen.getByLabelText(/potion type/i), 'first-aid');
    await userEvent.click(screen.getByRole('button', { name: /give potion/i }));

    expect(screen.getByText(/new potion: first aid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^close$/i })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /discard new potion/i }));

    expect(screen.queryByText(/new potion: first aid/i)).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /potions/i })).not.toHaveTextContent('First Aid');

    await userEvent.click(screen.getByRole('button', { name: /give potion/i }));
    await userEvent.click(screen.getByLabelText(/discard small heal/i));
    await userEvent.click(screen.getByRole('button', { name: /replace selected potion/i }));

    const potionDisplay = screen.getByRole('region', { name: /potions/i });
    expect(potionDisplay).toHaveTextContent('Roll Choice');
    expect(potionDisplay).toHaveTextContent('First Aid');
    expect(potionDisplay).toHaveTextContent('Heal');
    expect(potionDisplay).not.toHaveTextContent('Small Heal');
  });
});
