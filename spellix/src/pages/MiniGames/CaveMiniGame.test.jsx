import { readFileSync } from 'fs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { POTION_DEFINITIONS } from '../../data/potions';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import {
  generateCavePotionReward,
  generateCaveTokenReward,
  selectCaveOutcome,
} from '../../features/miniGames/caveMiniGame';
import { getCaveMiniGameTranslations } from '../../i18n/translations';
import CaveMiniGame from './CaveMiniGame';

const mockNavigate = jest.fn();
const completeMiniGame = jest.fn();
const removePlayerPotion = jest.fn();
const returnFromMiniGame = jest.fn();
const caveRunnerPotion = POTION_DEFINITIONS.find(({ id }) => id === 'cave-runner');
const generatedPotion = {
  id: 'small-heal',
  japaneseName: '小回復',
  name: 'Small Heal',
  rarity: 'Common',
};
const generatedToken = {
  name: { en: 'Damage', jp: 'ダメージ' },
  rarity: 'Common',
  type: 'red',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

jest.mock('../../features/miniGames/caveMiniGame', () => ({
  ...jest.requireActual('../../features/miniGames/caveMiniGame'),
  generateCavePotionReward: jest.fn(),
  generateCaveTokenReward: jest.fn(),
  selectCaveOutcome: jest.fn(),
}));

function renderCave(language = 'en', playerOverrides = {}) {
  const player = {
    colour: 'red',
    currentHealth: 100,
    gender: 'boy',
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
    miniGameResult: { playerId: 'player-1', type: 'cave' },
    removePlayerPotion,
    returnFromMiniGame,
  });

  return render(
    <MemoryRouter>
      <CaveMiniGame />
    </MemoryRouter>
  );
}

