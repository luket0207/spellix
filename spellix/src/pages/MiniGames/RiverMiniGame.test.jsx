import { existsSync, readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { POTION_DEFINITIONS } from '../../data/potions';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import RiverMiniGame from './RiverMiniGame';

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

jest.mock('../../features/miniGames/riverMiniGame', () => ({
  createRiverRows: () => [
    {
      row: 1,
      rocks: [
        { id: 'row-1-rock-1', imageId: 'rock-1', imageSrc: 'rock-1.png', isSafe: true },
        { id: 'row-1-rock-2', imageId: 'rock-2', imageSrc: 'rock-2.png', isSafe: true },
        { id: 'row-1-rock-3', imageId: 'rock-3', imageSrc: 'rock-3.png', isSafe: false },
      ],
    },
    {
      row: 2,
      rocks: [
        { id: 'row-2-rock-1', imageId: 'rock-4', imageSrc: 'rock-4.png', isSafe: false },
        { id: 'row-2-rock-2', imageId: 'rock-5', imageSrc: 'rock-5.png', isSafe: true },
        { id: 'row-2-rock-3', imageId: 'rock-6', imageSrc: 'rock-6.png', isSafe: true },
      ],
    },
    {
      row: 3,
      rocks: [
        { id: 'row-3-rock-1', imageId: 'rock-7', imageSrc: 'rock-7.png', isSafe: false },
        { id: 'row-3-rock-2', imageId: 'rock-8', imageSrc: 'rock-8.png', isSafe: false },
        { id: 'row-3-rock-3', imageId: 'rock-9', imageSrc: 'rock-9.png', isSafe: true },
      ],
    },
  ],
}));

const completeMiniGame = jest.fn();
const removePlayerPotion = jest.fn();
const bridgeBuilderPotion = POTION_DEFINITIONS.find(
  ({ id }) => id === 'bridge-builder'
);

function renderRiverMiniGame(language = 'en', playerOverrides = {}) {
  const player = {
    colour: 'red',
    id: 'player-1',
    language,
    pieceImage: 'm-red.png',
    potions: [],
    ...playerOverrides,
  };

  useGameSetup.mockReturnValue({
    completeMiniGame,
    currentPlayer: player,
    gameSetup: { players: [player] },
    miniGameResult: {
      playerId: 'player-1',
      result: null,
      returnBehaviour: null,
      type: 'river',
    },
    removePlayerPotion,
  });

  return render(
    <MemoryRouter initialEntries={['/mini-game/river']}>
      <Routes>
        <Route
          path="/mini-game/river"
          element={<RiverMiniGame />}
        />
        <Route path="/mini-game/loot-chest" element={<p>Loot destination</p>} />
        <Route path="/mini-game/lose" element={<p>Lose destination</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function finishRowTransition() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
  act(() => {
    jest.advanceTimersByTime(700);
  });
  act(() => {
    jest.advanceTimersByTime(700);
  });
}

beforeEach(() => {
  completeMiniGame.mockClear();
  removePlayerPotion.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

test('shows only Row 1 as image rocks with the player character below it', () => {
  renderRiverMiniGame();

  expect(screen.queryByRole('heading', { name: /river mini game/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/current player:/i)).not.toBeInTheDocument();
  expect(screen.getByText('Get over the 3 rows of rocks to make it to the other side.')).toBeInTheDocument();
  expect(screen.getByText('Choose a safe rock in the first row.')).toBeInTheDocument();
  expect(screen.getAllByRole('group', { name: /river row/i })).toHaveLength(1);
  expect(screen.getByRole('group', { name: /river row 1/i })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: /river row 2/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('group', { name: /river row 3/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /row 1 rock/i })).toHaveLength(3);
  expect(screen.queryByText(/^rock$/i)).not.toBeInTheDocument();

  const row = screen.getByRole('group', { name: /river row 1/i });
  const playerImage = screen.getByRole('img', { name: /current player character/i });
  expect(row.compareDocumentPosition(playerImage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(playerImage).toHaveAttribute('src', 'm-red.png');
});

test('shows Bridge Builder beneath the player without changing the River layout', () => {
  const stylesheet = readFileSync(`${__dirname}/RiverMiniGame.css`, 'utf8');

  renderRiverMiniGame('en', {
    potions: [bridgeBuilderPotion],
    turnPotionUsage: { boardPotionUsedThisTurn: true },
  });

  const playerImage = screen.getByRole('img', { name: /current player character/i });
  const potion = screen.getByRole('group', { name: /bridge builder potion/i });
  const useButton = screen.getByRole('button', { name: 'Use' });

  expect(potion).toHaveAttribute('title', 'Auto win a River Mini Game');
  expect(within(potion).getByText('Bridge Builder')).toHaveClass('language-en');
  expect(useButton).toHaveClass('language-en');
  expect(
    playerImage.compareDocumentPosition(potion) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    potion.compareDocumentPosition(useButton) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(stylesheet).toMatch(/\.river-player-area\s*{[^}]*position:\s*relative;/s);
  expect(stylesheet).toMatch(
    /\.river-bridge-builder-potion\s*{[^}]*position:\s*absolute;[^}]*top:\s*calc\(100% \+ 16px\);/s
  );
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});

test('cancels Bridge Builder confirmation without consuming it or leaving River', () => {
  renderRiverMiniGame('en', { potions: [bridgeBuilderPotion] });

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));

  const confirmation = screen.getByRole('dialog', {
    name: 'Use potion confirmation',
  });
  expect(
    within(confirmation).getByText(
      'Are you sure you want to use Bridge Builder?'
    )
  ).toHaveClass('larger-text', 'language-en');
  expect(within(confirmation).getByText('Potion Description')).toBeInTheDocument();
  expect(
    within(confirmation).getByText('Auto win a River Mini Game')
  ).toBeInTheDocument();

  fireEvent.click(within(confirmation).getByRole('button', { name: 'No' }));

  expect(
    screen.queryByRole('dialog', { name: 'Use potion confirmation' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('group', { name: /river row 1/i })).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /bridge builder potion/i })).toBeInTheDocument();
  expect(removePlayerPotion).not.toHaveBeenCalled();
  expect(completeMiniGame).not.toHaveBeenCalled();
});

test('consumes Bridge Builder on confirmation and uses the normal River win route after OK', () => {
  renderRiverMiniGame('en', { potions: [bridgeBuilderPotion] });

  fireEvent.click(screen.getByRole('button', { name: 'Use' }));
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
  );

  expect(removePlayerPotion).toHaveBeenCalledWith('player-1', 0);
  expect(screen.queryByRole('group', { name: /bridge builder potion/i })).not.toBeInTheDocument();
  expect(completeMiniGame).not.toHaveBeenCalled();
  const successDialog = screen.getByRole('dialog', {
    name: 'Bridge Builder success',
  });
  expect(
    within(successDialog).getByText(
      'The potion created a bridge over the river for you'
    )
  ).toHaveClass('larger-text', 'language-en');
  expect(screen.queryByText(/lose destination/i)).not.toBeInTheDocument();

  fireEvent.click(within(successDialog).getByRole('button', { name: 'OK' }));

  expect(completeMiniGame).toHaveBeenCalledWith('win');
  expect(screen.getByText(/loot destination/i)).toBeInTheDocument();
});

test('localizes the Bridge Builder display, confirmation, and success modal in Japanese', () => {
  renderRiverMiniGame('jp', { potions: [bridgeBuilderPotion] });

  const potion = screen.getByRole('group', { name: '橋職人 potion' });
  expect(within(potion).getByText('橋職人')).toHaveClass('language-jp');
  expect(potion).toHaveAttribute('title', '川のミニゲームに自動的に勝利する。');
  expect(screen.getByRole('button', { name: '使用する' })).toHaveClass('language-jp');

  fireEvent.click(screen.getByRole('button', { name: '使用する' }));
  const confirmation = screen.getByRole('dialog', {
    name: 'Use potion confirmation',
  });
  expect(
    within(confirmation).getByText(
      'Bridge Builderを使用してもよろしいですか？'
    )
  ).toHaveClass('larger-text', 'language-jp');
  fireEvent.click(within(confirmation).getByRole('button', { name: 'はい' }));

  const successDialog = screen.getByRole('dialog', {
    name: 'Bridge Builder success',
  });
  expect(
    within(successDialog).getByText('ポーションが川に橋を架けてくれました。')
  ).toHaveClass('larger-text', 'language-jp');
  expect(within(successDialog).getByRole('button', { name: 'OK' })).toHaveClass(
    'language-jp'
  );
});

test('does not reveal safe or unsafe status before a rock is selected', () => {
  renderRiverMiniGame();

  expect(screen.queryByText('SAFE')).not.toBeInTheDocument();
  screen.getAllByRole('button', { name: /row 1 rock/i }).forEach((rockButton) => {
    expect(rockButton).toHaveClass('river-rock');
    expect(rockButton).not.toHaveClass('river-rock--safe', 'river-rock--unsafe');
  });
});

test('keeps safe click feedback and progression without revealing safe rocks first', () => {
  renderRiverMiniGame();

  expect(screen.queryByText('SAFE')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 1/i }));
  expect(screen.getByRole('button', { name: /row 1 rock 1/i })).toHaveClass(
    'river-rock--safe'
  );
});

test('uses the supplied River and rock image paths with image-only aligned rock styling', () => {
  const componentSource = readFileSync(`${__dirname}/RiverMiniGame.jsx`, 'utf8');
  const rockSource = readFileSync(
    `${__dirname}/../../features/miniGames/riverRockImages.js`,
    'utf8'
  );
  const stylesheet = readFileSync(`${__dirname}/RiverMiniGame.css`, 'utf8');

  expect(stylesheet).toContain("url('../../images/miniGames/river.png')");
  expect(stylesheet).toContain('background-repeat: no-repeat');
  expect(stylesheet).toContain('background-size: cover');
  expect(stylesheet).toContain('align-items: flex-end');
  expect(stylesheet).toContain('background: transparent');
  expect(stylesheet).toContain('border: 0');
  expect(stylesheet).toMatch(/\.river-rock:hover[^}]*transform:\s*scale/s);
  expect(stylesheet).toMatch(/\.river-rock-image[^}]*width:\s*130px/s);
  expect(stylesheet).toMatch(/\.river-rock-image[^}]*height:\s*auto/s);
  expect(stylesheet).toMatch(/\.river-mini-game-player[^}]*margin-top:\s*40px/s);
  expect(componentSource).toContain('river-rock-image');
  expect(rockSource).toContain("../../images/miniGames/rocks/rock-1.png");
  expect(rockSource).toContain("../../images/miniGames/rocks/rock-10.png");
  expect(componentSource).not.toContain('SHOW_SAFE_RIVER_ROCKS');
  expect(componentSource).not.toContain('river-rock-safe-debug-flag');
  expect(stylesheet).not.toContain('river-rock-safe-debug-flag');
  expect(
    existsSync(`${__dirname}/../../features/miniGames/riverDebug.js`)
  ).toBe(false);
});

