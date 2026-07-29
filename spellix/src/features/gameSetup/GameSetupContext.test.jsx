import { fireEvent, render, screen } from '@testing-library/react';
import { GameSetupProvider, useGameSetup } from './GameSetupContext';
import { createPlayers } from './gameSetup';

function TurnAdvanceProbe() {
  const {
    advanceTurn,
    currentPlayer,
    dismissNextTurnModal,
    pendingNextTurnModal,
  } = useGameSetup();

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <p>{`Skip flag: ${currentPlayer?.skipNextTurn ? 'set' : 'clear'}`}</p>
      <button type="button" onClick={advanceTurn}>Advance Turn</button>
      <button type="button" onClick={dismissNextTurnModal}>Dismiss Next Turn</button>
    </div>
  );
}

function TurnRespawnProbe() {
  const {
    beginTurnRespawn,
    completeTurnRespawn,
    currentPlayer,
    dismissNextTurnModal,
    pendingNextTurnModal,
    pendingTurnRespawn,
    setPlayerHealth,
  } = useGameSetup();

  return (
    <div>
      <p>{`Respawn player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Respawn health: ${currentPlayer?.currentHealth ?? 'none'}/${currentPlayer?.maxHealth ?? 'none'}`}</p>
      <p>{`Respawn died last turn: ${currentPlayer?.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Respawn position: ${currentPlayer?.position?.x ?? 'none'},${currentPlayer?.position?.y ?? 'none'}`}</p>
      <p>{`Respawn spell tokens: ${currentPlayer?.spellSlots.flatMap(({ tokens }) => tokens.map(({ id }) => id)).join(',') || 'none'}`}</p>
      <p>{`Respawn removed: ${pendingTurnRespawn?.removedTokens.map(({ token }) => token.id).join(',') || 'none'}`}</p>
      <p>{`Respawn pending: ${pendingTurnRespawn ? 'yes' : 'no'}`}</p>
      <p>{`Respawn turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <p>{`Respawn skip: ${currentPlayer?.skipNextTurn ? 'set' : 'clear'}`}</p>
      <button type="button" onClick={beginTurnRespawn}>Begin Respawn</button>
      <button type="button" onClick={completeTurnRespawn}>Complete Respawn</button>
      <button type="button" onClick={dismissNextTurnModal}>Dismiss Respawn Turn</button>
      <button type="button" onClick={() => setPlayerHealth(currentPlayer.id, 0)}>
        Apply Lethal Health
      </button>
    </div>
  );
}

function createRespawnSetup({
  diedLastTurn = false,
  randomTokens = [],
  skipNextTurn = false,
} = {}) {
  const setup = createFreezeSetup();
  const player = setup.players[0];

  setup.pendingNextTurnModal = true;
  setup.players[0] = {
    ...player,
    currentHealth: 0,
    diedLastTurn,
    maxHealth: 100,
    position: { x: 12, y: 12 },
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
              ...randomTokens,
            ]
          : [],
    })),
  };

  return setup;
}

test('queues one dismissible next-turn modal whenever advanceTurn changes players', () => {
  render(
    <GameSetupProvider initialGameSetup={createFreezeSetup()}>
      <TurnAdvanceProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^advance turn$/i }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /dismiss next turn/i }));
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();
});

test('clears a one-time skip flag and immediately queues the following player modal', () => {
  const setup = createFreezeSetup();

  setup.currentTurnIndex = 1;
  setup.pendingNextTurnModal = true;
  setup.players[1].skipNextTurn = true;

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <TurnAdvanceProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Skip flag: set')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /dismiss next turn/i }));

  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();
  expect(screen.getByText('Skip flag: clear')).toBeInTheDocument();
});

test('start-of-turn respawn removes Black first, then restores the same player at full health on the first start square', () => {
  const setup = createRespawnSetup({
    randomTokens: [
      { committed: true, id: 'green-1', type: 'green' },
      { committed: true, id: 'black-1', type: 'black' },
    ],
  });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <TurnRespawnProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Begin Respawn' }));

  expect(screen.getByText('Respawn removed: black-1')).toBeInTheDocument();
  expect(
    screen.getByText('Respawn spell tokens: starting-red,green-1')
  ).toBeInTheDocument();
  expect(screen.getByText('Respawn turn modal: clear')).toBeInTheDocument();
  expect(screen.getByText('Respawn pending: yes')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Respawn' }));

  expect(screen.getByText('Respawn player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Respawn health: 100/100')).toBeInTheDocument();
  expect(screen.getByText('Respawn position: 0,29')).toBeInTheDocument();
  expect(screen.getByText('Respawn pending: no')).toBeInTheDocument();
  expect(screen.getByText('Respawn turn modal: clear')).toBeInTheDocument();
});

test('start-of-turn respawn randomly removes an eligible non-Black token', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.99);
  const setup = createRespawnSetup({
    randomTokens: [
      { committed: true, id: 'green-1', type: 'green' },
      { committed: true, id: 'orange-1', type: 'orange' },
    ],
  });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <TurnRespawnProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Begin Respawn' }));

  expect(screen.getByText('Respawn removed: orange-1')).toBeInTheDocument();
  expect(
    screen.getByText('Respawn spell tokens: starting-red,green-1')
  ).toBeInTheDocument();
});

test('start-of-turn respawn preserves protected tokens and resolves a pending skip only after recovery', () => {
  const setup = createRespawnSetup({ skipNextTurn: true });

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <TurnRespawnProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Begin Respawn' }));

  expect(screen.getByText('Respawn removed: none')).toBeInTheDocument();
  expect(screen.getByText('Respawn spell tokens: starting-red')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Respawn' }));

  expect(screen.getByText('Respawn health: 100/100')).toBeInTheDocument();
  expect(screen.getByText('Respawn skip: set')).toBeInTheDocument();
  expect(screen.getByText('Respawn turn modal: pending')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss Respawn Turn' }));

  expect(screen.getByText('Respawn player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Respawn skip: clear')).toBeInTheDocument();
});

test('lethal health marks the current player as dead until start-of-turn respawn completes', () => {
  const setup = createRespawnSetup();
  setup.players[0].currentHealth = 5;

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <TurnRespawnProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Respawn died last turn: no')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Apply Lethal Health' }));

  expect(screen.getByText('Respawn health: 0/100')).toBeInTheDocument();
  expect(screen.getByText('Respawn died last turn: yes')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Begin Respawn' }));
  fireEvent.click(screen.getByRole('button', { name: 'Complete Respawn' }));

  expect(screen.getByText('Respawn health: 100/100')).toBeInTheDocument();
  expect(screen.getByText('Respawn died last turn: no')).toBeInTheDocument();
});

function createFreezeSetup({ activeBattle = null } = {}) {
  const players = createPlayers(2);

  players[0] = {
    ...players[0],
    spellSlots: players[0].spellSlots.map((slot, index) => ({
      ...slot,
      tokens:
        index === 2
          ? [
              { committed: true, id: 'light-blue-1', type: 'light-blue' },
              { committed: true, id: 'light-blue-2', type: 'light-blue' },
            ]
          : [],
    })),
  };

  return {
    activeBattle,
    board: null,
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function BattleStateProbe() {
  const { activeBattle, startBattle } = useGameSetup();

  return (
    <div>
      <button
        type="button"
        onClick={() => startBattle('player-1', 2, 'frostwisp-spirit', 'woods')}
      >
        Start battle
      </button>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor ?? 'none'}`}</p>
      <p>{`Battle environment: ${activeBattle?.environment ?? 'none'}`}</p>
      <p>{`Player guard: ${activeBattle?.playerGuard ?? 'none'}`}</p>
      <p>{`Enemy guard: ${activeBattle?.enemyGuard ?? 'none'}`}</p>
      <p>{`Resolving turn: ${activeBattle?.isResolvingTurn ?? 'none'}`}</p>
      <p>{`Player frozen: ${activeBattle?.playerFrozen ?? 'none'}`}</p>
      <p>{`Enemy frozen: ${activeBattle?.enemyFrozen ?? 'none'}`}</p>
      <p>{`Player freeze uses: ${activeBattle?.playerFreezeUses?.join(',') ?? 'none'}`}</p>
      <p>{`Enemy freeze uses: ${activeBattle?.enemyFreezeUses?.join(',') ?? 'none'}`}</p>
      <p>{`Player Purple buffs: ${activeBattle?.playerPurpleBuffs?.join(',') ?? 'none'}`}</p>
      <p>{`Enemy Purple buffs: ${activeBattle?.enemyPurpleBuffs?.join(',') ?? 'none'}`}</p>
    </div>
  );
}

