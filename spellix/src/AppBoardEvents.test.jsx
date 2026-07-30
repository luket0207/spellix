import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

jest.mock('./pages/GameplayPage', () => {
  const LootChestFoundModal = jest.requireActual(
    './features/boardEvents/LootChestFoundModal'
  ).default;
  const { useGameSetup: useTestGameSetup } = jest.requireActual(
    './features/gameSetup/GameSetupContext'
  );

  return function TestGameplayPage({
    activeLootChestEvent,
    activeRollAgainEvent,
    isChooseEventModeEnabled,
    onOpenLootChest,
    onTriggerBoardEvent,
  }) {
    const { gameSetup } = useTestGameSetup();
    const eventPlayer = gameSetup.players.find(
      ({ id }) => id === activeLootChestEvent?.playerId
    );
    const trigger = (eventType, environment = 'field') =>
      onTriggerBoardEvent({
        environment,
        eventType,
        playerId: 'player-1',
        source: 'boardLanding',
      });

    return (
      <main>
        <button type="button" onClick={() => trigger('nothing', 'stream')}>
          Land on Stream Nothing
        </button>
        <button type="button" onClick={() => trigger('level1Battle')}>
          Land on Field Battle
        </button>
        <button type="button" onClick={() => trigger('riverMiniGame', 'stream')}>
          Land on Stream River
        </button>
        <button type="button" onClick={() => trigger('caveMiniGame', 'hills')}>
          Land on Hills Cave
        </button>
        <button type="button" onClick={() => trigger('decision')}>
          Land on Field Decision
        </button>
        <button type="button" onClick={() => trigger('hazard', 'mud')}>
          Land on Mud Hazard
        </button>
        <button type="button" onClick={() => trigger('lootChest')}>
          Land on Field Loot Chest
        </button>
        <button type="button" onClick={() => trigger('rollAgain')}>
          Land on Field Roll Again
        </button>
        <p>{`Roll Again player: ${
          activeRollAgainEvent?.playerId ?? 'none'
        }`}</p>
        <p>{`Choose event mode: ${
          isChooseEventModeEnabled ? 'enabled' : 'disabled'
        }`}</p>
        <LootChestFoundModal
          isOpen={Boolean(activeLootChestEvent)}
          language={eventPlayer?.language}
          onOpen={onOpenLootChest}
        />
      </main>
    );
  };
});

jest.mock('./pages/BattlePage', () => {
  const { useGameSetup: useTestGameSetup } = jest.requireActual(
    './features/gameSetup/GameSetupContext'
  );

  return function TestBattlePage() {
    const { activeBattle } = useTestGameSetup();

    return (
      <p>{`Battle: level ${activeBattle?.level}, ${activeBattle?.environment}`}</p>
    );
  };
});

jest.mock('./pages/DecisionPage', () => ({ environment }) => (
  <p>{`Decision: ${environment}`}</p>
));

jest.mock('./pages/HazardPage', () => ({ encounter }) => (
  <p>{`Hazard: ${encounter?.environment}, ${encounter?.hazard?.id}`}</p>
));

jest.mock('./pages/NothingEventPage', () => ({ encounter }) => (
  <p>{`Nothing: ${encounter?.event?.id}`}</p>
));

jest.mock('./pages/MiniGames/RiverMiniGame', () => {
  const { useGameSetup: useTestGameSetup } = jest.requireActual(
    './features/gameSetup/GameSetupContext'
  );

  return function TestRiverMiniGame() {
    const { miniGameResult } = useTestGameSetup();

    return (
      <p>{`Mini game: ${miniGameResult?.type}, ${miniGameResult?.environment}, ${miniGameResult?.source}`}</p>
    );
  };
});

jest.mock('./pages/MiniGames/CaveMiniGame', () => {
  const { useGameSetup: useTestGameSetup } = jest.requireActual(
    './features/gameSetup/GameSetupContext'
  );

  return function TestCaveMiniGame() {
    const { miniGameResult } = useTestGameSetup();

    return (
      <p>{`Mini game: ${miniGameResult?.type}, ${miniGameResult?.environment}, ${miniGameResult?.source}`}</p>
    );
  };
});