test('keeps safe status hidden while known safe clicks progress through every row', () => {
  jest.useFakeTimers();
  renderRiverMiniGame();

  expect(screen.queryByText('SAFE')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 1/i }));
  finishRowTransition();

  expect(screen.getByRole('group', { name: /river row 2/i })).toBeInTheDocument();
  expect(screen.queryByText('SAFE')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /row 2 rock 2/i }));
  finishRowTransition();

  expect(screen.getByRole('group', { name: /river row 3/i })).toBeInTheDocument();
  expect(screen.queryByText('SAFE')).not.toBeInTheDocument();
});

test('animates safe rows out and the next row in while preventing clicks', () => {
  jest.useFakeTimers();
  renderRiverMiniGame();

  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 1/i }));

  expect(screen.getByRole('button', { name: /row 1 rock 1/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /row 1 rock 1/i })).toHaveClass(
    'river-rock--safe'
  );

  act(() => {
    jest.advanceTimersByTime(300);
  });
  expect(screen.getByRole('group', { name: /river row 1/i })).toHaveClass(
    'river-row--exiting'
  );

  act(() => {
    jest.advanceTimersByTime(700);
  });
  expect(screen.queryByRole('group', { name: /river row 1/i })).not.toBeInTheDocument();
  expect(screen.getByRole('group', { name: /river row 2/i })).toHaveClass(
    'river-row--entering'
  );
  expect(screen.getByRole('button', { name: /row 2 rock 2/i })).toBeDisabled();
  expect(screen.getByText('Choose a safe rock in the second row.')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(700);
  });
  expect(screen.getByRole('button', { name: /row 2 rock 2/i })).toBeEnabled();
});

