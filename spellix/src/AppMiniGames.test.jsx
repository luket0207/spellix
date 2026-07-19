import { readFileSync } from 'fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

function createGameplayReadySetup(overrides = {}) {
  const players = createPlayers(2).map((player) => ({
    ...player,
    hasCommittedInitialSpells: true,
  }));

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingPotionGrant: null,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
    ...overrides,
  };
}

function renderApp(initialRoute, initialGameSetup = createGameplayReadySetup()) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

test('debug Mini Games section starts River for the current player', () => {
  renderApp('/gameplay');

  fireEvent.click(screen.getByRole('button', { name: /open settings/i }));
  fireEvent.click(screen.getByRole('button', { name: /^debug$/i }));

  expect(screen.getByRole('heading', { name: /mini games/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /start river mini game/i }));

  expect(screen.getByRole('group', { name: /river row 1/i })).toBeInTheDocument();
  expect(screen.getByText(/choose a safe rock in the first row/i)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /current player character/i })).toHaveAttribute(
    'src',
    'm-red.png'
  );
  expect(screen.queryByRole('heading', { name: /river mini game/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/current player: red/i)).not.toBeInTheDocument();
});

test('Gameplay shows and dismisses the River win roll-again notice', () => {
  renderApp(
    '/gameplay',
    createGameplayReadySetup({
      miniGameReturnNotice: {
        playerId: 'player-1',
        type: 'river',
      },
    })
  );

  expect(screen.getByText('You crossed the river! You may roll again.')).toHaveClass(
    'larger-text',
    'language-en'
  );
  fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
  expect(screen.queryByRole('dialog', { name: /mini game result/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
});

test('Gameplay localizes the River win roll-again notice for a Japanese player', () => {
  const gameSetup = createGameplayReadySetup({
    miniGameReturnNotice: {
      playerId: 'player-1',
      type: 'river',
    },
  });
  gameSetup.players[0].language = 'jp';

  renderApp('/gameplay', gameSetup);

  expect(
    screen.getByText('川を渡り切りました！もう一度サイコロを振ることができます。')
  ).toHaveClass('larger-text', 'language-jp');
});

test('River return modal language classes use the established English and Japanese fonts', () => {
  const stylesheet = readFileSync(`${__dirname}/index.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.language-en\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;/s
  );
  expect(stylesheet).toMatch(
    /\.language-jp\s*{[^}]*font-family:\s*'Noto Serif JP',\s*serif;/s
  );
});
