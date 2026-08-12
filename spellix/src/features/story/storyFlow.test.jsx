import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';
import GameSetupPage from '../../pages/GameSetupPage';
import StoryPage from '../../pages/StoryPage';

function GameplayStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <p>{`${gameSetup.board ? 'Board ready' : 'Board missing'}, ${gameSetup.turnOrder.length} players ready`}</p>
  );
}

test('moves from setup through story to gameplay with initialized game state', () => {
  jest.useFakeTimers();

  render(
    <GameSetupProvider>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/setup']}
      >
        <Routes>
          <Route path="/setup" element={<GameSetupPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/gameplay" element={<GameplayStateProbe />} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Start Game - ゲーム開始' }));

  expect(screen.getByRole('dialog', { name: 'Game story' })).toBeInTheDocument();
  expect(screen.getByText(/taking on a quest to save the kingdom of Spellix/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Board ready, 2 players ready')).toBeInTheDocument();

  jest.clearAllTimers();
  jest.useRealTimers();
});
