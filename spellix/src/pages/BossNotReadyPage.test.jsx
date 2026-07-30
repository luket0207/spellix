import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import BossNotReadyPage from './BossNotReadyPage';

function GameplayResultProbe() {
  const { currentPlayer, gameSetup, pendingNextTurnModal } = useGameSetup();

  return (
    <div>
      <p>{`Encounter health: ${gameSetup.players[0].currentHealth}`}</p>
      <p>{`Current player: ${currentPlayer?.id}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal}`}</p>
    </div>
  );
}

function createLockedBossSetup(language = 'en') {
  const setup = createInitialGameSetup();

  setup.activeBattle = {
    encounterType: 'bossNotReady',
    phase: 'bossNotReady',
    playerId: 'player-1',
  };
  setup.currentTurnIndex = 0;
  setup.players[0].language = language;
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

describe('boss not-ready page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('locks the player, reduces health to zero after one second, and advances on OK', () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/boss-not-ready']}>
          <GameSetupProvider initialGameSetup={createLockedBossSetup()}>
            <Routes>
              <Route
                path="/boss-not-ready"
                element={<BossNotReadyPage />}
              />
              <Route path="/gameplay" element={<GameplayResultProbe />} />
            </Routes>
          </GameSetupProvider>
        </MemoryRouter>
      </StrictMode>
    );

    expect(
      screen.getByText(
        'You are not ready to be here. A powerful force rises from the castle and strikes you down. Complete the Elite Towers before trying to visit here again.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: 'OK' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(screen.getByText('Encounter health: 0')).toBeInTheDocument();
    expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
    expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
  });

  test('shows the exact Japanese lockout message', () => {
    render(
      <MemoryRouter initialEntries={['/boss-not-ready']}>
        <GameSetupProvider initialGameSetup={createLockedBossSetup('jp')}>
          <BossNotReadyPage />
        </GameSetupProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        'まだここに来る準備ができていません。城から強大な力が立ち上り、あなたを打ち倒しました。再びここを訪れる前に、エリートタワーをすべて攻略してください。'
      )
    ).toBeInTheDocument();
  });
});
