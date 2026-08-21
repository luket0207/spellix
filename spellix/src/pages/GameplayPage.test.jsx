import { readFileSync } from 'fs';
import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../data/potions';
import { TOKEN_TYPES } from '../data/tokens';
import { createPlayers } from '../features/gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import GameplayPage from './GameplayPage';

const mockGetAnywhereModeHighlightedNodeIds = jest.fn();
const mockGetHighlightedNodeIds = jest.fn();
const mockChooseVisualPositionForFeature = jest.fn();

jest.mock(
  '../features/gameBoard/BoardGrid',
  () => ({
    currentPlayerId,
    eliteBossEnemyAssignments,
    language,
    onSquareClick,
  }) => (
    <div aria-label="game board">
      <p>{`Current board player: ${currentPlayerId}`}</p>
      <p>{`Board hover language: ${language}`}</p>
      <p>{`Board enemy assignments: ${JSON.stringify(
        eliteBossEnemyAssignments
      )}`}</p>
    <button type="button" onClick={() => onSquareClick({ x: 1, y: 28 })}>
      Move to square 1, 28
    </button>
    <button
      type="button"
      onClick={() =>
        onSquareClick({
          areaType: 'normal',
          environmentType: 'field',
          featureId: null,
          x: 1,
          y: 28,
        })
      }
    >
      Move to Field event square
    </button>
    </div>
  )
);

jest.mock('../features/gameBoard/movement', () => ({
  getAnywhereModeHighlightedNodeIds: (...args) => mockGetAnywhereModeHighlightedNodeIds(...args),
  getHighlightedNodeIds: (...args) => mockGetHighlightedNodeIds(...args),
  getMovementNodeIdFromCoordinates: (x, y) =>
    x >= 0 && x <= 1 && y >= 29 && y <= 30 ? 'start-area' : `square-${x}-${y}`,
}));

jest.mock('../features/gameBoard/multiSquareFeatures', () => ({
  chooseVisualPositionForFeature: (...args) =>
    mockChooseVisualPositionForFeature(...args),
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
  getFirstStartAreaPosition: () => ({ x: 0, y: 29 }),
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

function GameplayPositionProbe() {
  const { gameSetup } = useGameSetup();
  const position = gameSetup.players[0]?.position;

  return (
    <p>
      {`Player one board position: ${position?.type ?? 'square'},${
        position?.featureId ?? 'none'
      },${position?.x ?? 'none'},${position?.y ?? 'none'}`}
    </p>
  );
}

function VillageVisitProbe() {
  const { currentPlayer, gameSetup } = useGameSetup();
  const visit = gameSetup.villageVisit;

  return (
    <>
      <p>{`Village visit: ${visit?.villageId ?? 'none'},${visit?.phase ?? 'none'}`}</p>
      <p>{`Village feature: ${visit?.villageFeatureId ?? 'none'}`}</p>
      <p>{`Village lock: ${currentPlayer?.villageActionState?.currentVillageLockId ?? 'none'}`}</p>
    </>
  );
}

function createWandsmithGameplaySetup(language = 'en', villageId = 'fieldVillage') {
  const setup = createCommittedGameplaySetup();

  setup.players[0].language = language;
  setup.players[0].villageActionState = {
    currentVillageLockId: 'board-feature-field-a',
    usedActionsForCurrentVillage: {
      rest: false,
      wandsmith: true,
    },
  };
  setup.villageVisit = {
    pendingRewards: [],
    phase: 'wandsmith',
    playerId: 'player-1',
    rewardClaimKeys: [],
    villageFeatureId: 'board-feature-field-a',
    villageId,
  };

  return setup;
}

function WandsmithStateProbe() {
  const { currentPlayer, gameSetup, pendingNextTurnModal } = useGameSetup();
  const playerOne = gameSetup.players[0];

  return (
    <div>
      <p>{`Wandsmith visit: ${gameSetup.villageVisit?.phase ?? 'none'}`}</p>
      <p>{`Wandsmith current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Wandsmith next turn modal: ${pendingNextTurnModal}`}</p>
      <p>{`Wandsmith player one slots: ${playerOne.spellSlots
        .flatMap(({ tokens }) => tokens.map(({ id }) => id))
        .join(',')}`}</p>
      <p>{`Wandsmith player one committed: ${playerOne.spellSlots
        .flatMap(({ tokens }) => tokens)
        .every(({ committed }) => committed)}`}</p>
    </div>
  );
}

function createSosGameplaySetup({ includeVillages = true } = {}) {
  const setup = createCommittedGameplaySetup();

  setup.players[0].position = { x: 1, y: 1 };
  setup.players[0].anywhereMode = true;
  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'sos'),
  ];
  setup.board = {
    featureImages: includeVillages
      ? [
          { id: 'feature-1', imageName: 'village-field.png' },
          { id: 'feature-2', imageName: 'village-forest.png' },
        ]
      : [],
    height: 30,
    squares: includeVillages
      ? [
          { areaType: 'feature', featureId: 'feature-1', x: 3, y: 1 },
          { areaType: 'feature', featureId: 'feature-1', x: 4, y: 1 },
          { areaType: 'feature', featureId: 'feature-2', x: 20, y: 20 },
        ]
      : [],
    width: 30,
  };

  return setup;
}

function createForcedGameplaySetup(placedTokenCount) {
  const players = createPlayers(2);
  const currentPlayer = players[0];
  const placedTokens = currentPlayer.tokenBag.slice(0, placedTokenCount);

  currentPlayer.spellSlots[0].tokens = placedTokens.slice(0, 5);
  currentPlayer.spellSlots[1].tokens = placedTokens.slice(5);
  currentPlayer.tokenBag = currentPlayer.tokenBag.slice(placedTokenCount);

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
  mockChooseVisualPositionForFeature.mockReset();
  mockChooseVisualPositionForFeature.mockImplementation(
    ({ destinationSquare }) => ({
      x: destinationSquare.x,
      y: destinationSquare.y,
    })
  );
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

test('selects and delegates an event for a normal environment landing', () => {
  const onTriggerBoardEvent = jest.fn();
  jest.spyOn(Math, 'random').mockReturnValue(0);

  render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <GameplayPage onTriggerBoardEvent={onTriggerBoardEvent} />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  expect(onTriggerBoardEvent).toHaveBeenCalledTimes(1);
  expect(onTriggerBoardEvent).toHaveBeenCalledWith({
    environment: 'field',
    eventType: 'nothing',
    playerId: 'player-1',
    source: 'boardLanding',
  });
});

test('guarantees Loot Chest on a Metal Detector non-feature landing before event selection', () => {
  const initialGameSetup = createCommittedGameplaySetup();
  const onTriggerBoardEvent = jest.fn();

  initialGameSetup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'metal-detector'),
  ];

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <GameplayPage
        isChooseEventModeEnabled
        onTriggerBoardEvent={onTriggerBoardEvent}
      />
      <PlayerPotionStateProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  expect(
    screen.getByText('Are you sure you want to use Metal Detector?')
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'No' }));

  expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
  expect(screen.getByText('1/3')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

  expect(screen.getByText('Test active potion: metal-detector')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'Active Potion' })).getByText(
      'Metal Detector'
    )
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  expect(screen.queryByRole('dialog', { name: 'Choose Event' })).not.toBeInTheDocument();
  expect(onTriggerBoardEvent).toHaveBeenCalledTimes(1);
  expect(onTriggerBoardEvent).toHaveBeenCalledWith({
    environment: 'field',
    eventType: 'lootChest',
    playerId: 'player-1',
    source: 'boardLanding',
  });
  expect(screen.getByText('Test active potion: metal-detector')).toBeInTheDocument();
});

test('activates Smokescreen and excludes random battles from a normal landing', () => {
  const initialGameSetup = createCommittedGameplaySetup();
  const onTriggerBoardEvent = jest.fn();

  initialGameSetup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'smokescreen'),
  ];
  jest.spyOn(Math, 'random').mockReturnValue(0.3);

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <GameplayPage onTriggerBoardEvent={onTriggerBoardEvent} />
      <PlayerPotionStateProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  expect(
    screen.getByText('Are you sure you want to use Smokescreen?')
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'No' }));

  expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
  expect(screen.getByText('1/3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

  expect(screen.getByText('Test active potion: smokescreen')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'Active Potion' })).getByText(
      'Smokescreen'
    )
  ).toBeInTheDocument();
  expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  expect(onTriggerBoardEvent).toHaveBeenCalledWith({
    environment: 'field',
    eventType: 'nothing',
    playerId: 'player-1',
    source: 'boardLanding',
  });
  expect(screen.getByText('Test active potion: smokescreen')).toBeInTheDocument();
});

test('hides random battles from debug event choice while Smokescreen is active', () => {
  const initialGameSetup = createCommittedGameplaySetup();

  initialGameSetup.players[0].activePotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'smokescreen'
  );

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <GameplayPage isChooseEventModeEnabled />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  const dialog = screen.getByRole('dialog', { name: 'Choose Event' });

  expect(within(dialog).queryByRole('button', { name: /battle/i })).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Nothing' })).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Roll Again' })).toBeInTheDocument();
});

test('pauses a normal landing for manual event selection when choose mode is enabled', () => {
  const onTriggerBoardEvent = jest.fn();

  render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <GameplayPage
        isChooseEventModeEnabled
        onTriggerBoardEvent={onTriggerBoardEvent}
      />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  const dialog = screen.getByRole('dialog', { name: 'Choose Event' });

  expect(onTriggerBoardEvent).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /^spells$/i })).toBeDisabled();

  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Level 1 Battle' })
  );

  expect(
    screen.queryByRole('dialog', { name: 'Choose Event' })
  ).not.toBeInTheDocument();
  expect(onTriggerBoardEvent).toHaveBeenCalledTimes(1);
  expect(onTriggerBoardEvent).toHaveBeenCalledWith({
    environment: 'field',
    eventType: 'level1Battle',
    playerId: 'player-1',
    source: 'chooseEventMode',
  });
});

