import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import {
  getPotionDescription,
  getPotionName,
  POTION_DEFINITIONS,
} from '../data/potions';
import { getTokenName, TOKEN_DEFINITIONS } from '../data/tokens';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import {
  getCaveMiniGameTranslations,
  getRewardPageTranslations,
  getSpellAssignmentTranslations,
} from '../i18n/translations';
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
          <>
            <button
              type="button"
              onClick={() => props.onTokenDrop(props.rewardToken.id, 'token-bag')}
            >
              Simulate reward token bag drop
            </button>
            <button
              type="button"
              onClick={() => props.onTokenDrop(props.rewardToken.id, 'slot-3')}
            >
              Simulate reward spell slot drop
            </button>
            <button
              type="button"
              onClick={() => props.onTokenDrop(props.rewardToken.id, 'reward-discard')}
            >
              Simulate reward discard drop
            </button>
          </>
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
      environment: 'forest',
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
  const { activeBattle, currentPlayer, gameSetup, pendingNextTurnModal } = useGameSetup();

  return (
    <div>
      <p>{`Selected choice: ${activeBattle?.selectedRewardChoiceId ?? 'none'}`}</p>
      <p>{`Reward destination: ${activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <p>{`Player 1 potions: ${gameSetup.players[0].potions.map(({ name }) => name).join(',') || 'empty'}`}</p>
      <p>{`Player 1 token bag: ${gameSetup.players[0].tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Player 1 slot 3: ${gameSetup.players[0].spellSlots[2].tokens.map(({ committed, id }) => `${id}:${committed}`).join(',') || 'empty'}`}</p>
      <p>{`Village phase: ${gameSetup.villageVisit?.phase ?? 'none'}`}</p>
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
          <Route
            path="/village"
            element={
              <>
                <p>Village</p>
                <RewardStateSnapshot />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

function chooseReward(index = 0, name = 'Choose') {
  fireEvent.click(screen.getAllByRole('button', { name })[index]);
}

describe('RewardPage choice flow', () => {
  test('shows component-based rewards in a centred div layout over the battle background', () => {
    renderRewardPage();

    expect(screen.getByRole('heading', { name: 'Choose your reward' })).toHaveClass(
      'larger-text',
      'language-en'
    );
    expect(screen.queryByText('Common Token')).not.toBeInTheDocument();
    expect(screen.queryByText('Red')).not.toBeInTheDocument();
    expect(screen.queryByText('Rare Potion')).not.toBeInTheDocument();
    expect(screen.getByText('Roll Choice')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Choose' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /choose red/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /choose roll choice/i })).not.toBeInTheDocument();
    const tokenRewardIcon = screen.getByRole('img', { name: /red reward token/i });
    const rewardOptions = screen.getByLabelText('Reward options');

    expect(screen.getByRole('main')).toHaveClass('reward-page');
    expect(screen.getByRole('main')).toHaveStyle({
      backgroundImage: `url(${getBattleBackgroundSource('forest')})`,
    });
    expect(screen.getByRole('dialog', { name: 'Reward choices' })).toHaveClass(
      'modal-panel',
      'modal-panel--default',
      'battle-reward-panel'
    );
    expect(rewardOptions).toHaveClass('reward-options');
    expect(within(rewardOptions).queryByRole('list')).not.toBeInTheDocument();
    expect(within(rewardOptions).getAllByLabelText(/reward option/i)).toHaveLength(2);
    expect(tokenRewardIcon).toHaveClass('token-display--glow', 'token-display--red');
    expect(tokenRewardIcon).toHaveAttribute(
      'title',
      TOKEN_DEFINITIONS.red.description.en
    );
    expect(tokenRewardIcon).toHaveAccessibleDescription(
      TOKEN_DEFINITIONS.red.description.en
    );
    expect(screen.getByText('Damage')).toHaveClass('battle-reward-name', 'language-en');
    expect(tokenRewardIcon.parentElement.parentElement).toHaveClass(
      'battle-reward-icon-row'
    );
    expect(tokenRewardIcon.parentElement.querySelector('.token-display-name')).toBeNull();
    expect(screen.getAllByTestId('battle-reward-button-row')).toHaveLength(2);
    expect(screen.getByRole('group', { name: /roll choice potion/i })).toHaveClass(
      'potion-icon--blue'
    );
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test.each(['battle', 'cave'])(
    'uses the generic night sky and wooden modal panel for %s token assignment',
    (source) => {
      renderRewardPage([], (setup) => {
        if (source === 'cave') {
          setup.activeBattle.source = 'cave';
        }
        setup.activeBattle.selectedRewardChoiceId = 'reward-choice-1';
      });

      expect(screen.getByLabelText(/reward token assignment/i)).toBeInTheDocument();
      expect(screen.getByTestId('magical-night-sky')).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('reward-page--assignment');
      expect(screen.getByRole('main')).not.toHaveStyle({
        backgroundImage: `url(${getBattleBackgroundSource('forest')})`,
      });
      expect(screen.getByLabelText('Reward assignment')).toHaveClass(
        'modal-panel',
        'modal-panel--default',
        'reward-panel--assignment'
      );
      expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
    }
  );

  test('shows Japanese token reward names and tooltips for a Japanese battle player', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].language = 'jp';
    });

    expect(screen.getByRole('heading', { name: '報酬を選んでください。' })).toHaveClass(
      'larger-text',
      'language-jp'
    );
    expect(screen.getAllByRole('button', { name: '選ぶ' })).toHaveLength(2);
    expect(screen.getByText('ダメージ')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /red reward token/i })).toHaveAttribute(
      'title',
      TOKEN_DEFINITIONS.red.description.jp
    );
    expect(screen.getByRole('group', { name: '出目選択 potion' })).toHaveAccessibleDescription(
      '次に振るサイコロの出目を選ぶ。'
    );
  });

  test('falls back to the fields background and English copy for invalid values', () => {
    renderRewardPage([], (setup) => {
      setup.activeBattle.environment = 'invalid';
      setup.players[0].language = 'invalid';
    });

    expect(screen.getByRole('main')).toHaveStyle({
      backgroundImage: `url(${getBattleBackgroundSource('fields')})`,
    });
    expect(screen.getByRole('heading', { name: 'Choose your reward' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Choose' })).toHaveLength(2);
  });

  test('uses the required horizontal, centred, stable wooden reward modal styles', () => {
    const stylesheet = readFileSync(`${__dirname}/RewardPage.css`, 'utf8');

    expect(stylesheet).toMatch(/\.reward-page\s*{[^}]*align-items:\s*center;/s);
    expect(stylesheet).toMatch(/\.reward-page\s*{[^}]*justify-content:\s*center;/s);
    expect(stylesheet).toMatch(/\.reward-page\s*{[^}]*background-size:\s*cover;/s);
    expect(stylesheet).toMatch(/\.battle-reward-panel\s*{[^}]*text-align:\s*center;/s);
    expect(stylesheet).toMatch(/\.reward-panel\s*{[^}]*text-align:\s*center;/s);
    expect(stylesheet).toMatch(
      /\.reward-options\s*{[^}]*align-items:\s*stretch;[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.reward-option\s*{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*90px minmax\(48px, auto\) auto;[^}]*width:\s*150px;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-reward-name\s*{[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*700;[^}]*text-align:\s*center;/s
    );
  });

  test('uses a bottom-centred standard button for the assignment result', () => {
    renderRewardPage([], (setup) => {
      setup.activeBattle.selectedRewardChoiceId = 'reward-choice-1';
      setup.activeBattle.rewardResolution = {
        choiceId: 'reward-choice-1',
        destination: 'discarded',
      };
    });

    const actions = screen.getByLabelText('Assignment result actions');
    const continueButton = within(actions).getByRole('button', { name: 'Continue' });
    const stylesheet = readFileSync(`${__dirname}/RewardPage.css`, 'utf8');

    expect(continueButton).toHaveClass('fantasy-button', 'language-en');
    expect(stylesheet).toMatch(
      /\.assignment-result-modal\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s
    );
    expect(stylesheet).toMatch(
      /\.assignment-result-modal-actions\s*{[^}]*margin-top:\s*auto;[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.assignment-result-modal-actions\s+button\s*{[^}]*width:\s*auto;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-reward-item-display\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s
    );
  });

  test('adds a selected potion from mixed choices, then continues with only that reward', () => {
    renderRewardPage();

    chooseReward(1);

    const potionRewardDialog = screen.getByRole('dialog', {
      name: 'Reward potion added.',
    });

    expect(potionRewardDialog).toHaveClass(
      'modal-panel',
      'modal-panel--default',
      'reward-panel',
      'language-en'
    );
    expect(screen.getByTestId('modal-overlay')).toContainElement(potionRewardDialog);
    expect(within(potionRewardDialog).queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.queryByText(/Selected reward:/)).not.toBeInTheDocument();
    expect(screen.getByText('Selected choice: reward-choice-2')).toBeInTheDocument();
    expect(screen.getByText('Reward potion added.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionSlot')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Roll Choice')).toBeInTheDocument();
    const awardedPotion = within(potionRewardDialog).getByRole('group', {
      name: 'Roll Choice potion',
    });

    expect(awardedPotion).toHaveAccessibleDescription(
      getPotionDescription(
        POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
        'en'
      )
    );
    expect(within(potionRewardDialog).getByText('Roll Choice')).toHaveClass(
      'potion-icon-name',
      'language-en'
    );
    expect(awardedPotion.parentElement).toHaveClass('battle-reward-item-display');
    expect(screen.queryByRole('button', { name: 'Choose' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByText('Gameplay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Selected choice: none')).toBeInTheDocument();
    expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
    expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Roll Choice')).toBeInTheDocument();
    expect(screen.getByText('Player 1 token bag: empty')).toBeInTheDocument();
  });

  test('shows a full-slot battle potion reward in the normal modal without list markup', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].potions = [
        createNamedPotion(0),
        createNamedPotion(1),
        createNamedPotion(2),
      ];
    });

    chooseReward(1);

    const potionRewardDialog = screen.getByRole('dialog', {
      name: 'Potion slots are full',
    });

    expect(potionRewardDialog).toHaveClass(
      'modal-panel',
      'modal-panel--default',
      'reward-panel',
      'language-en'
    );
    expect(screen.getByTestId('modal-overlay')).toContainElement(potionRewardDialog);
    expect(within(potionRewardDialog).getByText('Roll Choice')).toHaveClass(
      'potion-icon-name',
      'language-en'
    );
    expect(within(potionRewardDialog).getByText('Potion slots are full.')).toBeInTheDocument();
    expect(within(potionRewardDialog).queryByRole('list')).not.toBeInTheDocument();
  });

  test('returns a resolved village reward to the village choice phase', () => {
    renderRewardPage([], (setup) => {
      const potion = POTION_DEFINITIONS.find(
        ({ id }) => id === 'roll-choice'
      );

      setup.activeBattle = {
        encounterType: 'fieldVillage',
        environment: 'fields',
        phase: 'reward',
        playerId: 'player-1',
        rewardChoices: [
          {
            category: 'Rare Potion',
            id: 'village-potion',
            item: potion,
            itemType: 'potion',
          },
        ],
        rewardResolution: {
          choiceId: 'village-potion',
          destination: 'potionSlot',
        },
        selectedRewardChoiceId: 'village-potion',
        source: 'village',
      };
      setup.villageVisit = {
        defeatedEliteCount: 1,
        defeatedEnemyId: 'crowned-lichlord',
        phase: 'rewardFlow',
        playerId: 'player-1',
        rewardItem: potion,
        rewardType: 'potion',
        villageId: 'fieldVillage',
      };
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Village')).toBeInTheDocument();
    expect(screen.getByText('Village phase: choice')).toBeInTheDocument();
    expect(screen.getByText('Selected choice: none')).toBeInTheDocument();
    expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
    expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();
  });

  test('returns a resolved village Loot Chest assignment to village choices', () => {
    renderRewardPage([], (setup) => {
      setup.activeBattle = {
        environment: 'fields',
        phase: 'reward',
        playerId: 'player-1',
        rewardChoices: [
          {
            category: 'Common Token',
            id: 'village-loot-token',
            item: { label: 'Red', rarity: 'Common', type: 'red' },
            itemType: 'token',
          },
        ],
        rewardResolution: {
          choiceId: 'village-loot-token',
          destination: 'discarded',
        },
        selectedRewardChoiceId: 'village-loot-token',
        source: 'lootChest',
      };
      setup.miniGameResult = {
        lootChestReward: {
          status: 'processing',
        },
        playerId: 'player-1',
        result: 'win',
        type: 'villageLootChest',
      };
      setup.villageVisit = {
        defeatedEliteCount: 0,
        defeatedEnemyId: null,
        phase: 'rewardFlow',
        playerId: 'player-1',
        rewardItem: null,
        rewardType: 'lootChest',
        villageId: 'fieldVillage',
      };
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Village')).toBeInTheDocument();
    expect(screen.getByText('Village phase: choice')).toBeInTheDocument();
    expect(screen.getByText('Selected choice: none')).toBeInTheDocument();
  });

  test('replaces one selected potion when all potion slots are full', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].potions = [
        createNamedPotion(0),
        createNamedPotion(1),
        createNamedPotion(2),
      ];
    });

    chooseReward(1);

    expect(screen.getByText('Potion slots are full.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Potion 2,Potion 3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^replace potion/i })).toHaveLength(3);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: /roll choice potion/i })).toBeInTheDocument();
    expect(screen.getByLabelText('New potion')).toContainElement(
      screen.getByRole('group', { name: /roll choice potion/i })
    );
    const potionActions = screen.getByLabelText('Current potions');
    expect(within(potionActions).getAllByRole('button')).toHaveLength(4);
    within(potionActions)
      .getAllByRole('button')
      .forEach((button) => expect(button).toHaveClass('potion-assignment-button'));
    expect(
      within(screen.getByRole('button', { name: /replace potion 2/i })).getByRole('group', {
        name: /potion 2 potion/i,
      })
    ).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('button', { name: /discard new potion/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();

    const stylesheet = readFileSync(`${__dirname}/RewardPage.css`, 'utf8');
    expect(stylesheet).toMatch(
      /\.new-potion-reward\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.potion-assignment-actions\s*{[^}]*display:\s*grid;[^}]*gap:\s*15px;[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\);/s
    );
    expect(stylesheet).toMatch(
      /\.potion-assignment-actions\s+button\s*{[^}]*width:\s*100%;/s
    );
    expect(stylesheet).toMatch(
      /\.potion-assignment-button\s+\.potion-icon\s*{[^}]*margin-right:\s*20px;/s
    );

    fireEvent.click(screen.getByRole('button', { name: /replace potion 2/i }));

    expect(screen.getByText('Reward potion replaced an existing potion.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionSlotReplacement')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Roll Choice,Potion 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('shows Japanese potion text throughout the full-capacity replacement flow', () => {
    const rewardGrantTranslations = getCaveMiniGameTranslations('jp').rewardGrant;
    const currentPotions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
      POTION_DEFINITIONS.find(({ id }) => id === 'ice-beam'),
      POTION_DEFINITIONS.find(({ id }) => id === 'charger'),
    ];

    renderRewardPage([], (setup) => {
      setup.players[0].language = 'jp';
      setup.players[0].potions = currentPotions;
    });

    chooseReward(1, '選ぶ');

    expect(screen.getByRole('group', { name: '出目選択 potion' })).toHaveAccessibleDescription(
      '次に振るサイコロの出目を選ぶ。'
    );
    expect(
      screen.getByRole('dialog', {
        name: rewardGrantTranslations.potionSlotsFull,
      })
    ).toHaveClass('modal-panel', 'modal-panel--default', 'reward-panel', 'language-jp');
    expect(
      screen.getByText(`${rewardGrantTranslations.potionSlotsFull}.`)
    ).toBeInTheDocument();
    currentPotions.forEach((potion) => {
      const potionName = getPotionName(potion, 'jp');
      const replaceLabel = rewardGrantTranslations.replacePotion(potionName);

      expect(screen.getByRole('button', { name: replaceLabel })).toContainElement(
        screen.getByRole('group', { name: `${potionName} potion` })
      );
    });
    expect(
      screen.getByRole('button', { name: rewardGrantTranslations.discardNewPotion })
    ).toHaveClass('language-jp');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: rewardGrantTranslations.replacePotion(getPotionName(currentPotions[0], 'jp')),
      })
    );
    expect(
      screen.getByText('報酬ポーションで既存のポーションを交換しました。')
    ).toHaveClass('language-jp');
  });

  test('discards a selected new potion when all potion slots are full', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].potions = [
        createNamedPotion(0),
        createNamedPotion(1),
        createNamedPotion(2),
      ];
    });

    chooseReward(1);
    fireEvent.click(screen.getByRole('button', { name: /discard new potion/i }));

    expect(screen.getByText('Reward potion discarded.')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionDiscarded')).toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: Potion 1,Potion 2,Potion 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  test('uses the shared token-bag drop zone without a temporary add button', () => {
    renderRewardPage([{ committed: false, id: 'player-1-blue-1', type: 'blue' }]);

    chooseReward();

    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getByRole('button', {
        name: /moveable blue token/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^confirm$/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /add to token bag/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Selected destination: Token Bag')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm token bag/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 token bag: player-1-blue-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('uses the shared trash drop zone without a temporary discard button', () => {
    renderRewardPage();

    chooseReward();

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

    chooseReward();

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

    expect(screen.getByText('Selected token to replace: Guard token 3')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /^confirm$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    expect(screen.getByText('Reward added to token bag')).toBeInTheDocument();
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

    chooseReward();
    fireEvent.click(screen.getByRole('button', { name: /simulate reward token bag drop/i }));
    fireEvent.click(
      within(screen.getByLabelText(/token bag drop zone/i)).getAllByRole('button', {
        name: /moveable blue token/i,
      })[2]
    );

    expect(screen.queryByRole('button', { name: /choose token to replace/i })).not.toBeInTheDocument();
    expect(screen.getByText('Selected token to replace: Guard token 3')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText(originalBagText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /leave reward route/i }));

    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText(originalBagText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /return to reward route/i }));

    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.queryByText(/selected token to replace/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^confirm$/i })).toBeDisabled();
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

    chooseReward();

    expect(screen.getByLabelText(/reward token assignment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^spell slots$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/token bag drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByLabelText(/discard token drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /trash can/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /committed spell slots/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1', level: 4 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3', level: 4 })).toBeInTheDocument();
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    expect(screen.getAllByText('0 / 5')).toHaveLength(5);
    expect(screen.queryByLabelText(/spell slot assignment choices/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select spell slot/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm spell slot/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reward destination: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 slot 3: empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test.each([
    {
      completion: 'Reward added to token bag',
      destination: 'tokenBag',
      dropButton: /simulate reward token bag drop/i,
      status: 'Placed in token bag',
    },
    {
      completion: 'Reward added to spell slot 3',
      destination: 'spellSlot',
      dropButton: /simulate reward spell slot drop/i,
      status: 'Placed in spell slot 3',
    },
    {
      completion: 'Reward added to discard area',
      destination: 'discarded',
      dropButton: /simulate reward discard drop/i,
      status: 'Placed in discard area',
    },
  ])(
    'uses one English Confirm action and completion copy for $destination',
    ({ completion, destination, dropButton, status }) => {
      renderRewardPage();

      chooseReward();
      fireEvent.click(screen.getByRole('button', { name: dropButton }));

      expect(screen.getByText(status)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
      expect(screen.queryByText(/Selected destination:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Selected reward:/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(screen.getByText(completion)).toBeInTheDocument();
      expect(screen.getByText(`Reward destination: ${destination}`)).toBeInTheDocument();
    }
  );

  test('shows the exact awarded token component, name, and tooltip in the result modal', () => {
    renderRewardPage();

    chooseReward();
    fireEvent.click(screen.getByRole('button', { name: /simulate reward token bag drop/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    const rewardDialog = screen.getByRole('dialog', { name: 'Reward assignment' });
    const awardedToken = within(rewardDialog).getByRole('img', {
      name: 'Damage reward token',
    });

    expect(awardedToken).toHaveClass('token-display--red');
    expect(awardedToken).toHaveAccessibleDescription(
      TOKEN_DEFINITIONS.red.description.en
    );
    expect(screen.getByText('Player 1 token bag: player-1-red-1')).toBeInTheDocument();
    expect(within(rewardDialog).getByText(getTokenName('red', 'en'))).toHaveClass(
      'token-display-name',
      'language-en'
    );
    expect(awardedToken.parentElement.parentElement).toHaveClass(
      'battle-reward-item-display'
    );
    expect(within(rewardDialog).queryByRole('list')).not.toBeInTheDocument();
  });

  test('shows a Japanese awarded potion name and tooltip in the result modal', () => {
    const rewardTranslations = getRewardPageTranslations('jp');
    const rollChoicePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'roll-choice'
    );

    renderRewardPage([], (setup) => {
      setup.players[0].language = 'jp';
    });

    chooseReward(1, rewardTranslations.choose);

    const rewardDialog = screen.getByRole('dialog', {
      name: rewardTranslations.potionAdded,
    });
    const awardedPotion = within(rewardDialog).getByRole('group', {
      name: `${getPotionName(rollChoicePotion, 'jp')} potion`,
    });

    expect(awardedPotion).toHaveAccessibleDescription(
      getPotionDescription(rollChoicePotion, 'jp')
    );
    expect(within(rewardDialog).getByText(getPotionName(rollChoicePotion, 'jp'))).toHaveClass(
      'potion-icon-name',
      'language-jp'
    );
  });

  test('shows a Japanese awarded token name and tooltip in the result modal', () => {
    const rewardTranslations = getRewardPageTranslations('jp');
    const spellTranslations = getSpellAssignmentTranslations('jp');

    renderRewardPage([], (setup) => {
      setup.players[0].language = 'jp';
    });

    chooseReward(0, rewardTranslations.choose);
    fireEvent.click(screen.getByRole('button', { name: /simulate reward token bag drop/i }));
    fireEvent.click(screen.getByRole('button', { name: spellTranslations.confirm }));

    const rewardDialog = screen.getByRole('dialog', { name: 'Reward assignment' });
    const awardedToken = within(rewardDialog).getByRole('img', {
      name: `${getTokenName('red', 'jp')} reward token`,
    });

    expect(awardedToken).toHaveAccessibleDescription(
      TOKEN_DEFINITIONS.red.description.jp
    );
    expect(within(rewardDialog).getByText(getTokenName('red', 'jp'))).toHaveClass(
      'token-display-name',
      'language-jp'
    );
  });

  test('uses English awarded-item content when the player language is invalid', () => {
    const rollChoicePotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'roll-choice'
    );

    renderRewardPage([], (setup) => {
      setup.players[0].language = 'invalid';
    });

    chooseReward(1);

    const awardedPotion = screen.getByRole('group', {
      name: 'Roll Choice potion',
    });

    expect(awardedPotion).toHaveAccessibleDescription(
      getPotionDescription(rollChoicePotion, 'en')
    );
    expect(screen.getByText('Roll Choice')).toHaveClass(
      'potion-icon-name',
      'language-en'
    );
  });

  test('uses Japanese reward assignment labels, status, confirmation, and completion copy', () => {
    renderRewardPage([], (setup) => {
      setup.players[0].language = 'jp';
    });

    chooseReward(0, '選ぶ');

    expect(screen.getByRole('heading', { name: '報酬を割り当てる' })).toHaveClass(
      'language-jp'
    );
    expect(screen.queryByText('新しい報酬トークン')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        '続けるには、トークンを自分のスペルかトークンバッグに配置するか、破棄してください。'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('トークンバッグ')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ゴミ箱' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /simulate reward spell slot drop/i }));

    expect(screen.getByText('呪文スロット3に配置')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '確定' }));
    expect(screen.getByText('報酬を呪文スロット3に追加しました')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '続ける' })).toHaveClass('language-jp');
  });
});
