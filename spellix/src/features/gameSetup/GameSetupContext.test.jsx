import { fireEvent, render, screen } from '@testing-library/react';
import { GameSetupProvider, useGameSetup } from './GameSetupContext';
import { createPlayers } from './gameSetup';

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
      <button type="button" onClick={() => startBattle('player-1', 2, 'frostwisp-spirit')}>
        Start battle
      </button>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor ?? 'none'}`}</p>
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
      <p>{`Enemy Purple buffs: ${activeBattle?.enemyPurpleBuffs?.join(',')}`}</p>
      <p>{`Player charged: ${activeBattle?.playerCharged}`}</p>
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

test('starts every battle with fresh Light Blue uses and no frozen actors', () => {
  render(
    <GameSetupProvider initialGameSetup={createFreezeSetup()}>
      <BattleStateProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /start battle/i }));

  expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
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

test('stores stacked Purple on adjacent columns until the caster next resolves a turn', () => {
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

  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <PurpleResolutionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /apply slot 2/i }));
  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
  expect(screen.getByText(/enemy health: 120/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  expect(screen.getByText(/player purple buffs: 10,0,10,0,0,0/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  fireEvent.click(screen.getByRole('button', { name: /apply slot 1/i }));

  expect(screen.getByText(/enemy health: 120/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /apply red effect/i }));
  expect(screen.getByText(/enemy health: 100/i)).toBeInTheDocument();
  expect(screen.getByText(/player purple buffs: 10,0,10,0,0,0/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /advance battle/i }));
  expect(screen.getByText(/player purple buffs: 0,0,0,0,0,0/i)).toBeInTheDocument();
});

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
