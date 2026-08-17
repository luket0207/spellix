import { existsSync, readFileSync } from 'fs';
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

test('uses Spellix browser metadata and the provided ico favicon', () => {
  const html = readFileSync('public/index.html', 'utf8');
  const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
  const faviconLinks = html.match(/<link\s+rel="icon"[^>]*>/g) ?? [];

  expect(html).toMatch(/<title>Spellix<\/title>/);
  expect(html).not.toMatch(/<title>React App<\/title>/);
  expect(faviconLinks).toEqual([
    '<link rel="icon" href="%PUBLIC_URL%/favicon.ico" sizes="any" />',
  ]);
  expect(existsSync('public/favicon.ico')).toBe(true);
  expect(readFileSync('public/favicon.ico')).toEqual(
    readFileSync('src/images/favicon.ico')
  );
  expect(manifest.short_name).toBe('Spellix');
  expect(manifest.name).toBe('Spellix');
  expect(manifest.icons[0]).toEqual({
    src: 'favicon.png',
    sizes: '1254x1254',
    type: 'image/png',
  });
});
