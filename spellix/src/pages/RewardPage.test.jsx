import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { POTION_DEFINITIONS } from '../data/potions';
import { TOKEN_DEFINITIONS } from '../data/tokens';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import RewardPage from './RewardPage';

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

function createRewardSetup(tokenBag = []) {
  const initialSetup = createInitialGameSetup();

  return {
    ...initialSetup,
    activeBattle: {
      level: 2,
      phase: 'reward',
      playerId: 'player-1',
      rewardChoices: [
        {
          category: 'Common Token',
          id: 'reward-choice-1',
          item: { label: 'Red', rarity: 'Common', type: 'red' },
          itemType: 'token',
        },
        {
          category: 'Rare Potion',
          id: 'reward-choice-2',
          item: POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
          itemType: 'potion',
        },
      ],
    },
    players: initialSetup.players.map((player, index) =>
      index === 0 ? { ...player, tokenBag } : player
    ),
    turnOrder: ['player-1', 'player-2'],
  };
}

function createNamedPotion(index) {
  return {
    ...POTION_DEFINITIONS[index],
    id: `potion-${index + 1}`,
    name: `Potion ${index + 1}`,
  };
}

function RewardStateSnapshot() {
  const { activeBattle, currentPlayer, gameSetup } = useGameSetup();

  return (
    <div>
      <p>{`Selected choice: ${activeBattle?.selectedRewardChoiceId ?? 'none'}`}</p>
      <p>{`Reward destination: ${activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Player 1 potions: ${gameSetup.players[0].potions.map(({ name }) => name).join(',') || 'empty'}`}</p>
      <p>{`Player 1 token bag: ${gameSetup.players[0].tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Player 1 slot 3: ${gameSetup.players[0].spellSlots[2].tokens.map(({ committed, id }) => `${id}:${committed}`).join(',') || 'empty'}`}</p>
    </div>
  );
}

function RewardRouteControls() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate('/gameplay')}>
        Leave reward route
      </button>
      <button type="button" onClick={() => navigate('/reward')}>
        Return to reward route
      </button>
    </>
  );
}

