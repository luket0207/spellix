import { readFileSync } from 'fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

beforeEach(() => {
  jest
    .spyOn(window.HTMLMediaElement.prototype, 'pause')
    .mockImplementation(() => {});
  jest
    .spyOn(window.HTMLMediaElement.prototype, 'play')
    .mockResolvedValue();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('mounts one global music player outside route-specific pages', () => {
  const source = readFileSync(`${__dirname}/App.jsx`, 'utf8');

  expect(source.match(/<MusicPlayer/g)).toHaveLength(1);
  expect(source).toMatch(/<MusicPlayer[\s\S]*?<Routes>/s);
  expect(source).toMatch(
    /className="floating-icon-button settings-floating-button"/
  );
});

test('keeps the same music player and track mounted across route changes', async () => {
  render(
    <GameSetupProvider>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );

  const audio = screen.getByLabelText('Background music');
  const initialSource = audio.getAttribute('src');

  expect(screen.getByRole('button', { name: 'Turn music off' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /rules/i }));

  expect(
    await screen.findByRole('heading', { name: 'Rules of the game' })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Background music')).toBe(audio);
  expect(audio).toHaveAttribute('src', initialSource);
  expect(screen.getByRole('button', { name: 'Turn music off' })).toBeInTheDocument();
});
