import { readFileSync } from 'fs';

const projectSource = `${__dirname}/../../..`;

function readSource(relativePath) {
  return readFileSync(`${projectSource}/${relativePath}`, 'utf8');
}

describe('global Button adoption', () => {
  test.each([
    'pages/GameSetupPage.jsx',
    'pages/GameplayPage.jsx',
    'pages/RewardPage.jsx',
    'features/spells/SpellsModal.jsx',
    'components/dice/DiceRoll.jsx',
  ])('replaces native action buttons in %s', (relativePath) => {
    const source = readSource(relativePath);

    expect(source).toMatch(/import Button from/);
    expect(source).not.toMatch(/<button[\s>]/);
    expect(source).toMatch(/<Button[\s>]/);
  });

  test('converts settings actions but keeps the settings cog native', () => {
    const source = readSource('App.jsx');

    expect(source).toMatch(/import Button from/);
    expect(source.match(/<button[\s>]/g)).toHaveLength(1);
    expect(source.match(/<Button[\s>]/g)).toHaveLength(3);
  });

  test('converts respawn while preserving battle debug and forced-dice controls', () => {
    const source = readSource('pages/BattlePage.jsx');

    expect(source).toMatch(/import Button from/);
    expect(source).toMatch(/<Button[^>]*variant="secondary"[^>]*>/s);
    expect(source.match(/<button[\s>]/g)).toHaveLength(4);
  });

  test('uses secondary variants for modal actions and primary defaults elsewhere', () => {
    const gameplaySource = readSource('pages/GameplayPage.jsx');
    const spellsSource = readSource('features/spells/SpellsModal.jsx');
    const battleSource = readSource('pages/BattlePage.jsx');
    const rewardSource = readSource('pages/RewardPage.jsx');
    const appSource = readSource('App.jsx');

    expect(gameplaySource.match(/variant="secondary"/g)).toHaveLength(5);
    expect(spellsSource.match(/variant="secondary"/g)).toHaveLength(2);
    expect(battleSource.match(/variant="secondary"/g)).toHaveLength(1);
    expect(rewardSource).not.toMatch(/variant="secondary"/);
    expect(appSource).not.toMatch(/variant="secondary"/);
  });

  test('keeps bespoke, debug, and draggable controls outside global Button styling', () => {
    const excludedSources = [
      readSource('pages/StartPage.jsx'),
      readSource('features/debug/DebugModal.jsx'),
      readSource('features/debug/DebugPotionGrantControls.jsx'),
      readSource('features/spells/SpellTokenAssignment.jsx'),
    ];

    excludedSources.forEach((source) => {
      expect(source).not.toMatch(/import Button from/);
      expect(source).toMatch(/<button[\s>]/);
    });
  });
});
