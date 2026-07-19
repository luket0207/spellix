import { fireEvent, render, screen } from '@testing-library/react';
import { createPlayers } from '../gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';

function createMiniGameSetup() {
  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingPotionGrant: null,
    playerCount: 2,
    players: createPlayers(2),
    turnOrder: ['player-1', 'player-2'],
  };
}

function MiniGameStateProbe() {
  const {
    completeMiniGame,
    currentPlayer,
    dismissMiniGameReturnNotice,
    miniGameResult,
    miniGameReturnNotice,
    returnFromMiniGame,
    startMiniGame,
  } = useGameSetup();

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Mini game: ${miniGameResult?.type ?? 'none'}`}</p>
      <p>{`Result: ${miniGameResult?.result ?? 'none'}`}</p>
      <p>{`Return: ${miniGameResult?.returnBehaviour ?? 'none'}`}</p>
      <p>{`Notice: ${miniGameReturnNotice?.message ?? 'none'}`}</p>
      <button type="button" onClick={() => startMiniGame('river', 'player-1')}>
        Start River
      </button>
      <button type="button" onClick={() => completeMiniGame('win')}>
        Win River
      </button>
      <button type="button" onClick={() => completeMiniGame('loss')}>
        Lose River
      </button>
      <button type="button" onClick={returnFromMiniGame}>
        Return
      </button>
      <button type="button" onClick={dismissMiniGameReturnNotice}>
        Dismiss Notice
      </button>
    </div>
  );
}

function renderProbe() {
  render(
    <GameSetupProvider initialGameSetup={createMiniGameSetup()}>
      <MiniGameStateProbe />
    </GameSetupProvider>
  );
}

test('River wins keep the same player active and create the roll-again notice', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start river/i }));
  fireEvent.click(screen.getByRole('button', { name: /win river/i }));

  expect(screen.getByText('Mini game: river')).toBeInTheDocument();
  expect(screen.getByText('Result: win')).toBeInTheDocument();
  expect(screen.getByText('Return: samePlayerRollAgain')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(
    screen.getByText('Notice: You crossed the river! You may roll again.')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }));
  expect(screen.getByText('Notice: none')).toBeInTheDocument();
});

test('River losses advance to the next player when returning', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start river/i }));
  fireEvent.click(screen.getByRole('button', { name: /lose river/i }));

  expect(screen.getByText('Result: loss')).toBeInTheDocument();
  expect(screen.getByText('Return: nextPlayerTurn')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(screen.getByText('Notice: none')).toBeInTheDocument();
});
