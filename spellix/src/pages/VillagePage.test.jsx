import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { POTION_DEFINITIONS } from '../data/potions';
import { TOKEN_DEFINITIONS } from '../data/tokens';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import {
  FIELD_VILLAGE,
  FOREST_VILLAGE,
} from '../features/villages/villageVisits';
import VillagePage from './VillagePage';

function DestinationProbe({ label }) {
  const { gameSetup, pendingNextTurnModal } = useGameSetup();

  return (
    <main>
      <p>{label}</p>
      <p>{`Mini game: ${gameSetup.miniGameResult?.type ?? 'none'}`}</p>
      <p>{`Reward source: ${gameSetup.activeBattle?.source ?? 'none'}`}</p>
      <p>{`Current player: ${gameSetup.turnOrder[gameSetup.currentTurnIndex]}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal}`}</p>
      <p>{`Visit active: ${gameSetup.villageVisit ? 'yes' : 'no'}`}</p>
    </main>
  );
}

function createVillageSetup({
  language = 'en',
  phase = 'reward',
  rewardItem = null,
  rewardType = 'lootChest',
  villageId = FIELD_VILLAGE,
} = {}) {
  const setup = createInitialGameSetup();

  setup.players[0].currentHealth = 20;
  setup.players[0].language = language;
  setup.players[0].position = { x: 4, y: 4 };
  setup.players[1].position = { x: 5, y: 5 };
  setup.turnOrder = ['player-1', 'player-2'];
  setup.villageVisit = {
    defeatedEliteCount:
      rewardType === 'potion' ? 1 : rewardType === 'token' ? 2 : 0,
    defeatedEnemyId:
      rewardType === 'potion' ? 'crowned-lichlord' : null,
    phase,
    playerId: 'player-1',
    rewardItem,
    rewardType,
    villageId,
  };

  return setup;
}

function renderVillage(setup, strict = false) {
  const routes = (
    <MemoryRouter initialEntries={['/village']}>
      <GameSetupProvider initialGameSetup={setup}>
        <Routes>
          <Route path="/village" element={<VillagePage />} />
          <Route
            path="/mini-game/loot-chest"
            element={<DestinationProbe label="Loot Chest destination" />}
          />
          <Route
            path="/reward"
            element={<DestinationProbe label="Reward destination" />}
          />
          <Route
            path="/gameplay"
            element={<DestinationProbe label="Gameplay destination" />}
          />
        </Routes>
      </GameSetupProvider>
    </MemoryRouter>
  );

  return render(strict ? <StrictMode>{routes}</StrictMode> : routes);
}

test('opens the existing Loot Chest flow over the Field Village background', () => {
  renderVillage(createVillageSetup());

  expect(screen.getByRole('main')).toHaveStyle({
    backgroundImage: expect.stringContaining('field-village.png'),
  });
  expect(
    screen.getByText(
      'Thank you for visiting our village traveller. We have this old chest here if you wish to open it.'
    )
  ).toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', { name: 'Open Loot Chest' })
  );

  expect(screen.getByText('Loot Chest destination')).toBeInTheDocument();
  expect(screen.getByText('Mini game: villageLootChest')).toBeInTheDocument();
});

test('shows the defeated enemy and starts the existing potion reward flow', () => {
  renderVillage(
    createVillageSetup({
      rewardItem: POTION_DEFINITIONS[0],
      rewardType: 'potion',
    })
  );

  expect(
    screen.getByText(
      'Thank you for defeating Crowned Lichlord! The village will be much safer with you around. Please take this as a sign of our appreciation.'
    )
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Reward destination')).toBeInTheDocument();
  expect(screen.getByText('Reward source: village')).toBeInTheDocument();
});

test('shows the random token with its name over the Forest Village background', () => {
  renderVillage(
    createVillageSetup({
      rewardItem: { type: 'red', ...TOKEN_DEFINITIONS.red },
      rewardType: 'token',
      villageId: FOREST_VILLAGE,
    })
  );

  expect(screen.getByRole('main')).toHaveStyle({
    backgroundImage: expect.stringContaining('forest-village.png'),
  });
  expect(
    screen.getByText(
      'Wow, you really are powerful. Now you have defeated both of the towers, take this to help you defeat the main boss in his castle, north east of here.'
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Village reward token' })
  ).toBeInTheDocument();
  expect(screen.getByText('Damage')).toBeInTheDocument();
});

test('uses the required Japanese village loot copy', () => {
  renderVillage(createVillageSetup({ language: 'jp' }));

  expect(
    screen.getByText(
      '\u79c1\u305f\u3061\u306e\u6751\u3078\u3088\u3046\u3053\u305d\u3001\u65c5\u4eba\u3055\u3093\u3002\u3053\u3053\u306b\u53e4\u3044\u5b9d\u7bb1\u304c\u3042\u308a\u307e\u3059\u3002\u3088\u308d\u3057\u3051\u308c\u3070\u3001\u958b\u3051\u3066\u307f\u307e\u305b\u3093\u304b\uff1f'
    )
  ).toHaveClass('language-jp');
  expect(
    screen.getByRole('button', {
      name: '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u958b\u3051\u308b',
    })
  ).toHaveClass('language-jp');
});

test('heals the locked player after one second before advancing the turn', () => {
  jest.useFakeTimers();
  const setup = createVillageSetup({
    phase: 'heal',
    rewardType: null,
  });

  setup.players[0].currentHealth = 0;
  setup.players[0].diedLastTurn = true;
  renderVillage(setup, true);

  const continueButton = screen.getByRole('button', { name: 'Continue' });

  expect(screen.getByAltText('Village player')).toBeInTheDocument();
  expect(screen.getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
  expect(continueButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '100'
  );
  expect(continueButton).toBeEnabled();

  fireEvent.click(continueButton);

  expect(screen.getByText('Gameplay destination')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
  expect(screen.getByText('Visit active: no')).toBeInTheDocument();

  jest.useRealTimers();
});
