import { readFileSync } from 'fs';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import GameplayPage from './GameplayPage';

let mockDestinationNodeId = 'elite-battle-top-left';

jest.mock('../components/dice/DiceRoll', () => ({
  onRollComplete,
  onSequenceComplete,
}) => (
  <button
    type="button"
    onClick={() => {
      onRollComplete(1);
      onSequenceComplete(1);
    }}
  >
    Complete Test Roll
  </button>
));

jest.mock('../features/gameBoard/BoardGrid', () => ({ onSquareClick }) => (
  <button type="button" onClick={() => onSquareClick({ x: 0, y: 0 })}>
    Land on Feature
  </button>
));

jest.mock('../features/gameBoard/movement', () => ({
  getAnywhereModeHighlightedNodeIds: () => [mockDestinationNodeId],
  getHighlightedNodeIds: () => [mockDestinationNodeId],
  getMovementNodeIdFromCoordinates: (x, y) =>
    x === 0 && y === 0 ? mockDestinationNodeId : 'start-area',
}));

jest.mock('../features/gameBoard/multiSquareFeatures', () => ({
  chooseVisualPositionForFeature: ({ destinationSquare }) => ({
    featureId: mockDestinationNodeId,
    type: 'feature',
    x: destinationSquare.x,
    y: destinationSquare.y,
  }),
}));

function EncounterProbe() {
  const { activeBattle, battleEnemy } = useGameSetup();

  return (
    <div>
      <p>{`Encounter: ${activeBattle?.encounterType}`}</p>
      <p>{`Enemy: ${battleEnemy?.id ?? 'none'}`}</p>
      <p>{`Enemy health: ${battleEnemy?.currentHealth ?? 'none'}/${battleEnemy?.maxHealth ?? 'none'}`}</p>
    </div>
  );
}

function VillageProbe() {
  const { gameSetup } = useGameSetup();

  return <p>{`Village: ${gameSetup.villageVisit?.villageId ?? 'none'}`}</p>;
}

function GameplayRoute() {
  const navigate = useNavigate();

  return <GameplayPage isChooseEventModeEnabled onNavigate={navigate} />;
}

function createGameplaySetup() {
  const setup = createInitialGameSetup();

  setup.board = {
    featureImages: [
      {
        id: 'elite-top-left',
        imageName: 'elite-tower-gravel.png',
      },
      {
        id: 'elite-bottom-right',
        imageName: 'elite-tower-woods.png',
      },
      {
        id: 'feature-1',
        imageName: 'village-field.png',
      },
    ],
    height: 31,
    squares: [],
    width: 31,
  };
  setup.eliteBossEnemyAssignments = {
    bossBattle: 'mossroot-elder',
    eliteTowerGravel: 'crowned-lichlord',
    eliteTowerWoods: 'amethyst-ogre',
  };
  setup.players.forEach((player, index) => {
    player.hasCommittedInitialSpells = true;
    player.position = { x: index + 10, y: index + 10 };
  });
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function renderGameplay(setup = createGameplaySetup()) {
  render(
    <MemoryRouter initialEntries={['/gameplay']}>
      <GameSetupProvider initialGameSetup={setup}>
        <Routes>
          <Route path="/gameplay" element={<GameplayRoute />} />
          <Route path="/battle" element={<EncounterProbe />} />
          <Route path="/boss-not-ready" element={<EncounterProbe />} />
          <Route path="/village" element={<VillageProbe />} />
        </Routes>
      </GameSetupProvider>
    </MemoryRouter>
  );
}

function rollAndLand() {
  fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Complete Test Roll' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Land on Feature' }));
}

beforeEach(() => {
  mockDestinationNodeId = 'elite-battle-top-left';
});

test('shows only the two assigned elite enemies with visual progress', () => {
  renderGameplay();

  expect(screen.getByLabelText('Elite Tower progress')).toHaveClass('language-en');
  expect(screen.getByText('Crowned Lichlord')).toBeInTheDocument();
  expect(screen.getByText('Amethyst Ogre')).toBeInTheDocument();
  expect(screen.queryByText('Mossroot Elder')).not.toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: 'Elite Tower not defeated' })).toHaveLength(2);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

test('limits the elite progress display to the required maximum height', () => {
  const cssSource = readFileSync(
    'src/pages/GameplayPage.css',
    'utf8'
  );
  const progressRule = cssSource.match(
    /\.elite-progress-display\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(progressRule).toMatch(/max-height:\s*100px/);
});

test('adds ten pixels of bottom padding to the Japanese elite progress display', () => {
  const setup = createGameplaySetup();

  setup.players[0].language = 'jp';
  renderGameplay(setup);

  expect(screen.getByLabelText('Elite Tower progress')).toHaveClass('language-jp');

  const cssSource = readFileSync('src/pages/GameplayPage.css', 'utf8');
  const japaneseProgressRule = cssSource.match(
    /\.elite-progress-display\.language-jp\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(japaneseProgressRule).toMatch(/padding-bottom:\s*10px/);
});

test('starts the assigned battle every time an elite tower is landed on', () => {
  const setup = createGameplaySetup();

  setup.players[0].eliteProgress.eliteTowerGravel = true;
  renderGameplay(setup);
  rollAndLand();

  expect(screen.getByText('Encounter: eliteTowerGravel')).toBeInTheDocument();
  expect(screen.getByText('Enemy: crowned-lichlord')).toBeInTheDocument();
});

test('routes a generated village landing into the village visit flow', () => {
  mockDestinationNodeId = 'board-feature-feature-1';
  renderGameplay();
  rollAndLand();

  expect(screen.getByText('Village: fieldVillage')).toBeInTheDocument();
});

test('routes an unready player to the locked boss encounter', () => {
  mockDestinationNodeId = 'boss-battle';
  renderGameplay();
  rollAndLand();

  expect(screen.getByText('Encounter: bossNotReady')).toBeInTheDocument();
  expect(screen.getByText('Enemy: none')).toBeInTheDocument();
});

test('starts the assigned 100 health boss for a ready player', () => {
  const setup = createGameplaySetup();

  mockDestinationNodeId = 'boss-battle';
  setup.players[0].eliteProgress = {
    eliteTowerGravel: true,
    eliteTowerWoods: true,
  };
  renderGameplay(setup);
  rollAndLand();

  expect(screen.getByText('Encounter: bossBattle')).toBeInTheDocument();
  expect(screen.getByText('Enemy: mossroot-elder')).toBeInTheDocument();
  expect(screen.getByText('Enemy health: 100/100')).toBeInTheDocument();
});

test.each(['crowned-lichlord', 'hellcrown-reaper'])(
  'keeps the 100 health boss override for joined-column enemy %s',
  (enemyId) => {
    const setup = createGameplaySetup();

    mockDestinationNodeId = 'boss-battle';
    setup.eliteBossEnemyAssignments.bossBattle = enemyId;
    setup.players[0].eliteProgress = {
      eliteTowerGravel: true,
      eliteTowerWoods: true,
    };
    renderGameplay(setup);
    rollAndLand();

    expect(screen.getByText(`Enemy: ${enemyId}`)).toBeInTheDocument();
    expect(screen.getByText('Enemy health: 100/100')).toBeInTheDocument();
  }
);
