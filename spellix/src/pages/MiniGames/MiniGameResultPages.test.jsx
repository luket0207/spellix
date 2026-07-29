import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readFileSync } from 'fs';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import { getFirstStartAreaPosition } from '../../features/gameBoard/board';
import MiniGameLosePage from './MiniGameLosePage';

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

const returnFromMiniGame = jest.fn();
const applyMiniGameFailurePunishment = jest.fn();
const setPlayerPosition = jest.fn();

const failingPlayer = {
  colour: 'red',
  currentHealth: 100,
  id: 'player-1',
  language: 'en',
  maxHealth: 100,
  pieceImage: 'm-red.png',
};

function renderResultPage(path, element, overrides = {}) {
  const player = { ...failingPlayer, ...overrides.player };

  useGameSetup.mockReturnValue({
    applyMiniGameFailurePunishment,
    currentPlayer: player,
    gameSetup: {
      board: null,
      players: [player],
    },
    miniGameResult: {
      playerId: player.id,
      result: 'loss',
      returnBehaviour: 'nextPlayerTurn',
      type: 'river',
    },
    returnFromMiniGame,
    setPlayerPosition,
    ...overrides.context,
  });

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
  applyMiniGameFailurePunishment.mockClear();
  returnFromMiniGame.mockClear();
  setPlayerPosition.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('Mini Game Failed applies one generated punishment after one second and continues if alive', () => {
  const randomFn = jest.fn(() => 0.6);

  renderResultPage('/mini-game/lose', <MiniGameLosePage randomFn={randomFn} />);

  expect(screen.getByTestId('magical-night-sky')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /mini game punishment/i })).toHaveClass(
    'mini-game-failure-panel',
    'language-en'
  );
  expect(screen.getByRole('img', { name: /current player character/i })).toHaveAttribute(
    'src',
    'm-red.png'
  );
  expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute(
    'aria-valuenow',
    '100'
  );
  expect(screen.getByText('You lost 25 health')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  expect(randomFn).toHaveBeenCalledTimes(1);

  act(() => {
    jest.advanceTimersByTime(999);
  });
  expect(applyMiniGameFailurePunishment).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(applyMiniGameFailurePunishment).toHaveBeenCalledWith('player-1', 25);
  expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute(
    'aria-valuenow',
    '75'
  );
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
  expect(randomFn).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole('button', { name: /continue/i }));


  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/gameplay destination/i)).toBeInTheDocument();
});

test('Cave Runner explains prevented damage while preserving the shared failure flow', () => {
  const preventedDamageMessage =
    'You didn’t lose any health because the Cave Runner potion helped you get out before the ogre reached you.';

  renderResultPage('/mini-game/lose', <MiniGameLosePage randomFn={() => 0.99} />, {
    context: {
      miniGameResult: {
        playerId: 'player-1',
        preventHealthLoss: true,
        result: 'loss',
        returnBehaviour: 'nextPlayerTurn',
        type: 'cave',
      },
    },
  });

  expect(screen.getByText(preventedDamageMessage)).toHaveClass(
    'mini-game-failure-punishment',
    'language-en'
  );
  expect(screen.queryByText('You lost 0 health')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(applyMiniGameFailurePunishment).toHaveBeenCalledWith('player-1', 0);
  expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute(
    'aria-valuenow',
    '100'
  );
  expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
});

test('Cave Runner prevented-damage message uses the Japanese copy and font class', () => {
  const preventedDamageMessage =
    '洞窟ランナーのポーションのおかげで、オーガに追いつかれる前に脱出できたため、HPを失いませんでした。';

  renderResultPage('/mini-game/lose', <MiniGameLosePage randomFn={() => 0.99} />, {
    context: {
      miniGameResult: {
        playerId: 'player-1',
        preventHealthLoss: true,
        result: 'loss',
        returnBehaviour: 'nextPlayerTurn',
        type: 'cave',
      },
    },
    player: {
      language: 'jp',
    },
  });

  expect(screen.getByText(preventedDamageMessage)).toHaveClass(
    'mini-game-failure-punishment',
    'language-jp'
  );
  expect(screen.queryByText(/体力を0失いました。/)).not.toBeInTheDocument();
});

test('Mini Game Failed clamps health to zero and respawns with Japanese text', () => {
  renderResultPage('/mini-game/lose', <MiniGameLosePage randomFn={() => 0.99} />, {
    player: {
      currentHealth: 20,
      language: 'jp',
    },
  });

  expect(screen.getByText('体力を50失いました。')).toHaveClass('language-jp');
  expect(screen.queryByRole('button', { name: 'リスポーン' })).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
  fireEvent.click(screen.getByRole('button', { name: 'リスポーン' }));

  expect(setPlayerPosition).toHaveBeenCalledWith(
    'player-1',
    getFirstStartAreaPosition(null),
    { currentHealth: 100 }
  );
  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/gameplay destination/i)).toBeInTheDocument();
});

test('Mini Game Failed keeps the failed player image while the live turn advances', () => {
  const nextPlayer = {
    ...failingPlayer,
    colour: 'blue',
    id: 'player-2',
    pieceImage: 'f-blue.png',
  };
  let context = {
    applyMiniGameFailurePunishment,
    currentPlayer: failingPlayer,
    gameSetup: {
      board: null,
      players: [failingPlayer, nextPlayer],
    },
    miniGameResult: {
      playerId: failingPlayer.id,
      result: 'loss',
      returnBehaviour: 'nextPlayerTurn',
      type: 'river',
    },
    returnFromMiniGame,
    setPlayerPosition,
  };

  useGameSetup.mockImplementation(() => context);

  const getResultPage = () => (
    <MemoryRouter initialEntries={['/mini-game/lose']}>
      <Routes>
        <Route
          path="/mini-game/lose"
          element={<MiniGameLosePage randomFn={() => 0.6} />}
        />
      </Routes>
    </MemoryRouter>
  );
  const { rerender } = render(getResultPage());

  expect(screen.getByRole('img', { name: /current player character/i })).toHaveAttribute(
    'src',
    'm-red.png'
  );

  context = {
    ...context,
    currentPlayer: nextPlayer,
    miniGameResult: null,
  };
  rerender(getResultPage());

  expect(screen.getByRole('img', { name: /current player character/i })).toHaveAttribute(
    'src',
    'm-red.png'
  );
});

test('Mini Game Failed CSS keeps the wooden panel lo-fi and the requested text/layout rules', () => {
  const cssSource = readFileSync(`${__dirname}/MiniGameResultPage.css`, 'utf8');

  expect(cssSource).toMatch(
    /\.mini-game-failure-panel\s*{[^}]*background-image:\s*url\('\.\.\/\.\.\/images\/misc\/modalBackground\.png'\);[^}]*border:\s*0;[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*700;/s
  );
  expect(cssSource).toMatch(
    /\.mini-game-failure-punishment\s*{[^}]*margin:\s*30px 0 0;/s
  );
});