function renderRewardPage(tokenBag, configureSetup = () => {}) {
  const setup = createRewardSetup(tokenBag);

  configureSetup(setup);

  return render(
    <GameSetupProvider initialGameSetup={setup}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/reward']}
      >
        <RewardRouteControls />
        <Routes>
          <Route
            path="/reward"
            element={
              <>
                <RewardPage />
                <RewardStateSnapshot />
              </>
            }
          />
          <Route
            path="/gameplay"
            element={
              <>
                <p>Gameplay</p>
                <RewardStateSnapshot />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('RewardPage choice flow', () => {
  test('shows each generated category and exact reward', () => {
    renderRewardPage();

    expect(screen.getByRole('heading', { name: /choose one reward/i })).toBeInTheDocument();
    expect(screen.getByText('Common Token')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Rare Potion')).toBeInTheDocument();
    expect(screen.getByText('Roll Choice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose red/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose roll choice/i })).toBeInTheDocument();
    const tokenRewardIcon = screen.getByRole('img', { name: /red reward token/i });

    expect(tokenRewardIcon).toHaveClass('token-display--glow', 'token-display--red');
    expect(tokenRewardIcon).toHaveAttribute('title', TOKEN_DEFINITIONS.red.description);
    expect(tokenRewardIcon).toHaveAccessibleDescription(
      TOKEN_DEFINITIONS.red.description
    );
    expect(screen.getByRole('group', { name: /roll choice potion/i })).toHaveClass(
      'potion-icon--blue'
    );
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('adds a selected potion from mixed choices, then continues with only that reward', () => {
    renderRewardPage();

    fireEvent.click(screen.getByRole('button', { name: /choose roll choice/i }));

    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.getByText('Selected reward: Rare Potion - Roll Choice')).toBeInTheDocument();
    expect(screen.getByText('Selected choice: reward-choice-2')).toBeInTheDocument();
    expect(screen.getByText('Reward potion added.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionSlot')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Roll Choice')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /choose red/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByText('Gameplay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Selected choice: none')).toBeInTheDocument();
    expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Roll Choice')).toBeInTheDocument();
    expect(screen.getByText('Player 1 token bag: empty')).toBeInTheDocument();
  });

  test('replaces one selected potion when all potion slots are full', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].potions = [
        createNamedPotion(0),
        createNamedPotion(1),
        createNamedPotion(2),
      ];
    });

    fireEvent.click(screen.getByRole('button', { name: /choose roll choice/i }));

    expect(screen.getByText('Potion slots are full.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Potion 2,Potion 3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^replace potion/i })).toHaveLength(3);
    expect(screen.getByRole('group', { name: /roll choice potion/i })).toBeInTheDocument();
    expect(
      within(screen.getByRole('button', { name: /replace potion 2/i })).getByRole('group', {
        name: /potion 2 potion/i,
      })
    ).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('button', { name: /discard new potion/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /replace potion 2/i }));

    expect(screen.getByText('Reward potion replaced an existing potion.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionSlotReplacement')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Roll Choice,Potion 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('discards a selected new potion when all potion slots are full', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].potions = [
        createNamedPotion(0),
        createNamedPotion(1),
        createNamedPotion(2),
      ];
    });

    fireEvent.click(screen.getByRole('button', { name: /choose roll choice/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard new potion/i }));

    expect(screen.getByText('Reward potion discarded.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionDiscarded')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Potion 2,Potion 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('uses the shared token-bag drop zone without a temporary add button', () => {
    renderRewardPage([{ committed: false, id: 'player-1-blue-1', type: 'blue' }]);

    fireEvent.click(screen.getByRole('button', { name: /choose red/i }));

    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getByRole('button', {
        name: /moveable blue token/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /add to token bag/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Selected destination: Token Bag')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm token bag/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 token bag: player-1-blue-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('uses the shared trash drop zone without a temporary discard button', () => {
    renderRewardPage();

    fireEvent.click(screen.getByRole('button', { name: /choose red/i }));

    expect(
      within(screen.getByLabelText(/discard token drop zone/i)).queryByRole('button', {
        name: /new reward red token/i,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /new reward red token/i,
      })
    ).toBeEnabled();
    expect(screen.queryByRole('button', { name: /discard reward token/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Selected destination: Discard')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm discard/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 token bag: empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('replaces one clicked shared bag token without numbered fallback controls', () => {
    const fullTokenBag = Array.from({ length: 5 }, (_, index) => ({
      committed: false,
      id: `player-1-blue-${index + 1}`,
      type: 'blue',
    }));

    renderRewardPage(fullTokenBag);

    fireEvent.click(screen.getByRole('button', { name: /choose red/i }));

    expect(screen.getByText('Token bag is full.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to token bag/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /discard reward token/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /choose token to replace/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Choose a token to remove.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^replace blue token/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm replacement/i })).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getAllByRole('button')
    ).toHaveLength(5);
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Player 1 token bag: player-1-blue-1,player-1-blue-2,player-1-blue-3,player-1-blue-4,player-1-blue-5'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /simulate reward token bag drop/i }));

    expect(screen.getByText('Choose a token to remove.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^replace blue token/i })).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByLabelText(/token bag drop zone/i)).getAllByRole('button', {
        name: /moveable blue token/i,
      })[2]
    );

    expect(screen.getByText('Selected token to replace: Blue token 3')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getByRole('button', {
        name: /new reward red token/i,
      })
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getAllByRole('button')
    ).toHaveLength(5);
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Player 1 token bag: player-1-blue-1,player-1-blue-2,player-1-blue-3,player-1-blue-4,player-1-blue-5'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm replacement/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm replacement/i }));

    expect(screen.getByText('Reward replaced a token in the token bag.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: tokenBagReplacement')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Player 1 token bag: player-1-blue-1,player-1-blue-2,player-1-red-1,player-1-blue-4,player-1-blue-5'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('keeps a full-bag reward unresolved when leaving before a drop', () => {
    const fullTokenBag = Array.from({ length: 5 }, (_, index) => ({
      committed: false,
      id: `player-1-blue-${index + 1}`,
      type: 'blue',
    }));
    const originalBagText =
      'Player 1 token bag: player-1-blue-1,player-1-blue-2,player-1-blue-3,player-1-blue-4,player-1-blue-5';

    renderRewardPage(fullTokenBag);

    fireEvent.click(screen.getByRole('button', { name: /choose red/i }));
    fireEvent.click(screen.getByRole('button', { name: /simulate reward token bag drop/i }));
    fireEvent.click(
      within(screen.getByLabelText(/token bag drop zone/i)).getAllByRole('button', {
        name: /moveable blue token/i,
      })[2]
    );

    expect(screen.queryByRole('button', { name: /choose token to replace/i })).not.toBeInTheDocument();
    expect(screen.getByText('Selected token to replace: Blue token 3')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText(originalBagText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /leave reward route/i }));

    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText(originalBagText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /return to reward route/i }));

    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.queryByText(/selected token to replace/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm replacement/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText(originalBagText)).toBeInTheDocument();
  });

  test('uses shared spell-slot drop zones without temporary numbered selectors', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].spellSlots[0].tokens = Array.from({ length: 5 }, (_, index) => ({
        committed: true,
        id: `player-1-blue-${index + 1}`,
        type: 'blue',
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: /choose red/i }));

    expect(screen.getByLabelText(/reward token assignment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^spell slots$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token bag drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByLabelText(/discard token drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /trash can/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /committed spell slots/i })).not.toBeInTheDocument();
    expect(screen.getByText('Slot 1: 5 of 5 tokens')).toBeInTheDocument();
    expect(screen.getByText('Slot 3: 0 of 5 tokens')).toBeInTheDocument();
    expect(screen.queryByLabelText(/spell slot assignment choices/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select spell slot/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm spell slot/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 slot 3: empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });
});
