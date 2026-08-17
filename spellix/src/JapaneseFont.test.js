import { readFileSync } from 'fs';

function readStylesheet(relativePath) {
  return readFileSync(`${__dirname}/${relativePath}`, 'utf8');
}

test('loads M PLUS Rounded 1c once and applies it through the existing Japanese class', () => {
  const globalStylesheet = readStylesheet('index.css');

  expect(globalStylesheet).toMatch(
    /@import url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?family=Fontdiner\+Swanky&family=M\+PLUS\+Rounded\+1c:wght@400;500;700&family=Unkempt:wght@400;700&display=swap['"]\);/
  );
  expect(globalStylesheet).toMatch(
    /\.language-jp\s*{[^}]*font-family:\s*'M PLUS Rounded 1c',\s*sans-serif;/s
  );
  expect(globalStylesheet).toMatch(
    /\.language-en\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;/s
  );
});

test('uses M PLUS Rounded 1c in existing local Japanese-capable font overrides', () => {
  const buttonStylesheet = readStylesheet('components/common/Button/Button.css');
  const diceStylesheet = readStylesheet('components/dice/DiceRoll.css');
  const startStylesheet = readStylesheet('pages/StartPage.css');
  const setupStylesheet = readStylesheet('pages/GameSetupPage.css');

  expect(buttonStylesheet).toMatch(
    /\.fantasy-button\.language-jp\s*{[^}]*font-family:\s*'M PLUS Rounded 1c',\s*sans-serif;/s
  );
  expect(diceStylesheet).toMatch(
    /\.dice-roll-result\s*{[^}]*font-family:\s*"Unkempt",\s*"M PLUS Rounded 1c",\s*sans-serif;/s
  );
  expect(startStylesheet).toMatch(
    /\.start-page-button \.language-jp\s*{[^}]*font-family:\s*'M PLUS Rounded 1c',\s*sans-serif;/s
  );
  expect(setupStylesheet.match(/'M PLUS Rounded 1c'/g)).toHaveLength(3);
});

test('removes Noto Serif JP while preserving the HealthBar Unkempt exception', () => {
  const allFontStylesheets = [
    readStylesheet('index.css'),
    readStylesheet('components/common/Button/Button.css'),
    readStylesheet('components/dice/DiceRoll.css'),
    readStylesheet('pages/StartPage.css'),
    readStylesheet('pages/GameSetupPage.css'),
  ].join('\n');
  const healthStylesheet = readStylesheet('components/health/HealthBar.css');

  expect(allFontStylesheets).not.toContain('Noto Serif JP');
  expect(healthStylesheet).toMatch(
    /\.health-bar-text\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;/s
  );
  expect(healthStylesheet).not.toContain('M PLUS Rounded 1c');
});
