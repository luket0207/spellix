import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import LootChestPage from './LootChestPage';

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

const claimLootChestReward = jest.fn(() => '/reward');
const returnFromMiniGame = jest.fn();

function renderPage({ language = 'en', randomFn = () => 0 } = {}) {
  useGameSetup.mockReturnValue({
    claimLootChestReward,
    currentPlayer: { id: 'player-1', language },
    miniGameResult: {
      playerId: 'player-1',
      result: 'win',
      returnBehaviour: 'samePlayerRollAgain',
      type: 'river',
    },
    returnFromMiniGame,
  });

  return render(
    <MemoryRouter initialEntries={['/mini-game/loot-chest']}>
      <Routes>
        <Route
          path="/mini-game/loot-chest"
          element={<LootChestPage randomFn={randomFn} />}
        />
        <Route path="/reward" element={<p>Reward assignment destination</p>} />
        <Route path="/gameplay" element={<p>Gameplay destination</p>} />
        <Route path="/village" element={<p>Village destination</p>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  claimLootChestReward.mockClear().mockReturnValue('/reward');
  returnFromMiniGame.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('reveals three rewards, hides them in identical chests, shuffles, then allows one choice', () => {
  renderPage();

  expect(screen.getByTestId('magical-night-sky')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Choose your loot' })).toHaveClass(
    'language-en'
  );
  const chestIcons = screen.getAllByRole('img', { name: /loot chest \d/i });

  expect(chestIcons).toHaveLength(3);
  chestIcons.forEach((icon) => expect(icon).toHaveAttribute('data-icon', 'toolbox'));
  expect(screen.getAllByTestId('loot-reward-preview')).toHaveLength(3);
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Choose' })).not.toBeInTheDocument();
  const resultArea = screen.getByTestId('loot-chest-result-area');

  expect(resultArea).toBeEmptyDOMElement();
  expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(2499);
  });
  expect(screen.getByLabelText('Loot chest choices')).toHaveClass(
    'loot-chest-page--showing-rewards'
  );

  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(screen.getByLabelText('Loot chest choices')).toHaveClass(
    'loot-chest-page--rewards-entering'
  );

  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.getByLabelText('Loot chest choices')).toHaveClass(
    'loot-chest-page--shuffling'
  );

  act(() => {
    jest.advanceTimersByTime(1400);
  });
  const chooseButtons = screen.getAllByRole('button', { name: 'Choose' });

  expect(chooseButtons).toHaveLength(3);
  chooseButtons.forEach((button) => expect(button).toBeEnabled());
  expect(screen.queryByTestId('loot-reward-preview')).not.toBeInTheDocument();

  fireEvent.click(chooseButtons[0]);

  chooseButtons.forEach((button) => expect(button).toBeDisabled());
  expect(screen.getByTestId('loot-chest-result-area')).toBe(resultArea);
  expect(screen.getByText(/you got/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  expect(screen.getAllByTestId('loot-reward-reveal')).toHaveLength(1);
  expect(within(screen.getAllByLabelText(/loot chest choice \d/i)[0]).getByRole('img', {
    name: 'Loot chest 1',
  })).toHaveClass('is-opening');
  expect(
    within(screen.getAllByLabelText(/loot chest choice \d/i)[0]).getByTestId(
      'loot-chest-visual-slot'
    )
  ).toBeInTheDocument();

  fireEvent.click(chooseButtons[1]);
  expect(screen.getAllByTestId('loot-reward-reveal')).toHaveLength(1);
});

test('uses Japanese copy and routes the selected reward through the shared reward flow', () => {
  renderPage({ language: 'jp' });

  expect(screen.getByRole('heading', { name: '戦利品を選んでください。' })).toHaveClass(
    'language-jp'
  );

  act(() => {
    jest.advanceTimersByTime(4900);
  });

  const chest = screen.getAllByLabelText(/loot chest choice \d/i)[0];
  fireEvent.click(within(chest).getByRole('button', { name: '選ぶ' }));

  expect(screen.getByText(/を手に入れました。/)).toHaveClass('language-jp');
  fireEvent.click(screen.getByRole('button', { name: '続ける' }));

  expect(claimLootChestReward).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Reward assignment destination')).toBeInTheDocument();
  expect(returnFromMiniGame).not.toHaveBeenCalled();
});

test('completes Nothing directly when the shared reward action returns Gameplay', () => {
  claimLootChestReward.mockReturnValue('/gameplay');
  renderPage({ randomFn: () => 0.999 });

  expect(screen.getByRole('img', { name: 'Nothing reward' })).toHaveClass(
    'loot-nothing-icon'
  );

  act(() => {
    jest.advanceTimersByTime(4900);
  });

  const nothingChest = screen.getAllByLabelText(/loot chest choice \d/i)[2];

  fireEvent.click(within(nothingChest).getByRole('button', { name: 'Choose' }));
  expect(screen.getByRole('img', { name: 'Nothing reward' })).toHaveClass(
    'loot-nothing-icon'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Gameplay destination')).toBeInTheDocument();
});

test('returns a completed village Loot Chest directly to the village flow', () => {
  claimLootChestReward.mockReturnValue('/village');
  renderPage({ randomFn: () => 0.999 });

  act(() => {
    jest.advanceTimersByTime(4900);
  });

  const nothingChest = screen.getAllByLabelText(/loot chest choice \d/i)[2];

  fireEvent.click(within(nothingChest).getByRole('button', { name: 'Choose' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  expect(screen.getByText('Village destination')).toBeInTheDocument();
  expect(returnFromMiniGame).not.toHaveBeenCalled();
});

test('defines the requested chest sizing, gradient, glow, positioning, and animation states', () => {
  const stylesheet = readFileSync(`${__dirname}/LootChestPage.css`, 'utf8');

  expect(stylesheet).toMatch(/\.loot-chest-title\s*{[^}]*margin:\s*0 0 100px;/s);
  expect(stylesheet).toMatch(
    /\.loot-chest-icon\s*{[^}]*height:\s*100px;[^}]*width:\s*100px;/s
  );
  expect(stylesheet).toMatch(
    /\.loot-chest-visual-slot\s*{[^}]*height:\s*120px;[^}]*position:\s*relative;[^}]*width:\s*120px;/s
  );
  expect(stylesheet).toMatch(
    /\.loot-nothing-icon\s*{[^}]*color:\s*#36a8ff;[^}]*font-size:\s*20px;[^}]*height:\s*20px;[^}]*width:\s*20px;/s
  );
  expect(stylesheet).toMatch(
    /\.loot-chest-result\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*center;[^}]*min-height:\s*120px;/s
  );
  expect(stylesheet).toMatch(/\.loot-chest-icon path\s*{[^}]*fill:\s*url\('#loot-chest-gradient'\);/s);
  expect(stylesheet).toMatch(
    /\.loot-chest-choice::before\s*{[^}]*animation:\s*lootChestGlow 2\.5s ease-in-out infinite;[^}]*background:\s*rgba\(255, 245, 120, 0\.45\);/s
  );
  expect(stylesheet).toMatch(
    /\.loot-reward-preview\s*{[^}]*position:\s*absolute;[^}]*top:\s*-70px;/s
  );
  expect(stylesheet).toMatch(/@keyframes lootRewardEnter/);
  expect(stylesheet).toMatch(/@keyframes lootChestShuffle/);
  expect(stylesheet).toMatch(/@keyframes lootChooseFadeIn/);
  expect(stylesheet).toMatch(/@keyframes lootChestShrinkFadeOut/);
  expect(stylesheet).toMatch(/@keyframes lootRewardFadeIn/);
});
