import { useCallback, useEffect, useRef, useState } from 'react';
import './DiceRoll.css';

export const PERSISTENT_ROLL_DURATION_MS = 2000;
export const PERSISTENT_RESULT_DURATION_MS = 2000;
export const TEMPORARY_ROLL_DURATION_MS = 1500;
export const TEMPORARY_RESULT_DURATION_MS = 1500;

const FACE_DOT_POSITIONS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function getDiceResult() {
  return Math.floor(Math.random() * 6) + 1;
}

function DiceRoll({
  autoRoll = false,
  autoRollRequestId = 0,
  disabled = false,
  forcedRollRequest = null,
  mode = 'persistent',
  onRollComplete,
  onRollStart,
  onSequenceComplete,
}) {
  const [faceValue, setFaceValue] = useState(1);
  const [pendingFaceValue, setPendingFaceValue] = useState(1);
  const [phase, setPhase] = useState('rest');
  const phaseRef = useRef('rest');
  const resultTimeoutRef = useRef(null);
  const rollTimeoutRef = useRef(null);
  const disabledRef = useRef(disabled);
  const onRollCompleteRef = useRef(onRollComplete);
  const onRollStartRef = useRef(onRollStart);
  const onSequenceCompleteRef = useRef(onSequenceComplete);

  disabledRef.current = disabled;
  onRollCompleteRef.current = onRollComplete;
  onRollStartRef.current = onRollStart;
  onSequenceCompleteRef.current = onSequenceComplete;

  const clearTimers = useCallback(() => {
    window.clearTimeout(rollTimeoutRef.current);
    window.clearTimeout(resultTimeoutRef.current);
  }, []);

  const startRoll = useCallback((ignoreDisabled = false, forcedResult = null) => {
    if (
      phaseRef.current !== 'rest' ||
      (mode === 'persistent' && disabledRef.current && !ignoreDisabled)
    ) {
      return;
    }

    const result = forcedResult ?? getDiceResult();
    const rollMode = mode;
    const rollDuration =
      rollMode === 'temporary' ? TEMPORARY_ROLL_DURATION_MS : PERSISTENT_ROLL_DURATION_MS;
    const resultDuration =
      rollMode === 'temporary' ? TEMPORARY_RESULT_DURATION_MS : PERSISTENT_RESULT_DURATION_MS;

    phaseRef.current = 'rolling';
    setPendingFaceValue(result);
    setPhase('rolling');
    onRollStartRef.current?.(result);

    rollTimeoutRef.current = window.setTimeout(() => {
      setFaceValue(result);
      phaseRef.current = 'result';
      setPhase('result');
      onRollCompleteRef.current?.(result);

      resultTimeoutRef.current = window.setTimeout(() => {
        phaseRef.current = 'rest';
        setPhase('rest');
        onSequenceCompleteRef.current?.(result);
      }, resultDuration);
    }, rollDuration);
  }, [mode]);

  useEffect(() => {
    if (mode === 'temporary') {
      startRoll();
    }

    return () => {
      clearTimers();
      phaseRef.current = 'rest';
    };
  }, [clearTimers, mode, startRoll]);

  useEffect(() => {
    if (mode === 'persistent' && autoRoll) {
      startRoll(true);
    }
  }, [autoRoll, autoRollRequestId, mode, startRoll]);

  useEffect(() => {
    if (mode === 'persistent' && forcedRollRequest) {
      startRoll(false, forcedRollRequest.value);
    }
  }, [forcedRollRequest, mode, startRoll]);

  const displayedFaceValue = phase === 'rolling' ? pendingFaceValue : faceValue;
  const isResultVisible = phase === 'result';

  return (
    <section aria-label="Dice roller" className={`dice-roll dice-roll--${mode}`}>
      <div className="dice-roll-scene">
        <div
          aria-label={phase === 'rolling' ? 'Dice rolling' : `Dice face ${faceValue}`}
          className={`dice-roll-cube dice-roll-cube--face-${displayedFaceValue}${
            phase === 'rolling' ? ' dice-roll-cube--rolling' : ''
          }`}
          role="img"
        >
          {Object.entries(FACE_DOT_POSITIONS).map(([face, activeDots]) => (
            <div
              aria-hidden="true"
              className={`dice-roll-cube-face dice-roll-cube-face--${face}`}
              key={face}
            >
              {Array.from({ length: 9 }, (_, index) => {
                const position = index + 1;

                return (
                  <span
                    className={`dice-roll-dot${
                      activeDots.includes(position) ? ' dice-roll-dot--visible' : ''
                    }`}
                    key={position}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p
        aria-hidden={!isResultVisible}
        aria-live="polite"
        className={`dice-roll-result dice-roll-result--${isResultVisible ? 'visible' : 'hidden'}`}
      >
        {`Dice result: ${faceValue}`}
      </p>

      {mode === 'persistent' ? (
        <button disabled={disabled || phase !== 'rest'} type="button" onClick={() => startRoll()}>
          Roll Dice
        </button>
      ) : null}
    </section>
  );
}

export default DiceRoll;
