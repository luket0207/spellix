import { useRef, useState } from 'react';
import DiceRoll from '../../components/dice/DiceRoll';
import './MultiDiceRoll.css';

function MultiDiceRoll({
  aggregateResultText = null,
  diceCount,
  forcedFirstResult = null,
  onRollComplete,
  onSequenceComplete,
  resultDurationExtensionMs = 0,
}) {
  const [totalResult, setTotalResult] = useState(null);
  const rollResultsRef = useRef(Array(diceCount).fill(null));
  const completedSequencesRef = useRef(0);
  const didReportRollRef = useRef(false);
  const didReportSequenceRef = useRef(false);

  const handleRollComplete = (index, result) => {
    rollResultsRef.current[index] = result;

    if (
      !didReportRollRef.current &&
      rollResultsRef.current.every((value) => value !== null)
    ) {
      const results = [...rollResultsRef.current];
      const total = results.reduce((sum, value) => sum + value, 0);

      didReportRollRef.current = true;
      setTotalResult(total);
      onRollComplete?.(total, results);
    }
  };

  const handleSequenceComplete = () => {
    completedSequencesRef.current += 1;

    if (
      !didReportSequenceRef.current &&
      completedSequencesRef.current === diceCount
    ) {
      const results = [...rollResultsRef.current];
      const total = results.reduce((sum, value) => sum + value, 0);

      didReportSequenceRef.current = true;
      onSequenceComplete?.(total, results);
    }
  };

  return (
    <section aria-label="Multi dice roller" className="multi-dice-roll">
      <div className="multi-dice-roll-dice">
        {Array.from({ length: diceCount }, (_, index) => (
          <DiceRoll
            forcedResult={index === 0 ? forcedFirstResult : null}
            key={index}
            mode="temporary"
            onRollComplete={(result) => handleRollComplete(index, result)}
            onSequenceComplete={handleSequenceComplete}
            resultDurationExtensionMs={resultDurationExtensionMs}
          />
        ))}
      </div>
      {totalResult !== null && aggregateResultText ? (
        <div
          aria-live="polite"
          className="dice-roll-result dice-roll-result--visible"
        >
          {aggregateResultText(totalResult)}
        </div>
      ) : null}
    </section>
  );
}

export default MultiDiceRoll;
