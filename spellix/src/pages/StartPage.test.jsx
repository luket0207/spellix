import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RulesPage from './RulesPage';
import StartPage from './StartPage';

function renderStartPage(onStart = () => {}) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<StartPage onStart={onStart} />} />
        <Route path="/setup" element={<p>Game setup destination</p>} />
        <Route path="/rules" element={<RulesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('StartPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('shows the bilingual home actions in the required hierarchy and order', () => {
    const onStart = jest.fn();

    renderStartPage(onStart);

    expect(screen.getByRole('heading', { name: 'Spellix' })).toBeInTheDocument();
    expect(screen.queryByText(/start a new game/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();

    const buttonStack = screen.getByRole('group', { name: 'Home actions' });
    const [newGameButton, loadGameButton, rulesButton] = within(buttonStack).getAllByRole(
      'button'
    );

    expect(newGameButton).toHaveAccessibleName('New Game 新しいゲーム');
    expect(loadGameButton).toHaveAccessibleName('Load Game ゲームを読み込む');
    expect(rulesButton).toHaveAccessibleName('Rules ルール');
    expect(within(newGameButton).getByText('/')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(within(loadGameButton).getByText('/')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(within(rulesButton).getByText('/')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(newGameButton).toHaveClass(
      'start-page-button',
      'start-page-button--primary'
    );
    expect(loadGameButton).toHaveClass(
      'start-page-button',
      'start-page-button--secondary'
    );
    expect(rulesButton).toHaveClass(
      'start-page-button',
      'start-page-button--secondary'
    );
    expect(within(newGameButton).getByText('New Game')).toHaveClass('language-en');
    expect(within(newGameButton).getByText('新しいゲーム')).toHaveClass('language-jp');

    fireEvent.click(newGameButton);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Game setup destination')).toBeInTheDocument();
  });

  test('opens the Rules page without starting or resetting the game', () => {
    const onStart = jest.fn();

    renderStartPage(onStart);
    fireEvent.click(screen.getByRole('button', { name: 'Rules ルール' }));

    expect(onStart).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Rules of the game' })).toBeInTheDocument();
  });

  test('crossfades all seven battle backgrounds every fifteen seconds and loops', () => {
    renderStartPage();

    const fieldsBackground = screen.getByTestId('start-page-background-fields');
    const hillsBackground = screen.getByTestId('start-page-background-hills');

    expect(fieldsBackground).toHaveClass('start-page-background--visible');
    expect(hillsBackground).not.toHaveClass('start-page-background--visible');

    act(() => {
      jest.advanceTimersByTime(14999);
    });

    expect(fieldsBackground).toHaveClass('start-page-background--visible');
    expect(hillsBackground).not.toHaveClass('start-page-background--visible');

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(fieldsBackground).not.toHaveClass('start-page-background--visible');
    expect(hillsBackground).toHaveClass('start-page-background--visible');

    act(() => {
      jest.advanceTimersByTime(90000);
    });

    expect(fieldsBackground).toHaveClass('start-page-background--visible');
    expect(hillsBackground).not.toHaveClass('start-page-background--visible');
  });

  test('fades one decorative battle enemy outside the safe zone before removing it', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.4)
      .mockReturnValue(0);
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('start-page-safe-zone')) {
        return {
          bottom: 500,
          height: 300,
          left: 300,
          right: 700,
          top: 200,
          width: 400,
          x: 300,
          y: 200,
          toJSON: () => ({}),
        };
      }

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });

    const view = renderStartPage();

    expect(screen.queryByTestId('start-page-enemy')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    const enemy = screen.getByTestId('start-page-enemy');

    expect(enemy).toHaveAttribute('aria-hidden', 'true');
    expect(enemy).toHaveStyle({ left: '0px', top: '0px' });
    expect(enemy).toContainHTML('<img');
    expect(enemy).not.toHaveClass('start-page-enemy--visible');

    act(() => {
      jest.advanceTimersByTime(16);
    });

    expect(enemy).toHaveClass('start-page-enemy--visible');

    act(() => {
      jest.advanceTimersByTime(2484);
    });

    expect(enemy).not.toHaveClass('start-page-enemy--visible');
    expect(enemy).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(enemy).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.queryByTestId('start-page-enemy')).not.toBeInTheDocument();
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    view.unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('clears a visible decorative enemy on resize and cleans up timers', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 700,
      height: 300,
      left: 300,
      right: 700,
      top: 400,
      width: 400,
      x: 300,
      y: 400,
      toJSON: () => ({}),
    });

    const view = renderStartPage();

    act(() => {
      jest.advanceTimersByTime(1516);
    });

    expect(screen.getByTestId('start-page-enemy')).toHaveClass(
      'start-page-enemy--visible'
    );

    fireEvent(window, new Event('resize'));

    expect(screen.queryByTestId('start-page-enemy')).not.toBeInTheDocument();

    view.unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('uses the requested fonts, sizing, spacing, layering, and background behavior', () => {
    const stylesheet = readFileSync(`${__dirname}/StartPage.css`, 'utf8');
    const backgroundStylesheet = readFileSync(
      `${__dirname}/../components/BattleBackgroundSlideshow.css`,
      'utf8'
    );
    const globalStylesheet = readFileSync(`${__dirname}/../index.css`, 'utf8');

    expect(globalStylesheet).toMatch(/family=Fontdiner\+Swanky/);
    expect(stylesheet).toMatch(
      /\.start-page-title\s*{[^}]*animation:\s*spellix-title-glow 3s ease-in-out infinite;[^}]*background-color:\s*rgba\(0,\s*0,\s*0,\s*0\.5\);[^}]*border-radius:\s*24px;[^}]*color:\s*#C6CC0C;[^}]*font-family:\s*'Fontdiner Swanky',\s*cursive;[^}]*font-size:\s*72px;[^}]*padding:\s*12px 32px;/s
    );
    const titleRule = stylesheet.match(/\.start-page-title\s*{[^}]*}/s)?.[0];

    expect(titleRule).not.toMatch(/(?:^|[;\s])opacity\s*:/);
    expect(stylesheet).toMatch(
      /@keyframes spellix-title-glow\s*{[^}]*box-shadow:\s*0 0 14px rgba\(0,\s*0,\s*0,\s*0\.55\);[^}]*}[^}]*box-shadow:\s*0 0 34px rgba\(0,\s*0,\s*0,\s*0\.95\);/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-safe-zone\s*{[^}]*gap:\s*50px;[^}]*z-index:\s*2;/s
    );
    expect(stylesheet).toMatch(
      /\.start-page\s*{[^}]*min-height:\s*100vh;/s
    );
    expect(backgroundStylesheet).toMatch(
      /\.start-page-background\s*{[^}]*background-repeat:\s*no-repeat;[^}]*background-size:\s*cover;[^}]*opacity:\s*0;[^}]*transition:\s*opacity 1500ms ease;/s
    );
    expect(backgroundStylesheet).toMatch(
      /\.start-page-background--visible\s*{[^}]*opacity:\s*1;/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button-stack\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*gap:\s*24px;/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button\s*{[^}]*box-sizing:\s*border-box;[^}]*flex-direction:\s*row;[^}]*white-space:\s*nowrap;/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button--primary\s*{[^}]*font-size:\s*24px;[^}]*min-height:\s*70px;[^}]*width:\s*min\(300px,\s*calc\(100vw - 32px\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button--secondary\s*{[^}]*background:\s*#D8C79A;[^}]*font-size:\s*18px;[^}]*min-height:\s*52px;[^}]*width:\s*min\(270px,\s*calc\(100vw - 32px\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.start-page-button \.language-jp\s*{[^}]*font-family:\s*'M PLUS Rounded 1c',\s*sans-serif;/s
    );
    expect(stylesheet).toMatch(
      /@media \(max-width:\s*480px\)\s*{[\s\S]*\.start-page-button--primary\s*{[^}]*font-size:\s*clamp\(14px,\s*6vw,\s*24px\);[\s\S]*\.start-page-button--secondary\s*{[^}]*font-size:\s*clamp\(14px,\s*5vw,\s*18px\);/s
    );
    expect(stylesheet).toMatch(/\.start-page-button:hover\s*{/);
    expect(stylesheet).toMatch(
      /\.start-page-enemy\s*{[^}]*height:\s*150px;[^}]*opacity:\s*0;[^}]*transition:\s*opacity 1000ms ease-in-out;[^}]*width:\s*150px;[^}]*z-index:\s*1;/s
    );
    expect(stylesheet).toMatch(/\.start-page-enemy--visible\s*{[^}]*opacity:\s*1;/s);
  });
});
