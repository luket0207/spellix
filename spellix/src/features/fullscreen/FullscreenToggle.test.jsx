import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import FullscreenToggle from './FullscreenToggle';

describe('FullscreenToggle', () => {
  let exitFullscreen;
  let fullscreenElement;
  let originalExitFullscreen;
  let originalFullscreenElement;
  let originalRequestFullscreen;
  let originalWebkitExitFullscreen;
  let originalWebkitFullscreenElement;
  let originalWebkitRequestFullscreen;
  let requestFullscreen;
  let warnMock;

  beforeEach(() => {
    fullscreenElement = null;
    originalFullscreenElement = Object.getOwnPropertyDescriptor(
      document,
      'fullscreenElement'
    );
    originalExitFullscreen = Object.getOwnPropertyDescriptor(
      document,
      'exitFullscreen'
    );
    originalRequestFullscreen = Object.getOwnPropertyDescriptor(
      document.documentElement,
      'requestFullscreen'
    );
    originalWebkitFullscreenElement = Object.getOwnPropertyDescriptor(
      document,
      'webkitFullscreenElement'
    );
    originalWebkitExitFullscreen = Object.getOwnPropertyDescriptor(
      document,
      'webkitExitFullscreen'
    );
    originalWebkitRequestFullscreen = Object.getOwnPropertyDescriptor(
      document.documentElement,
      'webkitRequestFullscreen'
    );
    requestFullscreen = jest.fn().mockResolvedValue();
    exitFullscreen = jest.fn().mockResolvedValue();
    warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });
  });

  afterEach(() => {
    [
      [document, 'fullscreenElement', originalFullscreenElement],
      [document, 'exitFullscreen', originalExitFullscreen],
      [document, 'webkitFullscreenElement', originalWebkitFullscreenElement],
      [document, 'webkitExitFullscreen', originalWebkitExitFullscreen],
      [
        document.documentElement,
        'requestFullscreen',
        originalRequestFullscreen,
      ],
      [
        document.documentElement,
        'webkitRequestFullscreen',
        originalWebkitRequestFullscreen,
      ],
    ].forEach(([target, property, descriptor]) => {
      if (descriptor) {
        Object.defineProperty(target, property, descriptor);
      } else {
        delete target[property];
      }
    });
    jest.restoreAllMocks();
  });

  test('requests and exits fullscreen while the browser event drives icon state', async () => {
    render(<FullscreenToggle />);

    const enterButton = screen.getByRole('button', { name: 'Enter fullscreen' });

    expect(enterButton).toHaveClass(
      'floating-icon-button',
      'fullscreen-toggle-button'
    );
    expect(within(enterButton).getByRole('img', { hidden: true })).toHaveAttribute(
      'data-icon',
      'up-right-and-down-left-from-center'
    );

    fireEvent.click(enterButton);

    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();

    act(() => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    const exitButton = screen.getByRole('button', { name: 'Exit fullscreen' });

    expect(within(exitButton).getByRole('img', { hidden: true })).toHaveAttribute(
      'data-icon',
      'down-left-and-up-right-to-center'
    );

    fireEvent.click(exitButton);

    await waitFor(() => expect(exitFullscreen).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument();

    act(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();
  });

  test('syncs Japanese labels when fullscreen changes outside the button', () => {
    render(<FullscreenToggle language="jp" />);

    expect(
      screen.getByRole('button', {
        name: '\u5168\u753b\u9762\u8868\u793a\u306b\u3059\u308b',
      })
    ).toBeInTheDocument();

    act(() => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(
      screen.getByRole('button', {
        name: '\u5168\u753b\u9762\u8868\u793a\u3092\u7d42\u4e86\u3059\u308b',
      })
    ).toBeInTheDocument();
  });

  test('handles a rejected fullscreen request without changing actual state', async () => {
    const error = new Error('Fullscreen blocked');

    requestFullscreen.mockRejectedValueOnce(error);
    render(<FullscreenToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));

    await waitFor(() =>
      expect(warnMock).toHaveBeenCalledWith('Fullscreen toggle failed.', error)
    );
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();
  });

  test('uses safe WebKit-prefixed fallbacks when standard APIs are unavailable', async () => {
    const webkitRequestFullscreen = jest.fn().mockResolvedValue();
    const webkitExitFullscreen = jest.fn().mockResolvedValue();
    let webkitFullscreenElement = null;

    delete document.documentElement.requestFullscreen;
    delete document.exitFullscreen;
    Object.defineProperty(document, 'webkitFullscreenElement', {
      configurable: true,
      get: () => webkitFullscreenElement,
    });
    Object.defineProperty(document, 'webkitExitFullscreen', {
      configurable: true,
      value: webkitExitFullscreen,
    });
    Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', {
      configurable: true,
      value: webkitRequestFullscreen,
    });

    render(<FullscreenToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));

    await waitFor(() =>
      expect(webkitRequestFullscreen).toHaveBeenCalledTimes(1)
    );

    act(() => {
      webkitFullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }));

    await waitFor(() => expect(webkitExitFullscreen).toHaveBeenCalledTimes(1));
  });

  test('positions the shared 30px icon button directly below music', () => {
    render(<FullscreenToggle />);

    const stylesheet = readFileSync(`${__dirname}/../../App.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.fullscreen-toggle-button\s*{[^}]*top:\s*70px;[^}]*left:\s*10px;/s
    );
    expect(stylesheet).toMatch(
      /\.floating-icon-button svg\s*{[^}]*width:\s*30px;[^}]*height:\s*30px;/s
    );
  });
});
