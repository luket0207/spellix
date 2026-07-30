import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import { getGameplayLanguage } from '../i18n/translations';
import './WinnerPage.css';

function WinnerPage({ onBackToStart }) {
  const navigate = useNavigate();
  const { gameSetup } = useGameSetup();
  const winner = gameSetup.winnerDisplay;

  useEffect(() => {
    if (!winner) {
      navigate('/', { replace: true });
    }
  }, [navigate, winner]);

  if (!winner) {
    return null;
  }

  const language = getGameplayLanguage(winner.language);
  const languageClassName = `language-${language}`;
  const winnerImageSource = getPieceImageSource(winner.pieceImage);

  return (
    <main className="winner-page magical-night-sky-page">
      <MagicalNightSky />
      <div className="winner-content">
        <h1 className={`winner-title ${languageClassName}`}>WINNER!</h1>
        {winnerImageSource ? (
          <img
            alt="Winning player"
            className="winner-player-image"
            src={winnerImageSource}
          />
        ) : (
          <p>{winner.colour}</p>
        )}
        <Button
          className={`winner-back-button ${languageClassName}`}
          type="button"
          onClick={onBackToStart}
        >
          {language === 'jp' ? 'スタートに戻る' : 'Back to Start'}
        </Button>
      </div>
    </main>
  );
}

export default WinnerPage;
