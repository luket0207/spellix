import { readFileSync } from 'fs';
import { act, render, screen } from '@testing-library/react';
import MultiDiceRoll from './MultiDiceRoll';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('rolls two dice simultaneously and reports their total after both resolve', () => {
  const onRollComplete = jest.fn();
  const onSequenceComplete = jest.fn();
  jest
    .spyOn(Math, 'random')
    .mockReturnValueOnce(0.34)
    .mockReturnValueOnce(0.8);

  render(
    <MultiDiceRoll
      diceCount={2}
      onRollComplete={onRollComplete}
      onSequenceComplete={onSequenceComplete}
    />
  );

  expect(screen.getAllByLabelText('Dice roller')).toHaveLength(2);
  expect(screen.getAllByRole('img', { name: 'Dice rolling' })).toHaveLength(2);

  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(screen.getByRole('img', { name: 'Dice face 3' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Dice face 5' })).toBeInTheDocument();
  expect(onRollComplete).toHaveBeenCalledWith(8, [3, 5]);
  expect(onSequenceComplete).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(onSequenceComplete).toHaveBeenCalledWith(8, [3, 5]);
});

test('forces only the first of three dice and leaves the remaining dice random', () => {
  const onRollComplete = jest.fn();
  const randomSpy = jest
    .spyOn(Math, 'random')
    .mockReturnValueOnce(0.7)
    .mockReturnValueOnce(0.99);

  render(
    <MultiDiceRoll
      diceCount={3}
      forcedFirstResult={4}
      onRollComplete={onRollComplete}
    />
  );

  act(() => {
    jest.advanceTimersByTime(1500);
  });

  expect(screen.getByRole('img', { name: 'Dice face 4' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Dice face 5' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Dice face 6' })).toBeInTheDocument();
  expect(onRollComplete).toHaveBeenCalledWith(15, [4, 5, 6]);
  expect(randomSpy).toHaveBeenCalledTimes(2);
});

test('lays out repeated DiceRoll components horizontally', () => {
  const stylesheet = readFileSync(`${__dirname}/MultiDiceRoll.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.multi-dice-roll-dice\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;/s
  );
});
