import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import {
  createInitialGameSetup,
  createPlayers,
} from '../gameSetup/gameSetup';

function createStormMasterSetup() {
  const setup = createInitialGameSetup();

  setup.playerCount = 3;
  setup.players = createPlayers(3);
  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'storm-master'),
  ];
  setup.turnOrder = ['player-1', 'player-2', 'player-3'];

  return setup;
}

function StormMasterProbe() {
  const {
    advanceTurn,
    completeStormMasterForcedTurn,
    consumePlayerPotion,
    currentPlayer,
    gameSetup,
    resolveStormMasterRoll,
    startStormMasterBlockedTurn,
  } = useGameSetup();
  const caster = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'board')}
      >
        Use Storm Master
      </button>
      <button
        type="button"
        onClick={() => resolveStormMasterRoll('player-1', 8)}
      >
        Resolve even total
      </button>
      <button
        type="button"
        onClick={() => resolveStormMasterRoll('player-1', 3)}
      >
        Resolve odd total
      </button>
      <button
        type="button"
        onClick={() => startStormMasterBlockedTurn(currentPlayer.id, 5)}
      >
        Resolve blocked roll
      </button>
      <button type="button" onClick={advanceTurn}>
        Finish normal movement
      </button>
      <button
        type="button"
        onClick={() => completeStormMasterForcedTurn(currentPlayer.id)}
      >
        Continue forced turn
      </button>
      <p>{`Current: ${currentPlayer.id}`}</p>
      <p>{`Potions: ${caster.potions.length}`}</p>
      <p>{`Active: ${caster.activePotion?.id ?? 'none'}`}</p>
      <p>{`Pending caster: ${gameSetup.stormMasterPendingPlayerId ?? 'none'}`}</p>
      <p>{`Effect caster: ${gameSetup.stormMasterEffect?.casterPlayerId ?? 'none'}`}</p>
      <p>{`Affected: ${gameSetup.stormMasterEffect?.affectedPlayerIds.join(',') ?? 'none'}`}</p>
      <p>{`Result: ${gameSetup.stormMasterResult?.resultType ?? 'none'}`}</p>
      <p>{`Next turn modal: ${gameSetup.pendingNextTurnModal ?? false}`}</p>
    </div>
  );
}

describe('Storm Master context behavior', () => {
  test('activates, uses an even final total, blocks every other player once, and expires on the caster return', () => {
    render(
      <GameSetupProvider initialGameSetup={createStormMasterSetup()}>
        <StormMasterProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use Storm Master' }));

    expect(screen.getByText('Potions: 0')).toBeInTheDocument();
    expect(screen.getByText('Active: storm-master')).toBeInTheDocument();
    expect(screen.getByText('Pending caster: player-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resolve even total' }));

    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Pending caster: none')).toBeInTheDocument();
    expect(screen.getByText('Effect caster: player-1')).toBeInTheDocument();
    expect(screen.getByText('Affected: player-2,player-3')).toBeInTheDocument();
    expect(screen.getByText('Result: none')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Finish normal movement' }));
    expect(screen.getByText('Current: player-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resolve blocked roll' }));
    expect(screen.getByText('Result: movement-blocked')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue forced turn' }));
    expect(screen.getByText('Current: player-3')).toBeInTheDocument();
    expect(screen.getByText('Affected: player-3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resolve blocked roll' }));
    expect(screen.getByText('Result: movement-blocked')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue forced turn' }));

    expect(screen.getByText('Current: player-1')).toBeInTheDocument();
    expect(screen.getByText('Effect caster: none')).toBeInTheDocument();
    expect(screen.getByText('Affected: none')).toBeInTheDocument();
  });

  test('an odd final result targets the caster, creates no lasting effect, and advances after Continue', () => {
    render(
      <GameSetupProvider initialGameSetup={createStormMasterSetup()}>
        <StormMasterProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use Storm Master' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resolve odd total' }));

    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Pending caster: none')).toBeInTheDocument();
    expect(screen.getByText('Effect caster: none')).toBeInTheDocument();
    expect(screen.getByText('Result: caster-targeted')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue forced turn' }));

    expect(screen.getByText('Current: player-2')).toBeInTheDocument();
    expect(screen.getByText('Result: none')).toBeInTheDocument();
    expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
  });
});
