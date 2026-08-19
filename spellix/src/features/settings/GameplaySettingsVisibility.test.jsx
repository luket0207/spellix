import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { createPlayers } from '../gameSetup/gameSetup';
import { GameSetupProvider } from '../gameSetup/GameSetupContext';

jest.mock('../../pages/StartPage', () => () => <p>Start page</p>);
jest.mock('../../pages/RulesPage', () => () => <p>Rules page</p>);
jest.mock('../../pages/GameSetupPage', () => () => <p>Game Setup page</p>);
jest.mock('../../pages/StoryPage', () => () => <p>Story page</p>);
jest.mock('../../pages/GameplayPage', () => () => <p>Gameplay page</p>);
jest.mock('../../pages/BattlePage', () => () => <p>Battle page</p>);
jest.mock('../../pages/BossNotReadyPage', () => () => <p>Boss page</p>);
jest.mock('../../pages/VillagePage', () => () => <p>Village page</p>);
jest.mock('../../pages/DecisionPage', () => () => <p>Decision page</p>);
jest.mock('../../pages/HazardPage', () => () => <p>Hazard page</p>);
jest.mock('../../pages/NothingEventPage', () => () => <p>Nothing page</p>);
jest.mock('../../pages/RewardPage', () => () => <p>Reward page</p>);
jest.mock('../../pages/MiniGames/CaveMiniGame', () => () => <p>Cave page</p>);
jest.mock('../../pages/MiniGames/RiverMiniGame', () => () => <p>River page</p>);
jest.mock('../../pages/MiniGames/LootChestPage', () => () => <p>Loot page</p>);
jest.mock('../../pages/MiniGames/MiniGameLosePage', () => () => <p>Lose page</p>);
jest.mock('../../pages/WinnerPage', () => () => <p>Winner page</p>);
jest.mock('../music/MusicPlayer', () => () => null);

const NON_GAMEPLAY_ROUTES = [
  ['Start', '/'],
  ['Game Setup', '/setup'],
  ['Story', '/story'],
  ['Rules', '/rules'],
  ['Battle', '/battle'],
  ['Boss Not Ready', '/boss-not-ready'],
  ['Decision', '/decision'],
  ['River Mini Game', '/mini-game/river'],
  ['Cave Mini Game', '/mini-game/cave'],
  ['Loot Chest', '/mini-game/loot-chest'],
  ['Mini Game Lose', '/mini-game/lose'],
  ['Village', '/village'],
  ['Hazard', '/hazard'],
  ['Nothing Event', '/nothing-event'],
  ['Reward', '/reward'],
  ['Winner', '/winner'],
];

function createGameplaySetup({ debugMode = false, language = 'en' } = {}) {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    hasCommittedInitialSpells: true,
    language: index === 0 ? language : player.language,
    position: { x: index, y: 29 },
  }));

  return {
    board: {
      featureImages: [],
      features: [],
      height: 31,
      squareSize: 30,
      squares: [],
      width: 31,
    },
    currentTurnIndex: 0,
    debugMode,
    playerCount: players.length,
    players,
    turnOrder: players.map(({ id }) => id),
  };
}

