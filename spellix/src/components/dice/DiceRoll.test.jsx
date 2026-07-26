import { act, fireEvent, render, screen } from '@testing-library/react';
import DiceRoll, {
  PERSISTENT_RESULT_DURATION_MS,
  PERSISTENT_ROLL_DURATION_MS,
  TEMPORARY_RESULT_DURATION_MS,
  TEMPORARY_ROLL_DURATION_MS,
} from './DiceRoll';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('persistent mode rolls repeatedly and locks its button through both timed phases', () => {
  const onRollComplete = jest.fn();
  const onSequenceComplete = jest.fn();
  jest.spyOn(Math, 'random').mockReturnValueOnce(0.999).mockReturnValueOnce(0);

  render(
    <DiceRoll
      mode="persistent"
      onRollComplete={onRollComplete}
      onSequenceComplete={onSequenceComplete}
    />
  );

  const rollButton = screen.getByRole('button', { name: /roll dice/i });
  const resultDisplay = screen.getByText(/dice result: 1/i);
  const diceCube = screen.getByRole('img', { name: /dice face 1/i });

  expect(diceCube).toHaveClass('dice-roll-cube--face-1');
  expect(diceCube.parentElement).toHaveClass('dice-roll-scene');
  expect(screen.getByLabelText(/dice roller/i)).toHaveClass('dice-roll--persistent');
  expect(diceCube.querySelectorAll('.dice-roll-cube-face')).toHaveLength(6);
  expect(resultDisplay).toHaveClass('dice-roll-result--hidden');
  expect(rollButton).toBeEnabled();

  fireEvent.click(rollButton);

  expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
    'dice-roll-cube--rolling',
    'dice-roll-cube--face-6'
  );
  expect(rollButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS);
  });

  expect(screen.getByRole('img', { name: /dice face 6/i })).toHaveClass(
    'dice-roll-cube--face-6'
  );
  expect(screen.getByText(/dice result: 6/i)).toHaveClass('dice-roll-result--visible');
  expect(onRollComplete).toHaveBeenLastCalledWith(6);
  expect(rollButton).toBeDisabled();

  act(() => {
    jest.advanceTimersByTime(PERSISTENT_RESULT_DURATION_MS);
  });

  expect(screen.getByText(/dice result: 6/i)).toHaveClass('dice-roll-result--hidden');
  expect(rollButton).toBeEnabled();
  expect(onSequenceComplete).toHaveBeenCalledWith(6);

  fireEvent.click(rollButton);
  act(() => {
    jest.advanceTimersByTime(
      PERSISTENT_ROLL_DURATION_MS + PERSISTENT_RESULT_DURATION_MS
    );
  });

  expect(screen.getByRole('img', { name: /dice face 1/i })).toHaveClass(
    'dice-roll-cube--face-1'
  );
  expect(onRollComplete).toHaveBeenLastCalledWith(1);
  expect(onRollComplete).toHaveBeenCalledTimes(2);
  expect(onSequenceComplete).toHaveBeenLastCalledWith(1);
  expect(onSequenceComplete).toHaveBeenCalledTimes(2);
  expect(rollButton).toBeEnabled();
});

test('temporary mode auto-rolls once and reports completion after the result phase', () => {
  const onRollComplete = jest.fn();
  const onSequenceComplete = jest.fn();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);

  render(
    <DiceRoll
      mode="temporary"
      onRollComplete={onRollComplete}
      onSequenceComplete={onSequenceComplete}
    />
  );

  expect(screen.queryByRole('button', { name: /roll dice/i })).not.toBeInTheDocument();
  expect(screen.getByLabelText(/dice roller/i)).toHaveClass('dice-roll--temporary');
  expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(TEMPORARY_ROLL_DURATION_MS - 1);
  });

  expect(onRollComplete).not.toHaveBeenCalled();
  expect(onSequenceComplete).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(screen.getByRole('img', { name: /dice face 4/i })).toHaveClass(
    'dice-roll-cube--face-4'
  );
  expect(screen.getByText(/dice result: 4/i)).toHaveClass('dice-roll-result--visible');
  expect(onRollComplete).toHaveBeenCalledWith(4);
  expect(onSequenceComplete).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(TEMPORARY_RESULT_DURATION_MS - 1);
  });

  expect(onSequenceComplete).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(1);
  });

  expect(onSequenceComplete).toHaveBeenCalledWith(4);
});