function ChooseEventRollAgainHarness() {
  const [rollAgainEvent, setRollAgainEvent] = useState(null);

  return (
    <GameplayPage
      activeRollAgainEvent={rollAgainEvent}
      isChooseEventModeEnabled
      onConsumeRollAgainEvent={() => setRollAgainEvent(null)}
      onContinueRollAgainEvent={() =>
        setRollAgainEvent((event) => ({ ...event, isModalOpen: false }))
      }
      onTriggerBoardEvent={({ eventType, playerId }) => {
        if (eventType === 'rollAgain') {
          setRollAgainEvent({ isModalOpen: true, playerId });
        }
      }}
    />
  );
}

test('shows choose event mode again after a manually selected Roll Again', () => {
  render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <ChooseEventRollAgainHarness />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Roll Again' }));

  const rollAgainDialog = screen.getByRole('dialog', {
    name: 'Roll Again Event',
  });

  fireEvent.click(
    within(rollAgainDialog).getByRole('button', { name: 'Continue' })
  );
  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );

  expect(
    screen.getByRole('dialog', { name: 'Choose Event' })
  ).toBeInTheDocument();
});

test('keeps Smokescreen active after Roll Again continues the same turn', () => {
  const initialGameSetup = createCommittedGameplaySetup();

  initialGameSetup.players[0].activePotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'smokescreen'
  );

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <ChooseEventRollAgainHarness />
      <PlayerPotionStateProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();
  fireEvent.click(
    screen.getByRole('button', { name: /move to field event square/i })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Roll Again' }));

  expect(screen.getByText('Test active potion: smokescreen')).toBeInTheDocument();

  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Roll Again Event' })).getByRole(
      'button',
      { name: 'Continue' }
    )
  );

  expect(screen.getByText('Test active potion: smokescreen')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
});

function RollAgainGameplayHarness() {
  const [rollAgainEvent, setRollAgainEvent] = useState({
    isModalOpen: true,
    playerId: 'player-1',
  });

  return (
    <>
      <GameplayPage
        activeRollAgainEvent={rollAgainEvent}
        onConsumeRollAgainEvent={() => setRollAgainEvent(null)}
        onContinueRollAgainEvent={() =>
          setRollAgainEvent((event) => ({ ...event, isModalOpen: false }))
        }
      />
      <p>{`Roll Again state: ${
        rollAgainEvent
          ? rollAgainEvent.isModalOpen
            ? 'modal'
            : 'pending'
          : 'clear'
      }`}</p>
    </>
  );
}

test('keeps turn and potion usage intact until a Roll Again landing resolves', () => {
  const initialGameSetup = createCommittedGameplaySetup();
  initialGameSetup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
  ];
  initialGameSetup.players[0].turnPotionUsage = {
    ...initialGameSetup.players[0].turnPotionUsage,
    boardPotionUsedThisTurn: true,
  };

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <RollAgainGameplayHarness />
      <GameplayPositionProbe />
      <PlayerPotionStateProbe />
    </GameSetupProvider>
  );

  const dialog = screen.getByRole('dialog', { name: 'Roll Again Event' });

  expect(screen.getByRole('region', { name: 'Gameplay panel' })).toBeInTheDocument();
  expect(screen.getByText('Current board player: player-1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Roll Again state: pending')).toBeInTheDocument();
  expect(screen.getByText('Current board player: player-1')).toBeInTheDocument();
  expect(
    screen.getByText('Player one board position: square,none,0,29')
  ).toBeInTheDocument();
  expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
  expect(screen.getByRole('button', { name: /^spells$/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
  finishDiceSequence();

  expect(screen.getByText('Current board player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Roll Again state: pending')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Use' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

  expect(screen.getByText('Roll Again state: clear')).toBeInTheDocument();
  expect(screen.getByText('Current board player: player-2')).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
});

function RespawnStateProbe() {
  const { currentPlayer, pendingTurnRespawn } = useGameSetup();

  return (
    <div>
      <p>{`Respawn probe player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Respawn probe health: ${currentPlayer?.currentHealth ?? 'none'}/${currentPlayer?.maxHealth ?? 'none'}`}</p>
      <p>{`Respawn probe died last turn: ${currentPlayer?.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Respawn probe position: ${currentPlayer?.position?.x ?? 'none'},${currentPlayer?.position?.y ?? 'none'}`}</p>
      <p>{`Respawn probe removed: ${pendingTurnRespawn?.removedTokens.map(({ token }) => token.id).join(',') || 'none'}`}</p>
    </div>
  );
}

function createTurnRespawnGameplaySetup({
  diedLastTurn = false,
  language = 'en',
  removableTokens = [],
  skipNextTurn = false,
} = {}) {
  const setup = createCommittedGameplaySetup();
  const player = setup.players[0];

  setup.pendingNextTurnModal = true;
  setup.players[0] = {
    ...player,
    currentHealth: 0,
    diedLastTurn,
    language,
    position: { x: 10, y: 10 },
    potions: [POTION_DEFINITIONS.find(({ id }) => id === 'heal')],
    skipNextTurn,
    spellSlots: player.spellSlots.map((slot, index) => ({
      ...slot,
      tokens:
        index === 0
          ? [
              {
                committed: true,
                id: 'starting-red',
                protected: true,
                type: 'red',
              },
              ...removableTokens,
            ]
          : [],
    })),
  };

  return setup;
}

test('requires English start-of-turn respawn, shows the removed Black token, then unlocks the recovered player', () => {
  const setup = createTurnRespawnGameplaySetup({
    removableTokens: [
      { committed: true, id: 'green-1', type: 'green' },
      { committed: true, id: 'black-1', type: 'black' },
    ],
  });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <RespawnStateProbe />
      <GameplayPage />
    </GameSetupProvider>
  );

  const turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  expect(within(turnDialog).getByRole('button', { name: 'Respawn' })).toHaveClass(
    'language-en'
  );
  expect(within(turnDialog).queryByRole('button', { name: 'OK' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Spells' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use' })).toBeDisabled();

  fireEvent.click(within(turnDialog).getByRole('button', { name: 'Respawn' }));

  const tokenDialog = screen.getByRole('dialog', { name: 'Respawn token removal' });
  expect(
    within(tokenDialog).getByText('This token has been removed')
  ).toHaveClass('larger-text', 'language-en');
  expect(within(tokenDialog).getByText('Sacrifice')).toHaveClass('language-en');
  expect(within(tokenDialog).getByRole('img', { name: /removed token/i })).toHaveAttribute(
    'title',
    'This token will be the first token to be removed if you lose a battle'
  );
  expect(within(tokenDialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(tokenDialog).queryByRole('listitem')).not.toBeInTheDocument();
  expect(screen.getByText('Respawn probe removed: black-1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Use' })).toBeDisabled();

  fireEvent.click(within(tokenDialog).getByRole('button', { name: 'OK' }));

  expect(screen.queryByRole('dialog', { name: 'Respawn token removal' })).not.toBeInTheDocument();
  expect(screen.getByText('Respawn probe health: 100/100')).toBeInTheDocument();
  expect(screen.getByText('Respawn probe position: 0,29')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();
});

test('localizes start-of-turn respawn and explains when no token can be removed', () => {
  const setup = createTurnRespawnGameplaySetup({ language: 'jp' });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <RespawnStateProbe />
      <GameplayPage />
    </GameSetupProvider>
  );

  const turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  expect(within(turnDialog).getByRole('button', { name: 'リスポーン' })).toHaveClass(
    'language-jp'
  );

  fireEvent.click(
    within(turnDialog).getByRole('button', { name: 'リスポーン' })
  );

  const tokenDialog = screen.getByRole('dialog', { name: 'Respawn token removal' });
  expect(
    within(tokenDialog).getByText('トークンを取り除くことができませんでした。')
  ).toHaveClass('larger-text', 'language-jp');
  expect(within(tokenDialog).queryByRole('img')).not.toBeInTheDocument();
  expect(within(tokenDialog).getByRole('button', { name: 'OK' })).toHaveClass(
    'language-jp'
  );
});

test('resolves start-of-turn respawn before preserving the existing skip-turn flow', () => {
  const setup = createTurnRespawnGameplaySetup({ skipNextTurn: true });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <RespawnStateProbe />
      <GameplayPage />
    </GameSetupProvider>
  );

  let turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  expect(within(turnDialog).queryByText('You miss your turn this turn')).not.toBeInTheDocument();
  fireEvent.click(within(turnDialog).getByRole('button', { name: 'Respawn' }));
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Respawn token removal' }))
      .getByRole('button', { name: 'OK' })
  );

  turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  expect(within(turnDialog).getByText('You miss your turn this turn')).toHaveClass(
    'larger-text',
    'language-en'
  );
  expect(within(turnDialog).getByRole('button', { name: 'OK' })).toBeInTheDocument();
  expect(within(turnDialog).queryByRole('button', { name: 'Respawn' })).not.toBeInTheDocument();
  expect(screen.getByText('Respawn probe health: 100/100')).toBeInTheDocument();

  fireEvent.click(within(turnDialog).getByRole('button', { name: 'OK' }));

  expect(screen.getByText('Respawn probe player: player-2')).toBeInTheDocument();
});

test('keeps the normal next-turn OK flow for a positive-health player', () => {
  const setup = createCommittedGameplaySetup();
  setup.pendingNextTurnModal = true;

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <GameplayPage />
    </GameSetupProvider>
  );

  const turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  expect(within(turnDialog).getByRole('button', { name: 'OK' })).toBeInTheDocument();
  expect(within(turnDialog).queryByRole('button', { name: 'Respawn' })).not.toBeInTheDocument();

  fireEvent.click(within(turnDialog).getByRole('button', { name: 'OK' }));
  expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeEnabled();
});

