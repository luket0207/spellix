import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { readFileSync } from 'fs';
import MusicPlayer from './MusicPlayer';

const TEST_TRACKS = Array.from(
  { length: 10 },
  (_, index) => `track-${index + 1}.mp3`
);

describe('MusicPlayer', () => {
  let pauseMock;
  let playMock;
  let warnMock;

  beforeEach(() => {
    pauseMock = jest
      .spyOn(window.HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {});
    playMock = jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue();
    warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('attempts autoplay and toggles pause and resume without changing track', async () => {
    render(<MusicPlayer randomFn={() => 0} tracks={TEST_TRACKS} />);

    const audio = screen.getByLabelText('Background music');
    const musicButton = screen.getByRole('button', { name: 'Turn music off' });
    const initialSource = audio.getAttribute('src');

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
    expect(audio.volume).toBe(0.35);
    expect(musicButton).toHaveClass(
      'floating-icon-button',
      'music-toggle-button'
    );
    expect(within(musicButton).getByRole('img', { hidden: true })).toHaveAttribute(
      'data-icon',
      'volume'
    );

    audio.currentTime = 42;
    fireEvent.click(musicButton);

    expect(pauseMock).toHaveBeenCalledTimes(1);
    const enableButton = screen.getByRole('button', { name: 'Turn music on' });

    expect(enableButton).toBeInTheDocument();
    expect(within(enableButton).getByRole('img', { hidden: true })).toHaveAttribute(
      'data-icon',
      'volume-xmark'
    );
    expect(audio).toHaveAttribute('src', initialSource);
    expect(audio.currentTime).toBe(42);

    fireEvent.click(screen.getByRole('button', { name: 'Turn music on' }));

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Turn music off' })).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', initialSource);
  });

  test('retries blocked autoplay after the first user interaction', async () => {
    playMock.mockRejectedValueOnce(new Error('Autoplay blocked'));
    render(<MusicPlayer randomFn={() => 0} tracks={TEST_TRACKS} />);

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.keyDown(document, { key: 'Enter' });

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(2));
  });

  test('advances on ended and skips failed tracks without overlapping audio', async () => {
    render(<MusicPlayer randomFn={() => 0} tracks={TEST_TRACKS} />);

    const audio = screen.getByLabelText('Background music');
    const firstSource = audio.getAttribute('src');

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
    fireEvent.ended(audio);

    await waitFor(() => expect(audio.getAttribute('src')).not.toBe(firstSource));
    const secondSource = audio.getAttribute('src');

    fireEvent.error(audio);

    await waitFor(() => expect(audio.getAttribute('src')).not.toBe(secondSource));
    expect(warnMock).toHaveBeenCalledWith(
      'Background music track failed to load.',
      secondSource
    );
    expect(screen.getAllByLabelText('Background music')).toHaveLength(1);
  });

  test('disables safely after every available track fails', async () => {
    render(<MusicPlayer randomFn={() => 0} tracks={['broken.mp3']} />);

    const audio = screen.getByLabelText('Background music');

    fireEvent.error(audio);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Music unavailable' })).toBeDisabled()
    );
  });

  test('uses Japanese toggle labels and the specified shared floating styles', () => {
    render(
      <MusicPlayer language="jp" randomFn={() => 0} tracks={TEST_TRACKS} />
    );

    expect(
      screen.getByRole('button', {
        name: '\u97f3\u697d\u3092\u30aa\u30d5\u306b\u3059\u308b',
      })
    ).toBeInTheDocument();

    const stylesheet = readFileSync(`${__dirname}/../../App.css`, 'utf8');
    const componentSource = readFileSync(`${__dirname}/MusicPlayer.jsx`, 'utf8');

    expect(stylesheet).toMatch(
      /\.floating-icon-button\s*{[^}]*width:\s*50px;[^}]*height:\s*50px;[^}]*background:\s*#302419;[^}]*color:\s*#C6CC0C;[^}]*border:\s*2px solid #C6CC0C;[^}]*border-radius:\s*10px;[^}]*z-index:\s*9999;/s
    );
    expect(stylesheet).toMatch(
      /\.floating-icon-button svg\s*{[^}]*width:\s*30px;[^}]*height:\s*30px;/s
    );
    expect(stylesheet).toMatch(
      /\.music-toggle-button\s*{[^}]*top:\s*10px;[^}]*left:\s*10px;/s
    );
    expect(stylesheet).toMatch(
      /\.settings-floating-button\s*{[^}]*top:\s*10px;[^}]*right:\s*10px;/s
    );
    expect(componentSource).toMatch(/faVolumeXmark/);
    expect(componentSource).toMatch(/faVolume/);
  });
});