function PlayerLanguageProbe() {
  const { gameSetup, setPlayerLanguage } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => setPlayerLanguage('player-2', 'jp')}>
        Set player 2 Japanese
      </button>
      <p>{`Player languages: ${gameSetup.players.map(({ language }) => language).join(',')}`}</p>
    </div>
  );
}

function NonBattleSpellEffectsProbe() {
  const { currentPlayer, updatePlayerSpells } = useGameSetup();
  const commitLightGreen = () => {
    const spellSlots = currentPlayer.spellSlots.map((slot, index) => ({
      ...slot,
      tokens:
        index === 0
          ? [{ committed: true, id: 'light-green-1', type: 'light-green' }]
          : slot.tokens,
    }));

    updatePlayerSpells(currentPlayer.id, {
      columnMergesUsed: 1,
      hasCommittedInitialSpells: true,
      mergedColumns: [{ activeColumn: 2, columns: [2, 3], removedColumn: 3 }],
      spellSlots,
      tokenBag: currentPlayer.tokenBag,
    });
  };

  return (
    <div>
      <button type="button" onClick={commitLightGreen}>Commit non-battle effects</button>
      <p>{`Player health: ${currentPlayer.currentHealth}/${currentPlayer.maxHealth}`}</p>
      <p>{`Merges used: ${currentPlayer.columnMergesUsed ?? 0}`}</p>
      <p>{`Merged columns: ${currentPlayer.mergedColumns?.[0]?.columns.join('+') ?? 'none'}`}</p>
    </div>
  );
}

