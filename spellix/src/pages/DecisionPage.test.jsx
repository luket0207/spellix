import { readFileSync } from 'fs';
import { useEffect, useRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DECISION_QUESTIONS } from '../data/decisionQuestions';
import { POTION_DEFINITIONS } from '../data/potions';
import { createPlayers } from '../features/gameSetup/gameSetup';
import {
  GameSetupProvider,
  useGameSetup,
} from '../features/gameSetup/GameSetupContext';
import DecisionPage from './DecisionPage';

jest.mock('../features/spells/SpellTokenAssignment', () => {
  const ActualSpellTokenAssignment = jest.requireActual(
    '../features/spells/SpellTokenAssignment'
  ).default;

  return function TestableSpellTokenAssignment(props) {
    return (
      <>
        <ActualSpellTokenAssignment {...props} />
        {props.mode === 'rewardAssignment' ? (
          <button
            type="button"
            onClick={() => props.onTokenDrop(props.rewardToken.id, 'token-bag')}
          >
            Simulate reward token bag drop
          </button>
        ) : null}
      </>
    );
  };
});

function createDecisionSetup(language = 'en') {
  const players = createPlayers(2).map((player) => ({
    ...player,
    hasCommittedInitialSpells: true,
  }));

  players[0] = {
    ...players[0],
    currentHealth: 75,
    language,
    potions: [{ ...POTION_DEFINITIONS.find(({ id }) => id === 'small-heal') }],
    tokenBag: [{ committed: false, id: 'existing-token', type: 'red' }],
  };

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

function ReturnedStateProbe() {
  const { currentPlayer, gameSetup, pendingNextTurnModal } = useGameSetup();
  const decisionPlayer = gameSetup.players[0];

  return (
    <div>
      <p>{`Current player: ${currentPlayer.id}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal}`}</p>
      <p>{`Decision player health: ${decisionPlayer.currentHealth}`}</p>
      <p>{`Decision player potions: ${decisionPlayer.potions.length}`}</p>
      <p>{`Decision player tokens: ${decisionPlayer.tokenBag.length}`}</p>
      <p>{`Decision player skip: ${decisionPlayer.skipNextTurn}`}</p>
    </div>
  );
}

function DecisionStateProbe() {
  const { gameSetup } = useGameSetup();
  const decisionPlayer = gameSetup.players[0];

  return (
    <div data-testid="decision-state">
      {JSON.stringify({
        health: decisionPlayer.currentHealth,
        potions: decisionPlayer.potions.map(({ id }) => id),
        boardPotionUsedThisTurn:
          decisionPlayer.turnPotionUsage.boardPotionUsedThisTurn,
        skipNextTurn: decisionPlayer.skipNextTurn,
        spellTokens: decisionPlayer.spellSlots.flatMap(({ tokens }) =>
          tokens.map(({ type }) => type)
        ),
        tokenBag: decisionPlayer.tokenBag.map(({ type }) => type),
      })}
    </div>
  );
}

function CurrentPlayerProbe() {
  const { currentPlayer } = useGameSetup();

  return <p>{`Live current player: ${currentPlayer.id}`}</p>;
}

function StaleDecisionHealthAfterTurnProbe({ staleHealth }) {
  const { currentPlayer, setPlayerHealth } = useGameSetup();
  const hasRestoredStaleHealth = useRef(false);

  useEffect(() => {
    if (currentPlayer.id !== 'player-2' || hasRestoredStaleHealth.current) {
      return;
    }

    hasRestoredStaleHealth.current = true;
    setPlayerHealth('player-1', staleHealth);
  }, [currentPlayer.id, setPlayerHealth, staleHealth]);

  return null;
}

function renderDecision({
  environment = 'fields',
  language = 'en',
  mutateSetup = () => {},
  randomFn = jest.fn().mockReturnValue(0),
} = {}) {
  const setup = createDecisionSetup(language);

  mutateSetup(setup);

  return render(
    <GameSetupProvider initialGameSetup={setup}>
      <MemoryRouter initialEntries={['/decision']}>
        <Routes>
          <Route
            path="/decision"
            element={
              <>
                <DecisionPage environment={environment} randomFn={randomFn} />
                <DecisionStateProbe />
              </>
            }
          />
          <Route path="/gameplay" element={<ReturnedStateProbe />} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

function getOutcomeSelection(resultId) {
  for (
    let decisionIndex = 0;
    decisionIndex < DECISION_QUESTIONS.length;
    decisionIndex += 1
  ) {
    const decision = DECISION_QUESTIONS[decisionIndex];

    for (const decisionChoice of decision.choices) {
      for (const outcomeType of ['good', 'neutral', 'bad']) {
        if (
          decisionChoice.chances[outcomeType] > 0 &&
          decisionChoice.outcomes[outcomeType].resultId === resultId
        ) {
          const chanceStart =
            outcomeType === 'good'
              ? 0
              : outcomeType === 'neutral'
                ? decisionChoice.chances.good
                : decisionChoice.chances.good +
                  decisionChoice.chances.neutral;

          return {
            choiceText: decisionChoice.text,
            decisionRoll: (decisionIndex + 0.1) / DECISION_QUESTIONS.length,
            outcomeRoll: (chanceStart + 0.1) / 100,
          };
        }
      }
    }
  }

  throw new Error(`No selectable Decision outcome found for ${resultId}.`);
}

function renderDecisionOutcome(resultId, options = {}) {
  const selection = getOutcomeSelection(resultId);
  const randomFn = jest
    .fn()
    .mockReturnValueOnce(selection.decisionRoll)
    .mockReturnValueOnce(selection.outcomeRoll)
    .mockReturnValue(options.rewardRoll ?? 0);

  renderDecision({ ...options, randomFn });
  fireEvent.click(
    screen.getByRole('button', {
      name: selection.choiceText[options.language === 'jp' ? 'jp' : 'en'],
    })
  );

  return randomFn;
}

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('shows one random question with exactly three modal choices', () => {
  const randomFn = jest.fn().mockReturnValue(0);
  renderDecision({ environment: 'mountains', randomFn });
  const decisionPage = screen.getByTestId('decision-page');
  const decisionDialog = screen.getByRole('dialog', { name: 'Decision' });
  const question = screen.getByText(/old lantern glowing/i);

  expect(decisionPage).toHaveStyle({
    backgroundImage: 'url(mountains.png)',
  });
  expect(decisionDialog).toHaveClass(
    'modal-panel',
    'modal-panel--default',
    'decision-modal',
    'language-en'
  );
  expect(screen.getByRole('img', { name: /current player character/i })).toHaveAttribute(
    'src',
    'm-red.png'
  );
  expect(question).toHaveClass('decision-question', 'larger-text', 'language-en');
  expect(screen.getAllByRole('button')).toHaveLength(3);
  screen.getAllByRole('button').forEach((button) => {
    expect(button).toHaveClass('decision-choice-button', 'language-en');
  });
  expect(within(decisionDialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(decisionDialog).queryByRole('listitem')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /cancel|close|skip|retreat|back/i })
  ).not.toBeInTheDocument();
  expect(randomFn).toHaveBeenCalledTimes(1);
});

test('keeps the selected question stable when the page rerenders', () => {
  const randomFn = jest.fn().mockReturnValue(0);

  function StableDecisionProbe() {
    const [updateCount, setUpdateCount] = useState(0);

    return (
      <>
        <button type="button" onClick={() => setUpdateCount((count) => count + 1)}>
          Rerender
        </button>
        <span>{updateCount}</span>
        <DecisionPage randomFn={randomFn} />
      </>
    );
  }

  render(
    <GameSetupProvider initialGameSetup={createDecisionSetup()}>
      <MemoryRouter>
        <StableDecisionProbe />
      </MemoryRouter>
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Rerender' }));

  expect(screen.getByText(/old lantern glowing/i)).toBeInTheDocument();
  expect(randomFn).toHaveBeenCalledTimes(1);
});

test('activates and consumes Good Decisions only after safe outcome resolution', () => {
  const goodDecisionsPotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'good-decisions'
  );
  const randomFn = jest
    .fn()
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(0.9999);

  renderDecision({
    mutateSetup: (setup) => {
      setup.players[0].potions.push({ ...goodDecisionsPotion });
      setup.players[0].turnPotionUsage.boardPotionUsedThisTurn = true;
    },
    randomFn,
  });

  const goodDecisions = screen.getByRole('group', {
    name: 'Good Decisions potion',
  });
  const useButton = screen.getByRole('button', { name: 'Use' });
  const stylesheet = readFileSync(`${__dirname}/DecisionPage.css`, 'utf8');

  expect(goodDecisions).toHaveAttribute(
    'title',
    'Remove any forfeits from a decision'
  );
  expect(screen.getByText('Good Decisions')).toHaveClass(
    'potion-icon-name',
    'language-en'
  );
  expect(useButton).toHaveClass(
    'decision-mini-potion-use-button',
    'language-en'
  );
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent)
  ).toMatchObject({
    boardPotionUsedThisTurn: true,
    potions: ['small-heal', 'good-decisions'],
  });

  fireEvent.click(useButton);

  const activeText = screen.getByText('Active');

  expect(screen.queryByRole('button', { name: 'Use' })).not.toBeInTheDocument();
  expect(activeText).toHaveClass(
    'decision-mini-potion-active-text',
    'language-en'
  );
  expect(goodDecisions).toBeInTheDocument();
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).potions
  ).toContain('good-decisions');
  expect(stylesheet).toMatch(
    /\.decision-mini-potion-active-text\s*\{[^}]*color:\s*#F5FA00;[^}]*min-height:\s*40px;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-mini-potion-use-button\s*\{[^}]*min-height:\s*40px;/s
  );

  fireEvent.click(screen.getByRole('button', { name: 'Ask the voice who it is' }));

  expect(
    screen.getByText('The voice fades away without answering.')
  ).toBeInTheDocument();
  expect(screen.queryByText('The voice deceives you and steals one of your tokens.'))
    .not.toBeInTheDocument();
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent)
  ).toMatchObject({
    boardPotionUsedThisTurn: true,
    potions: ['small-heal'],
  });
});

