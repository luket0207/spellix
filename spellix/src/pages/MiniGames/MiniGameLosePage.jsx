import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import MagicalNightSky from '../../components/gameplay/MagicalNightSky/MagicalNightSky';
import HealthBar from '../../components/health/HealthBar';
import DeathResult from '../../features/death/DeathResult';
import { getFirstStartAreaPosition } from '../../features/gameBoard/board';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../../features/gameSetup/pieceImages';
import { selectMiniGameHealthLoss } from '../../features/miniGames/miniGamePunishment';
import {
  getGameplayLanguage,
  getMiniGameFailureTranslations,
} from '../../i18n/translations';
import './MiniGameResultPage.css';

function MiniGameLosePage({ randomFn = Math.random }) {
  const navigate = useNavigate();
  const {
    applyMiniGameFailurePunishment,
    currentPlayer,
    gameSetup,
    miniGameResult,
    returnFromMiniGame,
    setPlayerPosition,
  } = useGameSetup();
  const failingPlayer =
    gameSetup.players.find(({ id }) => id === miniGameResult?.playerId) ?? currentPlayer;
  const existingPunishment = miniGameResult?.failurePunishment;
  const [healthLost] = useState(
    () => existingPunishment?.healthLost ?? selectMiniGameHealthLoss(randomFn)
  );
  const [displayedHealth, setDisplayedHealth] = useState(
    () => existingPunishment?.nextHealth ?? failingPlayer?.currentHealth ?? 0
  );
  const [isDamageApplied, setIsDamageApplied] = useState(
    () => Boolean(existingPunishment?.applied)
  );
  const currentLanguage = getGameplayLanguage(failingPlayer?.language);
  const translations = getMiniGameFailureTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;

  useEffect(() => {
    if (isDamageApplied || !failingPlayer) {
      return undefined;
    }

    const nextHealth = Math.max(0, failingPlayer.currentHealth - healthLost);
    const timeoutId = window.setTimeout(() => {
      applyMiniGameFailurePunishment(failingPlayer.id, healthLost);
      setDisplayedHealth(nextHealth);
      setIsDamageApplied(true);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [
    applyMiniGameFailurePunishment,
    failingPlayer,
    healthLost,
    isDamageApplied,
  ]);

  const handleReturnToBoard = () => {
    returnFromMiniGame();
    navigate('/gameplay', { replace: true });
  };

  const handleRespawn = () => {
    setPlayerPosition(
      failingPlayer.id,
      getFirstStartAreaPosition(gameSetup.board),
      { currentHealth: failingPlayer.maxHealth }
    );
    handleReturnToBoard();
  };

  if (!failingPlayer) {
    return null;
  }

  const playerImageSource = getPieceImageSource(failingPlayer.pieceImage);
  const isPlayerDead = displayedHealth === 0;

  return (
    <main className="mini-game-failure-page">
      <MagicalNightSky />
      <section
        aria-label="Mini game punishment"
        className={`mini-game-failure-panel ${languageClassName}`}
      >
        <div className="mini-game-failure-player">
          {playerImageSource ? (
            <img
              alt="Current player character"
              className="mini-game-failure-player-image"
              src={playerImageSource}
            />
          ) : null}
          <HealthBar
            currentHealth={displayedHealth}
            maxHealth={failingPlayer.maxHealth}
          />
        </div>

        <p className={`mini-game-failure-punishment ${languageClassName}`}>
          {translations.punishment(healthLost)}
        </p>

        {isDamageApplied && isPlayerDead ? (
          <DeathResult
            language={currentLanguage}
            removedTokens={existingPunishment?.deathPenalty?.removedTokens}
          />
        ) : null}

        {isDamageApplied ? (
          <div className="mini-game-failure-actions">
            {isPlayerDead ? (
              <Button type="button" onClick={handleRespawn}>
                {translations.respawn}
              </Button>
            ) : (
              <Button type="button" onClick={handleReturnToBoard}>
                {translations.continue}
              </Button>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default MiniGameLosePage;
