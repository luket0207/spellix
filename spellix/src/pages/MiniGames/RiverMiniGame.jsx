import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../../features/gameSetup/pieceImages';
import { createRiverRows } from '../../features/miniGames/riverMiniGame';
import {
  getGameplayLanguage,
  getRiverMiniGameTranslations,
} from '../../i18n/translations';
import './RiverMiniGame.css';

const SAFE_SELECTION_DURATION = 300;
const ROW_TRANSITION_DURATION = 700;
const UNSAFE_DURATION = 1000;

function RiverMiniGame() {
  const navigate = useNavigate();
  const { completeMiniGame, currentPlayer, gameSetup, miniGameResult } = useGameSetup();
  const [activeRow, setActiveRow] = useState(1);
  const [phase, setPhase] = useState('idle');
  const [riverRows] = useState(() => createRiverRows());
  const [selectedRockId, setSelectedRockId] = useState('');
  const timersRef = useRef(new Set());
  const miniGamePlayer =
    gameSetup?.players?.find((player) => player.id === miniGameResult?.playerId) ??
    currentPlayer;
  const currentLanguage = getGameplayLanguage(miniGamePlayer?.language);
  const translations = getRiverMiniGameTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const currentRow = riverRows[activeRow - 1];
  const playerImageSource = getPieceImageSource(miniGamePlayer?.pieceImage);
  const resultText =
    phase === 'won'
      ? translations.win
      : phase === 'unsafe-selected' || phase === 'lost'
        ? translations.loss
        : translations.rowInstructions[activeRow - 1];

  const schedule = (callback, delay) => {
    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    },
    []
  );

  const finishMiniGame = (result, destination) => {
    completeMiniGame(result);
    navigate(destination);
  };

  const handleRockClick = (rock) => {
    if (phase !== 'idle') {
      return;
    }

    setSelectedRockId(rock.id);

    if (!rock.isSafe) {
      setPhase('unsafe-selected');
      schedule(() => {
        setPhase('lost');
      }, UNSAFE_DURATION);
      return;
    }

    setPhase('safe-selected');
    schedule(() => {
      if (activeRow === riverRows.length) {
        setPhase('won');
        return;
      }

      setPhase('exiting');
      schedule(() => {
        setActiveRow((currentActiveRow) => currentActiveRow + 1);
        setSelectedRockId('');
        setPhase('entering');
        schedule(() => setPhase('idle'), ROW_TRANSITION_DURATION);
      }, ROW_TRANSITION_DURATION);
    }, SAFE_SELECTION_DURATION);
  };

  const handleContinue = () => {
    if (phase === 'won') {
      finishMiniGame('win', '/mini-game/loot-chest');
    } else if (phase === 'lost') {
      finishMiniGame('loss', '/mini-game/lose');
    }
  };

  const rowClassName = [
    'river-row',
    phase === 'exiting' ? 'river-row--exiting' : '',
    phase === 'entering' ? 'river-row--entering' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className="river-mini-game-page">
      <section className="river-mini-game-layout">
        <div className="river-mini-game-instructions">
          <p className={`river-mini-game-main-instruction ${languageClassName}`}>
            {translations.mainInstruction}
          </p>
          <p
            aria-live="polite"
            className={`river-mini-game-row-instruction ${languageClassName}`}
          >
            {resultText}
          </p>
        </div>

        {currentRow && phase !== 'won' && phase !== 'lost' ? (
          <div aria-label={`River row ${activeRow}`} className={rowClassName} role="group">
            {currentRow.rocks.map((rock, rockIndex) => {
              const rockClassName = [
                'river-rock',
                selectedRockId === rock.id && rock.isSafe ? 'river-rock--safe' : '',
                selectedRockId === rock.id && !rock.isSafe ? 'river-rock--unsafe' : '',
              ]
                .filter(Boolean)
                .join(' ');
              const rockLabel = `Row ${activeRow} rock ${rockIndex + 1}`;

              return (
                <button
                  aria-label={rockLabel}
                  className={rockClassName}
                  disabled={phase !== 'idle'}
                  key={rock.id}
                  type="button"
                  onClick={() => handleRockClick(rock)}
                >
                  <img
                    alt={rockLabel}
                    className="river-rock-image"
                    draggable="false"
                    src={rock.imageSrc}
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        {phase === 'won' || phase === 'lost' ? (
          <div className="river-result-actions">
            <Button className={languageClassName} type="button" onClick={handleContinue}>
              {translations.continue}
            </Button>
          </div>
        ) : null}

        {playerImageSource ? (
          <img
            alt="Current player character"
            className="river-mini-game-player"
            src={playerImageSource}
          />
        ) : null}
      </section>
    </main>
  );
}

export default RiverMiniGame;