test('uses Good Decisions to force good when neutral chance is zero', () => {
  const goodDecisionsPotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'good-decisions'
  );
  const randomFn = jest
    .fn()
    .mockReturnValueOnce(0.9999)
    .mockReturnValueOnce(0.9999)
    .mockReturnValue(0);

  renderDecision({
    mutateSetup: (setup) => {
      setup.players[0].potions.push({ ...goodDecisionsPotion });
    },
    randomFn,
  });

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  fireEvent.click(screen.getByRole('button', { name: 'Accept the trade' }));

  expect(screen.getByText('Gain a common potion')).toBeInTheDocument();
  expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).potions
  ).not.toContain('good-decisions');
});

test('uses Japanese Good Decisions controls and font classes', () => {
  const goodDecisionsPotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'good-decisions'
  );

  renderDecision({
    language: 'jp',
    mutateSetup: (setup) => {
      setup.players[0].potions.push({ ...goodDecisionsPotion });
    },
  });

  expect(
    screen.getByRole('group', { name: '賢明な選択 potion' })
  ).toHaveAttribute('title', '選択によって受けるペナルティをすべて無効にする。');

  const useButton = screen.getByRole('button', { name: '使用する' });

  expect(useButton).toHaveClass('language-jp');
  fireEvent.click(useButton);
  expect(screen.getByText('発動中')).toHaveClass(
    'decision-mini-potion-active-text',
    'language-jp'
  );
});