function renderApp(initialRoute, setupOptions) {
  return render(
    <GameSetupProvider initialGameSetup={createGameplaySetup(setupOptions)}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[initialRoute]}
      >
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('gameplay-only settings visibility', () => {
  test.each(NON_GAMEPLAY_ROUTES)(
    'hides the settings button on the %s route',
    (_routeName, route) => {
      renderApp(route);

      expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
      expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
    }
  );

  test('shows the English settings actions in the required order', async () => {
    renderApp('/gameplay', { debugMode: true });

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const settingsDialog = screen.getByRole('dialog', { name: 'Settings' });
    const title = screen.getByRole('heading', { name: 'Settings' });
    const actions = screen.getByRole('group', { name: 'Settings actions' });
    const settingsButtons = within(actions).getAllByRole('button');

    expect(settingsDialog).toHaveClass('language-en');
    expect(title).toHaveClass('settings-title', 'larger-text', 'language-en');
    expect(settingsButtons).toHaveLength(5);
    expect(settingsButtons[0]).toHaveTextContent('Debug');
    expect(settingsButtons[1]).toHaveTextContent('Save Game');
    expect(settingsButtons[2]).toHaveTextContent('Rules');
    expect(settingsButtons[3]).toHaveTextContent('End Game');
    expect(settingsButtons[4]).toHaveTextContent('Close');
    expect(within(actions).getByRole('button', { name: 'Close' })).toHaveClass(
      'fantasy-button--secondary'
    );

    await userEvent.click(within(actions).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
    expect(screen.getByText('Gameplay page')).toBeInTheDocument();
  });

  test('preserves settings action order when Debug is hidden', async () => {
    renderApp('/gameplay');

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const actions = screen.getByRole('group', { name: 'Settings actions' });
    const settingsButtons = within(actions).getAllByRole('button');

    expect(settingsButtons).toHaveLength(4);
    expect(settingsButtons[0]).toHaveTextContent('Save Game');
    expect(settingsButtons[1]).toHaveTextContent('Rules');
    expect(settingsButtons[2]).toHaveTextContent('End Game');
    expect(settingsButtons[3]).toHaveTextContent('Close');
    expect(within(actions).queryByRole('button', { name: 'Debug' })).toBeNull();
  });

  test('returns from the shared Rules view to the settings menu', async () => {
    renderApp('/gameplay');

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rules' }));

    const rulesDialog = screen.getByRole('dialog', { name: 'Rules of the game' });

    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();

    await userEvent.click(
      within(rulesDialog).getAllByRole('button', { name: 'Back to Settings' })[0]
    );

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Rules of the game' })).toBeNull();
  });

  test('returns to settings when End Game confirmation is declined', async () => {
    renderApp('/gameplay');

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'End Game' }));

    const confirmationDialog = screen.getByRole('dialog', {
      name: 'End Game confirmation',
    });

    expect(
      within(confirmationDialog).getByText('Are you sure you want to end the game?')
    ).toHaveClass('larger-text', 'language-en');

    await userEvent.click(
      within(confirmationDialog).getByRole('button', { name: 'No' })
    );

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Gameplay page')).toBeInTheDocument();
    expect(screen.queryByText('Start page')).toBeNull();
  });

  test('ends and resets the game only after End Game confirmation is accepted', async () => {
    renderApp('/gameplay');

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'End Game' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Start page')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('localizes the Japanese settings menu and End Game confirmation', async () => {
    renderApp('/gameplay', { debugMode: true, language: 'jp' });

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const settingsDialog = screen.getByRole('dialog', { name: '\u8a2d\u5b9a' });
    const title = within(settingsDialog).getByRole('heading', { name: '\u8a2d\u5b9a' });
    const actions = within(settingsDialog).getByRole('group', {
      name: '\u8a2d\u5b9a\u30a2\u30af\u30b7\u30e7\u30f3',
    });
    const settingsButtons = within(actions).getAllByRole('button');

    expect(settingsDialog).toHaveClass('language-jp');
    expect(title).toHaveClass('settings-title', 'larger-text', 'language-jp');
    expect(settingsButtons).toHaveLength(5);
    expect(settingsButtons[0]).toHaveTextContent('\u30c7\u30d0\u30c3\u30b0');
    expect(settingsButtons[1]).toHaveTextContent('\u30b2\u30fc\u30e0\u3092\u4fdd\u5b58');
    expect(settingsButtons[2]).toHaveTextContent('\u30eb\u30fc\u30eb');
    expect(settingsButtons[3]).toHaveTextContent('\u30b2\u30fc\u30e0\u3092\u7d42\u4e86');
    expect(settingsButtons[4]).toHaveTextContent('\u9589\u3058\u308b');

    await userEvent.click(
      within(actions).getByRole('button', { name: '\u30b2\u30fc\u30e0\u3092\u7d42\u4e86' })
    );

    const confirmationDialog = screen.getByRole('dialog', {
      name: '\u30b2\u30fc\u30e0\u7d42\u4e86\u306e\u78ba\u8a8d',
    });

    expect(
      within(confirmationDialog).getByText(
        '\u30b2\u30fc\u30e0\u3092\u7d42\u4e86\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f'
      )
    ).toHaveClass('larger-text', 'language-jp');
    expect(
      within(confirmationDialog).getByRole('button', { name: '\u306f\u3044' })
    ).toHaveClass('language-jp');
    expect(
      within(confirmationDialog).getByRole('button', { name: '\u3044\u3044\u3048' })
    ).toHaveClass('language-jp');
  });
});
