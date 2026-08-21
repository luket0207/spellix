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
import { POTION_DEFINITIONS } from '../data/potions';
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

jest.mock(
  '../features/gameBoard/BoardGrid',
  () => ({ objectiveHighlightMode, onSquareClick }) => (
    <div>
      <p>{`Objective highlight: ${objectiveHighlightMode ?? 'none'}`}</p>
      <button type="button" onClick={() => onSquareClick({ x: 0, y: 0 })}>
        Land on Feature
      </button>
    </div>
  )
);

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
  const { activeBattle, battleEnemy, currentPlayer } = useGameSetup();

  return (
    <div>
      <p>{`Encounter: ${activeBattle?.encounterType}`}</p>
      <p>{`Enemy: ${battleEnemy?.id ?? 'none'}`}</p>
      <p>{`Enemy health: ${battleEnemy?.currentHealth ?? 'none'}/${battleEnemy?.maxHealth ?? 'none'}`}</p>
      <p>{`Active: ${currentPlayer?.activePotion?.id ?? 'none'}`}</p>
    </div>
  );
}

function VillageProbe() {
  const { currentPlayer, gameSetup } = useGameSetup();

  return (
    <>
      <p>{`Village: ${gameSetup.villageVisit?.villageId ?? 'none'}`}</p>
      <p>{`Village feature: ${gameSetup.villageVisit?.villageFeatureId ?? 'none'}`}</p>
      <p>{`Active: ${currentPlayer?.activePotion?.id ?? 'none'}`}</p>
    </>
  );
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
  expect(
    screen.getByText('Current Goal: Defeat the Elite Towers')
  ).toHaveClass('committed-spell-slot-display-title', 'language-en');
  expect(screen.getByText('Crowned Lichlord')).toBeInTheDocument();
  expect(screen.getByText('Amethyst Ogre')).toBeInTheDocument();
  expect(screen.queryByText('Mossroot Elder')).not.toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: 'Elite Tower not defeated' })).toHaveLength(2);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

test('allows the elite progress display to use its natural height', () => {
  const cssSource = readFileSync(
    'src/pages/GameplayPage.css',
    'utf8'
  );
  const progressRule = cssSource.match(
    /\.elite-progress-display\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(progressRule).toMatch(/height:\s*auto/);
  expect(progressRule).toMatch(/max-height:\s*none/);
});

test('uses the new Japanese goal title and reduces only its enemy labels', () => {
  const setup = createGameplaySetup();

  setup.players[0].language = 'jp';
  renderGameplay(setup);

  expect(screen.getByLabelText('Elite Tower progress')).toHaveClass('language-jp');
  expect(
    screen.getByText(
      '\u73fe\u5728\u306e\u76ee\u6a19\uff1a\u30a8\u30ea\u30fc\u30c8\u30bf\u30ef\u30fc\u3092\u653b\u7565\u3059\u308b'
    )
  ).toHaveClass('committed-spell-slot-display-title', 'language-jp');
  expect(screen.getByText('\u51a0\u306e\u30ea\u30c3\u30c1\u738b')).toHaveClass(
    'elite-progress-label',
    'language-jp'
  );

  const cssSource = readFileSync('src/pages/GameplayPage.css', 'utf8');
  const japaneseProgressRule = cssSource.match(
    /\.elite-progress-display\.language-jp\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(japaneseProgressRule).toMatch(/padding-bottom:\s*10px/);
  expect(cssSource).toMatch(
    /\.elite-progress-display\.language-jp\s+\.elite-progress-label\s*{[^}]*font-size:\s*14px;/s
  );
});

test('highlights both Elite Towers only while the unfinished goal is hovered', () => {
  renderGameplay();

  const progressDisplay = screen.getByLabelText('Elite Tower progress');

  expect(screen.getByText('Objective highlight: none')).toBeInTheDocument();
  fireEvent.mouseEnter(progressDisplay);
  expect(screen.getByText('Objective highlight: eliteTowers')).toBeInTheDocument();
  fireEvent.mouseLeave(progressDisplay);
  expect(screen.getByText('Objective highlight: none')).toBeInTheDocument();
});

test('replaces completed Elite progress with the assigned English Boss goal', () => {
  const setup = createGameplaySetup();

  setup.players[0].eliteProgress = {
    eliteTowerGravel: true,
    eliteTowerWoods: true,
  };
  renderGameplay(setup);

  const progressDisplay = screen.getByLabelText('Elite Tower progress');

  expect(progressDisplay).toHaveClass('elite-progress-display--boss-goal');
  expect(
    screen.getByText('Defeat the Mossroot Elder Boss Battle')
  ).toHaveClass('elite-progress-boss-goal', 'language-en');
  expect(screen.queryByText('Crowned Lichlord')).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /Elite Tower/i })).not.toBeInTheDocument();

  fireEvent.mouseEnter(progressDisplay);
  expect(screen.getByText('Objective highlight: bossBattle')).toBeInTheDocument();
});

test('localizes the assigned Boss goal in Japanese', () => {
  const setup = createGameplaySetup();

  setup.players[0].language = 'jp';
  setup.players[0].eliteProgress = {
    eliteTowerGravel: true,
    eliteTowerWoods: true,
  };
  renderGameplay(setup);

  expect(
    screen.getByText(
      '\u82d4\u6839\u306e\u53e4\u8001\u306e\u30dc\u30b9\u30d0\u30c8\u30eb\u306b\u52dd\u5229\u3059\u308b'
    )
  ).toHaveClass('elite-progress-boss-goal', 'language-jp');
});

test("uses only the current player's Elite progress for the displayed goal", () => {
  const setup = createGameplaySetup();

  setup.players[0].eliteProgress = {
    eliteTowerGravel: true,
    eliteTowerWoods: true,
  };
  setup.currentTurnIndex = 1;
  renderGameplay(setup);

  expect(
    screen.getByText('Current Goal: Defeat the Elite Towers')
  ).toBeInTheDocument();
  expect(
    screen.queryByText('Defeat the Mossroot Elder Boss Battle')
  ).not.toBeInTheDocument();
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
  expect(
    screen.getByText('Village feature: board-feature-feature-1')
  ).toBeInTheDocument();
});

test.each([
  ['board-feature-feature-1', 'Village: fieldVillage'],
  ['elite-battle-top-left', 'Encounter: eliteTowerGravel'],
])('does not replace feature destination %s with Metal Detector loot', (destinationNodeId, expected) => {
  const setup = createGameplaySetup();

  mockDestinationNodeId = destinationNodeId;
  setup.players[0].activePotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'metal-detector'
  );
  renderGameplay(setup);
  rollAndLand();

  expect(screen.getByText(expected)).toBeInTheDocument();
  expect(screen.getByText('Active: metal-detector')).toBeInTheDocument();
});

test.each([
  ['elite-battle-top-left', 'Encounter: eliteTowerGravel'],
  ['boss-battle', 'Encounter: bossBattle'],
])('does not prevent Smokescreen feature battle at %s', (destinationNodeId, expected) => {
  const setup = createGameplaySetup();

  mockDestinationNodeId = destinationNodeId;
  setup.players[0].activePotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'smokescreen'
  );
  setup.players[0].eliteProgress = {
    eliteTowerGravel: true,
    eliteTowerWoods: true,
  };
  renderGameplay(setup);
  rollAndLand();

  expect(screen.getByText(expected)).toBeInTheDocument();
  expect(screen.getByText('Active: smokescreen')).toBeInTheDocument();
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
