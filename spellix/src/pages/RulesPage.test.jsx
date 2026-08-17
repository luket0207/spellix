import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RULES_CONTENT } from '../features/rules/rulesContent';
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
    ['Tokens', 'Battles', 'Potions', 'Environments', 'Features', 'Village Actions'].forEach((section) => {
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

    ['ゲームのルール', 'トークン', 'バトル', 'ポーション', '環境', '特徴', '村でできること'].forEach((section) => {
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

  test.each([
    [
      'en',
      'Features',
      'Village Actions',
      [
        'When you visit a village, you can choose what to do there.',
        'Rest lets you recover your health before continuing your journey.',
        'Wandsmith lets you rearrange your spell tokens. Once your tokens are committed, they normally cannot be moved unless you use a Wandsmith or certain potions.',
        'Leave lets you leave the village without resting or using the Wandsmith.',
        'If you visit the same village again without visiting another feature first, the option you chose last time may be disabled. Rest and Wandsmith can become disabled this way. Leave is always available.',
        'These options reset when you visit another feature, visit a different village, or die and respawn.',
      ],
    ],
    [
      'jp',
      '特徴',
      '村でできること',
      [
        '村を訪れると、そこで何をするかを選べます。',
        '休むを選ぶと、冒険を続ける前にHPを回復できます。',
        '杖職人を選ぶと、スペルトークンを並べ替えることができます。一度トークンを確定すると、通常は杖職人や一部のポーションを使わない限り動かせません。',
        '出発するを選ぶと、休んだり杖職人を使ったりせずに村を出ます。',
        '別の特徴マスを訪れずに同じ村を再び訪れた場合、前回選んだ選択肢が無効になることがあります。休むと杖職人はこの条件で無効になることがあります。出発するは常に選べます。',
        'これらの選択肢は、別の特徴マスを訪れる、別の村を訪れる、または死亡してリスポーンすると再び選べるようになります。',
      ],
    ],
  ])('defines the exact Village Actions rules after Features in %s', (
    language,
    featuresHeading,
    villageActionsHeading,
    paragraphs
  ) => {
    const sections = RULES_CONTENT[language].sections;
    const featuresIndex = sections.findIndex(
      ({ heading }) => heading === featuresHeading
    );
    const villageActionsSection = sections[featuresIndex + 1];

    expect(villageActionsSection).toEqual({
      heading: villageActionsHeading,
      paragraphs,
    });
    expect(villageActionsSection.paragraphs.join(' ')).not.toMatch(
      /loot chest|common token|rare token|戦利品の宝箱|コモントークン|レアトークン/i
    );
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
