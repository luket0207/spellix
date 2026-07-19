import { readFileSync } from 'fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import { selectCaveOutcome } from '../../features/miniGames/caveMiniGame';
import { getCaveMiniGameTranslations } from '../../i18n/translations';
import CaveMiniGame from './CaveMiniGame';

const mockNavigate = jest.fn();
const completeMiniGame = jest.fn();
const returnFromMiniGame = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../features/gameSetup/GameSetupContext', () => ({
  useGameSetup: jest.fn(),
}));

jest.mock('../../features/miniGames/caveMiniGame', () => ({
  ...jest.requireActual('../../features/miniGames/caveMiniGame'),
  selectCaveOutcome: jest.fn(),
}));

function renderCave(language = 'en') {
  const player = {
    id: 'player-1',
    language,
  };

  useGameSetup.mockReturnValue({
    completeMiniGame,
    currentPlayer: player,
    gameSetup: { players: [player] },
    miniGameResult: { playerId: 'player-1', type: 'cave' },
    returnFromMiniGame,
  });

  return render(
    <MemoryRouter>
      <CaveMiniGame />
    </MemoryRouter>
  );
}

beforeEach(() => {
  completeMiniGame.mockClear();
  mockNavigate.mockClear();
  returnFromMiniGame.mockClear();
  selectCaveOutcome.mockReset();
});

test('renders localized Cave instructions, controls, and required background layout', () => {
  const translations = getCaveMiniGameTranslations('en');
  const stylesheet = readFileSync(`${__dirname}/CaveMiniGame.css`, 'utf8');

  renderCave();

  expect(screen.getByText(translations.messages.initial)).toHaveClass('language-en');
  expect(screen.getByRole('button', { name: translations.goDeeper })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: translations.retreat })).toBeInTheDocument();
  expect(stylesheet).toMatch(/url\(['"]?\.\.\/\.\.\/images\/miniGames\/cave\.png['"]?\)/);
  expect(stylesheet).toMatch(/\.cave-mini-game-page\s*{[^}]*background-size:\s*cover;/s);
  expect(stylesheet).toMatch(/\.cave-mini-game-page\s*{[^}]*background-repeat:\s*no-repeat;/s);
  expect(stylesheet).toMatch(/\.cave-mini-game-actions\s*{[^}]*display:\s*flex;/s);
});

test('tracks each reward once, retreats with a summary, and returns with roll again', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome
    .mockReturnValueOnce('token')
    .mockReturnValueOnce('loot')
    .mockReturnValueOnce('potion')
    .mockReturnValueOnce('rollAgain');

  renderCave();

  for (let click = 0; click < 4; click += 1) {
    fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  }
  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(screen.getByText(translations.messages.retreated)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.title)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.token)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.loot)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.potion)).toBeInTheDocument();
  expect(screen.getByText(translations.summary.rollAgain)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: translations.goDeeper })).not.toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('win', { rollAgain: true });

  fireEvent.click(screen.getByRole('button', { name: translations.continue }));

  expect(returnFromMiniGame).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/gameplay', { replace: true });
});

test('retreats without rewards and requests the next player turn', () => {
  const translations = getCaveMiniGameTranslations('en');

  renderCave();
  fireEvent.click(screen.getByRole('button', { name: translations.retreat }));

  expect(screen.getByText(translations.summary.none)).toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('win', { rollAgain: false });
});

test('clears rewards on ogre, waits for Continue, and uses the shared loss route', () => {
  const translations = getCaveMiniGameTranslations('en');
  selectCaveOutcome.mockReturnValueOnce('token').mockReturnValueOnce('ogre');

  renderCave();
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));
  fireEvent.click(screen.getByRole('button', { name: translations.goDeeper }));

  expect(screen.getByText(translations.messages.ogre)).toBeInTheDocument();
  expect(screen.queryByText(translations.summary.token)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: translations.retreat })).not.toBeInTheDocument();
  expect(completeMiniGame).toHaveBeenCalledWith('loss');

  fireEvent.click(screen.getByRole('button', { name: translations.continue }));

  expect(returnFromMiniGame).not.toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/mini-game/lose');
});

test('uses Japanese throughout and falls back to English for invalid language', () => {
  const japanese = getCaveMiniGameTranslations('jp');
  const { unmount } = renderCave('jp');

  expect(screen.getByText(japanese.messages.initial)).toHaveClass('language-jp');
  expect(screen.getByRole('button', { name: japanese.goDeeper })).toHaveClass('language-jp');
  expect(screen.getByRole('button', { name: japanese.retreat })).toHaveClass('language-jp');

  unmount();
  renderCave('invalid');

  expect(screen.getByText(getCaveMiniGameTranslations('en').messages.initial)).toHaveClass(
    'language-en'
  );
});
