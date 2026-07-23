import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../data/potions';
import { createPlayers } from '../features/gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import GameplayPage from './GameplayPage';

const mockGetAnywhereModeHighlightedNodeIds = jest.fn();
const mockGetHighlightedNodeIds = jest.fn();

jest.mock('../features/gameBoard/BoardGrid', () => ({ currentPlayerId, onSquareClick }) => (
  <div aria-label="game board">
    <p>{`Current board player: ${currentPlayerId}`}</p>
    <button type="button" onClick={() => onSquareClick({ x: 1, y: 28 })}>
      Move to square 1, 28
    </button>
  </div>
));

jest.mock('../features/gameBoard/movement', () => ({
  getAnywhereModeHighlightedNodeIds: (...args) => mockGetAnywhereModeHighlightedNodeIds(...args),
  getHighlightedNodeIds: (...args) => mockGetHighlightedNodeIds(...args),
  getMovementNodeIdFromCoordinates: (x, y) =>
    x >= 0 && x <= 1 && y >= 29 && y <= 30 ? 'start-area' : `square-${x}-${y}`,
}));

jest.mock('../features/gameBoard/board', () => ({
  assignStartingPositions: (players) =>
    players.map((player, index) => ({
      ...player,
      position: { x: index, y: 29 },
    })),
  createBoard: () => ({
    height: 0,
    squares: [],
    width: 0,
  }),
}));