test('keeps the entering player image while the Decision page remains mounted', () => {
  const selection = getOutcomeSelection('nothing');
  const randomFn = jest
    .fn()
    .mockReturnValueOnce(selection.decisionRoll)
    .mockReturnValueOnce(selection.outcomeRoll);

  render(
    <GameSetupProvider initialGameSetup={createDecisionSetup()}>
      <MemoryRouter>
        <DecisionPage randomFn={randomFn} />
        <CurrentPlayerProbe />
      </MemoryRouter>
    </GameSetupProvider>
  );

  const decisionPlayerImage = screen.getByRole('img', {
    name: /current player character/i,
  });

  expect(decisionPlayerImage).toHaveAttribute('src', 'm-red.png');

  fireEvent.click(
    screen.getByRole('button', { name: selection.choiceText.en })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Live current player: player-2')).toBeInTheDocument();
  expect(decisionPlayerImage).toHaveAttribute('src', 'm-red.png');
});

test('applies a specific potion reward and advances only after resolution', () => {
  const randomFn = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(0);
  renderDecision({ randomFn });

  fireEvent.click(screen.getByRole('button', { name: 'Ask the voice who it is' }));

  expect(screen.queryByText(/old lantern glowing/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /ask the voice/i })).not.toBeInTheDocument();
  expect(
    screen.getByText(/voice belongs to a grateful spirit/i)
  ).toHaveClass('decision-outcome-text', 'larger-text', 'language-en');
  expect(screen.getByText('Gain a Small Heal potion')).toHaveClass(
    'decision-outcome-result',
    'language-en'
  );
  expect(screen.getByRole('group', { name: 'Small Heal potion' })).toHaveAttribute(
    'title',
    'Recover 30% HP'
  );
  expect(screen.getByRole('img', { name: /current player character/i })).toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
  expect(screen.getByText('Decision player health: 75')).toBeInTheDocument();
  expect(screen.getByText('Decision player potions: 2')).toBeInTheDocument();
  expect(screen.getByText('Decision player tokens: 1')).toBeInTheDocument();
});