test('shows the English death state over the player until respawn completes', () => {
  const setup = createTurnRespawnGameplaySetup({ diedLastTurn: true });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <RespawnStateProbe />
      <GameplayPage />
    </GameSetupProvider>
  );

  const turnDialog = screen.getByRole('dialog', { name: 'Turn change' });
  const deathMessage = within(turnDialog).getByText('You died in your last turn');
  const skull = within(turnDialog).getByRole('img', { name: 'Death state skull' });
  const stylesheet = readFileSync(`${__dirname}/GameplayPage.css`, 'utf8');

  expect(deathMessage).toHaveClass(
    'larger-text',
    'turn-change-death-message',
    'language-en'
  );
  expect(skull).toHaveClass('turn-change-death-skull');
  expect(within(turnDialog).getByRole('button', { name: 'Respawn' })).toBeInTheDocument();
  expect(stylesheet).toMatch(
    /\.turn-change-player-image-wrapper\s*{[^}]*position:\s*relative;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-skull\s*{[^}]*animation:\s*deathSkullAppear[^;]*forwards;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-skull\s*{[^}]*color:\s*#333333;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-skull\s*{[^}]*position:\s*absolute;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-skull\s*{[^}]*width:\s*100%;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-message\s*{[^}]*color:\s*#F5FA00;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-message\s*{[^}]*margin-bottom:\s*30px;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-message\s*{[^}]*margin-top:\s*30px;/s
  );
  expect(stylesheet).toMatch(
    /\.turn-change-death-message\s*{[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /@keyframes deathSkullAppear\s*{[\s\S]*0%\s*{[^}]*opacity:\s*0;[^}]*transform:\s*scale\(0\);[\s\S]*100%\s*{[^}]*opacity:\s*1;[^}]*transform:\s*scale\(1\) translateX\(0\) rotate\(0\);/s
  );

  fireEvent.click(within(turnDialog).getByRole('button', { name: 'Respawn' }));
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Respawn token removal' }))
      .getByRole('button', { name: 'OK' })
  );

  expect(screen.getByText('Respawn probe died last turn: no')).toBeInTheDocument();
  expect(screen.queryByText('You died in your last turn')).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Death state skull' })).not.toBeInTheDocument();
});

test('localizes the death state and hides it without both death and respawn conditions', () => {
  const japaneseSetup = createTurnRespawnGameplaySetup({
    diedLastTurn: true,
    language: 'jp',
  });
  const { unmount } = render(
    <GameSetupProvider initialGameSetup={japaneseSetup}>
      <GameplayPage />
    </GameSetupProvider>
  );

  const deathMessage = within(
    screen.getByRole('dialog', { name: 'Turn change' })
  ).getByText('前のターンで死亡しました。');
  expect(deathMessage).toHaveClass('turn-change-death-message', 'language-jp');
  expect(
    screen.getByRole('button', { name: 'リスポーン' })
  ).toBeInTheDocument();
  unmount();

  const noDeathFlagSetup = createTurnRespawnGameplaySetup();
  const { unmount: unmountNoDeathFlag } = render(
    <GameSetupProvider initialGameSetup={noDeathFlagSetup}>
      <GameplayPage />
    </GameSetupProvider>
  );
  expect(screen.queryByText('You died in your last turn')).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Death state skull' })).not.toBeInTheDocument();
  unmountNoDeathFlag();

  const aliveSetup = createCommittedGameplaySetup();
  aliveSetup.pendingNextTurnModal = true;
  aliveSetup.players[0].diedLastTurn = true;
  render(
    <GameSetupProvider initialGameSetup={aliveSetup}>
      <GameplayPage />
    </GameSetupProvider>
  );
  expect(screen.queryByText('You died in your last turn')).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Death state skull' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
});

test.each([
  ['en', 'You miss your turn this turn'],
  ['jp', '\u3053\u306e\u30bf\u30fc\u30f3\u306f\u884c\u52d5\u3067\u304d\u307e\u305b\u3093\u3002'],
])(
  'shows the %s skipped-turn notice and keeps the following player modal open',
  (language, skipMessage) => {
    const setup = createCommittedGameplaySetup();

    setup.currentTurnIndex = 1;
    setup.pendingNextTurnModal = true;
    setup.players[1].language = language;
    setup.players[1].skipNextTurn = true;

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const skippedTurnDialog = screen.getByRole('dialog', { name: 'Turn change' });

    expect(within(skippedTurnDialog).getByText(skipMessage)).toHaveClass(
      'larger-text',
      `language-${language}`
    );

    fireEvent.click(
      within(skippedTurnDialog).getByRole('button', { name: /^ok$/i })
    );

    const nextTurnDialog = screen.getByRole('dialog', { name: 'Turn change' });

    expect(nextTurnDialog).toBeInTheDocument();
    expect(within(nextTurnDialog).getByText('Red Players Turn')).toBeInTheDocument();
    expect(within(nextTurnDialog).queryByText(skipMessage)).not.toBeInTheDocument();
  }
);

function PlayerPotionStateProbe() {
  const { currentPlayer } = useGameSetup();

  return (
    <div>
      <p>{`Test token bag: ${currentPlayer.tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Test board potion used: ${currentPlayer.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Test active potion: ${currentPlayer.activePotion?.id ?? 'none'}`}</p>
      <p>{`Test next board dice: ${currentPlayer.nextBoardDiceCount ?? 1}`}</p>
      <p>{`Test forced roll: ${currentPlayer.nextForcedRoll?.value ?? 'none'}`}</p>
      <p>{`Test board movement state: left=${currentPlayer.hasLeftStartArea}; anywhere=${currentPlayer.anywhereMode}`}</p>
    </div>
  );
}

function TargetPotionStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      {gameSetup.players.map((player) => (
        <p key={player.id}>
          {`${player.id} target effect: pending=${
            player.pendingPotionEffects?.map(({ potionId }) => potionId).join(',') || 'none'
          }; active=${player.activePotion?.id ?? 'none'}`}
        </p>
      ))}
    </div>
  );
}

function TroublemakerStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      {gameSetup.players.map((player) => (
        <p key={player.id}>
          {`${player.id} troublemaker state: active=${
            player.activePotion?.id ?? 'none'
          }; target=${
            player.activePotion?.targetPlayerId ?? 'none'
          }; tokens=${
            player.spellSlots
              .flatMap(({ tokens }) => tokens)
              .map(({ id }) => id)
              .join(',') || 'none'
          }`}
        </p>
      ))}
    </div>
  );
}

function DevineChanceStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      {gameSetup.players.map((player) => (
        <p key={player.id}>
          {`${player.id} Devine Chance state: active=${
            player.activePotion?.id ?? 'none'
          }; health=${player.currentHealth}/${player.maxHealth}`}
        </p>
      ))}
    </div>
  );
}

function StormMasterStateProbe() {
  const { currentPlayer, gameSetup } = useGameSetup();

  return (
    <div>
      <p>{`Storm current player: ${currentPlayer.id}`}</p>
      <p>{`Storm pending caster: ${gameSetup.stormMasterPendingPlayerId ?? 'none'}`}</p>
      <p>{`Storm effect caster: ${gameSetup.stormMasterEffect?.casterPlayerId ?? 'none'}`}</p>
      {gameSetup.players.map((player) => (
        <p key={player.id}>
          {`${player.id} storm position: ${player.position?.x ?? 'none'},${player.position?.y ?? 'none'}`}
        </p>
      ))}
    </div>
  );
}

function getSpellsNewBadge() {
  return screen.queryByLabelText(/new token bag tokens available/i);
}

function TokenBagStateControls() {
  const { currentPlayer, updatePlayerSpells } = useGameSetup();

  const updateCurrentPlayer = ({ spellSlots = currentPlayer.spellSlots, tokenBag }) => {
    updatePlayerSpells(currentPlayer.id, {
      hasCommittedInitialSpells: currentPlayer.hasCommittedInitialSpells,
      spellSlots,
      tokenBag,
    });
  };

  const commitFirstBagToken = () => {
    const [token, ...remainingTokenBag] = currentPlayer.tokenBag;
    const nextSpellSlots = currentPlayer.spellSlots.map((slot, index) =>
      index === 0
        ? { ...slot, tokens: [...slot.tokens, { ...token, committed: true }] }
        : slot
    );

    updateCurrentPlayer({ spellSlots: nextSpellSlots, tokenBag: remainingTokenBag });
  };

  return (
    <>
      <button type="button" onClick={commitFirstBagToken}>Commit bag token</button>
      <button
        type="button"
        onClick={() => updateCurrentPlayer({
          tokenBag: [{ committed: false, id: 'gained-token', type: 'blue' }],
        })}
      >
        Gain bag token
      </button>
      <button type="button" onClick={() => updateCurrentPlayer({ tokenBag: [] })}>
        Remove bag tokens
      </button>
    </>
  );
}

