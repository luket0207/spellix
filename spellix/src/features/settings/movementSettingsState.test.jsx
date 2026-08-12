import { fireEvent, render, screen } from '@testing-library/react';
import { createPlayers } from '../gameSetup/gameSetup';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';

function MovementSettingsStateProbe() {
  const {
    advanceTurn,
    currentPlayer,
    dismissNextTurnModal,
    gameSetup,
    markMovementDiceRolled,
  } = useGameSetup();

  return (
    <div>
      <p>{`Current player: ${currentPlayer.id}`}</p>
      <p>{`Movement rolled: ${gameSetup.hasRolledMovementDice ? 'yes' : 'no'}`}</p>
      <p>{`Turn modal: ${gameSetup.pendingNextTurnModal ? 'open' : 'closed'}`}</p>
      <button type="button" onClick={markMovementDiceRolled}>Mark movement roll</button>
      <button type="button" onClick={dismissNextTurnModal}>Dismiss same-turn modal</button>
      <button type="button" onClick={advanceTurn}>Advance turn</button>
    </div>
  );
}

function createSetup() {
  const players = createPlayers(2);

  return {
    board: { features: [], squares: [] },
    currentTurnIndex: 0,
    hasRolledMovementDice: false,
    playerCount: players.length,
    players,
    turnOrder: players.map(({ id }) => id),
  };
}

test('retains the rolled state during the same turn and clears it for the next player', () => {
  render(
    <GameSetupProvider initialGameSetup={createSetup()}>
      <MovementSettingsStateProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Movement rolled: no')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Mark movement roll' }));
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss same-turn modal' }));

  expect(screen.getByText('Movement rolled: yes')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Advance turn' }));

  expect(screen.getByText('Movement rolled: no')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Turn modal: open')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss same-turn modal' }));

  expect(screen.getByText('Movement rolled: no')).toBeInTheDocument();
  expect(screen.getByText('Turn modal: closed')).toBeInTheDocument();
});