test('persists merged columns and applies committed Light Green health', () => {
  const setup = createFreezeSetup();
  setup.players[0].currentHealth = 80;

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <NonBattleSpellEffectsProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /commit non-battle effects/i }));

  expect(screen.getByText('Player health: 85/105')).toBeInTheDocument();
  expect(screen.getByText('Merges used: 1')).toBeInTheDocument();
  expect(screen.getByText('Merged columns: 2+3')).toBeInTheDocument();
});

function FreezeResolutionProbe() {
  const {
    activeBattle,
    advanceBattleTurn,
    applyBattleDiceResult,
    battlePlayer,
    resolveBattleFreezeCheck,
  } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => applyBattleDiceResult(3)}>
        Apply slot 3
      </button>
      <button type="button" onClick={advanceBattleTurn}>
        Advance battle
      </button>
      <button type="button" onClick={() => resolveBattleFreezeCheck(1)}>
        Resolve odd freeze
      </button>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor}`}</p>
      <p>{`Enemy frozen: ${activeBattle?.enemyFrozen}`}</p>
      <p>{`Player freeze uses: ${activeBattle?.playerFreezeUses?.join(',')}`}</p>
      <p>{`Light Blue spell tokens: ${battlePlayer?.spellSlots[2].tokens.length}`}</p>
    </div>
  );
}

function PurpleResolutionProbe() {
  const {
    activeBattle,
    advanceBattleTurn,
    applyBattleEffect,
    applyBattleDiceResult,
    battleEnemy,
    resolveBattleFreezeCheck,
  } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => applyBattleDiceResult(1)}>
        Apply slot 1
      </button>
      <button type="button" onClick={() => applyBattleDiceResult(2)}>
        Apply slot 2
      </button>
      <button type="button" onClick={() => applyBattleDiceResult(3)}>
        Apply slot 3
      </button>
      <button type="button" onClick={() => applyBattleDiceResult(4)}>
        Apply slot 4
      </button>
      <button type="button" onClick={advanceBattleTurn}>
        Advance battle
      </button>
      <button
        type="button"
        onClick={() =>
          applyBattleEffect(
            activeBattle?.pendingEffects?.find(({ type }) => type === 'redDamage')
          )
        }
      >
        Apply Red effect
      </button>
      <button type="button" onClick={() => resolveBattleFreezeCheck(1)}>
        Resolve odd freeze
      </button>
      <button type="button" onClick={() => resolveBattleFreezeCheck(2)}>
        Resolve even freeze
      </button>
      <p>{`Player Purple buffs: ${activeBattle?.playerPurpleBuffs?.join(',')}`}</p>
      <p>{`Player next Purple buffs: ${activeBattle?.playerNextPurpleBuffs?.join(',') ?? 'none'}`}</p>
      <p>{`Enemy Purple buffs: ${activeBattle?.enemyPurpleBuffs?.join(',')}`}</p>
      <p>{`Player charged: ${activeBattle?.playerCharged}`}</p>
      <p>{`Player guard: ${activeBattle?.playerGuard}`}</p>
      <p>{`Enemy health: ${battleEnemy?.currentHealth}`}</p>
    </div>
  );
}

function ChargeResolutionProbe() {
  const {
    activeBattle,
    advanceBattleTurn,
    applyBattleEffect,
    applyBattleDiceResult,
    battleEnemy,
    battlePlayer,
  } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => applyBattleDiceResult(1)}>
        Apply slot 1
      </button>
      <button type="button" onClick={() => applyBattleDiceResult(2)}>
        Apply slot 2
      </button>
      <button type="button" onClick={advanceBattleTurn}>
        Advance battle
      </button>
      <button
        type="button"
        onClick={() =>
          applyBattleEffect(
            activeBattle?.pendingEffects?.find(({ type }) => type === 'redDamage')
          )
        }
      >
        Apply Red effect
      </button>
      <p>{`Player charge uses: ${activeBattle?.playerChargeUses?.join(',')}`}</p>
      <p>{`Player charged: ${activeBattle?.playerCharged}`}</p>
      <p>{`Enemy charged: ${activeBattle?.enemyCharged}`}</p>
      <p>{`Enemy health: ${battleEnemy?.currentHealth}`}</p>
      <p>{`Yellow spell tokens: ${battlePlayer?.spellSlots[1].tokens.length}`}</p>
    </div>
  );
}

test('defaults missing player languages to English and updates one player independently', () => {
  const initialGameSetup = createFreezeSetup();

  delete initialGameSetup.players[0].language;
  delete initialGameSetup.players[1].language;

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <PlayerLanguageProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Player languages: en,en')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /set player 2 japanese/i }));

  expect(screen.getByText('Player languages: en,jp')).toBeInTheDocument();
});

test('starts every battle with fresh Light Blue uses and no frozen actors', () => {
  render(
    <GameSetupProvider initialGameSetup={createFreezeSetup()}>
      <BattleStateProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /start battle/i }));

  expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
  expect(screen.getByText(/battle environment: woods/i)).toBeInTheDocument();
  expect(screen.getByText(/player guard: 0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();
  expect(screen.getByText(/resolving turn: false/i)).toBeInTheDocument();
  expect(screen.getByText(/player frozen: false/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy frozen: false/i)).toBeInTheDocument();
  expect(screen.getByText(/player freeze uses: 0,0,2,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy freeze uses: 0,0,1,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
});

test('starts a battle with fresh per-column Yellow uses and no charged actors', () => {
  const initialGameSetup = createFreezeSetup();

  initialGameSetup.players[0].spellSlots[1] = {
    ...initialGameSetup.players[0].spellSlots[1],
    tokens: [
      { committed: true, id: 'yellow-1', type: 'yellow' },
      { committed: true, id: 'yellow-2', type: 'yellow' },
    ],
  };

  function ChargeStartProbe() {
    const { activeBattle, startBattle } = useGameSetup();

    return (
      <div>
        <button
          type="button"
          onClick={() => startBattle('player-1', 2, 'harvestrot-scarecrow')}
        >
          Start charge battle
        </button>
        <p>{`Player charge uses: ${activeBattle?.playerChargeUses?.join(',') ?? 'none'}`}</p>
        <p>{`Enemy charge uses: ${activeBattle?.enemyChargeUses?.join(',') ?? 'none'}`}</p>
        <p>{`Player charged: ${activeBattle?.playerCharged ?? 'none'}`}</p>
        <p>{`Enemy charged: ${activeBattle?.enemyCharged ?? 'none'}`}</p>
      </div>
    );
  }

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <ChargeStartProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /start charge battle/i }));

  expect(screen.getByText(/player charge uses: 0,2,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy charge uses: 0,0,2,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy charged: false/i)).toBeInTheDocument();
});

test('consumes one Light Blue use per successful freeze without mutating spell tokens', () => {
  const initialGameSetup = createFreezeSetup({
    activeBattle: {
      currentBattleActor: 'player',
      enemyCurrentHealth: 60,
      enemyFreezeUses: [0, 0, 0, 0, 0, 0],
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'frostwisp-spirit',
      isResolvingTurn: false,
      level: 2,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerFreezeUses: [0, 0, 2, 0, 0, 0],
      playerFrozen: false,
      playerGuard: 0,
      playerId: 'player-1',
    },
  });

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <FreezeResolutionProbe />
    </GameSetupProvider>
  );

  const applySlot = screen.getByRole('button', { name: /apply slot 3/i });
  const advanceBattle = screen.getByRole('button', { name: /advance battle/i });
  const resolveOddFreeze = screen.getByRole('button', { name: /resolve odd freeze/i });

  fireEvent.click(applySlot);
  expect(screen.getByText(/enemy frozen: true/i)).toBeInTheDocument();
  expect(screen.getByText(/player freeze uses: 0,0,1,0,0,0/i)).toBeInTheDocument();

  fireEvent.click(advanceBattle);
  fireEvent.click(resolveOddFreeze);
  fireEvent.click(applySlot);
  expect(screen.getByText(/enemy frozen: true/i)).toBeInTheDocument();
  expect(screen.getByText(/player freeze uses: 0,0,0,0,0,0/i)).toBeInTheDocument();

  fireEvent.click(advanceBattle);
  fireEvent.click(resolveOddFreeze);
  fireEvent.click(applySlot);
  expect(screen.getByText(/enemy frozen: false/i)).toBeInTheDocument();
  expect(screen.getByText(/player freeze uses: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/light blue spell tokens: 2/i)).toBeInTheDocument();
});

test('stores stacked Purple on effective adjacent columns until the caster next resolves a turn', () => {
  const initialGameSetup = createFreezeSetup({
    activeBattle: {
      currentBattleActor: 'player',
      enemyCurrentHealth: 120,
      enemyFreezeUses: [0, 0, 0, 0, 0, 0],
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'hellcrown-reaper',
      enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
      isResolvingTurn: false,
      level: 4,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerFreezeUses: [0, 0, 0, 0, 0, 0],
      playerFrozen: false,
      playerGuard: 0,
      playerId: 'player-1',
      playerPurpleBuffs: [0, 0, 0, 0, 0, 0],
    },
  });

  initialGameSetup.players[0].spellSlots = initialGameSetup.players[0].spellSlots.map(
    (slot, index) => ({
      ...slot,
      tokens:
        index === 0
          ? [{ committed: true, id: 'red-1', type: 'red' }]
          : index === 1
            ? [
                { committed: true, id: 'purple-1', type: 'purple' },
                { committed: true, id: 'purple-2', type: 'purple' },
              ]
            : [],
    })
  );
  initialGameSetup.players[0].mergedColumns = [
    { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
  ];

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <PurpleResolutionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /apply slot 2/i }));
  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy health: 120/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  expect(screen.getByText(/player purple buffs: 10,0,0,10,0,0/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  fireEvent.click(screen.getByRole('button', { name: /apply slot 1/i }));

  expect(screen.getByText(/enemy health: 120/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /apply red effect/i }));
  expect(screen.getByText(/enemy health: 100/i)).toBeInTheDocument();
  expect(screen.getByText(/player purple buffs: 10,0,0,10,0,0/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
});

test.each([
  [2, 115],
  [3, 105],
])(
  'applies one Purple buff when merged column 2+3 is rolled as %i',
  (diceResult, expectedEnemyHealth) => {
    const initialGameSetup = createFreezeSetup({
      activeBattle: {
        currentBattleActor: 'player',
        enemyCurrentHealth: 120,
        enemyFreezeUses: [0, 0, 0, 0, 0, 0],
        enemyFrozen: false,
        enemyGuard: 0,
        enemyId: 'hellcrown-reaper',
        enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
        isResolvingTurn: false,
        level: 4,
        outcome: null,
        pendingEffects: [],
        phase: 'active',
        playerFreezeUses: [0, 0, 0, 0, 0, 0],
        playerFrozen: false,
        playerGuard: 0,
        playerId: 'player-1',
        playerPurpleBuffs: [0, 5, 0, 0, 0, 0],
      },
    });

    initialGameSetup.players[0].spellSlots = initialGameSetup.players[0].spellSlots.map(
      (slot, index) => ({
        ...slot,
        tokens:
          index === 1
            ? [{ committed: true, id: 'red-merged', type: 'red' }]
            : [],
      })
    );
    initialGameSetup.players[0].mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <PurpleResolutionProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: `Apply slot ${diceResult}` }));
    fireEvent.click(screen.getByRole('button', { name: /apply red effect/i }));

    expect(
      screen.getByText(`Enemy health: ${expectedEnemyHealth}`)
    ).toBeInTheDocument();
  }
);

test.each([
  [1, 2],
  [1, 3],
  [4, 2],
  [4, 3],
])(
  'applies one merged 2+3 Purple buff from source %i when rolled as %i',
  (sourceColumn, targetRoll) => {
    const initialGameSetup = createFreezeSetup({
      activeBattle: {
        currentBattleActor: 'player',
        enemyCurrentHealth: 120,
        enemyFreezeUses: [0, 0, 0, 0, 0, 0],
        enemyFrozen: false,
        enemyGuard: 0,
        enemyId: 'hellcrown-reaper',
        enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
        isResolvingTurn: false,
        level: 4,
        outcome: null,
        pendingEffects: [],
        phase: 'active',
        playerFreezeUses: [0, 0, 0, 0, 0, 0],
        playerFrozen: false,
        playerGuard: 0,
        playerId: 'player-1',
        playerPurpleBuffs: [0, 0, 0, 0, 0, 0],
      },
    });

    initialGameSetup.players[0].spellSlots =
      initialGameSetup.players[0].spellSlots.map((slot, index) => ({
        ...slot,
        tokens:
          index === sourceColumn - 1
            ? [{ committed: true, id: 'purple-source', type: 'purple' }]
            : index === 1
              ? [{ committed: true, id: 'blue-merged', type: 'blue' }]
              : [],
      }));
    initialGameSetup.players[0].mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <PurpleResolutionProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: `Apply slot ${sourceColumn}` })
    );
    const expectedNextBuffs =
      sourceColumn === 1 ? '0,5,0,0,0,0' : '0,5,0,0,5,0';
    expect(
      screen.getByText(`Player next Purple buffs: ${expectedNextBuffs}`)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
    expect(
      screen.getByText(`Player Purple buffs: ${expectedNextBuffs}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
    fireEvent.click(
      screen.getByRole('button', { name: `Apply slot ${targetRoll}` })
    );

    expect(screen.getByText(/player guard: 10/i)).toBeInTheDocument();
  }
);

