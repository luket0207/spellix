import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import BoardGrid from './features/gameBoard/BoardGrid';
import {
  createBoard,
  LAND_ENVIRONMENT_CONFIGS,
  selectPreferredWaterCandidate,
  WATER_ENVIRONMENT_CONFIGS,
} from './features/gameBoard/board';
import { getEnvironmentImageDetails } from './features/gameBoard/components/environments/environmentImages';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from './features/gameSetup/GameSetupContext';

function createGameplayReadySetup(playerCount = 2) {
  const players = createPlayers(playerCount).map((player) => {
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
      tokenBag: [],
      spellSlots,
      hasCommittedInitialSpells: true,
    };
  });

  return {
    playerCount,
    players,
    turnOrder: [],
    currentTurnIndex: 0,
    board: null,
  };
}

function renderApp(initialRoute = '/', { initialGameSetup = null } = {}) {
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

function GameSetupStateProbe() {
  const { gameSetup, resetGame, setPlayerColour, setPlayerCount } = useGameSetup();

  return (
    <div>
      <p>{`Player count: ${gameSetup.playerCount}`}</p>
      {gameSetup.players.map((player, index) => (
        <p key={player.id}>{`Player ${index + 1}: ${player.colour}`}</p>
      ))}
      <button type="button" onClick={() => setPlayerCount('4')}>
        Set four players
      </button>
      <button type="button" onClick={() => setPlayerColour('player-4', 'orange')}>
        Set player four orange
      </button>
      <button type="button" onClick={resetGame}>
        Reset game setup
      </button>
    </div>
  );
}

const GENERATED_LAND_ENVIRONMENT_TYPES = [
  'field',
  'hills',
  'gravel',
  'mud',
  'woods',
  'forest',
  'mountains',
];

const RENDERED_ENVIRONMENT_TYPES = [...GENERATED_LAND_ENVIRONMENT_TYPES, 'stream', 'river'];
const IMAGE_BASED_ENVIRONMENT_TYPES = [
  'field',
  'hills',
  'gravel',
  'mud',
  'woods',
  'forest',
  'mountains',
];
const WATER_ENVIRONMENT_TYPES = ['stream', 'river'];
const ORTHOGONAL_OFFSETS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

function createCyclingRandomFn(values) {
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function getSquareKey(x, y) {
  return `${x}-${y}`;
}

function countOrthogonalWaterNeighbors(square, squareLookup) {
  return ORTHOGONAL_OFFSETS.filter((offset) => {
    const adjacentSquare = squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y));

    return adjacentSquare && WATER_ENVIRONMENT_TYPES.includes(adjacentSquare.environmentType);
  }).length;
}

function countOrthogonalEnvironmentNeighborsWithSameVariation(square, squareLookup) {
  return ORTHOGONAL_OFFSETS.filter((offset) => {
    const adjacentSquare = squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y));

    return (
      adjacentSquare &&
      adjacentSquare.environmentType !== null &&
      adjacentSquare.environmentVariation === square.environmentVariation
    );
  }).length;
}

function hasTwoByTwoWaterBlock(square, squareLookup) {
  const blockOffsets = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
  ];

  return blockOffsets.some((offset) => {
    const blockSquares = [
      squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y)),
      squareLookup.get(getSquareKey(square.x + offset.x + 1, square.y + offset.y)),
      squareLookup.get(getSquareKey(square.x + offset.x, square.y + offset.y + 1)),
      squareLookup.get(getSquareKey(square.x + offset.x + 1, square.y + offset.y + 1)),
    ];

    return (
      blockSquares.every(Boolean) &&
      blockSquares.every((blockSquare) => WATER_ENVIRONMENT_TYPES.includes(blockSquare.environmentType))
    );
  });
}

function getSquareDistance(firstSquare, secondSquare) {
  return Math.max(
    Math.abs(firstSquare.x - secondSquare.x),
    Math.abs(firstSquare.y - secondSquare.y)
  );
}

