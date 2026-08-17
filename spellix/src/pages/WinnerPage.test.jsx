import { readFileSync } from 'fs';
import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import WinnerPage from './WinnerPage';

function createWinnerSetup(language = 'en') {
  const setup = createInitialGameSetup();

  setup.activeBattle = {
    encounterType: 'bossBattle',
    phase: 'wonGame',
    playerId: 'player-1',
  };
  setup.players[0].language = language;
  setup.winnerDisplay = {
    colour: setup.players[0].colour,
    id: setup.players[0].id,
    language,
    pieceImage: setup.players[0].pieceImage,
  };

  return setup;
}

function WinnerResetRoute() {
  const navigate = useNavigate();

  return (
    <WinnerPage
      onBackToStart={() => {
        navigate('/');
      }}
    />
  );
}

function HomepageProbe() {
  const navigate = useNavigate();
  const { activeBattle, gameSetup, resetGame } = useGameSetup();

  return (
    <main>
      <h1>Spellix</h1>
      <button
        type="button"
        onClick={() => {
          resetGame();
          navigate('/setup');
        }}
      >
        Start
      </button>
      <p>{`Winner state: ${activeBattle?.phase ?? 'clear'}`}</p>
      <p>{`Homepage players: ${gameSetup.players.length}`}</p>
      <p>{`Homepage board: ${gameSetup.board ? 'set' : 'clear'}`}</p>
    </main>
  );
}

function SetupProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <main>
      <p>{`Setup players: ${gameSetup.players.length}`}</p>
      <p>{`Setup winner: ${gameSetup.winnerDisplay ? 'set' : 'clear'}`}</p>
      <p>{`Setup battle: ${gameSetup.activeBattle?.phase ?? 'clear'}`}</p>
      <p>{`Setup board: ${gameSetup.board ? 'set' : 'clear'}`}</p>
    </main>
  );
}

function WinnerStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      <p>{`Active battle: ${gameSetup.activeBattle?.phase ?? 'clear'}`}</p>
      <p>{`Board state: ${gameSetup.board ? 'set' : 'clear'}`}</p>
      <p>{`Live players: ${gameSetup.players.length}`}</p>
      <p>{`Turn order: ${gameSetup.turnOrder.length}`}</p>
    </div>
  );
}

test('shows the locked winner and delegates Back to Start to the End Game action', () => {
  const onBackToStart = jest.fn();

  render(
    <MemoryRouter>
      <GameSetupProvider initialGameSetup={createWinnerSetup()}>
        <WinnerPage onBackToStart={onBackToStart} />
      </GameSetupProvider>
    </MemoryRouter>
  );

  expect(screen.getByRole('main')).toHaveClass(
    'magical-night-sky-page'
  );
  expect(screen.getByRole('heading', { name: 'WINNER!' })).toBeInTheDocument();
  expect(screen.getByAltText('Winning player')).toHaveAttribute(
    'src',
    expect.stringContaining('m-red')
  );

  fireEvent.click(screen.getByRole('button', { name: 'Back to Start' }));

  expect(onBackToStart).toHaveBeenCalledTimes(1);
});

test('uses the Japanese Back to Start text for a Japanese winner', () => {
  render(
    <MemoryRouter>
      <GameSetupProvider initialGameSetup={createWinnerSetup('jp')}>
        <WinnerPage onBackToStart={() => {}} />
      </GameSetupProvider>
    </MemoryRouter>
  );

  expect(
    screen.getByRole('button', { name: 'スタートに戻る' })
  ).toBeInTheDocument();
});

test('keeps final game state available while displaying the winner', () => {
  const setup = createWinnerSetup();

  setup.board = { squares: [] };
  setup.turnOrder = ['player-1', 'player-2'];

  render(
    <MemoryRouter>
      <GameSetupProvider initialGameSetup={setup}>
        <WinnerPage onBackToStart={() => {}} />
        <WinnerStateProbe />
      </GameSetupProvider>
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'WINNER!' })).toBeInTheDocument();
  expect(screen.getByAltText('Winning player')).toBeInTheDocument();
  expect(screen.getByText('Active battle: wonGame')).toBeInTheDocument();
  expect(screen.getByText('Board state: set')).toBeInTheDocument();
  expect(screen.getByText('Live players: 2')).toBeInTheDocument();
  expect(screen.getByText('Turn order: 2')).toBeInTheDocument();
});

test('returns home without clearing final state or starting a new game', () => {
  const setup = createWinnerSetup();

  setup.board = { squares: [] };

  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/winner']}>
        <GameSetupProvider initialGameSetup={setup}>
          <Routes>
            <Route path="/" element={<HomepageProbe />} />
            <Route path="/setup" element={<SetupProbe />} />
            <Route path="/winner" element={<WinnerResetRoute />} />
            <Route path="/gameplay" element={<p>Gameplay</p>} />
          </Routes>
        </GameSetupProvider>
      </MemoryRouter>
    </StrictMode>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Back to Start' }));

  expect(screen.getByRole('heading', { name: 'Spellix' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
  expect(screen.getByText('Winner state: wonGame')).toBeInTheDocument();
  expect(screen.getByText('Homepage players: 2')).toBeInTheDocument();
  expect(screen.getByText('Homepage board: set')).toBeInTheDocument();
  expect(screen.queryByText('Gameplay')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Start' }));

  expect(screen.getByText('Setup players: 2')).toBeInTheDocument();
  expect(screen.getByText('Setup winner: clear')).toBeInTheDocument();
  expect(screen.getByText('Setup battle: clear')).toBeInTheDocument();
  expect(screen.getByText('Setup board: clear')).toBeInTheDocument();
});

test('redirects a winner route without display data to the homepage', () => {
  render(
    <MemoryRouter initialEntries={['/winner']}>
      <GameSetupProvider initialGameSetup={createInitialGameSetup()}>
        <Routes>
          <Route path="/" element={<HomepageProbe />} />
          <Route
            path="/winner"
            element={<WinnerPage onBackToStart={() => {}} />}
          />
          <Route path="/gameplay" element={<p>Gameplay</p>} />
        </Routes>
      </GameSetupProvider>
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Spellix' })).toBeInTheDocument();
  expect(screen.queryByText('Gameplay')).not.toBeInTheDocument();
});

test('shares the complete gameplay sky background treatment', () => {
  const skyCss = readFileSync(
    'src/components/gameplay/MagicalNightSky/MagicalNightSky.css',
    'utf8'
  );
  const gameplaySource = readFileSync(
    'src/pages/GameplayPage.jsx',
    'utf8'
  );
  const sharedRule = skyCss.match(
    /\.magical-night-sky-page\s*\{([\s\S]*?)\}/
  )?.[1];

  expect(sharedRule).toMatch(/position:\s*relative/);
  expect(sharedRule).toMatch(/isolation:\s*isolate/);
  expect(sharedRule).toMatch(/overflow:\s*hidden/);
  expect(sharedRule).toMatch(/height:\s*100vh/);
  expect(sharedRule).toMatch(/radial-gradient/);
  expect(sharedRule).toMatch(/linear-gradient/);
  expect(gameplaySource).toContain(
    'gameplay-page magical-night-sky-page'
  );
});
