import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createPlayers } from '../features/gameSetup/gameSetup';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import HazardPage from './HazardPage';

function createHazardSetup({ health = 100, language = 'en' } = {}) {
  const players = createPlayers(2).map((player) => ({
    ...player,
    hasCommittedInitialSpells: true,
  }));

  players[0] = {
    ...players[0],
    currentHealth: health,
    language,
  };

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingNextTurnModal: false,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function HazardStateProbe() {
  const {
    advanceTurn,
    currentPlayer,
    gameSetup,
    pendingNextTurnModal,
  } = useGameSetup();
  const playerOne = gameSetup.players[0];

  return (
    <div>
      <p>{`Hazard current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Hazard player one health: ${playerOne.currentHealth}`}</p>
      <p>{`Hazard player one skip: ${playerOne.skipNextTurn ? 'yes' : 'no'}`}</p>
      <p>{`Hazard player one died: ${playerOne.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Hazard next-turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <button type="button" onClick={advanceTurn}>
        Advance Under Hazard
      </button>
    </div>
  );
}

function mountHazard(
  encounter,
  setup = createHazardSetup(),
  onComplete = jest.fn(),
  { strictMode = false } = {}
) {
  const hazardRoute = (
    <GameSetupProvider initialGameSetup={setup}>
      <MemoryRouter initialEntries={['/hazard']}>
        <HazardStateProbe />
        <Routes>
          <Route
            path="/hazard"
            element={<HazardPage encounter={encounter} onComplete={onComplete} />}
          />
          <Route path="/gameplay" element={<p>Returned to board</p>} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
  render(
    strictMode ? <StrictMode>{hazardRoute}</StrictMode> : hazardRoute
  );

  return onComplete;
}

afterEach(() => {
  jest.useRealTimers();
});

test('delays English health loss, locks the player display, and advances only after OK', () => {
  jest.useFakeTimers();
  const encounter = {
    environment: 'mountains',
    hazard: {
      effect: { amount: 10, type: 'loseHealth' },
      id: 'landslide',
      name: { en: 'Landslide', jp: '土砂崩れ' },
    },
    playerId: 'player-1',
  };
  const onComplete = mountHazard(encounter, createHazardSetup({ health: 5 }));
  const dialog = screen.getByRole('dialog', { name: 'Hazard' });
  const okButton = within(dialog).getByRole('button', { name: 'OK' });

  expect(screen.getByTestId('hazard-page')).toHaveStyle({
    backgroundImage: 'url(mountains.png)',
  });
  expect(within(dialog).getByText('Hazard')).toHaveClass(
    'hazard-title-text',
    'language-en'
  );
  expect(within(dialog).getByText('Landslide')).toHaveClass(
    'hazard-name',
    'language-en'
  );
  expect(within(dialog).getByText('Lose 10 health')).toHaveClass(
    'hazard-effect',
    'language-en'
  );
  expect(within(dialog).getByRole('img', { name: 'Hazard player' })).toHaveAttribute(
    'src',
    'm-red.png'
  );
  expect(within(dialog).getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '5'
  );
  expect(okButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(999);
  });
  expect(screen.getByText('Hazard player one health: 5')).toBeInTheDocument();
  expect(okButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(screen.getByText('Hazard player one health: 0')).toBeInTheDocument();
  expect(screen.getByText('Hazard player one died: yes')).toBeInTheDocument();
  expect(within(dialog).getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
  expect(okButton).toBeEnabled();

  fireEvent.click(okButton);

  expect(screen.getByText('Returned to board')).toBeInTheDocument();
  expect(screen.getByText('Hazard current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Hazard next-turn modal: pending')).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('resolves one health-loss timer when mounted in Strict Mode', () => {
  jest.useFakeTimers();
  const encounter = {
    environment: 'field',
    hazard: {
      effect: { amount: 5, type: 'loseHealth' },
      id: 'mana-storm',
      name: { en: 'Mana Storm', jp: 'マナの嵐' },
    },
    playerId: 'player-1',
  };

  mountHazard(
    encounter,
    createHazardSetup(),
    jest.fn(),
    { strictMode: true }
  );
  const okButton = screen.getByRole('button', { name: 'OK' });

  expect(okButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText('Hazard player one health: 95')).toBeInTheDocument();
  expect(okButton).toBeEnabled();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText('Hazard player one health: 95')).toBeInTheDocument();
});

test('applies a Japanese skip-turn hazard immediately and renders no player status', () => {
  const encounter = {
    environment: 'river',
    hazard: {
      effect: { type: 'skipNextTurn' },
      id: 'flash-flood',
      name: { en: 'Flash Flood', jp: '鉄砲水' },
    },
    playerId: 'player-1',
  };
  mountHazard(encounter, createHazardSetup({ language: 'jp' }));
  const dialog = screen.getByRole('dialog', { name: 'ハザード' });

  expect(screen.getByTestId('hazard-page')).toHaveStyle({
    backgroundImage: 'url(river.png)',
  });
  expect(within(dialog).getByText('ハザード')).toHaveClass(
    'larger-text',
    'language-jp'
  );
  expect(within(dialog).getByText('鉄砲水')).toHaveClass('hazard-name', 'language-jp');
  expect(within(dialog).getByText('次のターンを失う')).toHaveClass(
    'hazard-effect',
    'language-jp'
  );
  expect(within(dialog).getAllByRole('img', { name: 'Hazard warning' })).toHaveLength(2);
  expect(within(dialog).queryByRole('img', { name: 'Hazard player' })).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('meter')).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'OK' })).toBeEnabled();
  expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();
  expect(screen.getByText('Hazard player one skip: yes')).toBeInTheDocument();
});

test('keeps the original hazard player visible if global turn state changes underneath it', () => {
  const encounter = {
    environment: 'field',
    hazard: {
      effect: { amount: 10, type: 'loseHealth' },
      id: 'lightning-strike',
      name: { en: 'Lightning Strike', jp: '落雷' },
    },
    playerId: 'player-1',
  };
  mountHazard(encounter);

  fireEvent.click(screen.getByRole('button', { name: 'Advance Under Hazard' }));

  expect(screen.getByText('Hazard current player: player-2')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Hazard player' })).toHaveAttribute(
    'src',
    'm-red.png'
  );
  expect(screen.getByText('Lightning Strike')).toBeInTheDocument();
});

test('uses the required centred wooden-modal hazard styling', () => {
  const stylesheet = readFileSync(`${__dirname}/HazardPage.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.hazard-title-row\s*{[^}]*align-items:\s*center;[^}]*color:\s*#F5FA00;[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*margin-bottom:\s*60px;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(/\.hazard-title-icon\s*{[^}]*color:\s*#F5FA00;/s);
  expect(stylesheet).toMatch(/\.hazard-title-text\s*{[^}]*padding:\s*0 20px;/s);
  expect(stylesheet).toMatch(
    /\.hazard-name\s*{[^}]*color:\s*#F5FA00;[^}]*font-size:\s*24px;[^}]*margin-bottom:\s*30px;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.hazard-effect\s*{[^}]*color:\s*#F5FA00;[^}]*margin-bottom:\s*30px;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.hazard-modal \.modal-actions\s*{[^}]*margin-top:\s*20px;/s
  );
});