test('keeps neutral Nothing outcomes display-only without showing the result label', () => {
  renderDecisionOutcome('nothing');

  expect(screen.queryByText('Nothing')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  expect(JSON.parse(screen.getByTestId('decision-state').textContent)).toMatchObject({
    health: 75,
    potions: ['small-heal'],
    skipNextTurn: false,
    tokenBag: ['red'],
  });
});

test('hides the Japanese Nothing result label for neutral outcomes', () => {
  renderDecisionOutcome('nothing', { language: 'jp' });

  expect(screen.queryByText('\u4f55\u3082\u306a\u3057')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '\u7d9a\u3051\u308b' })).toBeEnabled();
});

test.each([
  ['firstAidPotion', 'First Aid'],
  ['freezePotion', 'Ice Beam'],
  ['thawPotion', 'Thaw'],
  ['cauldronPotion', 'Cauldron'],
])('grants the mapped %s potion with its name and tooltip', (resultId, name) => {
  renderDecisionOutcome(resultId);

  const potion = screen.getByRole('group', { name: `${name} potion` });

  expect(potion).toHaveAttribute('title');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test.each([
  ['commonPotion', 'Common'],
  ['rarePotion', 'Rare'],
])('selects a random %s potion and grants it', (resultId, rarity) => {
  renderDecisionOutcome(resultId, { rewardRoll: 0.99 });

  const grantedPotionId = JSON.parse(screen.getByTestId('decision-state').textContent)
    .potions[1];
  const grantedPotion = POTION_DEFINITIONS.find(({ id }) => id === grantedPotionId);

  expect(grantedPotion.rarity).toBe(rarity);
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('uses the existing replacement or discard flow when potion slots are full', () => {
  renderDecisionOutcome('smallHealPotion', {
    mutateSetup: (setup) => {
      setup.players[0].potions = POTION_DEFINITIONS.slice(0, 3);
    },
  });

  const continueButton = screen.getByRole('button', { name: 'Continue' });
  const currentPotionRow = screen.getByLabelText('Current potions');
  const discardNewPotionButton = screen.getByRole('button', {
    name: 'Discard new potion',
  });
  const replacementButtons = within(currentPotionRow).getAllByRole('button');
  const stylesheet = readFileSync(`${__dirname}/DecisionPage.css`, 'utf8');

  expect(continueButton).toBeDisabled();
  expect(screen.getByText(/potion slots are full/i)).toBeInTheDocument();
  expect(currentPotionRow).toHaveClass('decision-potion-choice-row');
  expect(replacementButtons).toHaveLength(3);
  replacementButtons.forEach((button) =>
    expect(button).toHaveClass('decision-potion-replace-button')
  );
  expect(
    within(currentPotionRow).queryByRole('button', {
      name: 'Discard new potion',
    })
  ).not.toBeInTheDocument();
  expect(discardNewPotionButton).toHaveClass('decision-potion-discard-button');
  expect(within(currentPotionRow).queryByRole('list')).not.toBeInTheDocument();
  expect(stylesheet).toMatch(
    /\.decision-potion-choice-row\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;[^}]*width:\s*100%;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-potion-discard-button\s*\{[^}]*width:\s*100%;/s
  );

  fireEvent.click(screen.getByRole('button', { name: /replace roll choice/i }));

  expect(continueButton).toBeEnabled();
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).potions
  ).toEqual(['small-heal', 'small-heal', 'heal']);
});

test.each([
  ['commonToken', 'red', 'Gain a common token', 0],
  ['rareToken', 'white', 'Gain a rare token', 0],
  ['token', 'red', 'Gain a token', 0],
  ['rareToken', 'purple-yellow-outline', 'Gain a rare token', 0.9999],
  ['token', 'purple-yellow-outline', 'Gain a token', 0.9999],
])(
  'shows the %s reward before opening assignment on Continue',
  (resultId, tokenType, resultLabel, rewardRoll) => {
  renderDecisionOutcome(resultId, { rewardRoll });

  expect(screen.getByText(resultLabel)).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: `${tokenType} reward token` })
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Reward token assignment')).not.toBeInTheDocument();

  const continueButton = screen.getByRole('button', { name: 'Continue' });

  expect(continueButton).toBeEnabled();
  fireEvent.click(continueButton);

  expect(screen.queryByText(resultLabel)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Reward token assignment')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: `New reward ${tokenType} token` })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Trash can')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  }
);

