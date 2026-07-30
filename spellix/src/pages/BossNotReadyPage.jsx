import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import { getFeatureBackgroundSource } from '../features/gameBoard/featureBackgrounds';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import { getGameplayLanguage } from '../i18n/translations';
import './BossNotReadyPage.css';

const NOT_READY_MESSAGES = {
  en: 'You are not ready to be here. A powerful force rises from the castle and strikes you down. Complete the Elite Towers before trying to visit here again.',
  jp: 'まだここに来る準備ができていません。城から強大な力が立ち上り、あなたを打ち倒しました。再びここを訪れる前に、エリートタワーをすべて攻略してください。',
};

function BossNotReadyPage() {
  const navigate = useNavigate();
  const {
    activeBattle,
    advanceTurn,
    clearActiveBattle,
    gameSetup,
    setPlayerHealth,
  } = useGameSetup();
  const [encounterPlayerId] = useState(() => activeBattle?.playerId ?? '');
  const encounterPlayer =
    gameSetup.players.find(({ id }) => id === encounterPlayerId) ?? null;
  const [displayedHealth, setDisplayedHealth] = useState(
    () => encounterPlayer?.currentHealth ?? 0
  );
  const [isResolved, setIsResolved] = useState(false);
  const setPlayerHealthRef = useRef(setPlayerHealth);

  setPlayerHealthRef.current = setPlayerHealth;

  useEffect(() => {
    if (
      activeBattle?.encounterType === 'bossNotReady' &&
      encounterPlayer
    ) {
      return;
    }

    navigate('/gameplay', { replace: true });
  }, [activeBattle?.encounterType, encounterPlayer, navigate]);

  useEffect(() => {
    if (!encounterPlayerId || isResolved) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setPlayerHealthRef.current(encounterPlayerId, 0);
      setDisplayedHealth(0);
      setIsResolved(true);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [encounterPlayerId, isResolved]);

  if (
    activeBattle?.encounterType !== 'bossNotReady' ||
    !encounterPlayer
  ) {
    return null;
  }

  const language = getGameplayLanguage(encounterPlayer.language);
  const languageClassName = `language-${language}`;
  const playerImageSource = getPieceImageSource(encounterPlayer.pieceImage);

  const handleContinue = () => {
    if (!isResolved) {
      return;
    }

    clearActiveBattle();
    advanceTurn();
    navigate('/gameplay', { replace: true });
  };

  return (
    <main
      className="boss-not-ready-page"
      style={{
        backgroundImage: `url(${getFeatureBackgroundSource(
          'bossNotReady'
        )})`,
      }}
    >
      <Modal
        actions={
          <Button
            className={languageClassName}
            disabled={!isResolved}
            type="button"
            variant="secondary"
            onClick={handleContinue}
          >
            OK
          </Button>
        }
        ariaLabel="Boss Battle locked"
        isOpen
        panelClassName={`boss-not-ready-modal ${languageClassName}`}
      >
        <div className="boss-not-ready-content">
          <p className={languageClassName}>{NOT_READY_MESSAGES[language]}</p>
          {playerImageSource ? (
            <img
              alt="Boss Battle player"
              className="boss-not-ready-player-image"
              src={playerImageSource}
            />
          ) : (
            <p>{encounterPlayer.colour}</p>
          )}
          <HealthBar
            currentHealth={displayedHealth}
            maxHealth={encounterPlayer.maxHealth}
          />
        </div>
      </Modal>
    </main>
  );
}

export default BossNotReadyPage;
