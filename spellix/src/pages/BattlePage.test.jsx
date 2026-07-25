import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { POTION_DEFINITIONS } from '../data/potions';
import { getEnemyById } from '../features/battle/enemies';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import { createPlayers } from '../features/gameSetup/gameSetup';
import BattlePage from './BattlePage';
import RewardPage from './RewardPage';

function createBattleSetup() {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    hasCommittedInitialSpells: true,
    position: index === 0 ? { x: 3, y: 28 } : { x: 1, y: 29 },
    spellSlots: player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    })),
    tokenBag: [],
  }));

  players[0] = {
    ...players[0],
    currentHealth: 10,
    spellSlots: players[0].spellSlots.map((slot, index) => {
      if (index === 0) {
        return {
          ...slot,
          tokens: [
            { id: 'player-1-red-1', type: 'red', committed: true },
            { id: 'player-1-red-2', type: 'red', committed: true },
          ],
        };
      }

      if (index === 1) {
        return {
          ...slot,
          tokens: [{ id: 'player-1-blue-1', type: 'blue', committed: true }],
        };
      }

      return slot;
    }),
  };

  return {
    activeBattle: {
      currentBattleActor: 'player',
      enemyChargeUses: [0, 0, 0, 0, 0, 0],
      enemyCharged: false,
      enemyCurrentHealth: 120,
      enemyFreezeUses: [0, 0, 0, 0, 0, 0],
      enemyFrozen: false,
      enemyGuard: 0,
      enemyId: 'hellcrown-reaper',
      enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
      isResolvingTurn: false,
      level: 4,
      outcome: null,
      pendingEffects: [],
      phase: 'active',
      playerChargeUses: [0, 0, 0, 0, 0, 0],
      playerCharged: false,
      playerFreezeUses: [0, 0, 0, 0, 0, 0],
      playerFrozen: false,
      playerGuard: 0,
      playerId: 'player-1',
      playerPurpleBuffs: [0, 0, 0, 0, 0, 0],
    },
    board: {
      features: [],
      height: 31,
      squareSize: 30,
      squares: [
        { areaType: 'start-area', id: 'square-0-29', x: 0, y: 29 },
        { areaType: 'start-area', id: 'square-1-29', x: 1, y: 29 },
      ],
      width: 31,
    },
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function GameStateSnapshot() {
  const {
    activeBattle,
    advanceBattleTurn,
    battleEnemy,
    battlePlayer,
    currentPlayer,
    gameSetup,
    pendingNextTurnModal,
  } = useGameSetup();
  const playerOne = gameSetup.players[0];
  const playerOneSpellTokenIds = playerOne.spellSlots
    .flatMap(({ tokens }) => tokens)
    .map(({ id }) => id)
    .join(',');

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <p>{`Battle enemy health: ${battleEnemy?.currentHealth ?? 'none'}`}</p>
      <p>{`Battle player health: ${battlePlayer?.currentHealth ?? 'none'}`}</p>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor ?? 'none'}`}</p>
      <p>{`Player guard: ${activeBattle?.playerGuard ?? 'none'}`}</p>
      <p>{`Enemy guard: ${activeBattle?.enemyGuard ?? 'none'}`}</p>
      <p>{`Player frozen: ${activeBattle?.playerFrozen ?? 'none'}`}</p>
      <p>{`Enemy frozen: ${activeBattle?.enemyFrozen ?? 'none'}`}</p>
      <p>{`Player freeze uses: ${activeBattle?.playerFreezeUses?.join(',') ?? 'none'}`}</p>
      <p>{`Enemy freeze uses: ${activeBattle?.enemyFreezeUses?.join(',') ?? 'none'}`}</p>
      <p>{`Player Purple buffs: ${activeBattle?.playerPurpleBuffs?.join(',') ?? 'none'}`}</p>
      <p>{`Enemy Purple buffs: ${activeBattle?.enemyPurpleBuffs?.join(',') ?? 'none'}`}</p>
      <p>{`Player charged: ${activeBattle?.playerCharged ?? 'none'}`}</p>
      <p>{`Enemy charged: ${activeBattle?.enemyCharged ?? 'none'}`}</p>
      <p>{`Resolving turn: ${activeBattle?.isResolvingTurn ?? 'none'}`}</p>
      <p>{`Battle phase: ${activeBattle?.phase ?? 'none'}`}</p>
      <p>{`Stored level: ${activeBattle?.level ?? 'none'}`}</p>
      <p>{`Player 1 health: ${playerOne.currentHealth}`}</p>
      <p>{`Player 1 spell tokens: ${playerOneSpellTokenIds || 'none'}`}</p>
      <p>{`Player 1 position: ${gameSetup.players[0].position.x},${gameSetup.players[0].position.y}`}</p>
      <p>{`Player 1 potions: ${playerOne.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <button type="button" onClick={advanceBattleTurn}>
        Advance battle actor
      </button>
    </div>
  );
}

