import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { POTION_DEFINITIONS } from './data/potions';
import { createPlayers } from './features/gameSetup/gameSetup';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';
import {
  getCaveMiniGameTranslations,
  getGameplayTranslations,
  getNextTurnMessage,
} from './i18n/translations';

jest.mock('./features/spells/SpellTokenAssignment', () => {
  const ActualSpellTokenAssignment = jest.requireActual(
    './features/spells/SpellTokenAssignment'
  ).default;

  return function TestableSpellTokenAssignment(props) {
    return (
      <>
        <ActualSpellTokenAssignment {...props} />
        {props.mode === 'rewardAssignment' ? (
          <button
            type="button"
            onClick={() => props.onTokenDrop(props.rewardToken.id, 'slot-3')}
          >
            Simulate reward spell slot drop
          </button>
        ) : null}
      </>
    );
  };
});

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

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

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

test('debug Mini Games section starts Cave for the current player', () => {
  renderApp('/gameplay');

  fireEvent.click(screen.getByRole('button', { name: /open settings/i }));
  fireEvent.click(screen.getByRole('button', { name: /^debug$/i }));
  fireEvent.click(screen.getByRole('button', { name: /start cave mini game/i }));

  expect(
    screen.getByText(getCaveMiniGameTranslations('en').messages.initial)
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /go deeper/i })).toBeInTheDocument();
});

test('Cave retreat without roll again advances through the next-turn modal', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText('Blue Players Turn')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
});

test('Cave roll-again reward keeps the player and shows the localized return modal', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.99);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(
    screen.getByText(getCaveMiniGameTranslations('en').rollAgainNotice)
  ).toHaveClass('larger-text', 'language-en');
  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
});

test('Cave ogre loss discards roll again and returns through the shared loss flow', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.99);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));

  expect(
    screen.getByText(/chased out of the cave by an ogre/i)
  ).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(screen.getByText(/you lost 50 health/i)).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  expect(screen.getByText('Blue Players Turn')).toBeInTheDocument();
  expect(
    screen.queryByText(getCaveMiniGameTranslations('en').rollAgainNotice)
  ).not.toBeInTheDocument();
});

test('Cave loot retreat uses the shared Loot Chest page then advances the turn', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.976);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^open loot$/i }));

  expect(screen.getByRole('heading', { name: /^loot chest$/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText('Blue Players Turn')).toBeInTheDocument();
});

test('Cave loot preserves roll again through the shared Loot Chest page', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValueOnce(0.976).mockReturnValue(0.98);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^open loot$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText(getCaveMiniGameTranslations('en').rollAgainNotice)).toHaveClass(
    'larger-text',
    'language-en'
  );
  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
});

test('Cave assigns its token through the shared reward flow before potion and loot', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const gameSetup = createGameplayReadySetup({
    miniGameResult: {
      playerId: 'player-1',
      result: null,
      returnBehaviour: null,
      type: 'cave',
    },
  });
  gameSetup.players[0] = {
    ...gameSetup.players[0],
    potions: POTION_DEFINITIONS.slice(0, 3),
    tokenBag: Array.from({ length: 5 }, (_, index) => ({
      committed: false,
      id: `full-bag-${index + 1}`,
      type: index === 0 ? 'blue' : 'red',
    })),
  };

  renderApp('/mini-game/cave', gameSetup);

  fireEvent.click(screen.getByRole('button', { name: /debug: add token/i }));
  fireEvent.click(screen.getByRole('button', { name: /debug: add potion/i }));
  fireEvent.click(screen.getByRole('button', { name: /debug: add loot chest/i }));
  fireEvent.click(screen.getByRole('button', { name: /debug: add roll again potion/i }));
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));

  expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/reward token assignment/i)).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: /token bag is full/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /simulate reward spell slot drop/i }));
  fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
  expect(screen.getByText(/reward added to spell slot 3/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  const potionDialog = screen.getByRole('dialog', { name: /potion slots are full/i });
  expect(potionDialog).not.toHaveClass('larger-text');
  expect(screen.getByRole('button', { name: /^open loot$/i })).toBeDisabled();
  fireEvent.click(
    within(potionDialog).getByRole('button', { name: /discard new potion/i })
  );

  expect(screen.queryByRole('dialog', { name: /slots are full|bag is full/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^open loot$/i }));
  expect(screen.getByRole('heading', { name: /^loot chest$/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
  expect(screen.getByText(getCaveMiniGameTranslations('en').rollAgainNotice)).toHaveClass(
    'larger-text',
    'language-en'
  );
  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
});

test('Cave token assignment completes before a no-roll next-player return', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /debug: add token/i }));
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));

  fireEvent.click(screen.getByRole('button', { name: /simulate reward spell slot drop/i }));
  fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText('Blue Players Turn')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  expect(
    screen.queryByText(getCaveMiniGameTranslations('en').messages.retreated)
  ).not.toBeInTheDocument();
});