test('persistent mode respects an external disabled state', () => {
  const onRollComplete = jest.fn();
  const { rerender } = render(
    <DiceRoll disabled mode="persistent" onRollComplete={onRollComplete} />
  );

  const rollButton = screen.getByRole('button', { name: /roll dice/i });

  expect(rollButton).toBeDisabled();
  fireEvent.click(rollButton);

  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS + PERSISTENT_RESULT_DURATION_MS);
  });

  expect(onRollComplete).not.toHaveBeenCalled();

  rerender(<DiceRoll mode="persistent" onRollComplete={onRollComplete} />);

  expect(rollButton).toBeEnabled();
});

test('persistent mode auto-rolls once per activation while its button remains disabled', () => {
  const onRollComplete = jest.fn();
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const { rerender } = render(
    <DiceRoll autoRoll disabled mode="persistent" onRollComplete={onRollComplete} />
  );

  expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();
  expect(screen.getByRole('img', { name: /dice rolling/i })).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS + PERSISTENT_RESULT_DURATION_MS);
  });

  expect(onRollComplete).toHaveBeenCalledTimes(1);
  expect(onRollComplete).toHaveBeenCalledWith(4);

  rerender(<DiceRoll autoRoll disabled mode="persistent" onRollComplete={onRollComplete} />);
  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS + PERSISTENT_RESULT_DURATION_MS);
  });

  expect(onRollComplete).toHaveBeenCalledTimes(1);
});

test('persistent mode animates each requested forced result without using random generation', () => {
  const onRollComplete = jest.fn();
  const onRollStart = jest.fn();
  const randomSpy = jest.spyOn(Math, 'random');
  const { rerender } = render(
    <DiceRoll mode="persistent" onRollComplete={onRollComplete} onRollStart={onRollStart} />
  );

  for (let value = 1; value <= 6; value += 1) {
    rerender(
      <DiceRoll
        forcedRollRequest={{ id: value, value }}
        mode="persistent"
        onRollComplete={onRollComplete}
        onRollStart={onRollStart}
      />
    );

    expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
      `dice-roll-cube--face-${value}`
    );
    expect(onRollStart).toHaveBeenLastCalledWith(value);

    act(() => {
      jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS);
    });

    expect(screen.getByRole('img', { name: `Dice face ${value}` })).toHaveClass(
      `dice-roll-cube--face-${value}`
    );
    expect(screen.getByText(`Dice result: ${value}`)).toHaveClass(
      'dice-roll-result--visible'
    );
    expect(onRollComplete).toHaveBeenLastCalledWith(value);

    act(() => {
      jest.advanceTimersByTime(PERSISTENT_RESULT_DURATION_MS);
    });
  }

  expect(onRollStart).toHaveBeenCalledTimes(6);
  expect(onRollComplete).toHaveBeenCalledTimes(6);
  expect(randomSpy).not.toHaveBeenCalled();
});

test('persistent forcedResult waits for a click and the following roll is random again', () => {
  const onRollComplete = jest.fn();
  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
  const { rerender } = render(
    <DiceRoll forcedResult={4} mode="persistent" onRollComplete={onRollComplete} />
  );
  const rollButton = screen.getByRole('button', { name: /roll dice/i });

  expect(screen.getByRole('img', { name: /dice face 1/i })).toBeInTheDocument();
  expect(randomSpy).not.toHaveBeenCalled();

  fireEvent.click(rollButton);
  expect(screen.getByRole('img', { name: /dice rolling/i })).toHaveClass(
    'dice-roll-cube--face-4'
  );
  expect(randomSpy).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS + PERSISTENT_RESULT_DURATION_MS);
  });
  expect(onRollComplete).toHaveBeenLastCalledWith(4);

  rerender(<DiceRoll forcedResult={null} mode="persistent" onRollComplete={onRollComplete} />);
  fireEvent.click(rollButton);
  act(() => {
    jest.advanceTimersByTime(PERSISTENT_ROLL_DURATION_MS);
  });

  expect(randomSpy).toHaveBeenCalledTimes(1);
  expect(onRollComplete).toHaveBeenLastCalledWith(1);
});
