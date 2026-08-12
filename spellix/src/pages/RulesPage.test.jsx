import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RulesPage from './RulesPage';

function renderRulesPage() {
  return render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/rules']}
    >
      <Routes>
        <Route path="/" element={<p>Start destination</p>} />
        <Route path="/rules" element={<RulesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RulesPage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows the English rules by default inside the animated starry modal', () => {
    jest.useFakeTimers();
    renderRulesPage();

    const rules = screen.getByRole('article', { name: 'Rules of the game' });

    expect(screen.getByTestId('magical-night-sky')).toBeInTheDocument();
    expect(within(rules).getByRole('heading', { name: 'Rules of the game' })).toBeInTheDocument();
    ['Tokens', 'Battles', 'Potions', 'Environments', 'Features'].forEach((section) => {
      expect(within(rules).getByRole('heading', { name: section })).toBeInTheDocument();
    });
    expect(within(rules).getByText(/defeat both Elite Towers first/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ゲームのルール' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Back to Start' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('switches all content and both Back buttons to Japanese', () => {
    jest.useFakeTimers();
    renderRulesPage();

    fireEvent.click(screen.getByRole('button', { name: '日本語' }));

    const rules = screen.getByRole('article', { name: 'ゲームのルール' });

    ['ゲームのルール', 'トークン', 'バトル', 'ポーション', '環境', '特徴'].forEach((section) => {
      expect(within(rules).getByRole('heading', { name: section })).toBeInTheDocument();
    });
    expect(within(rules).getByText(/2つのエリートタワーを両方攻略/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rules of the game' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'スタートに戻る' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute('aria-pressed', 'true');
  });

  test.each(['top', 'bottom'])('returns to Start from the %s Back button', (position) => {
    jest.useFakeTimers();
    renderRulesPage();

    const backButtons = screen.getAllByRole('button', { name: 'Back to Start' });
    fireEvent.click(position === 'top' ? backButtons[0] : backButtons[1]);

    expect(screen.getByText('Start destination')).toBeInTheDocument();
  });

  test('uses the required centred 80-percent scrollable modal over the gameplay sky base', () => {
    const stylesheet = readFileSync(`${__dirname}/RulesPage.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.rules-page\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*min-height:\s*100vh;/s
    );
    expect(stylesheet).toMatch(
      /\.rules-modal\s*{[^}]*background-image:\s*url\('\.\.\/images\/misc\/modalBackground\.png'\);[^}]*height:\s*80vh;[^}]*overflow-y:\s*auto;/s
    );
  });
});