function createCommittedGameplaySetup() {
  const players = createPlayers(2).map((player) => {
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));

    spellSlots[0].tokens = player.tokenBag
      .filter((token) => token.type === 'red')
      .map((token) => ({ ...token, committed: true }));
    spellSlots[1].tokens = player.tokenBag
      .filter((token) => token.type === 'blue')
      .map((token) => ({ ...token, committed: true }));

    return {
      ...player,
      hasCommittedInitialSpells: true,
      spellSlots,
      tokenBag: [],
    };
  });

  players[1] = {
    ...players[1],
    currentHealth: 15,
  };

  return {
    board: null,
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function createForcedGameplaySetup(placedTokenCount) {
  const players = createPlayers(2);
  const currentPlayer = players[0];
  const placedTokens = currentPlayer.tokenBag.slice(0, placedTokenCount);

  currentPlayer.spellSlots[0].tokens = placedTokens.slice(0, 5);
  currentPlayer.spellSlots[1].tokens = placedTokens.slice(5);
  currentPlayer.tokenBag = currentPlayer.tokenBag.slice(placedTokenCount);

  return {
    board: null,
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockGetAnywhereModeHighlightedNodeIds.mockReset();
  mockGetAnywhereModeHighlightedNodeIds.mockReturnValue(['square-1-28']);
  mockGetHighlightedNodeIds.mockReset();
  mockGetHighlightedNodeIds.mockReturnValue(['square-1-28']);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function finishDiceSequence() {
  act(() => {
    jest.advanceTimersByTime(3000);
  });
}

function renderGameplayPage() {
  return render(
    <GameSetupProvider initialGameSetup={createCommittedGameplaySetup()}>
      <GameplayPage />
    </GameSetupProvider>
  );
}

function getSpellsNotification() {
  return screen.queryByLabelText(/uncommitted tokens available/i);
}

function TokenBagStateControls() {
  const { currentPlayer, updatePlayerSpells } = useGameSetup();

  const updateCurrentPlayer = ({ spellSlots = currentPlayer.spellSlots, tokenBag }) => {
    updatePlayerSpells(currentPlayer.id, {
      hasCommittedInitialSpells: currentPlayer.hasCommittedInitialSpells,
      spellSlots,
      tokenBag,
    });
  };

  const commitFirstBagToken = () => {
    const [token, ...remainingTokenBag] = currentPlayer.tokenBag;
    const nextSpellSlots = currentPlayer.spellSlots.map((slot, index) =>
      index === 0
        ? { ...slot, tokens: [...slot.tokens, { ...token, committed: true }] }
        : slot
    );

    updateCurrentPlayer({ spellSlots: nextSpellSlots, tokenBag: remainingTokenBag });
  };

  return (
    <>
      <button type="button" onClick={commitFirstBagToken}>Commit bag token</button>
      <button
        type="button"
        onClick={() => updateCurrentPlayer({
          tokenBag: [{ committed: false, id: 'gained-token', type: 'blue' }],
        })}
      >
        Gain bag token
      </button>
      <button type="button" onClick={() => updateCurrentPlayer({ tokenBag: [] })}>
        Remove bag tokens
      </button>
    </>
  );
}

test('renders the decorative magical night sky only as gameplay background content', () => {
  renderGameplayPage();

  expect(screen.getByTestId('magical-night-sky')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByLabelText(/game board/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
});

describe('GameplayPage spell modal unsaved change behavior', () => {
  test('shows the Spells notification only for current-player token bag tokens', () => {
    const emptyBagSetup = createCommittedGameplaySetup();

    const { unmount: unmountEmptyBag } = render(
      <GameSetupProvider initialGameSetup={emptyBagSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNotification()).not.toBeInTheDocument();
    unmountEmptyBag();

    const oneTokenSetup = createCommittedGameplaySetup();
    oneTokenSetup.players[0].tokenBag = [{ committed: false, id: 'bag-token-1', type: 'red' }];

    const { unmount: unmountOneTokenBag } = render(
      <GameSetupProvider initialGameSetup={oneTokenSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getByLabelText(/uncommitted tokens available/i)).toHaveTextContent('!');
    unmountOneTokenBag();

    const multipleTokenSetup = createCommittedGameplaySetup();
    multipleTokenSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-token-1', type: 'red' },
      { committed: false, id: 'bag-token-2', type: 'blue' },
    ];

    render(
      <GameSetupProvider initialGameSetup={multipleTokenSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getAllByLabelText(/uncommitted tokens available/i)).toHaveLength(1);
  });

  test('updates the Spells notification with the active player and preserves button behavior', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'player-1-bag-token', type: 'red' },
    ];
    initialGameSetup.players[1].tokenBag = [];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(getSpellsNotification()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^spells$/i }));
    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(getSpellsNotification()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(getSpellsNotification()).toBeInTheDocument();
  });

  test('updates the Spells notification when bag tokens are committed, gained, or removed', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'uncommitted-token', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
        <TokenBagStateControls />
      </GameSetupProvider>
    );

    expect(getSpellsNotification()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /commit bag token/i }));
    expect(getSpellsNotification()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /gain bag token/i }));
    expect(getSpellsNotification()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove bag tokens/i }));
    expect(getSpellsNotification()).not.toBeInTheDocument();
  });

  test('positions a non-blocking notification over only the gameplay Spells button', () => {
    const stylesheet = readFileSync(`${__dirname}/GameplayPage.css`, 'utf8');

    expect(stylesheet).toMatch(/\.spells-button-wrapper\s*{[^}]*position:\s*relative;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*position:\s*absolute;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*top:\s*-8px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*right:\s*-8px;/s);
    expect(stylesheet).toMatch(/\.spells-button-notification\s*{[^}]*pointer-events:\s*none;/s);

    const initialGameSetup = createCommittedGameplaySetup();
    initialGameSetup.players[0].tokenBag = [
      { committed: false, id: 'bag-token-1', type: 'red' },
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    expect(screen.getByLabelText(/uncommitted tokens available/i)).toHaveClass(
      'spells-button-notification'
    );
    expect(screen.getAllByText('Spells')).toHaveLength(2);
  });

  test.each([0, 1, 6])(
    'keeps forced setup Save disabled with %i starting tokens placed',
    (placedTokenCount) => {
      render(
        <GameSetupProvider
          initialGameSetup={createForcedGameplaySetup(placedTokenCount)}
        >
          <GameplayPage />
        </GameSetupProvider>
      );

      const spellsDialog = screen.getByRole('dialog', { name: /spells/i });

      expect(within(spellsDialog).getByRole('button', { name: /^save$/i })).toBeDisabled();
      expect(
        within(spellsDialog).getByText(
          'You must place all 7 starting tokens into spell slots before rolling dice.'
        )
      ).toBeInTheDocument();
    }
  );

  test('enables forced setup Save only when all seven starting tokens are placed', () => {
    render(
      <GameSetupProvider initialGameSetup={createForcedGameplaySetup(7)}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const saveButton = within(
      screen.getByRole('dialog', { name: /spells/i })
    ).getByRole('button', { name: /^save$/i });

    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    const confirmationDialog = screen.getByRole('dialog', {
      name: /save spells confirmation/i,
    });

    expect(confirmationDialog).toBeInTheDocument();
    expect(
      within(confirmationDialog).getByText(/commit your tokens to these spell slots/i)
    ).toHaveClass('larger-text', 'language-en');
  });

  test('shows a pending turn modal before forced spell setup for the new player', () => {
    const initialGameSetup = createForcedGameplaySetup(0);

    initialGameSetup.currentTurnIndex = 1;
    initialGameSetup.pendingNextTurnModal = true;

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const turnDialog = screen.getByRole('dialog', { name: /turn change/i });

    expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /spells/i })).toBeDisabled();

    fireEvent.click(within(turnDialog).getByRole('button', { name: /^ok$/i }));

    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /spells/i })).toBeInTheDocument();
  });

  test('switches the listed gameplay labels and font classes with each player turn', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'en';
    initialGameSetup.players[1].language = 'jp';

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const gameplayPanel = screen.getByRole('region', { name: /gameplay panel/i });

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(
      within(gameplayPanel).getByText('Spells', {
        selector: '.committed-spell-slot-display-title',
      })
    ).toHaveClass('language-en');
    expect(
      within(gameplayPanel).getByRole('heading', { name: 'Potions' })
    ).toHaveClass('language-en');

    fireEvent.click(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(
      within(gameplayPanel).getByRole('button', { name: 'サイコロを振る' })
    ).toHaveClass('language-jp');
    expect(within(gameplayPanel).getByRole('button', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(
      within(gameplayPanel).getByText('呪文', {
        selector: '.committed-spell-slot-display-title',
      })
    ).toHaveClass('language-jp');
    expect(
      within(gameplayPanel).getByRole('heading', { name: 'ポーション' })
    ).toHaveClass('language-jp');
    expect(within(gameplayPanel).queryByRole('button', { name: 'Roll Dice' })).not.toBeInTheDocument();

    const japaneseTurnDialog = screen.getByRole('dialog', { name: /turn change/i });

    expect(within(japaneseTurnDialog).getByText('プレイヤー青のターン')).toHaveClass(
      'language-jp'
    );
    expect(within(japaneseTurnDialog).queryByText(/It is now/i)).not.toBeInTheDocument();

    fireEvent.click(
      within(japaneseTurnDialog).getByRole('button', {
        name: 'OK',
      })
    );
    fireEvent.click(within(gameplayPanel).getByRole('button', { name: '呪文' }));

    const spellsDialog = screen.getByRole('dialog', { name: '呪文' });

    expect(within(spellsDialog).getByRole('heading', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(within(spellsDialog).getByText('トークンバッグ')).toBeInTheDocument();
    expect(within(spellsDialog).getByRole('button', { name: 'キャンセル' })).toHaveClass(
      'language-jp'
    );
    fireEvent.click(within(spellsDialog).getByRole('button', { name: 'キャンセル' }));

    fireEvent.click(within(gameplayPanel).getByRole('button', { name: 'サイコロを振る' }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('heading', { name: 'Potions' })).toHaveClass(
      'language-en'
    );
  });

  test('uses English gameplay labels when the current player language is invalid', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'invalid';

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const gameplayPanel = screen.getByRole('region', { name: /gameplay panel/i });

    expect(within(gameplayPanel).getByRole('button', { name: 'Roll Dice' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('button', { name: 'Spells' })).toHaveClass(
      'language-en'
    );
    expect(within(gameplayPanel).getByRole('heading', { name: 'Potions' })).toHaveClass(
      'language-en'
    );
  });

  test('shows no potions for an empty collection', () => {
    renderGameplayPage();

    const potionsArea = screen.getByRole('region', { name: /potions/i });

    expect(potionsArea).toHaveTextContent('0/3');
    expect(within(potionsArea).queryByText('No potions')).not.toBeInTheDocument();
  });

  test('shows the current player potions and updates them when the turn changes', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].language = 'en';
    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    ];
    initialGameSetup.players[1].language = 'jp';
    initialGameSetup.players[1].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const firstPlayerPotions = screen.getByRole('region', { name: /potions/i });

    expect(within(firstPlayerPotions).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(firstPlayerPotions).getByText('1/3')).toBeInTheDocument();
    expect(within(firstPlayerPotions).queryByText('Rare | Both')).not.toBeInTheDocument();
    expect(
      within(firstPlayerPotions).getByRole('group', { name: /roll choice potion/i })
    ).toHaveClass('potion-icon--blue');
    expect(within(firstPlayerPotions).queryByText('Small Heal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    const secondPlayerPotions = screen.getByRole('region', { name: 'ポーション' });

    expect(within(secondPlayerPotions).getByText('小回復')).toHaveClass('language-jp');
    expect(within(secondPlayerPotions).getByText('1/3')).toBeInTheDocument();
    expect(within(secondPlayerPotions).queryByText('Common | Both')).not.toBeInTheDocument();
    expect(
      within(secondPlayerPotions).getByRole('group', { name: '小回復 potion' })
    ).toHaveAccessibleDescription('HPを30％回復する。');
    expect(within(secondPlayerPotions).queryByText('Roll Choice')).not.toBeInTheDocument();
  });

  test('confirms Board potion use and removes only the selected duplicate', () => {
    const initialGameSetup = createCommittedGameplaySetup();
    const boardPotion = POTION_DEFINITIONS.find(
      ({ id }) => id === 'copy-and-paste'
    );

    initialGameSetup.players[0].potions = [boardPotion, boardPotion];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: /potions/i });
    const useButtons = within(potionSection).getAllByRole('button', { name: 'Use' });

    expect(useButtons).toHaveLength(2);
    fireEvent.click(useButtons[1]);

    const confirmation = screen.getByRole('dialog', {
      name: /use potion confirmation/i,
    });

    expect(
      within(confirmation).getByText('Are you sure you want to use Copy and Paste?')
    ).toHaveClass('larger-text', 'language-en');
    expect(within(confirmation).getByText('Potion Description')).toBeInTheDocument();
    expect(
      within(confirmation).getByText(boardPotion.description)
    ).not.toHaveClass('larger-text');

    fireEvent.click(within(confirmation).getByRole('button', { name: 'No' }));
    expect(screen.queryByRole('dialog', { name: /use potion confirmation/i })).not.toBeInTheDocument();
    expect(within(potionSection).getAllByRole('button', { name: 'Use' })).toHaveLength(2);

    fireEvent.click(within(potionSection).getAllByRole('button', { name: 'Use' })[1]);
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: /use potion confirmation/i })
      ).getByRole('button', { name: 'Yes' })
    );

    expect(within(potionSection).getByText('1/3')).toBeInTheDocument();
    expect(within(potionSection).getAllByRole('button', { name: 'Use' })).toHaveLength(1);
    expect(initialGameSetup.players[0].currentHealth).toBe(100);
  });

  test('shows Battle and Mini potions on the board without Use controls', () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0].potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
      POTION_DEFINITIONS.find(({ id }) => id === 'bridge-builder'),
    ];

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    const potionSection = screen.getByRole('region', { name: /potions/i });

    expect(within(potionSection).getByText('First Aid')).toBeInTheDocument();
    expect(within(potionSection).getByText('Bridge Builder')).toBeInTheDocument();
    expect(within(potionSection).queryByRole('button', { name: 'Use' })).not.toBeInTheDocument();
  });

  test('locks the temporary dice modal for the full sequence and uses its result for movement', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    renderGameplayPage();

    expect(screen.queryByRole('button', { name: /force [1-6]/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    const diceDialog = screen.getByRole('dialog', { name: /dice result/i });

    expect(within(diceDialog).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('modal-overlay'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('img', { name: /dice face 4/i })).toBeInTheDocument();
    expect(screen.getByText(/dice result: 4/i)).toHaveClass('dice-roll-result--visible');
    expect(mockGetHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 },
      4,
      { blockedNodeIds: [] }
    );
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1499);
    });

    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('dialog', { name: /dice result/i })).not.toBeInTheDocument();
  });

  test('shows the current player piece in the sidebar and the next player piece in the turn-change modal', async () => {
    renderGameplayPage();

    expect(screen.getByText(/^Current board player: player-1$/i)).toBeInTheDocument();
    expect(screen.queryByText(/it is currently .* player's turn/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/current player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByLabelText(/current player piece/i)).not.toHaveClass('battle-player-piece');
    expect(screen.getByLabelText(/current player piece/i)).toHaveStyle({ height: '150px' });
    expect(screen.getByLabelText(/current player piece/i)).toHaveStyle({
      alignSelf: 'flex-start',
      width: 'auto',
    });
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100 / 100')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));

    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
    expect(screen.getByText('Blue Players Turn')).toHaveClass('language-en');
    expect(screen.queryByText(/it is now blue player's turn\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Current board player: player-2$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByLabelText(/turn change player piece/i)).not.toHaveClass(
      'battle-player-piece'
    );
    expect(screen.getByLabelText(/turn change player piece/i)).toHaveStyle({ height: '150px' });

    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

    expect(screen.getByLabelText(/current player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-blue.png')
    );
    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByText('15 / 100')).toBeInTheDocument();
  });

  test('disables save and closes immediately on cancel when no spell changes were made', async () => {
    renderGameplayPage();

    fireEvent.click(screen.getByRole('button', { name: /spells/i }));

    const spellsDialog = screen.getByRole('dialog', { name: /spells/i });

    expect(spellsDialog).toBeInTheDocument();
    expect(within(spellsDialog).getByRole('heading', { name: /^spells$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/spell player piece/i)).toHaveAttribute(
      'src',
      expect.stringContaining('m-red.png')
    );
    expect(screen.getByLabelText(/spell player piece/i)).not.toHaveClass('battle-player-piece');
    expect(screen.getByLabelText(/spell player piece/i)).toHaveStyle({ height: '100px' });
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByRole('dialog', { name: /spells/i })).not.toBeInTheDocument();

    expect(screen.queryByRole('dialog', { name: /cancel spells confirmation/i })).not.toBeInTheDocument();
  });

  test('blocks the start area only for a player who has already left it', async () => {
    renderGameplayPage();

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      { x: 0, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      { x: 1, y: 29 },
      expect.any(Number),
      { blockedNodeIds: [] }
    );

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    expect(mockGetHighlightedNodeIds).toHaveBeenNthCalledWith(
      3,
      expect.any(Object),
      { x: 1, y: 28 },
      expect.any(Number),
      { blockedNodeIds: ['start-area'] }
    );
  });

  test('uses anywhere mode movement once and then consumes it for that player', async () => {
    const initialGameSetup = createCommittedGameplaySetup();

    initialGameSetup.players[0] = {
      ...initialGameSetup.players[0],
      anywhereMode: true,
    };

    render(
      <GameSetupProvider initialGameSetup={initialGameSetup}>
        <GameplayPage />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByRole('dialog', { name: /dice result/i })).toHaveTextContent(/anywhere mode/i);
    expect(mockGetAnywhereModeHighlightedNodeIds).not.toHaveBeenCalled();

    finishDiceSequence();

    expect(mockGetAnywhereModeHighlightedNodeIds).toHaveBeenCalledWith(
      expect.any(Object),
      { x: 0, y: 29 }
    );
    expect(mockGetHighlightedNodeIds).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();
    fireEvent.click(screen.getByRole('button', { name: /move to square 1, 28/i }));
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    finishDiceSequence();

    expect(mockGetHighlightedNodeIds).toHaveBeenLastCalledWith(
      expect.any(Object),
      { x: 1, y: 28 },
      expect.any(Number),
      { blockedNodeIds: ['start-area'] }
    );
  });
});
