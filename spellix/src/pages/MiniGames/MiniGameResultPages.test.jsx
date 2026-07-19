import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import LootChestPage from './LootChestPage';
import MiniGameLosePage from './MiniGameLosePage';

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

const returnFromMiniGame = jest.fn();

function renderResultPage(path, element) {
  useGameSetup.mockReturnValue({ returnFromMiniGame });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/gameplay" element={<p>Gameplay destination</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  returnFromMiniGame.mockClear();
});

test('Loot Chest Continue resolves the result and returns to Gameplay', () => {
  renderResultPage('/mini-game/loot-chest', <LootChestPage />);

  expect(screen.getByRole('heading', { name: /loot chest/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/gameplay destination/i)).toBeInTheDocument();
});

test('Mini Game Lose returns through the same shared result handler', () => {
  renderResultPage('/mini-game/lose', <MiniGameLosePage />);

  expect(screen.getByRole('heading', { name: /mini game failed/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /return to board/i }));

  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/gameplay destination/i)).toBeInTheDocument();
});