function finishMovement() {
  act(() => {
    jest.advanceTimersByTime(500);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  completeMiniGame.mockClear();
  mockNavigate.mockClear();
  removePlayerPotion.mockClear();
  returnFromMiniGame.mockClear();
  generateCavePotionReward.mockReset().mockReturnValue(generatedPotion);
  generateCaveTokenReward.mockReset().mockReturnValue(generatedToken);
  selectCaveOutcome.mockReset();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('starts with Go Deeper enabled and Retreat visible but disabled at depth zero', () => {
  const translations = getCaveMiniGameTranslations('en');
  const stylesheet = readFileSync(`${__dirname}/CaveMiniGame.css`, 'utf8');

  renderCave();

  const player = screen.getByRole('img', { name: /current player character/i });
  const progressPosition = screen.getByTestId('cave-player-position');

  expect(screen.getByText(translations.messages.initial)).toHaveClass('language-en');
  expect(screen.getByRole('button', { name: translations.goDeeper })).toBeEnabled();
  expect(screen.getByRole('button', { name: translations.retreat })).toBeDisabled();
  expect(player).toHaveAttribute('src', 'm-red.png');
  expect(player).toHaveClass('is-flipped');
  expect(progressPosition).toHaveAttribute('data-depth', '0');
  expect(progressPosition).toHaveStyle('--cave-progress: 0%');
  expect(stylesheet).toMatch(/url\(['"]?\.\.\/\.\.\/images\/miniGames\/cave\.png['"]?\)/);
  expect(stylesheet).toMatch(/\.cave-player-position\s*{[^}]*margin-bottom:\s*20px;/s);
  expect(stylesheet).toMatch(/\.cave-player-position\s*{[^}]*transition:\s*left 500ms/s);
  expect(stylesheet).toMatch(/\.cave-player-image\.is-flipped\s*{[^}]*scaleX\(-1\)/s);
  expect(stylesheet).toMatch(
    /\.cave-debug-rewards\s*{[^}]*left:\s*8px;[^}]*position:\s*absolute;[^}]*top:\s*8px;[^}]*z-index:\s*20;/s
  );
});

test('shows owned Cave Runner below the actions as an automatic active potion', () => {
  const stylesheet = readFileSync(`${__dirname}/CaveMiniGame.css`, 'utf8');
  const componentSource = readFileSync(`${__dirname}/CaveMiniGame.jsx`, 'utf8');
  const translations = getCaveMiniGameTranslations('en');

  renderCave('en', { potions: [caveRunnerPotion] });

  const potion = screen.getByRole('group', { name: /cave runner potion/i });
  const display = screen.getByTestId('cave-runner-active-potion');

  expect(potion).toHaveAccessibleDescription(caveRunnerPotion.description);
  expect(within(potion).getByText(caveRunnerPotion.name)).toHaveClass('language-en');
  expect(screen.getByText('Active')).toHaveClass(
    'cave-runner-active-text',
    'language-en'
  );
  expect(display).toHaveClass('cave-runner-active-potion');
  expect(screen.getByRole('button', { name: translations.goDeeper })).toBeInTheDocument();
  expect(componentSource.indexOf('className="cave-mini-game-actions"')).toBeLessThan(
    componentSource.indexOf('className="cave-runner-active-potion"')
  );
  expect(screen.queryByRole('button', { name: /^use$/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  expect(stylesheet).toMatch(
    /\.cave-runner-active-potion\s*{[^}]*margin-top:\s*40px;/s
  );
  expect(stylesheet).toMatch(
    /\.cave-runner-active-text\s*{[^}]*color:\s*#F5FA00;/s
  );
});

test('localizes the Cave Runner name and Active text in Japanese', () => {
  renderCave('jp', { potions: [caveRunnerPotion] });

  expect(
    screen.getByRole('group', {
      name: `${caveRunnerPotion.japaneseName} potion`,
    })
  ).toHaveAccessibleDescription(caveRunnerPotion.japaneseDescription);
  expect(screen.getByText(caveRunnerPotion.japaneseName)).toHaveClass('language-jp');
  expect(screen.getByText('発動中')).toHaveClass('language-jp');
});

test('moves one depth over 500ms and prevents repeated decisions while moving', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('nothing');

  renderCave();

  const goDeeper = screen.getByRole('button', { name: translations.goDeeper });
  fireEvent.click(goDeeper);
  fireEvent.click(goDeeper);

  const retreat = screen.getByRole('button', { name: translations.retreat });
  const progressPosition = screen.getByTestId('cave-player-position');

  expect(selectCaveOutcome).toHaveBeenCalledTimes(1);
  expect(selectCaveOutcome).toHaveBeenCalledWith(1, expect.any(Object));
  expect(goDeeper).toBeDisabled();
  expect(retreat).toBeDisabled();
  expect(screen.getByRole('img', { name: /current player character/i })).toHaveClass(
    'is-flipped'
  );
  expect(progressPosition).toHaveAttribute('data-depth', '1');
  expect(progressPosition).toHaveStyle('--cave-progress: 6.25%');

  act(() => {
    jest.advanceTimersByTime(499);
  });
  expect(goDeeper).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(goDeeper).toBeEnabled();
  expect(retreat).toBeEnabled();
  expect(screen.getByRole('img', { name: /current player character/i })).toHaveClass(
    'is-flipped'
  );
});

test('uses no visible seventeenth depth and forces the sixteenth decision through the engine', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('nothing');

  renderCave();

  for (let depth = 1; depth <= 16; depth += 1) {
    fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
    finishMovement();
  }

  const progressPosition = screen.getByTestId('cave-player-position');

  expect(selectCaveOutcome).toHaveBeenCalledTimes(16);
  expect(selectCaveOutcome.mock.calls.map(([step]) => step)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  ]);
  expect(progressPosition).toHaveAttribute('data-depth', '16');
  expect(progressPosition).toHaveStyle('--cave-progress: 100%');

  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  expect(selectCaveOutcome).toHaveBeenCalledTimes(16);
});

test('generates each reward once and opens Loot before pending token assignment', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome
    .mockReturnValueOnce('token')
    .mockReturnValueOnce('token')
    .mockReturnValueOnce('loot')
    .mockReturnValueOnce('potion')
    .mockReturnValueOnce('rollAgain');

  renderCave();

  for (let click = 0; click < 5; click += 1) {
    fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
    finishMovement();
  }

  const foundRewards = screen.getByTestId('cave-found-rewards');
  expect(foundRewards).toHaveTextContent(translations.summary.title);
  expect(within(foundRewards).getByText('Token: Damage')).toBeInTheDocument();
  expect(within(foundRewards).getByText(translations.summary.loot)).toBeInTheDocument();
  expect(within(foundRewards).getByText('Potion: Small Heal')).toBeInTheDocument();
  expect(within(foundRewards).getByText(translations.summary.rollAgain)).toBeInTheDocument();
  expect(generateCaveTokenReward).toHaveBeenCalledTimes(1);
  expect(generateCavePotionReward).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: /debug: add token/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /debug: add potion/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /debug: add loot chest/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /debug: add roll again potion/i })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(screen.queryByTestId('cave-found-rewards')).not.toBeInTheDocument();
  expect(screen.getByText(translations.messages.retreated)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.title)).toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('win', {
    caveRewards: {
      hasLootChest: true,
      hasRollAgainPotion: true,
      potion: generatedPotion,
      token: generatedToken,
    },
    rollAgain: true,
  });
  expect(returnFromMiniGame).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalledWith('/reward');

  fireEvent.click(screen.getByRole('button', { name: translations.openLoot }));
  expect(mockNavigate).toHaveBeenCalledWith('/mini-game/loot-chest');
});

