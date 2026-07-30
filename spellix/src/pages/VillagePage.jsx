import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
import { getEnemyById } from '../features/battle/enemies';
import { getFeatureBackgroundSource } from '../features/gameBoard/featureBackgrounds';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import {
  getEnemyDisplayName,
  getGameplayLanguage,
  getVillageTranslations,
} from '../i18n/translations';
import './VillagePage.css';

function VillagePage() {
  const navigate = useNavigate();
  const {
    finishVillageVisit,
    gameSetup,
    healVillagePlayer,
    startVillageReward,
  } = useGameSetup();
  const visit = gameSetup.villageVisit;
  const villagePlayer =
    gameSetup.players.find(({ id }) => id === visit?.playerId) ?? null;
  const healVillagePlayerRef = useRef(healVillagePlayer);

  healVillagePlayerRef.current = healVillagePlayer;

  useEffect(() => {
    if (!visit || !villagePlayer) {
      navigate('/gameplay', { replace: true });
    }
  }, [navigate, villagePlayer, visit]);

  useEffect(() => {
    if (visit?.phase !== 'heal' || !villagePlayer) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      healVillagePlayerRef.current();
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [villagePlayer, visit?.phase]);

  if (!visit || !villagePlayer) {
    return null;
  }

  const language = getGameplayLanguage(villagePlayer.language);
  const translations = getVillageTranslations(language);
  const languageClassName = `language-${language}`;
  const playerImageSource = getPieceImageSource(villagePlayer.pieceImage);
  const defeatedEnemy = getEnemyById(visit.defeatedEnemyId);
  const rewardMessage =
    visit.rewardType === 'lootChest'
      ? translations.lootChest
      : visit.rewardType === 'potion'
        ? translations.potion(
            getEnemyDisplayName(language, defeatedEnemy)
          )
        : translations.token;
  const isHealing = ['heal', 'healed'].includes(visit.phase);

  const handleReward = () => {
    const destination =
      visit.rewardType === 'lootChest'
        ? '/mini-game/loot-chest'
        : '/reward';

    startVillageReward();
    navigate(destination);
  };

  const handleFinish = () => {
    if (visit.phase !== 'healed') {
      return;
    }

    finishVillageVisit();
    navigate('/gameplay', { replace: true });
  };

  return (
    <main
      className="village-page"
      style={{
        backgroundImage: `url(${getFeatureBackgroundSource(
          visit.villageId
        )})`,
      }}
    >
      <Modal
        actions={
          <Button
            className={languageClassName}
            disabled={isHealing && visit.phase !== 'healed'}
            type="button"
            variant="secondary"
            onClick={isHealing ? handleFinish : handleReward}
          >
            {visit.rewardType === 'lootChest' && !isHealing
              ? translations.openLootChest
              : translations.continue}
          </Button>
        }
        ariaLabel={isHealing ? 'Village rest' : 'Village reward'}
        isOpen
        panelClassName={`village-modal ${languageClassName}`}
      >
        <div className="village-content">
          <p className={languageClassName}>
            {isHealing ? translations.heal : rewardMessage}
          </p>
          {!isHealing && visit.rewardType === 'potion' && visit.rewardItem ? (
            <PotionIcon
              language={language}
              potion={visit.rewardItem}
            />
          ) : null}
          {!isHealing && visit.rewardType === 'token' && visit.rewardItem ? (
            <Token
              ariaLabel="Village reward token"
              language={language}
              showName
              showTooltip
              tokenType={visit.rewardItem.type}
            />
          ) : null}
          {isHealing ? (
            <>
              {playerImageSource ? (
                <img
                  alt="Village player"
                  className="village-player-image"
                  src={playerImageSource}
                />
              ) : (
                <p>{villagePlayer.colour}</p>
              )}
              <HealthBar
                currentHealth={villagePlayer.currentHealth}
                maxHealth={villagePlayer.maxHealth}
              />
            </>
          ) : null}
        </div>
      </Modal>
    </main>
  );
}

export default VillagePage;
