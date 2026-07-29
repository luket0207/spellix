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
      <p>{`Ice Beam freeze active: ${activeBattle?.freezeAppliedByIceBeamThisTurn ?? false}`}</p>
      <p>{`Battle potion used: ${activeBattle?.playerPotionUsedThisTurn ?? false}`}</p>
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
      <p>{`Player 1 died last turn: ${playerOne.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Player 1 next forced roll: ${playerOne.nextForcedRoll?.value ?? 'none'}`}</p>
      <p>{`Player 1 active potion: ${playerOne.activePotion?.id ?? 'none'}`}</p>
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

  test('groups the battle title and fixed-height potion bar in one wooden panel', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');
    const panelRule = stylesheet.match(
      /\.battle-title-potions-panel\s*\{([^}]*)\}/
    )?.[1];
    const titleRule = stylesheet.match(/\.battle-title\s*\{([^}]*)\}/)?.[1];
    const potionBarRule = stylesheet.match(
      /\.battle-potions-bar\s*\{([^}]*)\}/
    )?.[1];
    const emptyTextRule = stylesheet.match(
      /\.battle-potions-empty-text\s*\{([^}]*)\}/
    )?.[1];

    renderBattleFlow();

    const panel = document.querySelector('.battle-title-potions-panel');
    const title = screen.getByRole('heading', {
      name: 'Hellcrown Reaper Battle',
    });
    const potionBar = document.querySelector('.battle-potions-bar');
    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });

    expect(panel.firstElementChild).toBe(title);
    expect(title.nextElementSibling).toBe(potionBar);
    expect(potionBar).toContainElement(potionSection);
    expect(
      within(potionBar).getByText(
        'You have no battle potions at the moment'
      )
    ).toHaveClass('battle-potions-empty-text', 'language-en');
    expect(panel.querySelector('ul, li')).toBeNull();

    expect(panelRule).toMatch(
      /background-image:\s*url\('\.\.\/images\/misc\/modalBackground\.png'\)/
    );
    expect(panelRule).toMatch(/background-size:\s*cover/);
    expect(panelRule).toMatch(/box-sizing:\s*border-box/);
    expect(panelRule).toMatch(/margin:\s*16px auto 0/);
    expect(panelRule).toMatch(/padding:\s*40px 40px 20px/);
    expect(panelRule).toMatch(/width:\s*580px/);
    expect(titleRule).toMatch(/color:\s*#F5FA00/i);
    expect(titleRule).toMatch(/font-size:\s*32px/);
    expect(titleRule).toMatch(/font-weight:\s*700/);
    expect(titleRule).toMatch(/margin:\s*0 auto 24px/);
    expect(titleRule).toMatch(/max-width:\s*500px/);
    expect(titleRule).toMatch(/text-align:\s*center/);
    expect(potionBarRule).toMatch(/align-items:\s*center/);
    expect(potionBarRule).toMatch(/box-sizing:\s*border-box/);
    expect(potionBarRule).toMatch(/display:\s*flex/);
    expect(potionBarRule).toMatch(/height:\s*170px/);
    expect(potionBarRule).toMatch(/justify-content:\s*center/);
    expect(potionBarRule).toMatch(/padding:\s*20px 0/);
    expect(emptyTextRule).toMatch(/color:\s*#F5FA00/i);
    expect(emptyTextRule).toMatch(/margin:\s*0/);
    expect(emptyTextRule).toMatch(/text-align:\s*center/);
  });

  test('bottom-aligns the transparent fixed-width dice between both battle actors', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');
    const battleDisplayRule = stylesheet.match(
      /\.battle-display\s*\{([^}]*)\}/
    )?.[1];
    const battleDiceRule = stylesheet.match(/\.battle-dice\s*\{([^}]*)\}/)?.[1];
    const hiddenDiceRule = stylesheet.match(
      /\.battle-dice--hidden\s*\{([^}]*)\}/
    )?.[1];

    renderBattleFlow();

    const battleDisplay = document.querySelector('.battle-display');
    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const dicePanel = document.querySelector('.battle-dice');
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(battleDisplay.children).toHaveLength(3);
    expect(battleDisplay.children[0]).toBe(playerPanel);
    expect(battleDisplay.children[1]).toBe(dicePanel);
    expect(battleDisplay.children[2]).toBe(enemyPanel);
    expect(dicePanel).toContainElement(screen.getByLabelText(/dice roller/i));
    expect(dicePanel.querySelector('ul, li')).toBeNull();
    expect(battleDisplayRule).toMatch(/display:\s*grid/);
    expect(battleDisplayRule).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\) auto minmax\(0,\s*1fr\)/
    );
    expect(battleDisplayRule).toMatch(/align-items:\s*end/);
    expect(battleDisplayRule).toMatch(/margin-bottom:\s*60px/);
    expect(battleDiceRule).toMatch(/width:\s*300px/);
    expect(battleDiceRule).not.toMatch(/background(?:-color)?:/);
    expect(battleDiceRule).toMatch(/opacity:\s*1/);
    expect(battleDiceRule).toMatch(/transition:\s*opacity 0\.35s ease/);
    expect(hiddenDiceRule).toMatch(/opacity:\s*0/);
    expect(hiddenDiceRule).toMatch(/pointer-events:\s*none/);
    expect(hiddenDiceRule).not.toMatch(/display:\s*none/);
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*600px\)\s*\{[^}]*\.battle-display\s*\{[^}]*column-gap:\s*8px;/s
    );
  });

  test('keeps the result visible for two seconds before fading into battle effects', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderBattleFlow();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const dicePanel = document.querySelector('.battle-dice');
    const rollButton = screen.getByRole('button', { name: /roll dice/i });

    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
    fireEvent.click(rollButton);
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(dicePanel.querySelector('.dice-roll-result')).toHaveClass(
      'dice-roll-result--visible'
    );
    expect(dicePanel.querySelector('.dice-roll-result')).toHaveTextContent('1');
    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
    expect(rollButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(dicePanel.querySelector('.dice-roll-result')).toHaveClass(
      'dice-roll-result--visible'
    );
    expect(screen.queryByLabelText(/red damage animation/i)).not.toBeInTheDocument();
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
    expect(rollButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByLabelText(/red damage animation/i)).toBeInTheDocument();
    expect(dicePanel).toHaveClass('battle-dice--hidden');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/resolving turn: false/i)).toBeInTheDocument();
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
  });

  test('restores the dice only after a freeze-check result sequence finishes', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const frozenPlayerSetup = createBattleSetup();

    frozenPlayerSetup.activeBattle.playerFrozen = true;
    frozenPlayerSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
    ];
    renderBattleFlow(['/battle'], frozenPlayerSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const dicePanel = document.querySelector('.battle-dice');
    const potionUseButton = screen.getByRole('button', { name: 'Use' });

    expect(potionUseButton).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player frozen: true/i)).toBeInTheDocument();
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
    expect(potionUseButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(screen.getByText(/player frozen: true/i)).toBeInTheDocument();
    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
    expect(potionUseButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByText(/player frozen: false/i)).toBeInTheDocument();
    expect(dicePanel).toHaveClass('battle-dice--hidden');
    expect(potionUseButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(349);
    });

    expect(dicePanel).toHaveClass('battle-dice--hidden');
    expect(potionUseButton).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(dicePanel).not.toHaveClass('battle-dice--hidden');
  });

  test('does not restore the dice when battle effects finish in a reward state', () => {
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

    expect(document.querySelector('.battle-dice')).not.toHaveClass(
      'battle-dice--hidden'
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(document.querySelector('.battle-dice')).toHaveClass(
      'battle-dice--hidden'
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();
    expect(document.querySelector('.battle-dice')).not.toBeInTheDocument();
  });

  test('localizes and positions the frozen prompt above the battle dice', () => {
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');
    const battleDiceRule = stylesheet.match(/\.battle-dice\s*\{([^}]*)\}/)?.[1];
    const promptRule = stylesheet.match(
      /\.battle-unfreeze-prompt\s*\{([^}]*)\}/
    )?.[1];
    const frozenPlayerSetup = createBattleSetup();

    frozenPlayerSetup.activeBattle.playerFrozen = true;
    const { unmount } = renderBattleFlow(['/battle'], frozenPlayerSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const englishPrompt = screen.getByText('Roll even to unfreeze');
    const dicePanel = document.querySelector('.battle-dice');

    expect(englishPrompt).toHaveClass(
      'battle-unfreeze-prompt',
      'language-en'
    );
    expect(dicePanel).toContainElement(englishPrompt);
    expect(dicePanel.querySelector('ul, li')).toBeNull();
    expect(screen.queryByText('Roll to see if you unfreeze')).not.toBeInTheDocument();
    expect(battleDiceRule).toMatch(/position:\s*relative/);
    expect(promptRule).toMatch(/position:\s*absolute/);
    expect(promptRule).toMatch(/bottom:\s*calc\(100% \+ 40px\)/);
    expect(promptRule).toMatch(/left:\s*50%/);
    expect(promptRule).toMatch(/transform:\s*translateX\(-50%\)/);
    expect(promptRule).toMatch(/max-width:\s*400px/);
    expect(promptRule).toMatch(/background-color:\s*lightblue/);
    expect(promptRule).toMatch(/color:\s*#000000/i);
    expect(promptRule).toMatch(/border-radius:\s*12px/);
    expect(promptRule).toMatch(/text-align:\s*center/);

    unmount();

    const japaneseFrozenPlayerSetup = createBattleSetup();

    japaneseFrozenPlayerSetup.activeBattle.playerFrozen = true;
    japaneseFrozenPlayerSetup.players[0].language = 'jp';
    renderBattleFlow(['/battle'], japaneseFrozenPlayerSetup);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(
      screen.getByText(
        '\u51cd\u7d50\u72b6\u614b\u3092\u89e3\u9664\u3059\u308b\u306b\u306f\u3001\u5076\u6570\u3092\u51fa\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
      )
    ).toHaveClass('battle-unfreeze-prompt', 'language-jp');
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

  test('localizes the empty battle potion bar for Japanese players', () => {
    const setup = createBattleSetup();

    setup.players[0].language = 'jp';

    renderBattleFlow(['/battle'], setup);

    expect(
      screen.getByText(
        '\u73fe\u5728\u3001\u30d0\u30c8\u30eb\u7528\u30dd\u30fc\u30b7\u30e7\u30f3\u3092\u6301\u3063\u3066\u3044\u307e\u305b\u3093\u3002'
      )
    ).toHaveClass('battle-potions-empty-text', 'language-jp');
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
    const potionBar = document.querySelector('.battle-potions-bar');
    const titlePanel = document.querySelector('.battle-title-potions-panel');
    const dicePanel = document.querySelector('.battle-dice');

    expect(titlePanel).toContainElement(potionBar);
    expect(potionBar).toContainElement(potionSection);
    expect(dicePanel).not.toContainElement(potionSection);
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

    const healingAnimation = screen.getByLabelText('Healing potion animation');
    const battlePlayerImage = screen.getByRole('img', {
      name: 'Battle player piece',
    });

    expect(screen.getByText('Battle player health: 60')).toBeInTheDocument();
    expect(healingAnimation).toHaveAttribute('data-icon', 'flask');
    expect(healingAnimation).toHaveClass('healing-potion-animation');
    expect(healingAnimation.parentElement).toContainElement(battlePlayerImage);
    expect(screen.getByText('Player 1 potions: roll-choice,copy-and-paste,bridge-builder')).toBeInTheDocument();
    expect(within(potionSection).queryByText('First Aid')).not.toBeInTheDocument();
    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeDisabled();

    fireEvent.animationEnd(healingAnimation);
    expect(screen.queryByLabelText('Healing potion animation')).not.toBeInTheDocument();

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

  test('keeps the potion bar mounted when the last Battle potion is consumed', () => {
    const setup = createBattleSetup();

    setup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
    ];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionBar = document.querySelector('.battle-potions-bar');
    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });

    expect(within(potionSection).getByText('First Aid')).toBeInTheDocument();
    expect(
      within(potionBar).queryByText(
        'You have no battle potions at the moment'
      )
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(potionSection).getByRole('button', { name: 'Use' })
    );
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(document.querySelector('.battle-potions-bar')).toBe(potionBar);
    expect(screen.getByRole('region', { name: /battle potions/i })).toBe(
      potionSection
    );
    expect(
      within(potionBar).getByText(
        'You have no battle potions at the moment'
      )
    ).toBeInTheDocument();
    expect(potionBar.querySelector('ul, li')).toBeNull();
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

  test('uses Charger to charge every player column until the current turn ends', () => {
    const setup = createBattleSetup();
    const charger = POTION_DEFINITIONS.find(({ id }) => id === 'charger');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.players[0].potions = [charger, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const chargerCard = within(potionSection)
      .getByText('Charger')
      .closest('.battle-potion-card');
    const playerPanel = screen.getByLabelText(/battle player panel/i);

    expect(
      within(chargerCard).getByRole('button', { name: 'Use' })
    ).toBeEnabled();

    fireEvent.click(
      within(chargerCard).getByRole('button', { name: 'Use' })
    );
    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(within(confirmation).getByText(/Charger/)).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Player 1 potions: first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Player charged: true')).toBeInTheDocument();
    expect(
      playerPanel.querySelectorAll('.committed-spell-slot-column--yellow-charged')
    ).toHaveLength(6);

    fireEvent.click(screen.getByRole('button', { name: 'Force 1' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Battle enemy health: 120')).toBeInTheDocument();
    expect(screen.getByText('Player charged: true')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Battle enemy health: 90')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Player charged: false')).toBeInTheDocument();
    expect(
      playerPanel.querySelectorAll('.committed-spell-slot-column--yellow-charged')
    ).toHaveLength(0);
  });

  test('keeps Charger visible but unusable when player columns are already charged', () => {
    const setup = createBattleSetup();
    const charger = POTION_DEFINITIONS.find(({ id }) => id === 'charger');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.activeBattle.playerCharged = true;
    setup.players[0].potions = [charger, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const chargerCard = within(potionSection)
      .getByText('Charger')
      .closest('.battle-potion-card');
    const firstAidCard = within(potionSection)
      .getByText('First Aid')
      .closest('.battle-potion-card');
    const chargerUseButton = within(chargerCard).getByRole('button', {
      name: 'Use',
    });

    expect(chargerUseButton).toBeDisabled();
    expect(
      within(firstAidCard).getByRole('button', { name: 'Use' })
    ).toBeEnabled();

    fireEvent.click(chargerUseButton);

    expect(
      screen.queryByRole('dialog', { name: /use potion confirmation/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: charger,first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: false')).toBeInTheDocument();
    expect(screen.getByText('Player charged: true')).toBeInTheDocument();
  });

  test('uses Cosmic Intervention after its bolt animation and locks battle controls', () => {
    const setup = createBattleSetup();
    const cosmicIntervention = POTION_DEFINITIONS.find(
      ({ id }) => id === 'cosmic-intervention'
    );
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');

    setup.activeBattle.enemyGuard = 15;
    setup.players[0].potions = [cosmicIntervention, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const cosmicCard = within(potionSection)
      .getByText('Cosmic Intervention')
      .closest('.battle-potion-card');

    fireEvent.click(
      within(cosmicCard).getByRole('button', { name: 'Use' })
    );
    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText('Deal 10 damage to your opponent')
    ).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    const bolt = screen.getByLabelText('Cosmic Intervention animation');
    const enemyImage = screen.getByRole('img', { name: /battle enemy/i });
    const boltRule = stylesheet.match(
      /\.cosmic-intervention-bolt\s*\{([^}]*)\}/
    )?.[1];
    const boltIconRule = stylesheet.match(
      /\.battle-actor-image\s+svg\.cosmic-intervention-bolt\s*\{([^}]*)\}/
    )?.[1];

    expect(screen.getByText('Player 1 potions: first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Enemy guard: 15')).toBeInTheDocument();
    expect(screen.getByText('Battle enemy health: 120')).toBeInTheDocument();
    expect(bolt.tagName).toBe('svg');
    expect(bolt).toHaveAttribute('data-icon', 'bolt');
    expect(bolt.parentElement).toContainElement(enemyImage);
    expect(boltRule).toMatch(/animation:\s*cosmic-intervention-bolt 1\.5s linear forwards/);
    expect(boltRule).toMatch(/color:\s*#F5FA00/i);
    expect(boltRule).toMatch(/left:\s*50%/);
    expect(boltRule).toMatch(/top:\s*50%/);
    expect(boltRule).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
    expect(boltIconRule).toMatch(/height:\s*100%/);
    expect(boltIconRule).toMatch(/width:\s*auto/);
    expect(stylesheet).toMatch(
      /\.battle-actor-image\s*{[^}]*height:\s*150px;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-player-piece,\s*\.battle-enemy-piece\s*{[^}]*height:\s*100%;/s
    );
    expect(stylesheet).toMatch(
      /@keyframes cosmic-intervention-bolt\s*\{[\s\S]*66%\s*\{[^}]*opacity:\s*1;[^}]*\}[\s\S]*100%\s*\{[^}]*opacity:\s*0;/s
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    within(potionSection)
      .getAllByRole('button', { name: 'Use' })
      .forEach((button) => expect(button).toBeDisabled());
    document
      .querySelectorAll('.battle-debug-controls button')
      .forEach((button) => expect(button).toBeDisabled());

    fireEvent.animationEnd(bolt);

    expect(
      screen.queryByLabelText('Cosmic Intervention animation')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Enemy guard: 5')).toBeInTheDocument();
    expect(screen.getByText('Battle enemy health: 120')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /remove 5 health/i })).toBeEnabled();
  });

  test.each([
    [5, 115],
    [0, 110],
  ])(
    'applies Cosmic Intervention through %i enemy Guard before health',
    (startingGuard, expectedHealth) => {
      const setup = createBattleSetup();
      const cosmicIntervention = POTION_DEFINITIONS.find(
        ({ id }) => id === 'cosmic-intervention'
      );

      setup.activeBattle.enemyGuard = startingGuard;
      setup.players[0].potions = [cosmicIntervention];

      renderBattleFlow(['/battle'], setup);
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Use' }));
      fireEvent.click(
        within(
          screen.getByRole('dialog', { name: /use potion confirmation/i })
        ).getByRole('button', { name: 'Yes' })
      );

      expect(screen.getByText(`Enemy guard: ${startingGuard}`)).toBeInTheDocument();
      expect(screen.getByText('Battle enemy health: 120')).toBeInTheDocument();

      fireEvent.animationEnd(
        screen.getByLabelText('Cosmic Intervention animation')
      );

      expect(screen.getByText('Enemy guard: 0')).toBeInTheDocument();
      expect(
        screen.getByText(`Battle enemy health: ${expectedHealth}`)
      ).toBeInTheDocument();
      expect(screen.getByText('Battle phase: active')).toBeInTheDocument();
    }
  );

  test('uses the normal battle win flow when Cosmic Intervention is lethal', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const setup = createBattleSetup();
    const cosmicIntervention = POTION_DEFINITIONS.find(
      ({ id }) => id === 'cosmic-intervention'
    );

    setup.activeBattle.enemyCurrentHealth = 10;
    setup.players[0].potions = [cosmicIntervention];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(screen.getByText('Battle enemy health: 10')).toBeInTheDocument();
    fireEvent.animationEnd(
      screen.getByLabelText('Cosmic Intervention animation')
    );

    expect(screen.getByText('Battle enemy health: 0')).toBeInTheDocument();
    expect(screen.getByText('Battle phase: reward')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^choose$/i })).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: /roll dice/i })
    ).not.toBeInTheDocument();
  });

  test('keeps Shields Down visible but unusable when the enemy has no Guard', () => {
    const setup = createBattleSetup();
    const shieldsDown = POTION_DEFINITIONS.find(
      ({ id }) => id === 'shields-down'
    );
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.players[0].potions = [shieldsDown, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const shieldsDownCard = within(potionSection)
      .getByText('Shields Down')
      .closest('.battle-potion-card');
    const firstAidCard = within(potionSection)
      .getByText('First Aid')
      .closest('.battle-potion-card');
    const shieldsDownUseButton = within(shieldsDownCard).getByRole('button', {
      name: 'Use',
    });

    expect(shieldsDownUseButton).toBeDisabled();
    expect(
      within(firstAidCard).getByRole('button', { name: 'Use' })
    ).toBeEnabled();

    fireEvent.click(shieldsDownUseButton);

    expect(
      screen.queryByRole('dialog', { name: /use potion confirmation/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Player 1 potions: shields-down,first-aid')
    ).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: false')).toBeInTheDocument();
    expect(screen.getByText('Enemy guard: 0')).toBeInTheDocument();
  });

  test('removes all enemy Guard after the Shields Down gavel animation', () => {
    const setup = createBattleSetup();
    const shieldsDown = POTION_DEFINITIONS.find(
      ({ id }) => id === 'shields-down'
    );
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');
    const stylesheet = readFileSync(`${__dirname}/BattlePage.css`, 'utf8');

    setup.activeBattle.enemyCurrentHealth = 10;
    setup.activeBattle.enemyGuard = 50;
    setup.players[0].potions = [shieldsDown, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const shieldsDownCard = within(potionSection)
      .getByText('Shields Down')
      .closest('.battle-potion-card');

    fireEvent.click(
      within(shieldsDownCard).getByRole('button', { name: 'Use' })
    );
    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText(
        'Remove all guard from your opponent this turn'
      )
    ).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    const gavel = screen.getByLabelText('Shields Down animation');
    const enemyImage = screen.getByRole('img', { name: /battle enemy/i });
    const gavelRule = stylesheet.match(
      /\.shields-down-gavel\s*\{([^}]*)\}/
    )?.[1];
    const gavelIconRule = stylesheet.match(
      /\.battle-actor-image\s+svg\.shields-down-gavel\s*\{([^}]*)\}/
    )?.[1];

    expect(screen.getByText('Player 1 potions: first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Enemy guard: 50')).toBeInTheDocument();
    expect(screen.getByText('Battle enemy health: 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Enemy guard shield')).toBeInTheDocument();
    expect(gavel).toHaveAttribute('data-icon', 'gavel');
    expect(gavel.parentElement).toContainElement(enemyImage);
    expect(gavelRule).toMatch(
      /animation:\s*shields-down-gavel 1\.5s ease-in-out forwards/
    );
    expect(gavelRule).toMatch(/color:\s*#F5FA00/i);
    expect(gavelRule).toMatch(/left:\s*50%/);
    expect(gavelRule).toMatch(/top:\s*0/);
    expect(gavelIconRule).toMatch(/height:\s*100px/);
    expect(gavelIconRule).toMatch(/width:\s*auto/);
    expect(stylesheet).toMatch(
      /@keyframes shields-down-gavel\s*\{[\s\S]*66%\s*\{[^}]*opacity:\s*1;[^}]*top:\s*50%;[^}]*\}[\s\S]*76%\s*\{[^}]*opacity:\s*0\.15;[^}]*\}[\s\S]*86%\s*\{[^}]*opacity:\s*1;[^}]*\}[\s\S]*94%\s*\{[^}]*opacity:\s*0\.15;[^}]*\}[\s\S]*100%\s*\{[^}]*opacity:\s*0;/s
    );
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    within(potionSection)
      .getAllByRole('button', { name: 'Use' })
      .forEach((button) => expect(button).toBeDisabled());
    document
      .querySelectorAll('.battle-debug-controls button')
      .forEach((button) => expect(button).toBeDisabled());

    fireEvent.animationEnd(gavel);

    expect(
      screen.queryByLabelText('Shields Down animation')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Enemy guard shield')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Enemy guard: 0')).toBeInTheDocument();
    expect(screen.getByText('Battle enemy health: 10')).toBeInTheDocument();
    expect(screen.getByText('Battle phase: active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /remove 5 health/i })).toBeEnabled();
  });

  test('keeps Thaw visible but unusable while the player is not frozen', () => {
    const setup = createBattleSetup();
    const thaw = POTION_DEFINITIONS.find(({ id }) => id === 'thaw');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.players[0].potions = [thaw, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const thawCard = within(potionSection)
      .getByText('Thaw')
      .closest('.battle-potion-card');
    const firstAidCard = within(potionSection)
      .getByText('First Aid')
      .closest('.battle-potion-card');
    const thawUseButton = within(thawCard).getByRole('button', {
      name: 'Use',
    });

    expect(thawUseButton).toBeDisabled();
    expect(
      within(firstAidCard).getByRole('button', { name: 'Use' })
    ).toBeEnabled();

    fireEvent.click(thawUseButton);

    expect(
      screen.queryByRole('dialog', { name: /use potion confirmation/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Player 1 potions: thaw,first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: false')).toBeInTheDocument();
    expect(screen.getByText('Player frozen: false')).toBeInTheDocument();
  });

  test('uses Thaw before the freeze check and allows a normal attack roll', () => {
    const setup = createBattleSetup();
    const thaw = POTION_DEFINITIONS.find(({ id }) => id === 'thaw');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.activeBattle.playerFrozen = true;
    setup.players[0].potions = [thaw, firstAid];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', {
      name: /battle potions/i,
    });
    const thawCard = within(potionSection)
      .getByText('Thaw')
      .closest('.battle-potion-card');
    const thawUseButton = within(thawCard).getByRole('button', {
      name: 'Use',
    });

    expect(thawUseButton).toBeEnabled();
    expect(screen.getByText(/roll even to unfreeze/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Player frozen')).toHaveClass(
      'battle-freeze-indicator--enter'
    );

    fireEvent.click(thawUseButton);
    let confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText('Auto unfreeze yourself')
    ).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'No' }));

    expect(screen.getByText('Player 1 potions: thaw,first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: false')).toBeInTheDocument();
    expect(screen.getByText('Player frozen: true')).toBeInTheDocument();
    expect(screen.getByText(/roll even to unfreeze/i)).toBeInTheDocument();

    fireEvent.click(
      within(thawCard).getByRole('button', { name: 'Use' })
    );
    confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Yes' }));

    expect(screen.getByText('Player 1 potions: first-aid')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: true')).toBeInTheDocument();
    expect(screen.getByText('Player frozen: false')).toBeInTheDocument();
    expect(screen.getByText('Battle actor: player')).toBeInTheDocument();
    expect(
      screen.queryByText(/roll even to unfreeze/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Player frozen')).toHaveClass(
      'battle-freeze-indicator--exit'
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.queryByLabelText('Player frozen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Force 2' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Player guard: 5')).toBeInTheDocument();
    expect(screen.getByLabelText(/blue guard animation/i)).toBeInTheDocument();
  });

  test('uses Ice Beam to freeze the enemy without consuming a redundant freeze token', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const setup = createBattleSetup();
    const iceBeam = POTION_DEFINITIONS.find(({ id }) => id === 'ice-beam');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    setup.players[0].potions = [iceBeam, firstAid];
    setup.players[0].spellSlots[2] = {
      ...setup.players[0].spellSlots[2],
      tokens: [
        {
          committed: true,
          id: 'player-1-light-blue-1',
          type: 'light-blue',
        },
      ],
    };
    setup.activeBattle.playerFreezeUses = [0, 0, 1, 0, 0, 0];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const potionSection = screen.getByRole('region', { name: /battle potions/i });
    const useButtons = within(potionSection).getAllByRole('button', { name: 'Use' });

    expect(within(potionSection).getByText('Ice Beam')).toBeInTheDocument();
    expect(useButtons).toHaveLength(2);

    fireEvent.click(useButtons[0]);
    const cancelledConfirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(within(cancelledConfirmation).getByText('Freeze your opponent')).toBeInTheDocument();
    fireEvent.click(within(cancelledConfirmation).getByRole('button', { name: 'No' }));

    expect(screen.getByText('Player 1 potions: ice-beam,first-aid')).toBeInTheDocument();
    expect(screen.getByText('Enemy frozen: false')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: false')).toBeInTheDocument();
    expect(screen.queryByLabelText('Enemy frozen')).not.toBeInTheDocument();
    within(potionSection)
      .getAllByRole('button', { name: 'Use' })
      .forEach((button) => expect(button).toBeEnabled());

    fireEvent.click(
      within(potionSection).getAllByRole('button', { name: 'Use' })[0]
    );
    const confirmedDialog = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });
    fireEvent.click(within(confirmedDialog).getByRole('button', { name: 'Yes' }));

    const enemyFrozenOverlay = screen.getByLabelText('Enemy frozen');
    const enemyImage = screen.getByRole('img', { name: /battle enemy/i });

    expect(screen.getByText('Player 1 potions: first-aid')).toBeInTheDocument();
    expect(screen.getByText('Enemy frozen: true')).toBeInTheDocument();
    expect(screen.getByText('Ice Beam freeze active: true')).toBeInTheDocument();
    expect(screen.getByText('Battle potion used: true')).toBeInTheDocument();
    expect(enemyFrozenOverlay).toHaveAttribute('data-icon', 'snowflake');
    expect(enemyFrozenOverlay).toHaveClass('battle-freeze-indicator--enter');
    expect(enemyFrozenOverlay.parentElement).toContainElement(enemyImage);
    expect(
      within(potionSection).getByRole('button', { name: 'Use' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Force 3' }));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Enemy frozen: true')).toBeInTheDocument();
    expect(screen.getByText('Player freeze uses: 0,0,1,0,0,0')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Battle actor: enemy')).toBeInTheDocument();
    expect(screen.getByText('Ice Beam freeze active: false')).toBeInTheDocument();
    expect(screen.getByText('Enemy frozen: true')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/roll even to unfreeze/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      jest.advanceTimersByTime(2350);
    });

    expect(Math.random).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Enemy frozen: false')).toBeInTheDocument();
    expect(screen.getByText('Battle actor: player')).toBeInTheDocument();
  });

  test('activates Roll Choice in battle and forces the next player roll once', () => {
    const setup = createBattleSetup();
    const randomSpy = jest.spyOn(Math, 'random');

    setup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    ];

    renderBattleFlow(['/battle'], setup);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    const choiceModal = screen.getByRole('dialog', { name: 'Roll Choice' });

    expect(screen.getByText('Player 1 potions: roll-choice')).toBeInTheDocument();
    fireEvent.click(within(choiceModal).getByRole('button', { name: '2' }));

    expect(screen.getByText('Player 1 potions: none')).toBeInTheDocument();
    expect(screen.getByText('Player 1 next forced roll: 2')).toBeInTheDocument();
    expect(screen.getByText('Player 1 active potion: none')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
      'dice-roll-cube--face-2'
    );
    expect(randomSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('img', { name: /dice face 2/i })).toBeInTheDocument();
    expect(screen.getByText('Player 1 next forced roll: 2')).toBeInTheDocument();
    expect(randomSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Player 1 next forced roll: none')).toBeInTheDocument();
    expect(randomSpy).not.toHaveBeenCalled();
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
      jest.advanceTimersByTime(2000);
    });

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
      jest.advanceTimersByTime(2000);
    });

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

    expect(screen.getByText(/roll even to unfreeze/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Force 2' }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player frozen: true/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/player frozen: false/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/player frozen/i)).toHaveClass(
      'battle-freeze-indicator--exit'
    );
    expect(screen.queryByText(/roll even to unfreeze/i)).not.toBeInTheDocument();
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

    expect(screen.getByText(/player guard: 0/i)).toBeInTheDocument();

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

    expect(screen.getByText(/player frozen: true/i)).toBeInTheDocument();

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

    expect(screen.getByText(/roll even to unfreeze/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/enemy frozen: true/i)).toBeInTheDocument();

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

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/enemy frozen: false/i)).toBeInTheDocument();
    expect(screen.getByText(/battle actor: enemy/i)).toBeInTheDocument();
    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();
    expect(Math.random).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(349);
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

    expect(screen.getByText(/enemy guard: 0/i)).toBeInTheDocument();

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

    act(() => {
      jest.advanceTimersByTime(2000);
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

    act(() => {
      jest.advanceTimersByTime(2000);
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
    expect(screen.getByText(/player 1 died last turn: yes/i)).toBeInTheDocument();
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
    expect(screen.getByText(/player 1 died last turn: no/i)).toBeInTheDocument();
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