test('commits token assignment before returning to the board and advancing', () => {
  renderDecisionOutcome('commonToken');

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByLabelText('Reward token assignment')).toBeInTheDocument();
  expect(screen.queryByText('Current player: player-2')).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', { name: 'Simulate reward token bag drop' })
  );

  const confirmButton = screen.getByRole('button', { name: 'Confirm' });

  expect(confirmButton).toBeEnabled();
  expect(screen.queryByText('Current player: player-2')).not.toBeInTheDocument();

  fireEvent.click(confirmButton);

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
  expect(screen.getByText('Decision player tokens: 2')).toBeInTheDocument();
});

test('delays health loss for one second and clamps health at zero', () => {
  jest.useFakeTimers();
  renderDecisionOutcome('lose20Health', {
    mutateSetup: (setup) => {
      setup.players[0].currentHealth = 10;
    },
  });

  const continueButton = screen.getByRole('button', { name: 'Continue' });

  expect(continueButton).toBeDisabled();
  expect(screen.getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '10'
  );

  act(() => {
    jest.advanceTimersByTime(999);
  });
  expect(continueButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(continueButton).toBeEnabled();
  expect(screen.getByRole('meter', { name: 'Health bar' })).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
});

test('locks the damaged Decision health display after Continue rerenders stale player data', () => {
  jest.useFakeTimers();
  const selection = getOutcomeSelection('lose20Health');
  const randomFn = jest
    .fn()
    .mockReturnValueOnce(selection.decisionRoll)
    .mockReturnValueOnce(selection.outcomeRoll);
  const setup = createDecisionSetup();

  setup.players[0].currentHealth = 40;
  setup.players[1].currentHealth = 90;

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <MemoryRouter>
        <DecisionPage randomFn={randomFn} />
        <CurrentPlayerProbe />
        <StaleDecisionHealthAfterTurnProbe staleHealth={40} />
      </MemoryRouter>
    </GameSetupProvider>
  );

  fireEvent.click(
    screen.getByRole('button', { name: selection.choiceText.en })
  );

  const decisionPlayerImage = screen.getByRole('img', {
    name: /current player character/i,
  });
  const healthBar = screen.getByRole('meter', { name: 'Health bar' });

  expect(decisionPlayerImage).toHaveAttribute('src', 'm-red.png');
  expect(healthBar).toHaveAttribute('aria-valuenow', '40');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(healthBar).toHaveAttribute('aria-valuenow', '20');

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Live current player: player-2')).toBeInTheDocument();
  expect(decisionPlayerImage).toHaveAttribute('src', 'm-red.png');
  expect(healthBar).toHaveAttribute('aria-valuenow', '20');
});

