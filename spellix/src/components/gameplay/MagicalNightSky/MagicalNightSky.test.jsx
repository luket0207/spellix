import { readFileSync } from 'fs';
import { act, render, screen } from '@testing-library/react';
import MagicalNightSky from './MagicalNightSky';

function createCyclingRandomFn() {
  const values = [0.05, 0.25, 0.45, 0.65, 0.85];
  let index = 0;

  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

describe('MagicalNightSky', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders doubled randomized stars and an initial mix of live spell effects', () => {
    render(<MagicalNightSky randomFn={createCyclingRandomFn()} />);

    const sky = screen.getByTestId('magical-night-sky');
    const stars = screen.getAllByTestId('magical-night-sky-star');
    const spellEffects = screen.getAllByTestId('magical-night-sky-spell');

    expect(sky).toHaveAttribute('aria-hidden', 'true');
    expect(stars).toHaveLength(96);
    expect(spellEffects).toHaveLength(3);
    expect(new Set(stars.map((star) => star.style.getPropertyValue('--sky-left'))).size).toBeGreaterThan(1);
    expect(new Set(stars.map((star) => star.style.getPropertyValue('--sky-duration'))).size).toBeGreaterThan(1);
    expect(spellEffects.filter((effect) => effect.dataset.effectType === 'orb')).toHaveLength(1);
    expect(spellEffects.filter((effect) => effect.dataset.effectType === 'comet')).toHaveLength(1);
    expect(spellEffects.filter((effect) => effect.dataset.effectType === 'swirl')).toHaveLength(1);
  });

  test('continuously spawns varied effects, removes completed nodes, and cleans up timers', () => {
    jest.useFakeTimers();
    let randomValue = 0;
    const randomFn = () => {
      randomValue = (randomValue + 0.137) % 1;
      return randomValue;
    };
    const view = render(<MagicalNightSky randomFn={randomFn} />);
    const initialEffects = screen.getAllByTestId('magical-night-sky-spell');
    const observedEffects = new Set(initialEffects);

    for (let interval = 0; interval < 8; interval += 1) {
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      const activeEffects = screen.getAllByTestId('magical-night-sky-spell');

      expect(activeEffects.length).toBeGreaterThan(0);
      expect(activeEffects.length).toBeLessThanOrEqual(8);
      activeEffects.forEach((effect) => observedEffects.add(effect));
    }

    const observedPositions = [...observedEffects].map((effect) => ({
      colour: effect.style.getPropertyValue('--sky-colour'),
      left: Number.parseFloat(effect.style.getPropertyValue('--sky-left')),
      top: Number.parseFloat(effect.style.getPropertyValue('--sky-top')),
      type: effect.dataset.effectType,
    }));

    initialEffects.forEach((effect) => expect(effect).not.toBeInTheDocument());
    expect(Math.min(...observedPositions.map(({ left }) => left))).toBeLessThan(20);
    expect(Math.max(...observedPositions.map(({ left }) => left))).toBeGreaterThan(80);
    expect(Math.min(...observedPositions.map(({ top }) => top))).toBeLessThan(20);
    expect(Math.max(...observedPositions.map(({ top }) => top))).toBeGreaterThan(80);
    expect(new Set(observedPositions.map(({ type }) => type))).toEqual(
      new Set(['orb', 'comet', 'swirl'])
    );
    expect(new Set(observedPositions.map(({ colour }) => colour)).size).toBeGreaterThan(3);
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    view.unmount();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('keeps generated positions stable across gameplay rerenders', () => {
    const view = render(<MagicalNightSky randomFn={createCyclingRandomFn()} />);
    const initialStarStyle = screen.getAllByTestId('magical-night-sky-star')[0].getAttribute('style');
    const initialSpellStyle = screen.getAllByTestId('magical-night-sky-spell')[0].getAttribute('style');

    view.rerender(<MagicalNightSky randomFn={() => 0.99} />);

    expect(screen.getAllByTestId('magical-night-sky-star')[0]).toHaveAttribute(
      'style',
      initialStarStyle
    );
    expect(screen.getAllByTestId('magical-night-sky-spell')[0]).toHaveAttribute(
      'style',
      initialSpellStyle
    );
  });

  test('does not consume gameplay Math.random values for decorative generation', () => {
    const gameplayRandomSpy = jest.spyOn(Math, 'random');

    render(<MagicalNightSky />);

    expect(gameplayRandomSpy).not.toHaveBeenCalled();
  });

  test('defines a non-interactive background layer, varied animations, and reduced-motion fallback', () => {
    const cssSource = readFileSync(
      `${__dirname}/MagicalNightSky.css`,
      'utf8'
    );

    expect(cssSource).toMatch(/\.magical-night-sky\s*{[^}]*position:\s*absolute;/s);
    expect(cssSource).toMatch(/\.magical-night-sky\s*{[^}]*pointer-events:\s*none;/s);
    expect(cssSource).toMatch(
      /\.magical-night-sky-spell\s*{[^}]*animation-iteration-count:\s*1;/s
    );
    expect(cssSource).toMatch(/@keyframes magical-night-sky-twinkle/);
    expect(cssSource).toMatch(/@keyframes magical-night-sky-orb/);
    expect(cssSource).toMatch(/@keyframes magical-night-sky-comet/);
    expect(cssSource).toMatch(/@keyframes magical-night-sky-swirl/);
    expect(cssSource).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
  });
});
