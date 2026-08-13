import { readFileSync } from 'fs';
import packageJson from '../package.json';

test('configures the CRA GitHub Pages deployment contract', () => {
  expect(packageJson.homepage).toBe('https://luket0207.github.io/spellix');
  expect(packageJson.devDependencies?.['gh-pages']).toBeDefined();
  expect(packageJson.scripts.predeploy).toBe('npm run build');
  expect(packageJson.scripts.deploy).toBe('gh-pages -d build');
});

test('uses hash routing for refresh-safe GitHub Pages routes', () => {
  const entrySource = readFileSync('src/index.jsx', 'utf8');

  expect(entrySource).toMatch(/import \{ HashRouter \} from 'react-router-dom'/);
  expect(entrySource).toMatch(/<HashRouter[\s>]/);
  expect(entrySource).toMatch(/<\/HashRouter>/);
  expect(entrySource).not.toMatch(/BrowserRouter/);
});