test('debug reward controls preserve Loot-first Cave routing', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('nothing');

  renderCave();

  const debugToken = screen.getByRole('button', { name: /debug: add token/i });
  const debugPotion = screen.getByRole('button', { name: /debug: add potion/i });
  const debugLoot = screen.getByRole('button', { name: /debug: add loot chest/i });
  const debugRollAgain = screen.getByRole('button', {
    name: /debug: add roll again potion/i,
  });

  fireEvent.click(debugToken);
  fireEvent.click(debugPotion);
  fireEvent.click(debugLoot);
  fireEvent.click(debugRollAgain);

  expect(debugToken).toBeDisabled();
  expect(debugPotion).toBeDisabled();
  expect(debugLoot).toBeDisabled();
  expect(debugRollAgain).toBeDisabled();
  expect(generateCaveTokenReward).toHaveBeenCalledTimes(1);
  expect(generateCavePotionReward).toHaveBeenCalledTimes(1);
  const foundRewards = screen.getByTestId('cave-found-rewards');
  expect(within(foundRewards).getByText('Token: Damage')).toBeInTheDocument();
  expect(within(foundRewards).getByText('Potion: Small Heal')).toBeInTheDocument();
  expect(within(foundRewards).getByText('Loot Chest')).toBeInTheDocument();
  expect(within(foundRewards).getByText('Roll Again Potion')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();
  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(completeMiniGame).toHaveBeenCalledWith('win', {
    caveRewards: {
      hasLootChest: true,
      hasRollAgainPotion: true,
      potion: generatedPotion,
      token: generatedToken,
    },
    rollAgain: true,
  });
  expect(mockNavigate).not.toHaveBeenCalledWith('/reward');

  fireEvent.click(screen.getByRole('button', { name: translations.openLoot }));
  expect(mockNavigate).toHaveBeenCalledWith('/mini-game/loot-chest');
});

test('routes a non-loot token reward to shared assignment before Gameplay', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome
    .mockReturnValueOnce('token')
    .mockReturnValueOnce('potion')
    .mockReturnValueOnce('rollAgain');

  renderCave();

  for (let click = 0; click < 3; click += 1) {
    fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
    finishMovement();
  }

  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(returnFromMiniGame).not.toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/reward');
});

test('retreats without rewards only after the first movement', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('nothing');

  renderCave();
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();
  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(screen.getByText(translations.summary.none)).toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('win', {
    caveRewards: {
      hasLootChest: false,
      hasRollAgainPotion: false,
      potion: null,
      token: null,
    },
    rollAgain: false,
  });
});

test('plays the ogre chase before navigating and discards found rewards', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValueOnce('token').mockReturnValueOnce('ogre');

  renderCave();
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));

  expect(screen.getByText(translations.messages.ogre)).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /ogre/i })).not.toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();

  finishMovement();

  const player = screen.getByRole('img', { name: /current player character/i });
  const ogre = screen.getByRole('img', { name: /ogre/i });
  expect(player).toHaveClass('is-unflipped');
  expect(player).not.toHaveClass('is-flipped');
  expect(ogre).toHaveAttribute('src', 'AO.png');
  expect(screen.queryByTestId('cave-found-rewards')).not.toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('loss');

  act(() => {
    jest.advanceTimersByTime(1499);
  });
  expect(mockNavigate).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(1);
  });
  expect(mockNavigate).toHaveBeenCalledWith('/mini-game/lose');
});

test('automatically consumes Cave Runner on an ogre chase and prevents only health loss', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValueOnce('token').mockReturnValueOnce('ogre');

  renderCave('en', { potions: [caveRunnerPotion] });
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();

  expect(screen.getByTestId('cave-found-rewards')).toHaveTextContent('Token: Damage');

  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  expect(screen.queryByTestId('cave-found-rewards')).not.toBeInTheDocument();
  expect(removePlayerPotion).not.toHaveBeenCalled();

  finishMovement();

  expect(removePlayerPotion).toHaveBeenCalledWith('player-1', 0);
  expect(completeMiniGame).toHaveBeenCalledWith('loss', {
    preventHealthLoss: true,
  });
});

test('does not consume Cave Runner after a successful retreat', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('nothing');

  renderCave('en', { potions: [caveRunnerPotion] });
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();
  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(removePlayerPotion).not.toHaveBeenCalled();
  expect(screen.getByRole('group', { name: /cave runner potion/i })).toBeInTheDocument();
});

test('does not consume Cave Runner when an ogre cannot reduce zero health', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValue('ogre');

  renderCave('en', {
    currentHealth: 0,
    potions: [caveRunnerPotion],
  });
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  finishMovement();

  expect(removePlayerPotion).not.toHaveBeenCalled();
  expect(completeMiniGame).toHaveBeenCalledWith('loss');
});

test('localizes found rewards in Japanese and falls back to English', () => {
  const japanese = getCaveMiniGameTranslations('jp');
  selectCaveOutcome.mockReturnValueOnce('token').mockReturnValueOnce('loot');
  const { unmount } = renderCave('jp');

  fireEvent.click(screen.getByRole('button', { name: japanese.goDeeper }));
  finishMovement();
  fireEvent.click(screen.getByRole('button', { name: japanese.goDeeper }));
  finishMovement();

  const foundRewards = screen.getByTestId('cave-found-rewards');
  expect(foundRewards).toHaveClass('language-jp');
  expect(within(foundRewards).getByText(japanese.summary.title)).toBeInTheDocument();
  expect(within(foundRewards).getByText('トークン: ダメージ')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: japanese.retreat }));
  expect(screen.getByRole('button', { name: japanese.openLoot })).toHaveClass(
    'language-jp'
  );

  unmount();
  renderCave('invalid');

  const english = getCaveMiniGameTranslations('en');
  expect(screen.getByText(english.messages.initial)).toHaveClass('language-en');
  expect(screen.getByRole('button', { name: english.retreat })).toBeDisabled();
});
