import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  NOTHING_EVENT_ENVIRONMENTS,
  getNothingEventForEnvironment,
} from '../data/nothingEvents';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import { createPlayers } from '../features/gameSetup/gameSetup';
import NothingEventPage from './NothingEventPage';

function createNothingEventSetup(
  language = 'en',
  { currentHealth = 40, maxHealth = 100 } = {}
) {
  const players = createPlayers(2).map((player) => ({
    ...player,
    hasCommittedInitialSpells: true,
  }));

  players[0].language = language;
  players[0].baseMaxHealth = maxHealth;
  players[0].currentHealth = currentHealth;
  players[0].maxHealth = maxHealth;

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingNextTurnModal: false,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function NothingEventStateProbe() {
  const {
    advanceTurn,
    currentPlayer,
    gameSetup,
    pendingNextTurnModal,
  } = useGameSetup();
  const eventPlayer = gameSetup.players.find(({ id }) => id === 'player-1');

  return (
    <div>
      <p>{`Nothing current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Nothing next-turn modal: ${
        pendingNextTurnModal ? 'pending' : 'clear'
      }`}</p>
      <p>{`Nothing player-1 health: ${eventPlayer.currentHealth}/${eventPlayer.maxHealth}`}</p>
      <button type="button" onClick={advanceTurn}>
        Advance under Nothing event
      </button>
    </div>
  );
}

function mountNothingEvent({
  environmentId = 'field',
  currentHealth = 40,
  language = 'en',
  maxHealth = 100,
  onComplete = jest.fn(),
  playerId = 'player-1',
  randomFn = Math.random,
} = {}) {
  const event = getNothingEventForEnvironment(environmentId);

  render(
    <GameSetupProvider
      initialGameSetup={createNothingEventSetup(language, {
        currentHealth,
        maxHealth,
      })}
    >
      <MemoryRouter initialEntries={['/nothing-event']}>
        <NothingEventStateProbe />
        <Routes>
          <Route
            path="/nothing-event"
            element={
              <NothingEventPage
                encounter={{ event, playerId }}
                onComplete={onComplete}
                randomFn={randomFn}
              />
            }
          />
          <Route path="/gameplay" element={<p>Returned to board</p>} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );

  return onComplete;
}

afterEach(() => {
  jest.useRealTimers();
});

test.each(
  NOTHING_EVENT_ENVIRONMENTS.flatMap((event) => [
    [event, 'en'],
    [event, 'jp'],
  ])
)(
  'renders the $id Nothing event with its $label background in %s',
  (event, language) => {
    mountNothingEvent({ environmentId: event.id, language });

    const dialog = screen.getByRole('dialog', { name: 'Nothing Event' });
    const eventText = within(dialog).getByText(event.text[language]);
    const continueText = language === 'jp' ? '\u7d9a\u3051\u308b' : 'Continue';

    expect(screen.getByTestId('nothing-event-page')).toHaveStyle({
      backgroundImage: `url(${event.background}.png)`,
    });
    expect(eventText).toHaveClass(
      'nothing-event-text',
      'larger-text',
      `language-${language}`
    );
    expect(
      within(dialog).getByRole('button', { name: continueText })
    ).toHaveClass(`language-${language}`);
    expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();
  }
);

test.each([
  [0, 45],
  [0.5, 50],
])('shows village-style healing and applies the selected amount for random value %s', (
  randomValue,
  expectedHealth
) => {
  jest.useFakeTimers();
  mountNothingEvent({
    currentHealth: 40,
    maxHealth: 110,
    randomFn: () => randomValue,
  });

  const continueButton = screen.getByRole('button', { name: 'Continue' });
  const healthBar = screen.getByRole('meter', { name: 'Health bar' });

  expect(screen.getByAltText('Nothing event player')).toHaveClass(
    'nothing-event-player-image'
  );
  expect(healthBar).toHaveAttribute('aria-valuenow', '40');
  expect(healthBar).toHaveAttribute('aria-valuemax', '110');
  expect(continueButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(999);
  });

  expect(healthBar).toHaveAttribute('aria-valuenow', '40');
  expect(continueButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(healthBar).toHaveAttribute(
    'aria-valuenow',
    String(expectedHealth)
  );
  expect(
    screen.getByText(`Nothing player-1 health: ${expectedHealth}/110`)
  ).toBeInTheDocument();
  expect(continueButton).toBeEnabled();
});

test.each([
  [96, 100],
  [100, 100],
])('clamps a 10 HP heal from $currentHealth HP to $expectedHealth HP', (
  currentHealth,
  expectedHealth
) => {
  jest.useFakeTimers();
  mountNothingEvent({
    currentHealth,
    maxHealth: 100,
    randomFn: () => 0.5,
  });

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    String(expectedHealth)
  );
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('Continue returns to the board, advances once, and queues the next-turn modal after healing', () => {
  jest.useFakeTimers();
  const onComplete = mountNothingEvent();
  const continueButton = screen.getByRole('button', { name: 'Continue' });

  expect(continueButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  fireEvent.click(continueButton);

  expect(screen.getByText('Returned to board')).toBeInTheDocument();
  expect(screen.getByText('Nothing current player: player-2')).toBeInTheDocument();
  expect(
    screen.getByText('Nothing next-turn modal: pending')
  ).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('keeps the original event player language if turn state changes underneath it', () => {
  mountNothingEvent({ language: 'jp' });

  fireEvent.click(
    screen.getByRole('button', { name: 'Advance under Nothing event' })
  );

  expect(screen.getByText('Nothing current player: player-2')).toBeInTheDocument();
  expect(
    screen.getByText(
      '\u5e83\u3005\u3068\u3057\u305f\u91ce\u539f\u3067\u4f11\u307f\u307e\u3059'
    )
  ).toHaveClass('language-jp');
  expect(
    screen.getByRole('button', { name: '\u7d9a\u3051\u308b' })
  ).toBeInTheDocument();
});

test('redirects an invalid Nothing encounter back to Gameplay', () => {
  mountNothingEvent({ environmentId: 'forest' });

  expect(screen.getByText('Returned to board')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('centres larger yellow text within the existing modal body', () => {
  const stylesheet = readFileSync(`${__dirname}/NothingEventPage.css`, 'utf8');
  const healthBarStylesheet = readFileSync(
    `${__dirname}/../components/health/HealthBar.css`,
    'utf8'
  );

  expect(stylesheet).toMatch(
    /\.nothing-event-modal \.modal-body\s*{[^}]*display:\s*flex;/s
  );
  expect(stylesheet).toMatch(
    /\.nothing-event-modal-content\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.nothing-event-text\s*{[^}]*color:\s*#F5FA00;[^}]*margin:\s*0;[^}]*text-align:\s*center;/si
  );
  expect(stylesheet).toMatch(
    /\.nothing-event-modal-content\s*{[^}]*flex-direction:\s*column;[^}]*gap:\s*20px;[^}]*margin-bottom:\s*20px;/s
  );
  expect(stylesheet).toMatch(
    /\.nothing-event-player-image\s*{[^}]*height:\s*180px;[^}]*width:\s*auto;/s
  );
  expect(healthBarStylesheet).toMatch(
    /\.health-bar-text\s*{[^}]*color:\s*#000;[^}]*font-family:\s*['"]Unkempt['"],\s*cursive;/s
  );
});