test('expires a pending Purple buff when a frozen caster loses its next turn', () => {
  const initialGameSetup = createFreezeSetup({
    activeBattle: {
      currentBattleActor: 'player',
      enemyCurrentHealth: 60,
      enemyFreezeUses: [0, 0, 0, 0, 0, 0],
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'frostwisp-spirit',
      enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
      isResolvingTurn: false,
      level: 2,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerFreezeUses: [0, 0, 0, 0, 0, 0],
      playerFrozen: true,
      playerGuard: 0,
      playerId: 'player-1',
      playerCharged: true,
      playerPurpleBuffs: [5, 0, 5, 0, 0, 0],
    },
  });

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <PurpleResolutionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /resolve odd freeze/i }));

  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();
});

test('keeps pending Purple and Yellow after an even freeze check', () => {
  const initialGameSetup = createFreezeSetup({
    activeBattle: {
      currentBattleActor: 'player',
      enemyCurrentHealth: 60,
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'frostwisp-spirit',
      isResolvingTurn: false,
      level: 2,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerCharged: true,
      playerFrozen: true,
      playerGuard: 0,
      playerId: 'player-1',
      playerPurpleBuffs: [5, 0, 5, 0, 0, 0],
    },
  });

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <PurpleResolutionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /resolve even freeze/i }));

  expect(screen.getByText(/player purple buffs: 5,0,5,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/player charged: true/i)).toBeInTheDocument();
});

