import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BattleBackgroundSlideshow from '../components/BattleBackgroundSlideshow';
import Button from '../components/common/Button/Button';
import Modal from '../components/Modal';
import { ENEMIES } from '../features/battle/enemies';
import { getEnemyImageSource } from '../features/battle/enemyImages';
import { readSaveFile } from '../features/saveGame/saveGame';
import './StartPage.css';

const ENEMY_SIZE = 150;
const ENEMY_SAFE_ZONE_BUFFER = 24;
const ENEMY_POSITION_ATTEMPTS = 30;
const ENEMY_MINIMUM_DELAY_MS = 1500;
const ENEMY_MAXIMUM_DELAY_MS = 4500;
const ENEMY_VISIBLE_DURATION_MS = 2500;
const ENEMY_FADE_DURATION_MS = 1000;

function getRandomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function getRandomEnemyPosition(safeZoneElement) {
  if (!safeZoneElement) {
    return null;
  }

  const safeZone = safeZoneElement.getBoundingClientRect();
  const maximumLeft = Math.max(0, window.innerWidth - ENEMY_SIZE);
  const maximumTop = Math.max(0, window.innerHeight - ENEMY_SIZE);

  for (let attempt = 0; attempt < ENEMY_POSITION_ATTEMPTS; attempt += 1) {
    const left = getRandomInteger(0, maximumLeft);
    const top = getRandomInteger(0, maximumTop);
    const right = left + ENEMY_SIZE;
    const bottom = top + ENEMY_SIZE;
    const overlapsSafeZone =
      right > safeZone.left - ENEMY_SAFE_ZONE_BUFFER &&
      left < safeZone.right + ENEMY_SAFE_ZONE_BUFFER &&
      bottom > safeZone.top - ENEMY_SAFE_ZONE_BUFFER &&
      top < safeZone.bottom + ENEMY_SAFE_ZONE_BUFFER;

    if (!overlapsSafeZone) {
      return { left, top };
    }
  }

  return null;
}

function StartPage({ onLoadGame = () => {}, onStart = () => {} }) {
  const navigate = useNavigate();
  const loadFileInputRef = useRef(null);
  const safeZoneRef = useRef(null);
  const [decorativeEnemy, setDecorativeEnemy] = useState(null);
  const [isLoadErrorOpen, setIsLoadErrorOpen] = useState(false);

  const handleLoadFile = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const saveData = await readSaveFile(file);

      onLoadGame(saveData);
    } catch (_error) {
      setIsLoadErrorOpen(true);
    }
  };

  useEffect(() => {
    let appearanceTimeoutId;
    let fadeInAnimationFrameId;
    let fadeOutTimeoutId;
    let removalTimeoutId;
    let isActive = true;
    const handleResize = () => setDecorativeEnemy(null);

    const scheduleEnemyAppearance = () => {
      const delay = getRandomInteger(
        ENEMY_MINIMUM_DELAY_MS,
        ENEMY_MAXIMUM_DELAY_MS
      );

      appearanceTimeoutId = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        const position = getRandomEnemyPosition(safeZoneRef.current);
        const enemy = ENEMIES[getRandomInteger(0, ENEMIES.length - 1)];
        const source = getEnemyImageSource(enemy?.imageFileName);

        if (position && enemy && source) {
          setDecorativeEnemy({
            id: enemy.id,
            isVisible: false,
            left: position.left,
            source,
            top: position.top,
          });

          fadeInAnimationFrameId = window.requestAnimationFrame(() => {
            if (!isActive) {
              return;
            }

            setDecorativeEnemy((currentEnemy) =>
              currentEnemy ? { ...currentEnemy, isVisible: true } : null
            );
          });
        }

        fadeOutTimeoutId = window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          setDecorativeEnemy((currentEnemy) =>
            currentEnemy ? { ...currentEnemy, isVisible: false } : null
          );

          removalTimeoutId = window.setTimeout(() => {
            if (!isActive) {
              return;
            }

            setDecorativeEnemy(null);
            scheduleEnemyAppearance();
          }, ENEMY_FADE_DURATION_MS);
        }, ENEMY_VISIBLE_DURATION_MS);
      }, delay);
    };

    scheduleEnemyAppearance();
    window.addEventListener('resize', handleResize);

    return () => {
      isActive = false;
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(appearanceTimeoutId);
      window.cancelAnimationFrame(fadeInAnimationFrameId);
      window.clearTimeout(fadeOutTimeoutId);
      window.clearTimeout(removalTimeoutId);
    };
  }, []);

  return (
    <main className="start-page">
      <BattleBackgroundSlideshow />

      {decorativeEnemy ? (
        <span
          aria-hidden="true"
          className={`start-page-enemy${
            decorativeEnemy.isVisible ? ' start-page-enemy--visible' : ''
          }`}
          data-testid="start-page-enemy"
          style={{ left: decorativeEnemy.left, top: decorativeEnemy.top }}
        >
          <img alt="" src={decorativeEnemy.source} />
        </span>
      ) : null}

      <div className="start-page-safe-zone" ref={safeZoneRef}>
        <h1 className="start-page-title">Spellix</h1>
        <button
          className="start-page-button"
          type="button"
          onClick={() => {
            onStart();
            navigate('/setup');
          }}
        >
          Start
        </button>
        <button
          className="start-page-button"
          type="button"
          onClick={() => navigate('/rules')}
        >
          Rules - ルール
        </button>
        <button
          className="start-page-button"
          type="button"
          onClick={() => {
            setIsLoadErrorOpen(false);
            loadFileInputRef.current?.click();
          }}
        >
          Load Game - ゲームを読み込む
        </button>
        <input
          accept=".txt,text/plain"
          aria-label="Load saved game file"
          hidden
          ref={loadFileInputRef}
          type="file"
          onChange={handleLoadFile}
        />
      </div>

      <Modal
        actions={
          <Button type="button" onClick={() => setIsLoadErrorOpen(false)}>
            Close
          </Button>
        }
        ariaLabel="Load game error"
        isOpen={isLoadErrorOpen}
      >
        <p>This save file could not be loaded.</p>
        <p>このセーブファイルを読み込めませんでした。</p>
      </Modal>
    </main>
  );
}

export default StartPage;