function createTestBoardSquare({
  x,
  y,
  section = 'hard',
  environmentType = 'field',
  areaType = 'normal',
  featureId = null,
  isFixedArea = false,
}) {
  return {
    id: `square-${x}-${y}`,
    x,
    y,
    section,
    areaType,
    environmentType,
    featureId,
    isFixedArea,
  };
}

function getMinimumDistanceBetweenSquareSets(firstSquares, secondSquares) {
  return firstSquares.reduce(
    (minimumDistance, firstSquare) =>
      Math.min(
        minimumDistance,
        secondSquares.reduce(
          (currentMinimumDistance, secondSquare) =>
            Math.min(currentMinimumDistance, getSquareDistance(firstSquare, secondSquare)),
          Number.POSITIVE_INFINITY
        )
      ),
    Number.POSITIVE_INFINITY
  );
}

function getConnectedEnvironmentComponent(startSquare, squareLookup, environmentType) {
  const visitedSquareKeys = new Set();
  const squareQueue = [startSquare];

  while (squareQueue.length > 0) {
    const currentSquare = squareQueue.shift();
    const currentSquareKey = getSquareKey(currentSquare.x, currentSquare.y);

    if (visitedSquareKeys.has(currentSquareKey)) {
      continue;
    }

    visitedSquareKeys.add(currentSquareKey);

    ORTHOGONAL_OFFSETS.forEach((offset) => {
      const adjacentSquare = squareLookup.get(
        getSquareKey(currentSquare.x + offset.x, currentSquare.y + offset.y)
      );

      if (
        adjacentSquare &&
        adjacentSquare.environmentType === environmentType &&
        !visitedSquareKeys.has(getSquareKey(adjacentSquare.x, adjacentSquare.y))
      ) {
        squareQueue.push(adjacentSquare);
      }
    });
  }

  return visitedSquareKeys;
}