test('renders the decorative magical night sky only as gameplay background content', () => {
  renderGameplayPage();

  expect(screen.getByTestId('magical-night-sky')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByLabelText(/game board/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
});

describe('GameplayPage spell modal unsaved change behavior', () => {
  test('shows the localized New badge only for unseen current-player token bag tokens', () => {
    const emptyBagSetup = createCommittedGameplaySetup();

    const { unmount: unmountEmptyBag } = render(
      <GameSetupProvider initialGameSetup={emptyBagSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    unmountEmptyBag();

    const oneTokenSetup = createCommittedGameplaySetup();
    oneTokenSetup.players[0].tokenBag = [{ committed: false, id: 'bag-token-1', type: 'red' }];

    const { unmount: unmountOneTokenBag } = render(
      <GameSetupProvider initialGameSetup={oneTokenSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toHaveTextContent('New');
    expect(getSpellsNewBadge()).toHaveClass('language-en');
    expect(getSpellsNewBadge()).not.toHaveTextContent('!');
    unmountOneTokenBag();

    const multipleTokenSetup = createCommittedGameplaySetup();
    multipleTokenSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-token-1', type: 'red' },
      { committed: false, id: 'bag-token-2', type: 'blue' },
    ];

    render(
      <GameSetupProvider initialGameSetup={multipleTokenSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getAllByLabelText(/new token bag tokens available/i)).toHaveLength(1);
  });

  test('clears the badge when Spells opens and keeps it cleared after cancel and turn changes', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'player-1-bag-token', type: 'red' },
    ];
    initialGameSetup.players[1].tokenBag = [];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^spells$/i }));
    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(getSpellsNewBadge()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(getSpellsNewBadge()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(getSpellsNewBadge()).not.toBeInTheDocument();
  });

  test('re-shows the badge for a later token and hides it when the bag becomes empty', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'uncommitted-token', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <TokenBagStateControls />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /commit bag token/i }));
    expect(getSpellsNewBadge()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gain bag token/i }));
    expect(getSpellsNewBadge()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^spells$/i }));
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(getSpellsNewBadge()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove bag tokens/i }));
    expect(getSpellsNewBadge()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gain bag token/i }));
    expect(getSpellsNewBadge()).toBeInTheDocument();
  });

  test('shows the Japanese badge and falls back to English for an invalid language', () => {
    const japaneseSetup = createCommittedGameplaySetup();
    japaneseSetup.players[0].language = 'jp';
    japaneseSetup.players[0].tokenBag = [
      { committed: false, id: 'jp-token', type: 'red' },
    ];

    const { unmount } = render(
      <GameSetupProvider initialGameSetup={japaneseSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toHaveTextContent('新規');
    expect(getSpellsNewBadge()).toHaveClass('language-jp');
    unmount();

    const fallbackSetup = createCommittedGameplaySetup();
    fallbackSetup.players[0].language = 'invalid';
    fallbackSetup.players[0].tokenBag = [
      { committed: false, id: 'fallback-token', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={fallbackSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toHaveTextContent('New');
    expect(getSpellsNewBadge()).toHaveClass('language-en');
  });

  test('positions a compact non-blocking badge over only the gameplay Spells button', () => {
    const globalStylesheet = readFileSync(`${__dirname}/../index.css`, 'utf8');
    const stylesheet = readFileSync(`${__dirname}/GameplayPage.css`, 'utf8');

    expect(globalStylesheet).toMatch(
      /\.language-en\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;/s
    );
    expect(globalStylesheet).toMatch(
      /\.language-jp\s*{[^}]*font-family:\s*'M PLUS Rounded 1c',\s*sans-serif;/s
    );
    expect(stylesheet).toMatch(/\.spells-button-wrapper\s*{[^}]*position:\s*relative;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*position:\s*absolute;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*top:\s*-8px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*right:\s*-8px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*pointer-events:\s*none;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*min-width:\s*34px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*padding:\s*3px 6px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*border-radius:\s*999px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*font-size:\s*12px;/s);

    const initialGameSetup = createCommittedGameplaySetup();
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-token-1', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNewBadge()).toHaveClass(
      'spells-button-notification'
    );
    expect(screen.getAllByText('Spells')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /^spells$/i })).toBeEnabled();
    expect(document.querySelector('.spells-button-wrapper ul, .spells-button-wrapper li')).toBeNull();
  });

  test.each([0, 1, 4])(
    'keeps forced setup Save disabled with %i starting tokens placed',
    (placedTokenCount) => {
      render(
        <GameSetupProvider
          initialGameSetup={createForcedGameplaySetup(placedTokenCount)}
        >
          <GameplayPage />
        </GameSetupProvider>
      );

      const spellsDialog = screen.getByRole('dialog', { name: /spells/i });

      expect(within(spellsDialog).getByRole('button', { name: /^save$/i })).toBeDisabled();
      expect(
        within(spellsDialog).getByText(
          'You must place all 5 starting tokens into spell slots before rolling dice. Place your tokens by dragging them from your token bag into the spell slots.'
        )
      ).toBeInTheDocument();
    }
  );

  test('enables forced setup Save only when all five starting tokens are placed', () => {
    render(
      <GameSetupProvider initialGameSetup={createForcedGameplaySetup(5)}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const saveButton = within(
      screen.getByRole('dialog', { name: /spells/i })
    ).getByRole('button', { name: /^save$/i });

    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    const confirmationDialog = screen.getByRole('dialog', {
      name: /save spells confirmation/i,
    });

    expect(confirmationDialog).toBeInTheDocument();
    expect(
      within(confirmationDialog).getByText(/commit your tokens to these spell slots/i)
    ).toHaveClass('larger-text', 'language-en');
  });

  test('shows a pending turn modal before forced spell setup for the new player', () => {
    const initialGameSetup = createForcedGameplaySetup(0);

    initialGameSetup.currentTurnIndex = 1;
    initialGameSetup.pendingNextTurnModal = true;

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const turnDialog = screen.getByRole('dialog', { name: /turn change/i });

    expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /spells/i })).toBeDisabled();

    fireEvent.click(within(turnDialog).getByRole('button', { name: /^ok$/i }));

    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
  });

  test('switches the listed gameplay labels and font classes with each player turn', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'en';
    initialGameSetup.players[1].language = 'jp';

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const gameplayPanel = screen.getByRole('region', { name: /gameplay panel/i });

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(
      within(gameplayPanel).getByText('Spells', {
        selector: '.committed-spell-slot-display-title',
      })
    ).toHaveClass('language-en');
    expect(
      within(gameplayPanel).getByRole('heading', { name: 'Potions' })
    ).toHaveClass('language-en');

    fireEvent.click(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(
      within(gameplayPanel).getByRole('button', { name: 'サイコロを振る' })
    ).toHaveClass('language-jp');
    expect(within(gameplayPanel).getByRole('button', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(
      within(gameplayPanel).getByText('呪文', {
        selector: '.committed-spell-slot-display-title',
      })
    ).toHaveClass('language-jp');
    expect(
      within(gameplayPanel).getByRole('heading', { name: 'ポーション' })
    ).toHaveClass('language-jp');
    expect(within(gameplayPanel).queryByRole('button', { name: 'Roll Dice' })).not.toBeInTheDocument();

    const japaneseTurnDialog = screen.getByRole('dialog', { name: /turn change/i });

    expect(within(japaneseTurnDialog).getByText('プレイヤー青のターン')).toHaveClass(
      'language-jp'
    );
    expect(within(japaneseTurnDialog).queryByText(/It is now/i)).not.toBeInTheDocument();

    fireEvent.click(
      within(japaneseTurnDialog).getByRole('button', {
        name: 'OK',
      })
    );
    fireEvent.click(within(gameplayPanel).getByRole('button', { name: '呪文' }));

    const spellsDialog = screen.getByRole('dialog', { name: '呪文' });

    expect(within(spellsDialog).getByRole('heading', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(within(spellsDialog).getByText('トークンバッグ')).toBeInTheDocument();
    expect(within(spellsDialog).getByRole('button', { name: 'キャンセル' })).toHaveClass(
      'language-jp'
    );
    fireEvent.click(within(spellsDialog).getByRole('button', { name: 'キャンセル' }));

    fireEvent.click(within(gameplayPanel).getByRole('button', { name: 'サイコロを振る' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('heading', { name: 'Potions' })).toHaveClass(
      'language-en'
    );
  });

  test('uses English gameplay labels when the current player language is invalid', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'invalid';

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const gameplayPanel = screen.getByRole('region', { name: /gameplay panel/i });

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('heading', { name: 'Potions' })).toHaveClass(
      'language-en'
    );
  });

  test('shows no potions for an empty collection', () => {
    renderGameplayPage();

    const potionsArea = screen.getByRole('region', { name: /potions/i });

    expect(potionsArea).toHaveTextContent('0/3');
    expect(within(potionsArea).queryByText('No potions')).not.toBeInTheDocument();
  });

  test('shows the current player potions and updates them when the turn changes', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'en';
    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    ];
    initialGameSetup.players[1].language = 'jp';
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
    expect(within(firstPlayerPotions).getByText('1/3')).toBeInTheDocument();
    expect(within(firstPlayerPotions).queryByText('Rare | Both')).not.toBeInTheDocument();
    expect(
      within(firstPlayerPotions).getByRole('group', { name: /roll choice potion/i })
    ).toHaveClass('potion-icon--blue');
    expect(within(firstPlayerPotions).queryByText('Small Heal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    const secondPlayerPotions = screen.getByRole('region', { name: 'ポーション' });

    expect(within(secondPlayerPotions).getByText('小回復')).toHaveClass('language-jp');
    expect(within(secondPlayerPotions).getByText('1/3')).toBeInTheDocument();
    expect(within(secondPlayerPotions).queryByText('Common | Both')).not.toBeInTheDocument();
    expect(
      within(secondPlayerPotions).getByRole('group', { name: '小回復 potion' })
    ).toHaveAccessibleDescription('HPを30％回復する。');
    expect(within(secondPlayerPotions).queryByText('Roll Choice')).not.toBeInTheDocument();
  });

  test('confirms Board potion use and removes only the selected duplicate', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const boardPotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'small-heal'
    );

    initialGameSetup.players[0].potions = [boardPotion, boardPotion];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: /potions/i });
    const useButtons = within(potionSection).getAllByRole('button', { name: 'Use' });

    expect(useButtons).toHaveLength(2);
    fireEvent.click(useButtons[1]);

    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText(
        `Are you sure you want to use ${boardPotion.name}?`
      )
    ).toHaveClass('larger-text', 'language-en');
    expect(within(confirmation).getByText('Potion Description')).toBeInTheDocument();
    expect(
      within(confirmation).getByText(boardPotion.description)
    ).not.toHaveClass('larger-text');

    fireEvent.click(within(confirmation).getByRole('button', { name: 'No' }));
    expect(screen.queryByRole('dialog', { name: /use potion confirmation/i })).not.toBeInTheDocument();
    within(potionSection).getAllByRole('button', { name: 'Use' }).forEach(
      (button) => expect(button).toBeEnabled()
    );

    fireEvent.click(within(potionSection).getAllByRole('button', { name: 'Use' })[1]);
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(within(potionSection).getByText('1/3')).toBeInTheDocument();
    expect(within(potionSection).getAllByRole('button', { name: 'Use' })).toHaveLength(1);
    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeDisabled();
    expect(initialGameSetup.players[0].currentHealth).toBe(100);
  });

  test('cancels SOS without consuming it, then teleports to the nearest village and starts its normal visit', () => {
    const initialGameSetup = createSosGameplaySetup();
    const onNavigate = jest.fn();

    mockChooseVisualPositionForFeature.mockReturnValue({
      featureId: 'board-feature-feature-1',
      type: 'feature',
      x: 4,
      y: 1,
    });

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage onNavigate={onNavigate} />
        <GameplayPositionProbe />
        <PlayerPotionStateProbe />
        <VillageVisitProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));

    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText('Are you sure you want to use SOS?')
    ).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'No' }));

    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();
    expect(
      screen.getByText('Player one board position: square,none,1,1')
    ).toBeInTheDocument();
    expect(screen.getByText('Village visit: none,none')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(mockChooseVisualPositionForFeature).toHaveBeenCalledWith({
      board: initialGameSetup.board,
      destinationSquare: {
        areaType: 'feature',
        featureId: 'feature-1',
        x: 3,
        y: 1,
      },
      players: expect.any(Array),
    });
    expect(
      screen.getByText(
        'Player one board position: feature,board-feature-feature-1,4,1'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Village visit: fieldVillage,reward')).toBeInTheDocument();
    expect(
      screen.getByText('Village feature: board-feature-feature-1')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Village lock: board-feature-feature-1')
    ).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(
      screen.getByText('Test board movement state: left=true; anywhere=false')
    ).toBeInTheDocument();
    expect(onNavigate).toHaveBeenCalledWith('/village');
  });

  test('keeps SOS when no generated village destination exists', () => {
    const initialGameSetup = createSosGameplaySetup({ includeVillages: false });
    const onNavigate = jest.fn();
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage onNavigate={onNavigate} />
        <GameplayPositionProbe />
        <PlayerPotionStateProbe />
        <VillageVisitProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(warning).toHaveBeenCalledWith(
      'SOS potion could not find a generated village destination.'
    );
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();
    expect(
      screen.getByText('Player one board position: square,none,1,1')
    ).toBeInTheDocument();
    expect(screen.getByText('Village visit: none,none')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  test('uses the standard Japanese confirmation copy for SOS', () => {
    const initialGameSetup = createSosGameplaySetup();

    initialGameSetup.players[0].language = 'jp';

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: '使用する' }));

    expect(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByText('SOSを使用してもよろしいですか？')
    ).toBeInTheDocument();
  });

  test('returns Copy and Paste to its slot when the token bag is empty', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
    ];
    initialGameSetup.players[0].hasUnseenTokenBagTokens = false;

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const modal = screen.getByRole('dialog', { name: 'Copy and Paste' });

    expect(
      within(modal).getByText(
        'You have no tokens in your token bag, so this potion cannot be used. The potion was added back to your potion slots.'
      )
    ).toHaveClass('larger-text');
    expect(screen.getByText('Test token bag: empty')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('1/3')
    ).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog', { name: 'Copy and Paste' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();
  });

  test('cancels Copy and Paste without changing tokens, potions, or Board usage', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
    ];
    initialGameSetup.players[0].hasUnseenTokenBagTokens = false;
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'player-1-red-3', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: 'Potions' });

    fireEvent.click(
      within(potionSection).getAllByRole('button', { name: 'Use' })[0]
    );
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getByRole(
        'button',
        { name: 'Cancel' }
      )
    );

    expect(screen.queryByRole('dialog', { name: 'Copy and Paste' })).not.toBeInTheDocument();
    expect(screen.getByText('Test token bag: player-1-red-3')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    expect(within(potionSection).getByText('2/3')).toBeInTheDocument();
    within(potionSection).getAllByRole('button', { name: 'Use' }).forEach(
      (button) => expect(button).toBeEnabled()
    );

    fireEvent.click(
      within(potionSection).getAllByRole('button', { name: 'Use' })[0]
    );
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getByRole(
        'button',
        { name: 'Duplicate' }
      )
    );

    expect(
      screen.getByText('Test token bag: player-1-red-3,player-1-red-6')
    ).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(getSpellsNewBadge()).toHaveTextContent('New');
    expect(within(potionSection).getByText('1/3')).toBeInTheDocument();
    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeDisabled();
  });

  test('duplicates a selected token with Copy and Paste when the bag has space', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
    ];
    initialGameSetup.players[0].hasUnseenTokenBagTokens = false;
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'player-1-red-3', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getByRole(
        'button',
        { name: 'Duplicate' }
      )
    );

    expect(screen.queryByRole('dialog', { name: 'Copy and Paste' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Test token bag: player-1-red-3,player-1-red-6')
    ).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(getSpellsNewBadge()).toHaveTextContent('New');
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();
  });

  test('keeps a full bag unchanged when the new Copy and Paste token is discarded', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const tokenBag = [
      { committed: false, id: 'player-1-red-1', type: 'red' },
      { committed: false, id: 'player-1-blue-1', type: 'blue' },
      { committed: false, id: 'player-1-green-1', type: 'green' },
      { committed: false, id: 'player-1-orange-1', type: 'orange' },
      { committed: false, id: 'player-1-purple-1', type: 'purple' },
    ];

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
    ];
    initialGameSetup.players[0].hasUnseenTokenBagTokens = false;
    initialGameSetup.players[0].tokenBag = tokenBag;

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getAllByRole(
        'button',
        { name: 'Duplicate' }
      )[0]
    );

    const discardModal = screen.getByRole('dialog', { name: 'Copy and Paste' });

    expect(within(discardModal).getByRole('img', { name: 'red token duplicate' })).toBeInTheDocument();
    fireEvent.click(
      within(discardModal).getByRole('button', { name: 'Discard this new token' })
    );

    expect(
      screen.getByText(`Test token bag: ${tokenBag.map(({ id }) => id).join(',')}`)
    ).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();
  });

  test('replaces a selected full-bag token with the Copy and Paste duplicate', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
    ];
    initialGameSetup.players[0].hasUnseenTokenBagTokens = false;
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'player-1-red-1', type: 'red' },
      { committed: false, id: 'player-1-blue-1', type: 'blue' },
      { committed: false, id: 'player-1-green-1', type: 'green' },
      { committed: false, id: 'player-1-orange-1', type: 'orange' },
      { committed: false, id: 'player-1-purple-1', type: 'purple' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getAllByRole(
        'button',
        { name: 'Duplicate' }
      )[0]
    );

    const blueTokenOption = screen
      .getByRole('img', { name: 'blue token' })
      .closest('.copy-paste-token-option');

    fireEvent.click(
      within(blueTokenOption).getByRole('button', {
        name: 'Discard this token and keep the duplicate',
      })
    );

    expect(
      screen.getByText(
        'Test token bag: player-1-red-1,player-1-red-6,player-1-green-1,player-1-orange-1,player-1-purple-1'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(getSpellsNewBadge()).not.toBeInTheDocument();
  });

  test('moves a confirmed committed token with Tokensmith only after its modal flow', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'tokensmith'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const tokenButton = within(
      screen.getByRole('dialog', { name: 'Tokensmith' })
    ).getByRole('button', {
      name: /select red token player-1-red-1 in slot 1/i,
    });
    fireEvent.click(tokenButton);

    let confirmation = screen.getByRole('dialog', {
      name: 'Tokensmith confirmation',
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'No' })
    );

    expect(screen.getByRole('dialog', { name: 'Tokensmith' })).toBeInTheDocument();
    expect(screen.getByText('Test token bag: empty')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Tokensmith' })).getByRole(
        'button',
        {
          name: /select red token player-1-red-1 in slot 1/i,
        }
      )
    );
    confirmation = screen.getByRole('dialog', {
      name: 'Tokensmith confirmation',
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Yes' })
    );

    expect(screen.queryByRole('dialog', { name: 'Tokensmith' })).not.toBeInTheDocument();
    expect(screen.getByText('Test token bag: player-1-red-1')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();
  });

  test('consumes Redo, opens movable committed spells, and restores normal locking after cancel', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'redo'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    let spellsDialog = screen.getByRole('dialog', { name: 'Spells' });

    expect(
      within(spellsDialog).getByText(
        'Rearrange your tokens as much as you like, but when you commit them, they become fixed again.'
      )
    ).toHaveClass('spells-starting-warning');
    within(spellsDialog)
      .getAllByRole('button', { name: /moveable red token/i })
      .forEach((button) => expect(button).toBeEnabled());
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();

    fireEvent.click(
      within(spellsDialog).getByRole('button', { name: 'Cancel' })
    );

    expect(screen.queryByRole('dialog', { name: 'Spells' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    spellsDialog = screen.getByRole('dialog', { name: 'Spells' });

    within(spellsDialog)
      .getAllByRole('button', { name: /committed red token/i })
      .forEach((button) => expect(button).toBeDisabled());
    expect(
      within(spellsDialog).queryByText(
        'Rearrange your tokens as much as you like, but when you commit them, they become fixed again.'
      )
    ).not.toBeInTheDocument();
  });

  test.each([
    {
      cancel: 'Cancel',
      language: 'en',
      no: 'No',
      warning:
        'Are you sure you want to leave without making any changes? The Wandsmith will close after you leave.',
      yes: 'Yes',
    },
    {
      cancel: '\u30ad\u30e3\u30f3\u30bb\u30eb',
      language: 'jp',
      no: '\u3044\u3044\u3048',
      warning:
        '\u5909\u66f4\u305b\u305a\u306b\u9000\u51fa\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f\u9000\u51fa\u3059\u308b\u3068\u3001\u6756\u8077\u4eba\u306e\u753b\u9762\u306f\u9589\u3058\u307e\u3059\u3002',
      yes: '\u306f\u3044',
    },
  ])('confirms a Wandsmith cancel and preserves saved spells in $language', ({
    cancel,
    language,
    no,
    warning,
    yes,
  }) => {
    const setup = createWandsmithGameplaySetup(language);
    const savedTokenIds = setup.players[0].spellSlots
      .flatMap(({ tokens }) => tokens.map(({ id }) => id))
      .join(',');

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <GameplayPage />
        <WandsmithStateProbe />
      </GameSetupProvider>
    );

    let spellsDialog = screen.getByRole('dialog');

    within(spellsDialog)
      .getAllByRole('button', { name: /moveable/i })
      .forEach((button) => expect(button).toBeEnabled());
    fireEvent.click(within(spellsDialog).getByRole('button', { name: cancel }));

    let confirmation = screen.getByRole('dialog', {
      name: /cancel spells confirmation/i,
    });

    expect(within(confirmation).getByText(warning)).toHaveClass(
      'larger-text',
      `language-${language}`
    );
    fireEvent.click(within(confirmation).getByRole('button', { name: no }));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByText('Wandsmith current player: player-1')).toBeInTheDocument();

    spellsDialog = screen.getByRole('dialog');
    fireEvent.click(within(spellsDialog).getByRole('button', { name: cancel }));
    confirmation = screen.getByRole('dialog', {
      name: /cancel spells confirmation/i,
    });
    fireEvent.click(within(confirmation).getByRole('button', { name: yes }));

    expect(screen.queryByRole('button', { name: cancel })).not.toBeInTheDocument();
    expect(screen.getByText('Wandsmith visit: none')).toBeInTheDocument();
    expect(screen.getByText('Wandsmith current player: player-2')).toBeInTheDocument();
    expect(screen.getByText('Wandsmith next turn modal: true')).toBeInTheDocument();
    expect(
      screen.getByText(`Wandsmith player one slots: ${savedTokenIds}`)
    ).toBeInTheDocument();
  });

  test('allows a no-change Wandsmith commit and ends the turn after confirmation', () => {
    const setup = createWandsmithGameplaySetup();

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <GameplayPage />
        <WandsmithStateProbe />
      </GameSetupProvider>
    );

    const spellsDialog = screen.getByRole('dialog', { name: 'Spells' });
    const saveButton = within(spellsDialog).getByRole('button', { name: 'Save' });

    expect(
      within(spellsDialog).getByText(
        'The Wandsmith helps you arrange your tokens however you wish.'
      )
    ).toHaveClass('spells-starting-warning');
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    const confirmation = screen.getByRole('dialog', {
      name: /save spells confirmation/i,
    });

    expect(
      within(confirmation).getByText(
        'Are you sure you want to commit your tokens to these spell slots? This cannot be changed without using a Wandsmith or potions once they are saved.'
      )
    ).toHaveClass('larger-text', 'language-en');
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Wandsmith visit: none')).toBeInTheDocument();
    expect(screen.getByText('Wandsmith current player: player-2')).toBeInTheDocument();
    expect(screen.getByText('Wandsmith next turn modal: true')).toBeInTheDocument();
    expect(screen.getByText('Wandsmith player one committed: true')).toBeInTheDocument();
  });

  test.each([
    ['fieldVillage', 'field-village.png'],
    ['forestVillage', 'forest-village.png'],
  ])('keeps the %s background behind its Wandsmith modal', (villageId, imageName) => {
    const setup = createWandsmithGameplaySetup('en', villageId);

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getByRole('main').style.backgroundImage).toContain(imageName);
    expect(screen.queryByTestId('magical-night-sky')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Spells' })).toBeInTheDocument();
  });

  test('targets another player with Spellbound and blocks Board potions only for that next turn', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'spellbound'),
    ];
    initialGameSetup.players[1].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <TargetPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const chooser = screen.getByRole('dialog', {
      name: 'Choose a player to target',
    });

    expect(within(chooser).queryByRole('group', {
      name: 'Player 1 option',
    })).not.toBeInTheDocument();
    fireEvent.click(
      within(
        within(chooser).getByRole('group', { name: 'Player 2 option' })
      ).getByRole('button', { name: 'Choose' })
    );

    expect(
      screen.getByText(
        'player-2 target effect: pending=spellbound; active=none'
      )
    ).toBeInTheDocument();
    expect(within(screen.getByRole('region', {
      name: 'Potions',
    })).getByText('0/3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', {
      name: 'Move to square 1, 28',
    }));

    expect(
      screen.getByText(
        'player-2 target effect: pending=none; active=spellbound'
      )
    ).toBeInTheDocument();
    expect(within(screen.getByRole('region', {
      name: 'Active Potion',
    })).getByText('Spellbound')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', {
      name: 'Move to square 1, 28',
    }));

    expect(
      screen.getByText(
        'player-2 target effect: pending=none; active=none'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Potions' })).toBeInTheDocument();
  });

  test('halves a Heavy Weight target board roll, movement, and result text', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'heavy-weight'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <TargetPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(
      within(
        screen.getByRole('group', { name: 'Player 2 option' })
      ).getByRole('button', { name: 'Choose' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', {
      name: 'Move to square 1, 28',
    }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    jest.spyOn(Math, 'random').mockReturnValue(0.8);
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('img', { name: 'Dice face 5' })).toBeInTheDocument();
    expect(
      screen.getByText('3', {
        selector: '.heavy-weight-dice-result-number',
      })
    ).toHaveClass('heavy-weight-dice-result-number');
    expect(
      screen.getByText('3', {
        selector: '.heavy-weight-dice-result-number',
      }).tagName
    ).toBe('P');
    const heavyWeightMessage = screen
      .getByRole('dialog', { name: 'Dice result' })
      .querySelector('.heavy-weight-dice-result-message');

    expect(heavyWeightMessage).toHaveClass(
      'heavy-weight-dice-result-message',
      'language-en'
    );
    expect(heavyWeightMessage).toHaveTextContent(
      'Dice roll is halved because you are weighed down.'
    );
    expect(heavyWeightMessage).not.toHaveTextContent('-');
    expect(heavyWeightMessage.tagName).toBe('P');
    expect(heavyWeightMessage.parentElement.tagName).toBe('DIV');
    expect(heavyWeightMessage.parentElement).toHaveClass(
      'heavy-weight-dice-result'
    );
    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 1, y: 29 },
      3,
      { blockedNodeIds: [] }
    );

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('dialog', { name: 'Dice result' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByRole('dialog', { name: 'Dice result' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(
      screen.queryByRole('dialog', { name: 'Dice result' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {
      name: 'Move to square 1, 28',
    }));

    expect(
      screen.getByText(
        'player-2 target effect: pending=none; active=none'
      )
    ).toBeInTheDocument();
  });

  test('resolves Troublemaker with one shared even roll before movement continues', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const targetStartingToken = initialGameSetup.players[1].spellSlots[0].tokens[0];

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'troublemaker'),
    ];
    initialGameSetup.players[0].nextForcedRoll = {
      sourcePotionId: 'test',
      usedFrom: 'board',
      value: 2,
    };
    initialGameSetup.players[1].spellSlots[0].tokens.push({
      committed: true,
      id: 'target-black',
      protected: false,
      type: 'black',
    });

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <TroublemakerStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const chooser = screen.getByRole('dialog', {
      name: 'Choose a player to target',
    });

    expect(
      within(chooser).queryByRole('group', { name: 'Player 1 option' })
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(
        within(chooser).getByRole('group', { name: 'Player 2 option' })
      ).getByRole('button', { name: 'Choose' })
    );

    expect(
      screen.getByText(
        /player-1 troublemaker state: active=troublemaker; target=player-2/
      )
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Active Potion' })
      ).getByText('Troublemaker')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));

    expect(screen.getAllByLabelText('Dice roller')).toHaveLength(1);
    finishDiceSequence();

    const resultModal = screen.getByRole('dialog', {
      name: 'Troublemaker token loss',
    });

    expect(
      within(resultModal).getByRole('img', { name: 'Player 2 piece' })
    ).toBeInTheDocument();
    expect(
      within(resultModal).getByText('You lost this token')
    ).toBeInTheDocument();
    expect(
      within(resultModal).getByRole('img', { name: 'Black lost token' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `player-2 troublemaker state: active=none; target=none; tokens=${targetStartingToken.id}`
        )
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /player-1 troublemaker state: active=troublemaker; target=player-2/
      )
    ).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(
      within(resultModal).getByRole('button', { name: 'Continue' })
    );

    expect(
      screen.queryByRole('dialog', { name: 'Troublemaker token loss' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /player-1 troublemaker state: active=none; target=none/
      )
    ).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledTimes(1);
    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      2,
      { blockedNodeIds: [] }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Move to square 1, 28' })
    );
  });

  test('resolves Devine Chance with one shared even roll before movement continues', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      currentHealth: 40,
      potions: [
        POTION_DEFINITIONS.find(({ id }) => id === 'devine-chance'),
      ],
      nextForcedRoll: {
        sourcePotionId: 'test',
        usedFrom: 'board',
        value: 2,
      },
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <DevineChanceStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(
      screen.getByText(
        'player-1 Devine Chance state: active=devine-chance; health=40/100'
      )
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Active Potion' })
      ).getByText('Devine Chance')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));

    expect(screen.getAllByLabelText('Dice roller')).toHaveLength(1);
    finishDiceSequence();

    const resultModal = screen.getByRole('dialog', {
      name: 'Devine Chance result',
    });

    expect(
      within(resultModal).getByText('You recovered all your health')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'player-1 Devine Chance state: active=devine-chance; health=100/100'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'player-2 Devine Chance state: active=none; health=15/100'
      )
    ).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(
      within(resultModal).getByRole('button', { name: 'Continue' })
    );

    expect(
      screen.queryByRole('dialog', { name: 'Devine Chance result' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'player-1 Devine Chance state: active=none; health=100/100'
      )
    ).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledTimes(1);
    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      2,
      { blockedNodeIds: [] }
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Move to square 1, 28' })
    );
  });

  test('keeps Buy and Sell when the token bag has fewer than three tokens', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'buy-and-sell'),
    ];
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-red', type: 'red' },
      { committed: false, id: 'bag-blue', type: 'blue' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const modal = screen.getByRole('dialog', { name: 'Buy and Sell' });

    expect(
      within(modal).getByText(
        'You do not have enough tokens in your token bag to cast this potion'
      )
    ).toBeInTheDocument();
    fireEvent.click(within(modal).getByRole('button', { name: 'OK' }));

    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('1/3')
    ).toBeInTheDocument();
  });

  test('discards three tokens, gains one choice, then consumes Buy and Sell', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'buy-and-sell'),
    ];
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-red', type: 'red' },
      { committed: false, id: 'bag-blue', type: 'blue' },
      { committed: false, id: 'bag-green', type: 'green' },
    ];
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99);

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    let modal = screen.getByRole('dialog', { name: 'Buy and Sell' });
    const discardButton = within(modal).getByRole('button', {
      name: 'Discard',
    });

    expect(discardButton).toBeDisabled();
    within(modal)
      .getAllByRole('button', { name: /select .* bag token/i })
      .forEach((button) => fireEvent.click(button));
    expect(discardButton).toBeEnabled();
    fireEvent.click(discardButton);

    modal = screen.getByRole('dialog', { name: 'Buy and Sell' });
    const rewardOptions = within(modal).getAllByRole('group', {
      name: /reward token option/i,
    });
    const expectedRewardTokenTypes = [
      TOKEN_TYPES[0],
      TOKEN_TYPES[TOKEN_TYPES.length - 1],
    ];

    expect(rewardOptions).toHaveLength(2);
    expect(
      rewardOptions.map((option) =>
        within(option).getByRole('img').getAttribute('aria-label')
      )
    ).toEqual(
      expectedRewardTokenTypes.map((tokenType) => `${tokenType} reward token`)
    );
    fireEvent.click(
      within(rewardOptions[1]).getByRole('button', { name: 'Choose' })
    );

    expect(
      within(modal).getByText('The token was added to your token bag')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Test token bag: player-1-${expectedRewardTokenTypes[1]}-1`
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole('button', { name: 'OK' }));
    expect(
      screen.queryByRole('dialog', { name: 'Buy and Sell' })
    ).not.toBeInTheDocument();
  });

  test('replaces Cauldron in its original slot after a forced potion choice', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      activePotion: null,
      currentHealth: 40,
      potions: [
        POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
        POTION_DEFINITIONS.find(({ id }) => id === 'cauldron'),
        POTION_DEFINITIONS.find(({ id }) => id === 'heal'),
      ],
    };
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.99);

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: 'Potions' });
    const cauldronSlot = within(potionSection)
      .getByRole('group', { name: 'Cauldron potion' })
      .closest('.potion-slot');

    fireEvent.click(
      within(cauldronSlot).getByRole('button', { name: 'Use' })
    );
    let confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'No' })
    );

    expect(
      screen.queryByRole('dialog', { name: 'Cauldron choices' })
    ).not.toBeInTheDocument();
    expect(within(cauldronSlot).getByText('Cauldron')).toBeInTheDocument();
    expect(screen.getByText('Test board potion used: false')).toBeInTheDocument();

    fireEvent.click(
      within(cauldronSlot).getByRole('button', { name: 'Use' })
    );
    confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Yes' })
    );

    const choiceModal = screen.getByRole('dialog', {
      name: 'Cauldron choices',
    });
    const options = within(choiceModal).getAllByRole('group', {
      name: /cauldron potion option/i,
    });

    expect(options).toHaveLength(3);
    expect(
      options.map((option) =>
        within(option).getByRole('group', { name: /potion$/i })
          .getAttribute('aria-label')
      )
    ).toEqual([
      'Roll Choice potion',
      'Devine Chance potion',
      'SOS potion',
    ]);
    expect(
      within(choiceModal).queryByRole('button', { name: /cancel|close/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('modal-overlay'));
    fireEvent.keyDown(choiceModal, { key: 'Escape' });
    expect(screen.getByRole('dialog', {
      name: 'Cauldron choices',
    })).toBeInTheDocument();

    fireEvent.click(
      within(options[1]).getByRole('button', { name: 'Choose' })
    );

    const potionSlots = potionSection.querySelectorAll('.potion-slot');

    expect(
      screen.queryByRole('dialog', { name: 'Cauldron choices' })
    ).not.toBeInTheDocument();
    expect(within(potionSlots[0]).getByText('Small Heal')).toBeInTheDocument();
    expect(within(potionSlots[1]).getByText('Devine Chance')).toBeInTheDocument();
    expect(within(potionSlots[2]).getByText('Heal')).toBeInTheDocument();
    expect(within(potionSection).queryByText('Cauldron')).not.toBeInTheDocument();
    expect(screen.getByText('Test board potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    within(potionSection)
      .getAllByRole('button', { name: 'Use' })
      .forEach((button) => expect(button).toBeDisabled());
  });

  test.each([
    ['double-dice', 'Double Dice', 2, [0.34, 0.8], 8],
    ['triple-dice', 'Triple Dice', 3, [0.5, 0.7, 0.99], 15],
  ])(
    'activates %s, rolls every die simultaneously, and moves by the total',
    (potionId, potionName, diceCount, randomValues, expectedTotal) => {
      const initialGameSetup = createCommittedGameplaySetup();

      initialGameSetup.players[0].potions = [
        POTION_DEFINITIONS.find(({ id }) => id === potionId),
      ];

      render(
        <GameSetupProvider initialGameSetup={initialGameSetup}>
          <GameplayPage />
          <PlayerPotionStateProbe />
        </GameSetupProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Use' }));
      fireEvent.click(
        within(
          screen.getByRole('dialog', { name: /use potion confirmation/i })
        ).getByRole('button', { name: 'Yes' })
      );

      expect(screen.getByText(`Test active potion: ${potionId}`)).toBeInTheDocument();
      expect(screen.getByText(`Test next board dice: ${diceCount}`)).toBeInTheDocument();
      expect(
        within(
          screen.getByRole('region', { name: 'Active Potion' })
        ).getByText(potionName)
      ).toBeInTheDocument();

      const randomSpy = jest.spyOn(Math, 'random');
      randomValues.forEach((value) => randomSpy.mockReturnValueOnce(value));
      fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));

      expect(screen.getAllByLabelText('Dice roller')).toHaveLength(diceCount);
      expect(screen.getAllByRole('img', { name: 'Dice rolling' })).toHaveLength(
        diceCount
      );

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
        expect.any(Object),
        { x: 0, y: 29 },
        expectedTotal,
        { blockedNodeIds: [] }
      );
      expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
      expect(screen.getByText('Test next board dice: 1')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1500);
      });
      fireEvent.click(
        screen.getByRole('button', { name: 'Move to square 1, 28' })
      );
    }
  );

  test('uses Roll Choice for only the first die of a multi-dice board roll', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].activePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'double-dice'
    );
    initialGameSetup.players[0].nextBoardDiceCount = 2;
    initialGameSetup.players[0].nextForcedRoll = {
      sourcePotionId: 'roll-choice',
      usedFrom: 'board',
      value: 4,
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
      </GameSetupProvider>
    );

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.7);
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('img', { name: 'Dice face 4' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dice face 5' })).toBeInTheDocument();
    expect(randomSpy).toHaveBeenCalledTimes(1);
    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      9,
      { blockedNodeIds: [] }
    );
    expect(screen.getByText('Test forced roll: none')).toBeInTheDocument();
  });

  test('halves the summed multi-dice total when Heavy Weight is active', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].activePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'heavy-weight'
    );
    initialGameSetup.players[0].nextBoardDiceCount = 2;

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.34)
      .mockReturnValueOnce(0.5);
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      4,
      { blockedNodeIds: [] }
    );
    expect(
      screen.getByText('4', {
        selector: '.heavy-weight-dice-result-number',
      })
    ).toBeInTheDocument();
  });

  test('heals with Small Heal and animates the potion over the board player image', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const smallHeal = POTION_DEFINITIONS.find(({ id }) => id === 'small-heal');

    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      currentHealth: 40,
      maxHealth: 115,
      potions: [smallHeal],
      spellSlots: initialGameSetup.players[0].spellSlots.map((slot, index) =>
        index === 2
          ? {
              ...slot,
              tokens: [1, 2, 3].map((number) => ({
                committed: true,
                id: `light-green-${number}`,
                type: 'light-green',
              })),
            }
          : slot
      ),
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const animation = screen.getByLabelText('Healing potion animation');
    const playerImage = screen.getByRole('img', { name: 'Current player piece' });

    expect(screen.getByText('75 / 115')).toBeInTheDocument();
    expect(animation).toHaveAttribute('data-icon', 'flask');
    expect(animation).toHaveClass('healing-potion-animation');
    expect(animation.parentElement).toContainElement(playerImage);

    fireEvent.animationEnd(animation);
    expect(screen.queryByLabelText('Healing potion animation')).not.toBeInTheDocument();
  });

  test('activates Roll Choice on the board and forces one roll before clearing it', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const rollChoice = POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice');
    const randomSpy = jest.spyOn(Math, 'random');

    initialGameSetup.players[0].potions = [rollChoice];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const choiceModal = screen.getByRole('dialog', { name: 'Roll Choice' });

    expect(within(choiceModal).getAllByRole('button')).toHaveLength(6);
    expect(within(screen.getByRole('region', { name: 'Potions' })).getByText('1/3')).toBeInTheDocument();
    fireEvent.click(within(choiceModal).getByRole('button', { name: '4' }));

    const activePotion = screen.getByRole('region', { name: 'Active Potion' });

    expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();
    expect(within(activePotion).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(activePotion).getByLabelText('Chosen roll 4')).toHaveClass(
      'language-en'
    );

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
      'dice-roll-cube--face-4'
    );
    expect(randomSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('img', { name: /dice face 4/i })).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      4,
      { blockedNodeIds: [] }
    );
    expect(
      screen.queryByRole('region', { name: 'Active Potion' })
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Potions' })).getByText('0/3')
    ).toBeInTheDocument();
  });

  test('shows one localized Active Potion instead of Potions when state exists', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].activePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'roll-choice'
    );

    const { unmount } = render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const activeSection = screen.getByRole('region', { name: 'Active Potion' });

    expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();
    expect(within(activeSection).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(activeSection).queryByRole('list')).not.toBeInTheDocument();
    expect(within(activeSection).queryByRole('listitem')).not.toBeInTheDocument();

    unmount();

    const japaneseSetup = createCommittedGameplaySetup();
    japaneseSetup.players[0].language = 'jp';
    japaneseSetup.players[0].activePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'roll-choice'
    );

    render(
      <GameSetupProvider initialGameSetup={japaneseSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(
      screen.getByRole('region', {
        name: '\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: '\u30dd\u30fc\u30b7\u30e7\u30f3' })
    ).not.toBeInTheDocument();
  });

  test('hides Active Potion when the current player has no active potion', () => {
    renderGameplayPage();

    expect(screen.getByRole('region', { name: 'Potions' })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Active Potion' })
    ).not.toBeInTheDocument();
  });

  test('shows Battle and Mini potions on the board without Use controls', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
      POTION_DEFINITIONS.find(({ id }) => id === 'bridge-builder'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: /potions/i });

    expect(within(potionSection).getByText('First Aid')).toBeInTheDocument();
    expect(within(potionSection).getByText('Bridge Builder')).toBeInTheDocument();
    expect(within(potionSection).queryByRole('button', { name: 'Use' })).not.toBeInTheDocument();
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
    expect(
      within(diceDialog).getByText('4', { selector: '.dice-roll-result' })
    ).toHaveClass('dice-roll-result--visible');
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

  test('passes localized always-on hover label data to the board', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'jp';
    initialGameSetup.eliteBossEnemyAssignments = {
      bossBattle: 'hellcrown-reaper',
      eliteTowerGravel: 'crowned-lichlord',
      eliteTowerWoods: 'amethyst-ogre',
    };
    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getByText('Board hover language: jp')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Board enemy assignments: ${JSON.stringify(
          initialGameSetup.eliteBossEnemyAssignments
        )}`
      )
    ).toBeInTheDocument();
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
      alignSelf: 'center',
      width: 'auto',
    });
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100 / 100')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
    expect(screen.getByText('Blue Players Turn')).toHaveClass('language-en');
    expect(screen.queryByText(/it is now blue player's turn\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Current board player: player-2$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByLabelText(/turn change player piece/i)).not.toHaveClass(
      'battle-player-piece'
    );
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveStyle({ height: '200px' });

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

    expect(screen.getByLabelText(/current player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByText('15 / 100')).toBeInTheDocument();
  });

  test('stores logical feature identity separately from its chosen visual cell', () => {
    mockChooseVisualPositionForFeature.mockReturnValue({
      featureId: 'board-feature-feature-1',
      type: 'feature',
      x: 10,
      y: 11,
    });

    render(
      <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
        <GameplayPositionProbe />
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(mockChooseVisualPositionForFeature).toHaveBeenCalledWith({
      board: expect.any(Object),
      destinationSquare: { x: 1, y: 28 },
      players: expect.any(Array),
    });
    expect(
      screen.getByText(
        'Player one board position: feature,board-feature-feature-1,10,11'
      )
    ).toBeInTheDocument();
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
    expect(screen.getByLabelText(/spell player piece/i)).toHaveClass('spells-player-piece');
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

  test('uses one even Storm Master roll for caster movement and blocks every other player until the caster returns', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'storm-master'),
    ];
    initialGameSetup.players[0].nextForcedRoll = {
      sourcePotionId: 'test',
      usedFrom: 'board',
      value: 2,
    };
    initialGameSetup.players[1].nextForcedRoll = {
      sourcePotionId: 'test',
      usedFrom: 'board',
      value: 3,
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
        <StormMasterStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(screen.getByText('Test active potion: storm-master')).toBeInTheDocument();
    expect(screen.getByText('Storm pending caster: player-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();

    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(screen.getByText('Storm pending caster: none')).toBeInTheDocument();
    expect(screen.getByText('Storm effect caster: player-1')).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'Move to square 1, 28' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Turn change' }))
        .getByRole('button', { name: 'OK' })
    );

    expect(screen.getByText('Storm current player: player-2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();

    const stormResult = screen.getByRole('dialog', {
      name: 'Storm Master result',
    });

    expect(
      within(stormResult).getByText('The storm prevents you from moving')
    ).toHaveClass('larger-text', 'language-en');
    expect(screen.getByText('player-2 storm position: 1,29')).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(stormResult).getByRole('button', { name: 'Continue' })
    );

    expect(screen.getByText('Storm current player: player-1')).toBeInTheDocument();
    expect(screen.getByText('Storm effect caster: none')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Turn change' })
    ).toBeInTheDocument();
  });

  test('uses an odd Storm Master roll to end the caster turn without movement or a lasting effect', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'storm-master'),
    ];
    initialGameSetup.players[0].nextForcedRoll = {
      sourcePotionId: 'test',
      usedFrom: 'board',
      value: 3,
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <PlayerPotionStateProbe />
        <StormMasterStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();

    const stormResult = screen.getByRole('dialog', {
      name: 'Storm Master result',
    });

    expect(
      within(stormResult).getByText('The storm targeted you')
    ).toHaveClass('larger-text', 'language-en');
    expect(screen.getByText('Test active potion: none')).toBeInTheDocument();
    expect(screen.getByText('Storm effect caster: none')).toBeInTheDocument();
    expect(screen.getByText('player-1 storm position: 0,29')).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(
      within(stormResult).getByRole('button', { name: 'Continue' })
    );

    expect(screen.getByText('Storm current player: player-2')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Turn change' })
    ).toBeInTheDocument();
  });

  test('uses the total of a multi-dice Storm Master roll for its even result', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const stormMaster = POTION_DEFINITIONS.find(
      ({ id }) => id === 'storm-master'
    );

    initialGameSetup.stormMasterPendingPlayerId = 'player-1';
    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      activePotion: stormMaster,
      nextBoardDiceCount: 2,
      nextForcedRoll: {
        sourcePotionId: 'test',
        usedFrom: 'board',
        value: 2,
      },
    };
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <StormMasterStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    expect(screen.getAllByLabelText('Dice roller')).toHaveLength(2);
    finishDiceSequence();

    expect(mockGetHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      4,
      { blockedNodeIds: [] }
    );
    expect(screen.getByText('Storm effect caster: player-1')).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Storm Master result' })
    ).not.toBeInTheDocument();
  });

  test('uses the Heavy Weight-adjusted final value for a pending Storm Master result', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.stormMasterPendingPlayerId = 'player-1';
    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      activePotion: {
        ...POTION_DEFINITIONS.find(({ id }) => id === 'heavy-weight'),
        sourcePlayerId: 'player-2',
      },
      nextForcedRoll: {
        sourcePotionId: 'test',
        usedFrom: 'board',
        value: 5,
      },
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <StormMasterStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(
      screen.getByRole('dialog', { name: 'Storm Master result' })
    ).toHaveTextContent('The storm targeted you');
    expect(screen.getByText('Storm effect caster: none')).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();
  });

  test('hides Board potions while Devine Chance resolves before storm-blocked movement', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const devineChance = POTION_DEFINITIONS.find(
      ({ id }) => id === 'devine-chance'
    );

    initialGameSetup.currentTurnIndex = 1;
    initialGameSetup.stormMasterEffect = {
      affectedPlayerIds: ['player-2'],
      casterPlayerId: 'player-1',
      expiresWhenTurnReturnsToPlayerId: 'player-1',
    };
    initialGameSetup.players[1] = {
      ...initialGameSetup.players[1],
      activePotion: devineChance,
      nextForcedRoll: {
        sourcePotionId: 'test',
        usedFrom: 'board',
        value: 2,
      },
      potions: [
        POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
      ],
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <StormMasterStateProbe />
      </GameSetupProvider>
    );

    expect(screen.queryByRole('region', { name: 'Potions' })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Active Potion' })).getByText(
        'Devine Chance'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();

    const devineResult = screen.getByRole('dialog', {
      name: 'Devine Chance result',
    });

    expect(
      screen.queryByRole('dialog', { name: 'Storm Master result' })
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(devineResult).getByRole('button', { name: 'Continue' })
    );

    expect(
      screen.getByRole('dialog', { name: 'Storm Master result' })
    ).toHaveTextContent('The storm prevents you from moving');
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();
  });
});