jest.mock('./pages/MiniGames/LootChestPage', () => {
  const { useGameSetup: useTestGameSetup } = jest.requireActual(
    './features/gameSetup/GameSetupContext'
  );

  return function TestLootChestPage() {
    const { miniGameResult } = useTestGameSetup();

    return (
      <p>{`Loot Chest: ${miniGameResult?.result}, ${miniGameResult?.returnBehaviour}, ${miniGameResult?.environment}`}</p>
    );
  };
});

function createGameplaySetup(language = 'en') {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    hasCommittedInitialSpells: true,
    language: index === 0 ? language : player.language,
  }));

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingPotionGrant: null,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function renderApp(language) {
  return render(
    <GameSetupProvider initialGameSetup={createGameplaySetup(language)}>
      <MemoryRouter initialEntries={['/gameplay']}>
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['Land on Stream Nothing', 'Nothing: stream'],
  ['Land on Field Battle', 'Battle: level 1, fields'],
  ['Land on Field Decision', 'Decision: fields'],
  ['Land on Mud Hazard', /^Hazard: mud, /],
])('routes %s with its landed environment', (buttonName, expectedResult) => {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  renderApp();

  fireEvent.click(screen.getByRole('button', { name: buttonName }));

  expect(screen.getByText(expectedResult)).toBeInTheDocument();
});

test.each([
  ['Land on Stream River', 'Mini game: river, stream, boardLanding'],
  ['Land on Hills Cave', 'Mini game: cave, hills, boardLanding'],
])('passes landed environment into %s', (buttonName, expectedResult) => {
  renderApp();

  fireEvent.click(screen.getByRole('button', { name: buttonName }));

  expect(screen.getByText(expectedResult)).toBeInTheDocument();
});

test('starts Roll Again without changing routes', () => {
  renderApp();

  fireEvent.click(
    screen.getByRole('button', { name: 'Land on Field Roll Again' })
  );

  expect(screen.getByText('Roll Again player: player-1')).toBeInTheDocument();
});

test('shows the localized board prompt and starts a next-player Loot Chest', () => {
  renderApp('jp');

  fireEvent.click(
    screen.getByRole('button', { name: 'Land on Field Loot Chest' })
  );

  expect(
    screen.getByText(
      '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u898b\u3064\u3051\u307e\u3057\u305f\uff01'
    )
  ).toHaveClass('larger-text', 'language-jp');

  fireEvent.click(
    screen.getByRole('button', {
      name: '\u5b9d\u7bb1\u3092\u958b\u3051\u308b',
    })
  );

  expect(
    screen.getByText('Loot Chest: win, nextPlayerTurn, field')
  ).toBeInTheDocument();
});

test('persists choose event mode until its debug action disables it', () => {
  renderApp('jp');

  fireEvent.click(screen.getByRole('button', { name: /open settings/i }));
  fireEvent.click(screen.getByRole('button', { name: /^debug$/i }));

  const enableButton = screen.getByRole('button', {
    name: '\u30a4\u30d9\u30f3\u30c8\u9078\u629e\u30e2\u30fc\u30c9\u3092\u6709\u52b9\u306b\u3059\u308b',
  });

  fireEvent.click(enableButton);
  expect(screen.getByText(/anywhere mode: disabled/i)).toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: '\u30a4\u30d9\u30f3\u30c8\u9078\u629e\u30e2\u30fc\u30c9\u3092\u7121\u52b9\u306b\u3059\u308b',
    })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByText('Choose event mode: enabled')).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', { name: 'Land on Field Roll Again' })
  );
  expect(screen.getByText('Choose event mode: enabled')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /open settings/i }));
  fireEvent.click(screen.getByRole('button', { name: /^debug$/i }));
  fireEvent.click(
    screen.getByRole('button', {
      name: '\u30a4\u30d9\u30f3\u30c8\u9078\u629e\u30e2\u30fc\u30c9\u3092\u7121\u52b9\u306b\u3059\u308b',
    })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(screen.getByText('Choose event mode: disabled')).toBeInTheDocument();
});