test('consumes one Yellow use per successful charge and expires charge after the next turn', () => {
  const initialGameSetup = createFreezeSetup({
    activeBattle: {
      currentBattleActor: 'player',
      enemyChargeUses: [0, 0, 0, 0, 0, 0],
      enemyCharged: false,
      enemyCurrentHealth: 120,
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'hellcrown-reaper',
      isResolvingTurn: false,
      level: 4,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerChargeUses: [0, 2, 0, 0, 0, 0],
      playerCharged: false,
      playerFrozen: false,
      playerGuard: 0,
      playerId: 'player-1',
    },
  });

  initialGameSetup.players[0].spellSlots = initialGameSetup.players[0].spellSlots.map(
    (slot, index) => ({
      ...slot,
      tokens:
        index === 0
          ? [{ committed: true, id: 'red-1', type: 'red' }]
          : index === 1
            ? [
                { committed: true, id: 'yellow-1', type: 'yellow' },
                { committed: true, id: 'yellow-2', type: 'yellow' },
              ]
            : [],
    })
  );

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <ChargeResolutionProbe />
    </GameSetupProvider>
  );

  const applySlot1 = screen.getByRole('button', { name: /apply slot 1/i });
  const applySlot2 = screen.getByRole('button', { name: /apply slot 2/i });
  const advanceBattle = screen.getByRole('button', { name: /advance battle/i });

  fireEvent.click(applySlot2);
  expect(screen.getByText(/player charge uses: 0,1,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();
  fireEvent.click(advanceBattle);
  expect(screen.getByText(/player charged: true/i)).toBeInTheDocument();

  fireEvent.click(advanceBattle);
  fireEvent.click(applySlot1);
  expect(screen.getByText(/enemy health: 120/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /apply red effect/i }));
  expect(screen.getByText(/enemy health: 100/i)).toBeInTheDocument();
  expect(screen.getByText(/player charged: true/i)).toBeInTheDocument();
  fireEvent.click(advanceBattle);
  expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();

  fireEvent.click(advanceBattle);
  fireEvent.click(applySlot2);
  expect(screen.getByText(/player charge uses: 0,0,0,0,0,0/i)).toBeInTheDocument();
  fireEvent.click(advanceBattle);
  expect(screen.getByText(/player charged: true/i)).toBeInTheDocument();

  fireEvent.click(advanceBattle);
  fireEvent.click(applySlot2);
  expect(screen.getByText(/player charge uses: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/yellow spell tokens: 2/i)).toBeInTheDocument();
  fireEvent.click(advanceBattle);
  expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();
});