test('replaces the final row with Continue and waits for it before routing to Loot Chest', () => {
  jest.useFakeTimers();
  renderRiverMiniGame('en', { potions: [bridgeBuilderPotion] });

  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 1/i }));
  finishRowTransition();
  fireEvent.click(screen.getByRole('button', { name: /row 2 rock 2/i }));
  finishRowTransition();
  fireEvent.click(screen.getByRole('button', { name: /row 3 rock 3/i }));

  act(() => {
    jest.advanceTimersByTime(300);
  });
  expect(
    screen.getByText('You made it to the other side! Take your reward and roll again.')
  ).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: /river row 3/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  expect(screen.queryByText(/loot destination/i)).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(screen.queryByText(/loot destination/i)).not.toBeInTheDocument();
  expect(completeMiniGame).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(completeMiniGame).toHaveBeenCalledWith('win');
  expect(removePlayerPotion).not.toHaveBeenCalled();
  expect(screen.getByText(/loot destination/i)).toBeInTheDocument();
});

test('finishes the unsafe animation, then waits for localized Continue before loss navigation', () => {
  jest.useFakeTimers();
  renderRiverMiniGame('jp', { potions: [bridgeBuilderPotion] });

  expect(screen.getByText('3列の岩を越えて、反対岸にたどり着いてください。')).toHaveClass(
    'language-jp'
  );
  expect(screen.getByText('1列目から安全な岩を選んでください。')).toHaveClass(
    'language-jp'
  );

  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 3/i }));

  expect(
    screen.getByText('川に落ちてしまい、岸まで泳がなければなりませんでした。')
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /row 1 rock 3/i })).toHaveClass(
    'river-rock--unsafe'
  );
  expect(screen.queryByRole('button', { name: '続ける' })).not.toBeInTheDocument();
  expect(screen.queryByText(/lose destination/i)).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.queryByRole('group', { name: /river row 1/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '続ける' })).toBeInTheDocument();
  expect(completeMiniGame).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(screen.queryByText(/lose destination/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '続ける' }));
  expect(completeMiniGame).toHaveBeenCalledWith('loss');
  expect(removePlayerPotion).not.toHaveBeenCalled();
  expect(screen.getByText(/lose destination/i)).toBeInTheDocument();
});

test('falls back to English and cleans up pending transition timers on unmount', () => {
  jest.useFakeTimers();
  const { unmount } = renderRiverMiniGame('invalid');

  expect(screen.getByText('Choose a safe rock in the first row.')).toHaveClass(
    'language-en'
  );
  fireEvent.click(screen.getByRole('button', { name: /row 1 rock 1/i }));
  unmount();

  act(() => {
    jest.runOnlyPendingTimers();
  });

  expect(completeMiniGame).not.toHaveBeenCalled();
});