test('removes an unprotected committed black token before other eligible tokens', () => {
  renderDecisionOutcome('loseToken', {
    mutateSetup: (setup) => {
      setup.players[0].spellSlots[0].tokens = [
        {
          committed: true,
          id: 'protected-red',
          protected: true,
          type: 'red',
        },
        { committed: true, id: 'blue-eligible', type: 'blue' },
        { committed: true, id: 'black-eligible', type: 'black' },
      ];
    },
  });

  expect(screen.getByText('Lose a token')).toBeInTheDocument();
  expect(screen.getByText('This token has been removed')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'black removed token' })).toHaveAttribute(
    'title'
  );
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).spellTokens
  ).toEqual(['red', 'blue']);
});

test('leaves protected tokens untouched and explains when none can be removed', () => {
  renderDecisionOutcome('loseToken', {
    mutateSetup: (setup) => {
      setup.players[0].spellSlots[0].tokens = [
        {
          committed: true,
          id: 'protected-red',
          protected: true,
          type: 'red',
        },
      ];
    },
  });

  expect(screen.getByText('No tokens were able to be removed')).toBeInTheDocument();
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).spellTokens
  ).toEqual(['red']);
});

test('uses the exact Japanese no-token-removed message', () => {
  renderDecisionOutcome('loseToken', { language: 'jp' });

  expect(
    screen.getByText(
      '\u30c8\u30fc\u30af\u30f3\u3092\u53d6\u308a\u9664\u304f\u3053\u3068\u304c\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002'
    )
  ).toHaveClass('language-jp');
});

test('removes a random existing potion and displays it with its tooltip', () => {
  renderDecisionOutcome('losePotion', {
    mutateSetup: (setup) => {
      setup.players[0].potions = POTION_DEFINITIONS.slice(0, 2);
    },
    rewardRoll: 0.99,
  });

  expect(screen.getByText('This potion was removed')).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Small Heal potion' })).toHaveAttribute(
    'title',
    'Recover 30% HP'
  );
  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).potions
  ).toEqual(['roll-choice']);
});

test('explains when there is no potion to remove', () => {
  renderDecisionOutcome('losePotion', {
    mutateSetup: (setup) => {
      setup.players[0].potions = [];
    },
  });

  expect(screen.getByText('No potions were able to be removed')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('sets the one-time skipped-turn flag before advancing', () => {
  renderDecisionOutcome('loseTurn');

  expect(
    JSON.parse(screen.getByTestId('decision-state').textContent).skipNextTurn
  ).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Decision player skip: true')).toBeInTheDocument();
});

test('uses Japanese decision copy and font classes', () => {
  renderDecision({ language: 'jp' });

  expect(
    screen.getByText(
      '古い魔法使いの塔のそばで、古びたランタンが光っているのを見つけました。中からかすかな声が聞こえてくるようです。どうしますか？'
    )
  ).toHaveClass('larger-text', 'language-jp');
  expect(screen.getByRole('button', { name: '中の声に正体を尋ねる' })).toHaveClass(
    'language-jp'
  );

  fireEvent.click(screen.getByRole('button', { name: '中の声に正体を尋ねる' }));

  expect(screen.getByText('小回復ポーションを獲得')).toHaveClass('language-jp');
  expect(screen.getByRole('button', { name: '続ける' })).toHaveClass('language-jp');
});

test('falls back to English for an invalid player language', () => {
  renderDecision({ language: 'invalid' });

  expect(screen.getByRole('dialog', { name: 'Decision' })).toHaveClass('language-en');
  expect(screen.getByText(/old lantern glowing/i)).toHaveClass('language-en');
  expect(screen.getByRole('button', { name: 'Ask the voice who it is' })).toHaveClass(
    'language-en'
  );
});

test('uses the requested layout contracts without list markup', () => {
  const stylesheet = readFileSync(`${__dirname}/DecisionPage.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.decision-page\s*\{[^}]*background-size:\s*cover;[^}]*min-height:\s*100vh;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-question,\s*\.decision-outcome-text\s*\{[^}]*margin:\s*40px 0 0;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-choice-list\s*\{[^}]*flex-direction:\s*column;[^}]*width:\s*100%;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-choice-button\s*\{[^}]*width:\s*100%;/s
  );
  expect(stylesheet).toMatch(
    /\.decision-outcome-result\s*\{[^}]*font-size:\s*16px;[^}]*text-align:\s*center;/s
  );
});