describe('App routing flow', () => {
  test('renders the start page by default', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /spellix/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to game setup/i })
    ).toBeInTheDocument();
  });

  test('shows a valid default setup on the setup page', () => {
    renderApp('/setup');

    expect(screen.getByLabelText(/number of players/i)).toHaveValue('2');
    expect(screen.getByLabelText(/player 1 colour/i)).toHaveValue('red');
    expect(screen.getByLabelText(/player 2 colour/i)).toHaveValue('blue');
  });

  test('navigates from the start page to setup and gameplay with stored setup data', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /go to game setup/i }));
    expect(screen.getByRole('heading', { name: /game setup/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText(/player 3 colour/i), {
      target: { value: 'orange' },
    });
    fireEvent.change(screen.getByLabelText(/player 4 colour/i), {
      target: { value: 'purple' },
    });

    fireEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(screen.getByLabelText(/board panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
    expect(screen.getByText(/it is currently red player's turn\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/orange player piece/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purple player piece/i)).toBeInTheDocument();
  });

  test('renders the setup page from its route', () => {
    renderApp('/setup');

    expect(screen.getByRole('heading', { name: /game setup/i })).toBeInTheDocument();
  });

  test('renders the gameplay page from its route', () => {
    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/board panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spells/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/committed spell slots/i)).toBeInTheDocument();
    expect(screen.getByText(/it is currently .* player's turn\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/game board/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /gameplay/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /board/i })).not.toBeInTheDocument();
  });

  test('creates players with starting token bags and empty spell slots for the spell setup foundation', () => {
    const players = createPlayers(2);

    players.forEach((player) => {
      expect(player.tokenBag.filter((token) => token.type === 'red')).toHaveLength(5);
      expect(player.tokenBag.filter((token) => token.type === 'blue')).toHaveLength(2);
      expect(player.spellSlots).toHaveLength(6);
      expect(player.spellSlots.every((slot) => slot.maxTokens === 5)).toBe(true);
      expect(player.spellSlots.every((slot) => slot.tokens.length === 0)).toBe(true);
      expect(player.hasCommittedInitialSpells).toBe(false);
    });
  });

  test('keeps the settings button visible across app pages', () => {
    const startRender = renderApp('/');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    startRender.unmount();

    const setupRender = renderApp('/setup');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    setupRender.unmount();
    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
  });

  test('opens the forced spells modal and blocks dice rolling until the current player saves spells', () => {
    renderApp('/gameplay');

    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
    expect(screen.getByText(/spells for .* player\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token bag drop zone/i)).toBeInTheDocument();
    expect(screen.getByText(/red tokens: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/blue tokens: 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spell slots/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 1: 0 of 5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 6: 0 of 5 tokens/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  });

  test('opens the spells modal for a committed player and uses cancel confirmation to close it', async () => {
    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    await userEvent.click(screen.getByRole('button', { name: /spells/i }));

    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
    expect(screen.getByText(/no available tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 1: 5 of 5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/slot 2: 2 of 5 tokens/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('dialog', { name: /cancel spells confirmation/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /yes/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();
    });
  });

  test('updates the number of colour selectors when the player count changes', () => {
    renderApp('/setup');

    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: '6' },
    });

    expect(screen.queryByLabelText(/player 7 colour/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/player 6 colour/i)).toHaveValue('orange');
  });

  test('shows the dice result and ends the turn after moving', async () => {
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    await userEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();
    expect(screen.getByText(/dice result: 4/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    expect(screen.queryByRole('dialog', { name: /dice result/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/square 0, 27/i));

    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
    expect(screen.getByText(/it is now blue player's turn\./i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/square 0, 27/i).querySelector('[aria-label="red player piece"]')
    ).not.toBeNull();

    randomSpy.mockRestore();
  });

  test('creates a fixed 31x31 board with the required area colours and starting positions', () => {
    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    const board = screen.getByLabelText(/game board/i);
    const easySectionSquare = screen.getByLabelText('Square 3, 28');
    const hardSectionSquare = screen.getByLabelText('Square 28, 3');

    expect(board).toHaveStyle({ width: '930px', height: '930px' });
    expect(board.children).toHaveLength(31 * 31);

    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute('data-area-type', 'start-area');
    expect(screen.getByLabelText(/square 0, 0/i)).toHaveAttribute('data-area-type', 'elite-battle');
    expect(screen.getByLabelText(/square 29, 29/i)).toHaveAttribute(
      'data-area-type',
      'elite-battle'
    );
    expect(screen.getByLabelText(/square 29, 0/i)).toHaveAttribute('data-area-type', 'boss-battle');
    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute('data-is-fixed-area', 'true');
    expect(easySectionSquare).toHaveAttribute('data-section', 'easy');
    expect(hardSectionSquare).toHaveAttribute('data-section', 'hard');

    expect(
      screen.getByLabelText(/square 0, 28/i).querySelector('[aria-label="red player piece"]')
    ).not.toBeNull();
    expect(
      screen.getByLabelText(/square 1, 28/i).querySelector('[aria-label="blue player piece"]')
    ).not.toBeNull();
  });

  test('generates mixed land environments before filling remaining squares with field', () => {
    const board = createBoard(() => 0);
    const nonFixedSquares = board.squares.filter((square) => !square.isFixedArea);
    const generatedEnvironmentTypes = new Set(
      nonFixedSquares.map((square) => square.environmentType)
    );

    expect(generatedEnvironmentTypes.has('field')).toBe(true);
    expect(Array.from(generatedEnvironmentTypes).some((environmentType) => environmentType !== 'field')).toBe(
      true
    );
    expect(nonFixedSquares.every((square) => square.environmentType !== null)).toBe(true);

    nonFixedSquares
      .filter((square) => ['hills', 'gravel'].includes(square.environmentType))
      .forEach((square) => {
        expect(square.section).toBe('easy');
      });

    nonFixedSquares
      .filter((square) => ['forest', 'mountains'].includes(square.environmentType))
      .forEach((square) => {
        expect(square.section).toBe('hard');
      });
  });

  test('renders the generated land environment components for board squares', () => {
    const board = {
      width: RENDERED_ENVIRONMENT_TYPES.length,
      height: 1,
      squareSize: 30,
      squares: RENDERED_ENVIRONMENT_TYPES.map((environmentType, index) => ({
        id: `square-${index}-0`,
        x: index,
        y: 0,
        section: ['forest', 'mountains', 'river'].includes(environmentType) ? 'hard' : 'easy',
        areaType: 'normal',
        environmentType,
        environmentVariation: (index % 6) + 1,
        featureId: null,
        isFixedArea: false,
      })),
    };
    const environmentClassNames = {
      field: '.field-environment',
      forest: '.forest-environment',
      gravel: '.gravel-environment',
      hills: '.hills-environment',
      mountains: '.mountains-environment',
      mud: '.mud-environment',
      river: '.river-environment',
      stream: '.stream-environment',
      woods: '.woods-environment',
    };

    render(
      <BoardGrid
        board={board}
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={jest.fn()}
        players={[]}
      />
    );

    RENDERED_ENVIRONMENT_TYPES.forEach((environmentType) => {
      const square = board.squares.find(
        (candidateSquare) => candidateSquare.environmentType === environmentType
      );
      const renderedSquare = screen.getByLabelText(`Square ${square.x}, ${square.y}`);

      expect(renderedSquare).toHaveAttribute('data-environment-type', environmentType);
      expect(renderedSquare).toHaveAttribute(
        'data-environment-variation',
        String(square.environmentVariation)
      );
      expect(renderedSquare.querySelector(environmentClassNames[environmentType])).not.toBeNull();

      if (IMAGE_BASED_ENVIRONMENT_TYPES.includes(environmentType)) {
        expect(
          renderedSquare.querySelector(
            `[data-environment-image="${environmentType}-${square.environmentVariation}"]`
          )
        ).not.toBeNull();
        expect(renderedSquare).not.toHaveTextContent(String(square.environmentVariation));
      } else {
        expect(renderedSquare).not.toHaveTextContent(String(square.environmentVariation));
      }
    });
  });

  test('maps image-based environments to the stored variation image and falls back to variation 1', () => {
    expect(getEnvironmentImageDetails('field', 4).imageKey).toBe('field-4');
    expect(getEnvironmentImageDetails('mountains', 6).imageKey).toBe('mountains-6');
    expect(getEnvironmentImageDetails('gravel', 0).imageKey).toBe('gravel-1');
  });

  test('assigns fixed environment variation numbers without orthogonal duplicates', () => {
    const board = createBoard(
      createCyclingRandomFn([0.1, 0.7, 0.3, 0.9, 0.2, 0.8, 0.4, 0.6, 0.5])
    );
    const squareLookup = new Map(
      board.squares.map((square) => [getSquareKey(square.x, square.y), square])
    );
    const environmentSquares = board.squares.filter((square) => square.environmentType !== null);

    expect(environmentSquares.length).toBeGreaterThan(0);

    environmentSquares.forEach((square) => {
      expect(square.environmentVariation).toBeGreaterThanOrEqual(1);
      expect(square.environmentVariation).toBeLessThanOrEqual(6);
      expect(
        countOrthogonalEnvironmentNeighborsWithSameVariation(square, squareLookup)
      ).toBe(0);
    });

    board.squares
      .filter((square) => square.isFixedArea || square.areaType === 'feature')
      .forEach((square) => {
        expect(square.environmentVariation).toBeNull();
      });
  });

  test('generates one-square-wide stream and river paths without overwriting fixed areas', () => {
    const board = createBoard(
      createCyclingRandomFn([0.1, 0.7, 0.3, 0.9, 0.2, 0.8, 0.4, 0.6, 0.5])
    );
    const squareLookup = new Map(
      board.squares.map((square) => [getSquareKey(square.x, square.y), square])
    );
    const waterSquares = board.squares.filter((square) =>
      WATER_ENVIRONMENT_TYPES.includes(square.environmentType)
    );
    const streamSquares = waterSquares.filter((square) => square.environmentType === 'stream');
    const riverSquares = waterSquares.filter((square) => square.environmentType === 'river');

    expect(streamSquares.length).toBeGreaterThan(0);
    expect(riverSquares.length).toBeGreaterThan(0);

    waterSquares.forEach((square) => {
      expect(countOrthogonalWaterNeighbors(square, squareLookup)).toBeLessThanOrEqual(2);
      expect(hasTwoByTwoWaterBlock(square, squareLookup)).toBe(false);
    });

    streamSquares.forEach((square) => {
      expect(square.isFixedArea).toBe(false);
    });

    riverSquares.forEach((square) => {
      expect(square.isFixedArea).toBe(false);
      expect(square.section).toBe('hard');
    });
  });

  test('prefers water candidates that avoid mountains when a valid alternative exists', () => {
    const mountainCandidate = createTestBoardSquare({
      x: 1,
      y: 1,
      environmentType: 'mountains',
    });
    const nearMountainCandidate = createTestBoardSquare({
      x: 2,
      y: 1,
    });
    const awayFromMountainCandidate = createTestBoardSquare({
      x: 3,
      y: 1,
    });
    const lookupSquares = [
      createTestBoardSquare({ x: 0, y: 1, environmentType: 'mountains' }),
      createTestBoardSquare({ x: 1, y: 0, environmentType: 'mountains' }),
      mountainCandidate,
      createTestBoardSquare({ x: 2, y: 0, environmentType: 'mountains' }),
      nearMountainCandidate,
      awayFromMountainCandidate,
      createTestBoardSquare({ x: 3, y: 0 }),
      createTestBoardSquare({ x: 4, y: 1 }),
      createTestBoardSquare({ x: 3, y: 2 }),
    ];
    const squareLookup = new Map(
      lookupSquares.map((square) => [getSquareKey(square.x, square.y), square])
    );
    const config = { avoidEnvironmentTypes: ['mountains'] };

    expect(
      selectPreferredWaterCandidate(
        [mountainCandidate, nearMountainCandidate, awayFromMountainCandidate],
        squareLookup,
        config,
        () => 0
      )
    ).toBe(awayFromMountainCandidate);

    expect(
      selectPreferredWaterCandidate([mountainCandidate], squareLookup, config, () => 0)
    ).toBe(mountainCandidate);
  });

  test('uses the updated Epic 002 environment generation values', () => {
    const gravelConfig = LAND_ENVIRONMENT_CONFIGS.find(
      (config) => config.environmentType === 'gravel'
    );
    const mudConfig = LAND_ENVIRONMENT_CONFIGS.find((config) => config.environmentType === 'mud');
    const forestConfig = LAND_ENVIRONMENT_CONFIGS.find(
      (config) => config.environmentType === 'forest'
    );
    const hillsConfig = LAND_ENVIRONMENT_CONFIGS.find(
      (config) => config.environmentType === 'hills'
    );
    const riverConfig = WATER_ENVIRONMENT_CONFIGS.find(
      (config) => config.environmentType === 'river'
    );

    expect(gravelConfig.maximumClusterSize).toBe(30);
    expect(mudConfig.maximumClusterSize).toBe(30);
    expect(forestConfig.maximumClusterSize).toBe(40);
    expect(hillsConfig.maximumClusterSize).toBe(50);
    expect(riverConfig.edgeInset).toBe(3);
    expect(riverConfig.minimumPathCount).toBe(2);
    expect(riverConfig.maximumPathCount).toBe(2);
    expect(riverConfig.minimumPathLength).toBe(8);
    expect(riverConfig.maximumPathLength).toBe(20);
  });

  test('keeps rivers away from map edges and surrounds the boss area with a bounded mountain cluster', () => {
    const board = createBoard(
      createCyclingRandomFn([0.1, 0.7, 0.3, 0.9, 0.2, 0.8, 0.4, 0.6, 0.5])
    );
    const squareLookup = new Map(
      board.squares.map((square) => [getSquareKey(square.x, square.y), square])
    );
    const riverSquares = board.squares.filter((square) => square.environmentType === 'river');
    const requiredBossMountainSquares = [
      { x: 27, y: 0 },
      { x: 28, y: 0 },
      { x: 27, y: 1 },
      { x: 28, y: 1 },
      { x: 27, y: 2 },
      { x: 28, y: 2 },
      { x: 27, y: 3 },
      { x: 28, y: 3 },
      { x: 29, y: 2 },
      { x: 30, y: 2 },
      { x: 29, y: 3 },
      { x: 30, y: 3 },
    ].map(({ x, y }) => squareLookup.get(getSquareKey(x, y)));
    const bossMountainClusterSquareKeys = getConnectedEnvironmentComponent(
      requiredBossMountainSquares[0],
      squareLookup,
      'mountains'
    );

    expect(riverSquares.length).toBeGreaterThan(0);
    riverSquares.forEach((square) => {
      expect(square.x).toBeGreaterThanOrEqual(3);
      expect(square.x).toBeLessThanOrEqual(27);
      expect(square.y).toBeGreaterThanOrEqual(3);
      expect(square.y).toBeLessThanOrEqual(27);
    });

    requiredBossMountainSquares.forEach((square) => {
      expect(square.environmentType).toBe('mountains');
      expect(square.areaType).toBe('normal');
      expect(square.isFixedArea).toBe(false);
      expect(bossMountainClusterSquareKeys.has(getSquareKey(square.x, square.y))).toBe(true);
    });

    expect(bossMountainClusterSquareKeys.size).toBeGreaterThanOrEqual(15);
    expect(bossMountainClusterSquareKeys.size).toBeLessThanOrEqual(20);
  });

  test('generates four spaced 2x2 feature areas across the easy and hard sections', () => {
    const board = createBoard(
      createCyclingRandomFn([0.1, 0.7, 0.3, 0.9, 0.2, 0.8, 0.4, 0.6, 0.5])
    );
    const squareLookup = new Map(
      board.squares.map((square) => [getSquareKey(square.x, square.y), square])
    );
    const fixedSquares = board.squares.filter((square) => square.isFixedArea);

    expect(board.features).toHaveLength(4);
    expect(board.features.filter((feature) => feature.section === 'easy')).toHaveLength(2);
    expect(board.features.filter((feature) => feature.section === 'hard')).toHaveLength(2);

    board.features.forEach((feature) => {
      const featureSquares = [
        squareLookup.get(getSquareKey(feature.x, feature.y)),
        squareLookup.get(getSquareKey(feature.x + 1, feature.y)),
        squareLookup.get(getSquareKey(feature.x, feature.y + 1)),
        squareLookup.get(getSquareKey(feature.x + 1, feature.y + 1)),
      ];

      expect(feature.width).toBe(2);
      expect(feature.height).toBe(2);
      expect(feature.areaType).toBe('feature');
      expect(featureSquares.every(Boolean)).toBe(true);
      expect(featureSquares).toHaveLength(4);
      expect(featureSquares.every((square) => square.areaType === 'feature')).toBe(true);
      expect(featureSquares.every((square) => square.featureId === feature.id)).toBe(true);
      expect(featureSquares.every((square) => square.section === feature.section)).toBe(true);
      expect(featureSquares.every((square) => square.environmentType === null)).toBe(true);
      expect(featureSquares.every((square) => square.environmentVariation === null)).toBe(true);
      expect(getMinimumDistanceBetweenSquareSets(featureSquares, fixedSquares)).toBeGreaterThanOrEqual(3);
    });

    board.features.forEach((feature, featureIndex) => {
      const featureSquares = [
        squareLookup.get(getSquareKey(feature.x, feature.y)),
        squareLookup.get(getSquareKey(feature.x + 1, feature.y)),
        squareLookup.get(getSquareKey(feature.x, feature.y + 1)),
        squareLookup.get(getSquareKey(feature.x + 1, feature.y + 1)),
      ];

      board.features.slice(featureIndex + 1).forEach((otherFeature) => {
        const otherFeatureSquares = [
          squareLookup.get(getSquareKey(otherFeature.x, otherFeature.y)),
          squareLookup.get(getSquareKey(otherFeature.x + 1, otherFeature.y)),
          squareLookup.get(getSquareKey(otherFeature.x, otherFeature.y + 1)),
          squareLookup.get(getSquareKey(otherFeature.x + 1, otherFeature.y + 1)),
        ];

        expect(getMinimumDistanceBetweenSquareSets(featureSquares, otherFeatureSquares)).toBeGreaterThanOrEqual(3);
      });
    });
  });

  test('does not regenerate the board when turns change', async () => {
    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    const startingSquare = screen.getByLabelText(/square 0, 28/i);
    const startingVariation = startingSquare.getAttribute('data-environment-variation');

    await userEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    await userEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.getByLabelText(/square 0, 28/i)).toBe(startingSquare);
    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute(
      'data-environment-variation',
      startingVariation ?? ''
    );
    expect(
      screen.getByLabelText(/square 0, 28/i).querySelector('[aria-label="red player piece"]')
    ).not.toBeNull();
    expect(
      screen.getByLabelText(/square 1, 28/i).querySelector('[aria-label="blue player piece"]')
    ).not.toBeNull();
  });

  test('opens and closes the settings modal from the start page', async () => {
    renderApp();

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /spellix/i })).toBeInTheDocument();
  });

  test('ends the game and resets setup state', () => {
    render(
      <GameSetupProvider>
        <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <GameSetupStateProbe />
        </MemoryRouter>
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /set four players/i }));
    fireEvent.click(screen.getByRole('button', { name: /set player four orange/i }));

    expect(screen.getByText(/player count: 4/i)).toBeInTheDocument();
    expect(screen.getByText(/player 4: orange/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset game setup/i }));

    expect(screen.getByText(/player count: 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/player 4:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/player 1: red/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: blue/i)).toBeInTheDocument();
  });

  test('highlights legal destinations after rolling and moves the current player', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.5);

    renderApp('/gameplay', { initialGameSetup: createGameplayReadySetup() });

    await userEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    await userEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByLabelText(/square 3, 28/i)).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlight-colour', 'red');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlight-opacity', '0.5');

    await userEvent.click(screen.getByLabelText(/square 0, 28/i));
    expect(
      screen.getByLabelText(/square 0, 28/i).querySelector('[aria-label="red player piece"]')
    ).not.toBeNull();
    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/square 3, 28/i));

    expect(
      screen.getByLabelText(/square 3, 28/i).querySelector('[aria-label="red player piece"]')
    ).not.toBeNull();
    expect(screen.getByLabelText(/square 3, 28/i)).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  test('renders grouped areas without grouped-border classes and keeps shared-square player pieces visible', () => {
    const board = createBoard();
    const players = [
      { id: 'player-1', colour: 'red', position: { x: 0, y: 28 } },
      { id: 'player-2', colour: 'blue', position: { x: 0, y: 28 } },
      { id: 'player-3', colour: 'green', position: { x: 0, y: 28 } },
      { id: 'player-4', colour: 'yellow', position: { x: 0, y: 28 } },
      { id: 'player-5', colour: 'purple', position: { x: 0, y: 28 } },
      { id: 'player-6', colour: 'orange', position: { x: 0, y: 28 } },
    ];

    render(
      <BoardGrid
        board={board}
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={jest.fn()}
        players={players}
      />
    );

    expect(screen.getByLabelText(/square 1, 29/i)).not.toHaveClass(
      'board-square--hide-top-border',
      'board-square--hide-right-border',
      'board-square--hide-bottom-border',
      'board-square--hide-left-border'
    );

    expect(screen.getByLabelText(/red player piece/i)).toHaveStyle({
      height: '14px',
      left: '0px',
      top: '0px',
      width: '14px',
    });
    expect(screen.getByLabelText(/blue player piece/i)).toHaveStyle({
      left: '8px',
      top: '0px',
    });
    expect(screen.getByLabelText(/orange player piece/i)).toHaveStyle({
      left: '16px',
      top: '10px',
    });
  });
});
