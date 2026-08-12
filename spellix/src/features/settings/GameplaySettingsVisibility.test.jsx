import { render, screen } from '@testing-library/react';
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

function createGameplaySetup() {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    hasCommittedInitialSpells: true,
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
    debugMode: false,
    playerCount: players.length,
    players,
    turnOrder: players.map(({ id }) => id),
  };
}

function renderApp(initialRoute) {
  return render(
    <GameSetupProvider initialGameSetup={createGameplaySetup()}>
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

  test('keeps gameplay settings, End Game, and Save Game working', async () => {
    renderApp('/gameplay');

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Game' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'End Game' }));

    expect(screen.getByText('Start page')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
  });
});