function renderBattleFlow(initialEntries = ['/battle'], initialGameSetup = createBattleSetup()) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={initialEntries}
      >
        <Routes>
          <Route
            path="/battle"
            element={
              <>
                <BattlePage />
                <GameStateSnapshot />
              </>
            }
          />
          <Route
            path="/reward"
            element={
              <>
                <RewardPage />
                <GameStateSnapshot />
              </>
            }
          />
          <Route path="/gameplay" element={<GameStateSnapshot />} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('BattlePage flows', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('keeps debug controls absolutely positioned on the left', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');
    const debugControlsRule = stylesheet.match(/\.battle-debug-controls\s*\{([^}]*)\}/)?.[1];

    expect(debugControlsRule).toMatch(/position:\s*absolute/);
    expect(debugControlsRule).toMatch(/left:\s*10px/);
    expect(debugControlsRule).not.toMatch(/right\s*:/);
  });

  test('positions the battle title at the top centre with the required size and weight', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');
    const titleRule = stylesheet.match(/\.battle-title\s*\{([^}]*)\}/)?.[1];

    expect(titleRule).toMatch(/position:\s*absolute/);
    expect(titleRule).toMatch(/top:\s*16px/);
    expect(titleRule).toMatch(/left:\s*50%/);
    expect(titleRule).toMatch(/transform:\s*translateX\(-50%\)/);
    expect(titleRule).toMatch(/font-size:\s*32px/);
    expect(titleRule).toMatch(/font-weight:\s*700/);
    expect(titleRule).toMatch(/text-align:\s*center/);
  });

  test('centres the Battle turn and loss modal content with current modal classes', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.battle-turn-modal-content\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*text-align:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-turn-modal-image\s*{[^}]*display:\s*block;[^}]*margin:\s*0 auto;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-loss-message\s*{[^}]*text-align:\s*center;/s
    );
  });

  test('uses the battling player language for the title, dice button, and both battle actors', () => {
    const japanesePlayerSetup = createBattleSetup();
    const enemy = getEnemyById('hellcrown-reaper');

    japanesePlayerSetup.players[0].language = 'jp';

    const { unmount } = renderBattleFlow(['/battle'], japanesePlayerSetup);

    expect(screen.getByRole('heading', { name: `${enemy.japaneseName}バトル` })).toHaveClass(
      'battle-title',
      'language-jp'
    );
    expect(screen.getByRole('button', { name: 'サイコロを振る' })).toHaveClass('language-jp');
    expect(screen.getByText('赤のターン')).toHaveClass('larger-text', 'language-jp');
    expect(screen.getByLabelText('Battle turn actor')).toHaveClass(
      'battle-turn-modal-image'
    );
    expect(screen.getByTestId('modal-body').firstElementChild).toHaveClass(
      'battle-turn-modal-content'
    );
    expect(screen.getByRole('img', { name: `Battle enemy ${enemy.japaneseName}` })).toBeInTheDocument();

    unmount();

    const japaneseEnemyTurnSetup = createBattleSetup();

    japaneseEnemyTurnSetup.players[0].language = 'jp';
    japaneseEnemyTurnSetup.activeBattle.currentBattleActor = 'enemy';
    renderBattleFlow(['/battle'], japaneseEnemyTurnSetup);

    expect(screen.getByText(`${enemy.japaneseName}のターン`)).toHaveClass('language-jp');
  });

  test('uses the selected environment background and falls back to fields', () => {
    const selectedEnvironmentSetup = createBattleSetup();
    selectedEnvironmentSetup.activeBattle.environment = 'mountains';

    const { unmount } = renderBattleFlow(['/battle'], selectedEnvironmentSetup);

    expect(screen.getByRole('main')).toHaveAttribute(
      'style',
      expect.stringContaining('mountains.png')
    );

    unmount();
    renderBattleFlow();

    expect(screen.getByRole('main')).toHaveAttribute(
      'style',
      expect.stringContaining('fields.png')
    );
  });

  test('shows only Battle-compatible potions above the dice and confirms one use', () => {
    const setup = createBattleSetup();

    setup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
      POTION_DEFINITIONS.find(({ id }) => id === 'bridge-builder'),
    ];

    renderBattleFlow(['/battle'], setup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', { name: /battle potions/i });
    const dicePanel = document.querySelector('.battle-dice');

    expect(dicePanel.firstElementChild).toBe(potionSection);
    expect(within(potionSection).getByText('First Aid')).toBeInTheDocument();
    expect(within(potionSection).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(potionSection).queryByText('Copy and Paste')).not.toBeInTheDocument();
    expect(within(potionSection).queryByText('Bridge Builder')).not.toBeInTheDocument();
    expect(within(potionSection).getAllByRole('button', { name: 'Use' })).toHaveLength(2);
    expect(potionSection.querySelector('ul, li')).toBeNull();

    fireEvent.click(within(potionSection).getAllByRole('button', { name: 'Use' })[0]);
    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(within(confirmation).getByText(/First Aid/)).toHaveClass('larger-text');
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Player 1 potions: roll-choice,copy-and-paste,bridge-builder')).toBeInTheDocument();
    expect(within(potionSection).queryByText('First Aid')).not.toBeInTheDocument();
    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeDisabled();

    fireEvent.click(
      within(potionSection).getByRole('button', { name: 'Use' })
    );
    expect(
      screen.queryByRole('dialog', { name: /use potion confirmation/i })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Advance battle actor' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Advance battle actor' })
    );
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeEnabled();
  });

  test('cancelling Battle potion confirmation does not lock usage', () => {
    const setup = createBattleSetup();

    setup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    ];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    fireEvent.click(
      within(potionSection).getAllByRole('button', { name: 'Use' })[0]
    );
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'No' })
    );

    expect(screen.getByText('Player 1 potions: first-aid,roll-choice')).toBeInTheDocument();
    within(potionSection).getAllByRole('button', { name: 'Use' }).forEach(
      (button) => expect(button).toBeEnabled()
    );
  });

  test('disables battle potion Use controls outside the player turn', () => {
    const setup = createBattleSetup();

    setup.activeBattle.currentBattleActor = 'enemy';
    setup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
    ];

    renderBattleFlow(['/battle'], setup);

    const potionSection = screen.getByRole('region', { name: /battle potions/i });

    expect(within(potionSection).getByRole('button', { name: 'Use' })).toBeDisabled();
  });

  test('removes player health in steps, clamps at zero, and respawns on loss', () => {
    renderBattleFlow();
    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(screen.getByRole('heading', { name: 'Hellcrown Reaper Battle' })).toHaveClass(
      'battle-title',
      'language-en'
    );
    expect(screen.queryByText(/battle level:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/stored level: 4/i)).toBeInTheDocument();
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /battle player piece/i })).toHaveClass(
      'battle-player-piece'
    );
    expect(screen.getByRole('img', { name: /battle player piece/i })).toHaveStyle({
      alignSelf: 'flex-start',
      width: 'auto',
    });
    expect(screen.getByRole('img', { name: /hellcrown reaper/i })).toHaveClass(
      'battle-enemy-piece'
    );
    expect(screen.getByText('120 / 120')).toBeInTheDocument();
    expect(within(playerPanel).getByLabelText('2 red tokens in slot 1')).toBeInTheDocument();
    expect(within(playerPanel).getByLabelText('blue token in slot 2')).toBeInTheDocument();
    expect(playerPanel.querySelectorAll('.committed-spell-slot-number')).toHaveLength(6);
    expect(enemyPanel.querySelectorAll('.committed-spell-slot-number')).toHaveLength(6);
    expect(screen.getAllByText('J')).toHaveLength(2);
    expect(screen.getByLabelText(/dice roller/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();
    expect(screen.getByText('Red Turn')).toBeInTheDocument();
    expect(screen.getByLabelText(/battle turn actor/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
    expect(screen.getByLabelText(/dice roller/i).parentElement).toHaveClass('battle-dice');
    expect(
      screen
        .getByLabelText(/dice roller/i)
        .compareDocumentPosition(screen.getByRole('button', { name: /remove 5 health/i })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByText(/地獄冠の死神/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove 5 health/i }));
    expect(screen.getByText('5 / 100')).toBeInTheDocument();
    expect(screen.getByText(/battle player health: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove 5 health/i }));
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    expect(screen.getByText(/battle phase: lost/i)).toBeInTheDocument();
    expect(screen.getByText(/resolving turn: false/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();
    expect(screen.getByText('The player has lost.')).toHaveClass(
      'battle-loss-message',
      'larger-text',
      'language-en'
    );
    expect(
      within(screen.getByRole('dialog', { name: /battle lost/i })).queryByRole('list')
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('A Red token was removed from column 1.')).toHaveLength(2);
    expect(screen.getByText('A Blue token was removed from column 2.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /respawn/i }));

    expect(screen.getByText(/current player: player-2/i)).toBeInTheDocument();
    expect(screen.getByText(/next turn modal: pending/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: none/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 position: 0,29/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 health: 100/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 spell tokens: none/i)).toBeInTheDocument();
    expect(screen.queryByText(/returning to gameplay/i)).not.toBeInTheDocument();
  });

  test('wins a battle, shows reward choices, and locks one for assignment', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderBattleFlow();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /^win$/i }));

    expect(screen.getAllByRole('button', { name: /^choose$/i })).toHaveLength(3);
    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^choose$/i })[0]);

    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.getByText(/current player: player-1/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 position: 3,28/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('finalizes the battle when the debug Lose button is selected', () => {
    renderBattleFlow();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /^lose$/i }));

    expect(screen.getByText(/battle phase: lost/i)).toBeInTheDocument();
    expect(screen.getByText(/resolving turn: false/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /remove 5 health/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^lose$/i })).toBeDisabled();
  });

  test('uses Japanese font classes and copy in the Battle loss modal', () => {
    const japaneseSetup = createBattleSetup();
    japaneseSetup.players[0].language = 'jp';
    renderBattleFlow(['/battle'], japaneseSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: /^lose$/i }));

    expect(screen.getByText('プレイヤーは敗北しました。')).toHaveClass(
      'battle-loss-message',
      'larger-text',
      'language-jp'
    );
    expect(screen.getByRole('button', { name: 'リスポーン' })).toHaveClass(
      'language-jp'
    );
  });

  test('reports no removals and keeps protected starting tokens after respawn', () => {
    const protectedTokenSetup = createBattleSetup();
    protectedTokenSetup.players[0].spellSlots = protectedTokenSetup.players[0].spellSlots.map(
      (slot) => ({
        ...slot,
        tokens: slot.tokens.map((token) => ({
          ...token,
          protected: true,
          source: 'starting',
        })),
      })
    );
    renderBattleFlow(['/battle'], protectedTokenSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /^lose$/i }));

    expect(
      screen.getByText('No tokens were removed because only starting tokens remained.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /removed tokens/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /respawn/i }));

    expect(
      screen.getByText(
        /player 1 spell tokens: player-1-red-1,player-1-red-2,player-1-blue-1/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/player 1 health: 100/i)).toBeInTheDocument();
  });

  test('forces a selected result through the existing persistent battle dice flow', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999);
    renderBattleFlow();
    const forceButtons = Array.from({ length: 6 }, (_, index) =>
      screen.getByRole('button', { name: `Force ${index + 1}` })
    );
    const debugControls = screen.getByRole('button', { name: /remove 5 health/i }).parentElement;

    expect(forceButtons).toHaveLength(6);
    forceButtons.forEach((button) => {
      expect(button).toBeDisabled();
      expect(debugControls).toContainElement(button);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    forceButtons.forEach((button) => expect(button).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Force 1' }));

    expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
      'dice-roll-cube--face-1'
    );
    forceButtons.forEach((button) => expect(button).toBeDisabled());
    expect(randomSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByRole('img', { name: /dice face 1/i })).toHaveClass(
      'dice-roll-cube--face-1'
    );
    expect(screen.getByText(/dice result: 1/i)).toHaveClass('dice-roll-result--visible');
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    forceButtons.forEach((button) => expect(button).toBeDisabled());

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText(/battle enemy health: 100/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
  });

  test('marks player and enemy Purple-buffed columns and removes the player marking after use', () => {
    const purpleSetup = createBattleSetup();
    purpleSetup.activeBattle.playerPurpleBuffs = [5, 0, 0, 0, 0, 0];
    purpleSetup.activeBattle.enemyPurpleBuffs = [0, 10, 0, 0, 0, 0];
    renderBattleFlow(['/battle'], purpleSetup);

    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);
    const playerColumns = playerPanel.querySelectorAll('.committed-spell-slot-column');
    const enemyColumns = enemyPanel.querySelectorAll('.committed-spell-slot-column');

    expect(playerColumns[0]).toHaveClass('committed-spell-slot-column--purple-buffed');
    expect(enemyColumns[1]).toHaveClass('committed-spell-slot-column--purple-buffed');

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Force 1' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(playerColumns[0]).toHaveClass('committed-spell-slot-column--purple-buffed');
    expect(enemyColumns[1]).toHaveClass('committed-spell-slot-column--purple-buffed');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle enemy health: 95/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(playerColumns[0]).not.toHaveClass('committed-spell-slot-column--purple-buffed');
    expect(enemyColumns[1]).toHaveClass('committed-spell-slot-column--purple-buffed');
  });

  test('marks all charged columns and combines Yellow with Purple until the player turn resolves', () => {
    const chargedSetup = createBattleSetup();
    chargedSetup.activeBattle.playerCharged = true;
    chargedSetup.activeBattle.enemyCharged = true;
    chargedSetup.activeBattle.playerPurpleBuffs = [5, 0, 0, 0, 0, 0];
    renderBattleFlow(['/battle'], chargedSetup);

    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);
    const playerColumns = playerPanel.querySelectorAll('.committed-spell-slot-column');
    const enemyColumns = enemyPanel.querySelectorAll('.committed-spell-slot-column');

    expect(
      playerPanel.querySelectorAll('.committed-spell-slot-column--yellow-charged')
    ).toHaveLength(6);
    expect(
      enemyPanel.querySelectorAll('.committed-spell-slot-column--yellow-charged')
    ).toHaveLength(6);
    expect(playerColumns[0]).toHaveClass('committed-spell-slot-column--purple-buffed');
    expect(playerColumns[0]).toHaveClass('committed-spell-slot-column--yellow-charged');

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Force 1' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByText(/player charged: true/i)).toBeInTheDocument();
    expect(playerColumns[0]).toHaveClass('committed-spell-slot-column--yellow-charged');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle enemy health: 85/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/player charged: false/i)).toBeInTheDocument();
    expect(screen.getByText(/enemy charged: true/i)).toBeInTheDocument();
    expect(playerColumns[0]).not.toHaveClass('committed-spell-slot-column--yellow-charged');
    expect(enemyColumns[0]).toHaveClass('committed-spell-slot-column--yellow-charged');
  });

  test('fades exhausted limited-use tokens in the player and enemy battle displays', () => {
    const limitedUseSetup = createBattleSetup();
    limitedUseSetup.activeBattle = {
      ...limitedUseSetup.activeBattle,
      enemyCurrentHealth: 60,
      enemyFreezeUses: [0, 0, 0, 0, 0, 0],
      enemyId: 'frostwisp-spirit',
      level: 2,
      playerChargeUses: [0, 0, 0, 0, 0, 0],
    };
    limitedUseSetup.players[0].spellSlots[0] = {
      ...limitedUseSetup.players[0].spellSlots[0],
      tokens: [{ committed: true, id: 'player-1-yellow-1', type: 'yellow' }],
    };
    renderBattleFlow(['/battle'], limitedUseSetup);

    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(within(playerPanel).getByLabelText(/yellow token in slot 1/i)).toHaveClass(
      'token-display--faded'
    );
    expect(within(enemyPanel).getByLabelText(/light-blue token in slot 3/i)).toHaveClass(
      'token-display--faded'
    );
  });

  test('shows remaining limited-use counts in player and enemy battle displays', () => {
    const limitedUseSetup = createBattleSetup();
    limitedUseSetup.activeBattle = {
      ...limitedUseSetup.activeBattle,
      enemyCurrentHealth: 80,
      enemyFreezeUses: [1, 0, 0, 0, 0, 0],
      enemyId: 'venomglyph-serpent',
      level: 3,
      playerChargeUses: [2, 0, 0, 0, 0, 0],
    };
    limitedUseSetup.players[0].spellSlots[0] = {
      ...limitedUseSetup.players[0].spellSlots[0],
      tokens: Array.from({ length: 3 }, (_, index) => ({
        committed: true,
        id: `player-1-yellow-${index + 1}`,
        type: 'yellow',
      })),
    };
    renderBattleFlow(['/battle'], limitedUseSetup);

    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(within(playerPanel).getByLabelText(/2 yellow tokens in slot 1/i)).toHaveTextContent('2');
    expect(within(playerPanel).queryByLabelText(/3 yellow tokens in slot 1/i)).not.toBeInTheDocument();
    expect(within(enemyPanel).getByLabelText(/light-blue token in slot 1/i)).not.toHaveTextContent(
      '1'
    );
    expect(
      within(enemyPanel).queryByLabelText(/2 light-blue tokens in slot 1/i)
    ).not.toBeInTheDocument();
  });


  test('uses a player freeze check without resolving a spell slot, then allows an even follow-up attack', () => {
    const frozenPlayerSetup = createBattleSetup();
    frozenPlayerSetup.activeBattle.playerFrozen = true;
    renderBattleFlow(['/battle'], frozenPlayerSetup);

    const playerFrozenOverlay = screen.getByLabelText(/player frozen/i);
    const playerImage = screen.getByRole('img', { name: /battle player piece/i });

    expect(playerFrozenOverlay).toHaveAttribute('data-icon', 'snowflake');
    expect(playerFrozenOverlay).toHaveClass('battle-freeze-indicator--enter');
    expect(playerFrozenOverlay).toHaveStyle({ opacity: '0.6' });
    expect(playerFrozenOverlay.parentElement).toHaveClass(
      'battle-actor-image',
      'battle-actor-image--player'
    );
    expect(playerFrozenOverlay.parentElement).toContainElement(playerImage);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/roll to see if you unfreeze/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Force 2' }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player frozen: false/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/player frozen/i)).toHaveClass(
      'battle-freeze-indicator--exit'
    );
    expect(screen.queryByText(/roll to see if you unfreeze/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByText(/player guard: 0/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(199);
    });
    expect(screen.getByLabelText(/player frozen/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByLabelText(/player frozen/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Force 2' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player guard: 5/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
  });

  test('removes player freeze and skips the attack after an odd check', () => {
    const frozenPlayerSetup = createBattleSetup();
    frozenPlayerSetup.activeBattle.playerFrozen = true;
    renderBattleFlow(['/battle'], frozenPlayerSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Force 1' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player frozen: false/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
  });

  test('automatically checks enemy freeze and skips its attack after an odd result', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const frozenEnemySetup = createBattleSetup();
    frozenEnemySetup.activeBattle.currentBattleActor = 'enemy';
    frozenEnemySetup.activeBattle.enemyFrozen = true;
    renderBattleFlow(['/battle'], frozenEnemySetup);

    const enemyFrozenOverlay = screen.getByLabelText(/enemy frozen/i);
    const enemyImage = screen.getByRole('img', { name: /battle enemy/i });

    expect(enemyFrozenOverlay).toHaveAttribute('data-icon', 'snowflake');
    expect(enemyFrozenOverlay).toHaveClass('battle-freeze-indicator--enter');
    expect(enemyFrozenOverlay).toHaveStyle({ opacity: '0.6' });
    expect(enemyFrozenOverlay.parentElement).toHaveClass(
      'battle-actor-image',
      'battle-actor-image--enemy'
    );
    expect(enemyFrozenOverlay.parentElement).toContainElement(enemyImage);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/roll to see if you unfreeze/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(Math.random).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/enemy frozen: false/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enemy frozen/i)).toHaveClass(
      'battle-freeze-indicator--exit'
    );
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByLabelText(/enemy frozen/i)).not.toBeInTheDocument();
  });

  test('automatically attacks after an enemy passes its freeze check with an even result', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.2).mockReturnValueOnce(0);
    const frozenEnemySetup = createBattleSetup();
    frozenEnemySetup.activeBattle.currentBattleActor = 'enemy';
    frozenEnemySetup.activeBattle.enemyFrozen = true;
    renderBattleFlow(['/battle'], frozenEnemySetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/enemy frozen: false/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();
    expect(Math.random).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.queryByRole('img', { name: /dice rolling/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();
    expect(Math.random).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/enemy guard: 25/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
  });

  test.each([
    { enemyId: 'vilewhisker-rat', level: 1 },
    { enemyId: 'harvestrot-scarecrow', level: 2 },
    { enemyId: 'gravechant-necromancer', level: 3 },
    { enemyId: 'hellcrown-reaper', level: 4 },
  ])('renders the selected Level $level enemy image and battle data', ({ enemyId, level }) => {
    const enemy = getEnemyById(enemyId);
    const selectedEnemySetup = createBattleSetup();
    selectedEnemySetup.activeBattle = {
      ...selectedEnemySetup.activeBattle,
      enemyCurrentHealth: enemy.currentHealth,
      enemyId,
      level,
    };
    renderBattleFlow(['/battle'], selectedEnemySetup);

    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);
    const enemyImage = within(enemyPanel).getByRole('img', {
      name: `Battle enemy ${enemy.englishName}`,
    });

    expect(enemyImage).toHaveAttribute('src', expect.stringContaining(enemy.imageFileName));
    expect(within(enemyPanel).queryByLabelText(/battle enemy fallback/i)).not.toBeInTheDocument();
    expect(within(enemyPanel).getByText(`${enemy.currentHealth} / ${enemy.maxHealth}`)).toBeInTheDocument();
    expect(enemyPanel.querySelectorAll('.committed-spell-slot-number')).toHaveLength(6);
    expect(screen.getByRole('img', { name: /battle player piece/i })).toBeInTheDocument();
  });

  test('applies dice results and alternates between player and enemy turns', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.2);
    renderBattleFlow();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.queryByLabelText(/player guard shield/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/enemy guard shield/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/player guard amount/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/enemy guard amount/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText('120 / 120')).toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByText(/battle player health: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByText(/resolving turn: true/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toHaveClass(
      'battle-red-effect--player-to-enemy'
    );

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 100/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText(/resolving turn: false/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();
    expect(screen.getByText('Hellcrown Reaper Turn')).toBeInTheDocument();
    expect(screen.getByLabelText(/battle turn actor/i)).toHaveAttribute(
      'src',
      expect.stringContaining('HR.png')
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();
    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText(/enemy guard: 25/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enemy guard shield/i)).toHaveAttribute('data-icon', 'shield');
    expect(screen.getByLabelText(/enemy guard shield/i)).toHaveClass('battle-guard-shield');
    expect(screen.getByLabelText(/enemy guard shield/i)).toHaveStyle({ opacity: '0.6' });
    expect(screen.getByLabelText(/enemy guard amount/i)).toHaveTextContent('25');
    expect(screen.getByLabelText(/enemy guard amount/i)).toHaveClass('battle-guard-amount');
    expect(screen.getByLabelText(/enemy guard amount/i).parentElement).toContainElement(
      screen.getByLabelText(/enemy guard shield/i)
    );
    expect(screen.getByLabelText(/enemy guard amount/i).parentElement?.parentElement).toHaveClass(
      'battle-actor-image--enemy'
    );
    expect(screen.queryByLabelText(/player guard shield/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/player guard amount/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText(/resolving turn: true/i)).toBeInTheDocument();
    const enemyGuardAnimation = screen.getByLabelText(/blue guard animation/i);
    expect(enemyGuardAnimation).toHaveClass('battle-radiating-effect--enemy');
    expect(enemyGuardAnimation.parentElement).toHaveAttribute(
      'aria-label',
      'Battle enemy panel'
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByLabelText(/blue guard animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByText('Red Turn')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player guard: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/player guard shield/i)).toHaveAttribute('data-icon', 'shield');
    expect(screen.getByLabelText(/player guard shield/i)).toHaveClass('battle-guard-shield');
    expect(screen.getByLabelText(/player guard shield/i)).toHaveStyle({ opacity: '0.6' });
    expect(screen.getByLabelText(/player guard amount/i)).toHaveTextContent('5');
    expect(screen.getByLabelText(/player guard amount/i)).toHaveClass('battle-guard-amount');
    expect(screen.getByLabelText(/player guard amount/i).parentElement).toContainElement(
      screen.getByLabelText(/player guard shield/i)
    );
    expect(screen.getByLabelText(/player guard amount/i).parentElement?.parentElement).toHaveClass(
      'battle-actor-image--player'
    );
    expect(screen.queryByLabelText(/enemy guard shield/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/enemy guard amount/i)).not.toBeInTheDocument();
    const playerGuardAnimation = screen.getByLabelText(/blue guard animation/i);
    expect(playerGuardAnimation).toHaveClass('battle-radiating-effect--player');
    expect(playerGuardAnimation.parentElement).toHaveAttribute(
      'aria-label',
      'Battle player panel'
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  });

  test('plays Green reduction after Red damage without overlapping effects', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const greenBattleSetup = createBattleSetup();
    greenBattleSetup.activeBattle = {
      ...greenBattleSetup.activeBattle,
      enemyCurrentHealth: 40,
      enemyId: 'boneveil-acolyte',
      level: 1,
    };
    renderBattleFlow(['/battle'], greenBattleSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle enemy health: 40/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/green reduction animation/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 25/i)).toBeInTheDocument();
    const enemyGreenAnimation = screen.getByLabelText(/green reduction animation/i);
    expect(enemyGreenAnimation).toHaveClass('battle-radiating-effect--enemy');
    expect(enemyGreenAnimation.parentElement).toHaveAttribute(
      'aria-label',
      'Battle enemy panel'
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByLabelText(/green reduction animation/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByLabelText(/green reduction animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText('Boneveil Acolyte Turn')).toBeInTheDocument();
  });

  test('places enemy-turn Green reduction behind the defending player', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.2);
    const greenBattleSetup = createBattleSetup();
    greenBattleSetup.activeBattle.currentBattleActor = 'enemy';
    greenBattleSetup.players[0].currentHealth = 100;
    greenBattleSetup.players[0].spellSlots[1] = {
      ...greenBattleSetup.players[0].spellSlots[1],
      tokens: Array.from({ length: 4 }, (_, index) => ({
        committed: true,
        id: `player-1-green-${index + 1}`,
        type: 'green',
      })),
    };
    renderBattleFlow(['/battle'], greenBattleSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle player health: 100/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/green reduction animation/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle player health: 90/i)).toBeInTheDocument();
    const playerGreenAnimation = screen.getByLabelText(/green reduction animation/i);
    expect(playerGreenAnimation).toHaveClass('battle-radiating-effect--player');
    expect(playerGreenAnimation.parentElement).toHaveAttribute(
      'aria-label',
      'Battle player panel'
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  });

  test('plays Orange counter last and travels from the opponent in both directions', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.2).mockReturnValueOnce(0);
    const orangeBattleSetup = createBattleSetup();
    orangeBattleSetup.activeBattle = {
      ...orangeBattleSetup.activeBattle,
      enemyCurrentHealth: 40,
      enemyId: 'vilewhisker-rat',
      level: 1,
    };
    orangeBattleSetup.players[0].spellSlots[0] = {
      ...orangeBattleSetup.players[0].spellSlots[0],
      tokens: [{ committed: true, id: 'player-1-orange-1', type: 'orange' }],
    };
    renderBattleFlow(['/battle'], orangeBattleSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle player health: 10/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/orange counter animation/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByLabelText(/blue guard animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle player health: 10/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/orange counter animation/i)).toHaveClass(
      'battle-orange-effect--enemy-to-player'
    );

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(screen.getByLabelText(/orange counter animation/i)).toBeInTheDocument();
    expect(screen.getByText(/battle player health: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByLabelText(/orange counter animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle player health: 5/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle enemy health: 40/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/orange counter animation/i)).toHaveClass(
      'battle-orange-effect--player-to-enemy'
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle enemy health: 35/i)).toBeInTheDocument();
  });

  test('automatically resolves a player win without starting another battle transition', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const winningBattleSetup = createBattleSetup();
    winningBattleSetup.activeBattle = {
      ...winningBattleSetup.activeBattle,
      enemyCurrentHealth: 15,
      enemyId: 'boneveil-acolyte',
      level: 1,
    };
    renderBattleFlow(['/battle'], winningBattleSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle enemy health: 15/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: active/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/green reduction animation/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 0/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/green reduction animation/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getAllByRole('button', { name: /^choose$/i })).toHaveLength(1);
    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/green reduction animation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /roll dice/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^choose$/i }));

    expect(screen.getByRole('heading', { name: /assign reward/i })).toBeInTheDocument();
    expect(screen.getByText(/current player: player-1/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
  });

  test('automatically resolves a player loss without starting another battle transition', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.2);
    const losingBattleSetup = createBattleSetup();
    losingBattleSetup.activeBattle = {
      ...losingBattleSetup.activeBattle,
      enemyCurrentHealth: 40,
      enemyId: 'vilewhisker-rat',
      level: 1,
    };
    losingBattleSetup.players[0].currentHealth = 5;
    renderBattleFlow(['/battle'], losingBattleSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle player health: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: active/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle lost/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/orange counter animation/i)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByLabelText(/blue guard animation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/battle player health: 5/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/orange counter animation/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle lost/i })).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/battle player health: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: lost/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: player/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog', { name: /battle lost/i })).getAllByTestId(
        'death-result-token-row'
      )
    ).toHaveLength(1);
    expect(screen.queryByLabelText(/orange counter animation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /respawn/i }));

    expect(screen.getByText(/current player: player-2/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: none/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 position: 0,29/i)).toBeInTheDocument();
  });

  test('automatically rolls a lethal enemy turn into the existing loss flow once', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.2);
    const enemyTurnSetup = createBattleSetup();
    enemyTurnSetup.activeBattle.currentBattleActor = 'enemy';
    renderBattleFlow(['/battle'], enemyTurnSetup);

    expect(screen.getByText('Hellcrown Reaper Turn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(randomSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /battle turn/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(randomSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle player health: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: active/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle lost/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(randomSpy).toHaveBeenCalledTimes(4);
    expect(screen.getByText(/battle player health: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: lost/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /battle turn/i })).not.toBeInTheDocument();
  });
});
