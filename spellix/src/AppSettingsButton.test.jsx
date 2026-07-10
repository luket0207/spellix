import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

jest.mock('./features/gameBoard/BoardGrid', () => ({ currentPlayerId }) => (
  <div aria-label="game board">{`Current board player: ${currentPlayerId}`}</div>
));

function createGameplaySetup({ hasCommittedInitialSpells = true, playerCount = 2 } = {}) {
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

  test('opens the settings modal while the dice result modal is open', async () => {
    renderApp('/gameplay', {
      initialGameSetup: createGameplaySetup({ hasCommittedInitialSpells: true }),
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();
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
    expect(screen.getByText(/battle level: 3/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battle player panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battle enemy panel/i)).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: /battle/i })).toBeInTheDocument();
    expect(screen.getByText(/battle level: 4/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /hellcrown reaper/i })).toHaveClass(
      'battle-enemy-piece'
    );
    expect(screen.getByText('120 / 120')).toBeInTheDocument();
    expect(screen.getAllByText('J')).toHaveLength(2);
  });
});
