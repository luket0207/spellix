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
import GameplayPage from './GameplayPage';
import './VillagePage.css';

function VillagePage() {
  const navigate = useNavigate();
  const {
    chooseVillageAction,
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

  if (visit.phase === 'wandsmith') {
    return <GameplayPage isVillageWandsmithRoute />;
  }

  const language = getGameplayLanguage(villagePlayer.language);
  const translations = getVillageTranslations(language);
  const languageClassName = `language-${language}`;
  const playerImageSource = getPieceImageSource(villagePlayer.pieceImage);
  const defeatedEnemy = getEnemyById(visit.defeatedEnemyId);
  const rewardMessage =
    visit.rewardType === 'lootChest'
      ? translations.lootChest
      : visit.rewardClaimKey === 'firstEliteVillageRewardClaimed' ||
          visit.rewardType === 'potion'
        ? translations.potion(
            getEnemyDisplayName(language, defeatedEnemy)
          )
        : translations.token;
  const isHealing = ['heal', 'healed'].includes(visit.phase);
  const isChoice = visit.phase === 'choice';
  const hasLeft = visit.phase === 'left';
  const villageActionState = villagePlayer.villageActionState;
  const isSameVillageLock =
    villageActionState?.currentVillageLockId === visit.villageFeatureId;
  const restDisabled = Boolean(
    isSameVillageLock &&
      villageActionState?.usedActionsForCurrentVillage?.rest
  );
  const wandsmithDisabled = Boolean(
    isSameVillageLock &&
      villageActionState?.usedActionsForCurrentVillage?.wandsmith
  );

  const handleReward = () => {
    const destination =
      visit.rewardType === 'lootChest'
        ? '/mini-game/loot-chest'
        : '/reward';

    startVillageReward();
    navigate(destination);
  };

  const handleFinish = () => {
    if (!['healed', 'left'].includes(visit.phase)) {
      return;
    }

    finishVillageVisit();
    navigate('/gameplay', { replace: true });
  };

  const handleVillageAction = (action) => {
    chooseVillageAction(action);
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
          isChoice ? null : (
            <Button
              className={languageClassName}
              disabled={isHealing && visit.phase !== 'healed'}
              type="button"
              variant="secondary"
              onClick={
                isHealing || hasLeft ? handleFinish : handleReward
              }
            >
              {visit.rewardType === 'lootChest' && !isHealing
                ? translations.openLootChest
                : translations.continue}
            </Button>
          )
        }
        ariaLabel={
          isChoice
            ? 'Village actions'
            : isHealing
              ? 'Village rest'
              : hasLeft
                ? 'Village departure'
                : 'Village reward'
        }
        isOpen
        panelClassName={`village-modal ${languageClassName}`}
      >
        <div
          className={`village-content${
            isChoice ? ' village-content--choice' : ''
          }`}
        >
          <p className={`larger-text ${languageClassName}`}>
            {isChoice
              ? translations.choice
              : isHealing
                ? translations.heal
                : hasLeft
                  ? translations.left
                  : rewardMessage}
          </p>
          {isChoice ? (
            <div className="village-choice-buttons">
              <Button
                className={languageClassName}
                disabled={restDisabled}
                type="button"
                onClick={() => handleVillageAction('rest')}
              >
                {translations.rest}
              </Button>
              <Button
                className={languageClassName}
                disabled={wandsmithDisabled}
                type="button"
                onClick={() => handleVillageAction('wandsmith')}
              >
                {translations.wandsmith}
              </Button>
              <Button
                className={languageClassName}
                type="button"
                variant="secondary"
                onClick={() => handleVillageAction('leave')}
              >
                {translations.leave}
              </Button>
            </div>
          ) : null}
          {!isChoice && !hasLeft && !isHealing && visit.rewardType === 'potion' && visit.rewardItem ? (
            <PotionIcon
              language={language}
              potion={visit.rewardItem}
            />
          ) : null}
          {!isChoice && !hasLeft && !isHealing && visit.rewardType === 'token' && visit.rewardItem ? (
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