test('Cave token assignment preserves a Roll Again Potion for the same player', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /debug: add token/i }));
  fireEvent.click(screen.getByRole('button', { name: /debug: add roll again potion/i }));
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /simulate reward spell slot drop/i }));
  fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText(getCaveMiniGameTranslations('en').rollAgainNotice)).toHaveClass(
    'larger-text',
    'language-en'
  );
  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
  expect(
    screen.queryByText(getCaveMiniGameTranslations('en').messages.retreated)
  ).not.toBeInTheDocument();
});

test('Cave token assignment routes directly through Loot Chest before advancing', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  renderApp(
    '/mini-game/cave',
    createGameplayReadySetup({
      miniGameResult: {
        playerId: 'player-1',
        result: null,
        returnBehaviour: null,
        type: 'cave',
      },
    })
  );

  fireEvent.click(screen.getByRole('button', { name: /debug: add token/i }));
  fireEvent.click(screen.getByRole('button', { name: /debug: add loot chest/i }));
  fireEvent.click(screen.getByRole('button', { name: /^go deeper$/i }));
  act(() => {
    jest.advanceTimersByTime(500);
  });
  fireEvent.click(screen.getByRole('button', { name: /^retreat$/i }));
  fireEvent.click(screen.getByRole('button', { name: /simulate reward spell slot drop/i }));
  fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByRole('heading', { name: /^loot chest$/i })).toBeInTheDocument();
  expect(
    screen.queryByText(getCaveMiniGameTranslations('en').messages.retreated)
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

  expect(screen.getByText('Blue Players Turn')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
});

test('Gameplay localizes the Cave roll-again notice for a Japanese player', () => {
  const gameSetup = createGameplayReadySetup({
    miniGameReturnNotice: {
      playerId: 'player-1',
      type: 'cave',
    },
  });
  gameSetup.players[0].language = 'jp';

  renderApp('/gameplay', gameSetup);

  expect(
    screen.getByText(getCaveMiniGameTranslations('jp').rollAgainNotice)
  ).toHaveClass('larger-text', 'language-jp');
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

test('River loss returns to a locked localized next-turn modal exactly once', () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0);
  const gameSetup = createGameplayReadySetup({
    miniGameResult: {
      playerId: 'player-1',
      result: 'loss',
      returnBehaviour: 'nextPlayerTurn',
      type: 'river',
    },
  });
  gameSetup.players[1].language = 'jp';

  renderApp('/mini-game/lose', gameSetup);

  act(() => {
    jest.advanceTimersByTime(1000);
  });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  const turnDialog = screen.getByRole('dialog', { name: /turn change/i });
  const japaneseGameplay = getGameplayTranslations('jp');

  expect(
    within(turnDialog).getByText(getNextTurnMessage('jp', gameSetup.players[1].colour))
  ).toHaveClass('language-jp');
  expect(screen.getByRole('button', { name: japaneseGameplay.rollDice })).toBeDisabled();
  expect(screen.getByRole('button', { name: japaneseGameplay.spells })).toBeDisabled();
  expect(screen.getByRole('button', { name: /open settings/i })).toBeDisabled();
  expect(screen.queryByRole('dialog', { name: /mini game result/i })).not.toBeInTheDocument();

  fireEvent.click(within(turnDialog).getByRole('button', { name: /^ok$/i }));

  expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: japaneseGameplay.rollDice })).toBeEnabled();
  expect(screen.getByRole('button', { name: japaneseGameplay.spells })).toBeEnabled();
  expect(screen.getByRole('button', { name: /open settings/i })).toBeEnabled();
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
