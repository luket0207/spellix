import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

const boardPotion = POTION_DEFINITIONS.find(
  ({ id }) => id === 'metal-detector'
);
const battlePotion = POTION_DEFINITIONS.find(
  ({ id }) => id === 'first-aid'
);
const bothPotion = POTION_DEFINITIONS.find(({ id }) => id === 'small-heal');

function PotionTurnUsageProbe() {
  const {
    activeBattle,
    advanceBattleTurn,
    advanceTurn,
    consumePlayerPotion,
    gameSetup,
    resolveBattleFreezeCheck,
    startBattle,
  } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'board')}
      >
        Consume Board
      </button>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'battle')}
      >
        Consume Battle
      </button>
      <button type="button" onClick={advanceTurn}>
        Advance Board
      </button>
      <button type="button" onClick={advanceBattleTurn}>
        Advance Battle
      </button>
      <button type="button" onClick={() => resolveBattleFreezeCheck(1)}>
        Fail Freeze Check
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle('player-1', 1, 'vilewhisker-rat', 'fields')
        }
      >
        Start Battle
      </button>
      <p>{`Potions: ${player.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Board used: ${player.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Battle used: ${activeBattle?.playerPotionUsedThisTurn ?? false}`}</p>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor ?? 'none'}`}</p>
    </div>
  );
}

function createPotionTurnSetup(potions, activeBattle = null) {
  const setup = createInitialGameSetup();

  setup.activeBattle = activeBattle;
  setup.players[0].potions = potions;
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function createActiveBattle() {
  return {
    currentBattleActor: 'player',
    enemyId: 'vilewhisker-rat',
    isResolvingTurn: false,
    level: 1,
    pendingEffects: [],
    phase: 'active',
    playerId: 'player-1',
  };
}

describe('potion turn usage context', () => {
  test('allows one Board potion and resets only when that player next begins a Board turn', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionTurnSetup([boardPotion, bothPotion])}
      >
        <PotionTurnUsageProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Consume Board' }));
    expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Consume Board' }));
    expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Advance Board' }));
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Advance Board' }));
    expect(screen.getByText('Board used: false')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Consume Board' }));
    expect(screen.getByText('Potions: none')).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
  });

  test('allows one Battle potion and resets on the next player Battle turn', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionTurnSetup(
          [battlePotion, bothPotion],
          createActiveBattle()
        )}
      >
        <PotionTurnUsageProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Consume Battle' }));
    expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();
    expect(screen.getByText('Battle used: true')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Consume Battle' }));
    expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Advance Battle' }));
    expect(screen.getByText('Battle actor: enemy')).toBeInTheDocument();
    expect(screen.getByText('Battle used: true')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Consume Battle' }));
    expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Advance Battle' }));
    expect(screen.getByText('Battle actor: player')).toBeInTheDocument();
    expect(screen.getByText('Battle used: false')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Consume Battle' }));
    expect(screen.getByText('Potions: none')).toBeInTheDocument();
  });

  test('keeps Board and Battle usage independent', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionTurnSetup([boardPotion, battlePotion])}
      >
        <PotionTurnUsageProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Consume Board' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));

    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    expect(screen.getByText('Battle used: false')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Consume Battle' }));
    expect(screen.getByText('Potions: none')).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    expect(screen.getByText('Battle used: true')).toBeInTheDocument();
  });

  test('resets Battle usage when a frozen enemy loses its turn to the player', () => {
    const activeBattle = {
      ...createActiveBattle(),
      currentBattleActor: 'enemy',
      enemyFrozen: true,
      playerPotionUsedThisTurn: true,
    };

    render(
      <GameSetupProvider
        initialGameSetup={createPotionTurnSetup([battlePotion], activeBattle)}
      >
        <PotionTurnUsageProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fail Freeze Check' }));

    expect(screen.getByText('Battle actor: player')).toBeInTheDocument();
    expect(screen.getByText('Battle used: false')).toBeInTheDocument();
  });
});
