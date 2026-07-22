import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
import { getPotionName } from '../data/potions';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import {
  canAddTokenToBag,
  getDebugTokenTypeLabel,
} from '../features/debug/tokenBagAdmin';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPendingCaveReward } from '../features/miniGames/caveRewardGrant';
import {
  getBagTokenDiscardReplacementId,
  getRequestedBagTokenReplacementId,
  getRewardSpellSlotDropId,
  isRewardTokenBagDrop,
  isRewardTokenDiscardDrop,
  isRewardTokenFullBagDrop,
} from '../features/rewards/rewardTokenAssignment';
import SpellTokenAssignment from '../features/spells/SpellTokenAssignment';
import {
  getGameplayLanguage,
  getRewardAddedMessage,
  getRewardPageTranslations,
  getSpellAssignmentTranslations,
} from '../i18n/translations';
import caveBackground from '../images/miniGames/cave.png';
import './RewardPage.css';

function RewardPage() {
  const navigate = useNavigate();
  const {
    activeBattle,
    addSelectedRewardTokenToBag,
    assignSelectedRewardTokenToSpellSlot,
    advanceTurn,
    battlePlayer,
    clearActiveBattle,
    discardSelectedRewardToken,
    miniGameResult,
    replaceSelectedRewardTokenInBag,
    resolveSelectedPotionReward,
    returnFromMiniGame,
    selectBattleReward,
  } = useGameSetup();
  const [isTokenBagStaged, setIsTokenBagStaged] = useState(false);
  const [isRewardTokenDiscardStaged, setIsRewardTokenDiscardStaged] = useState(false);
  const [isTokenBagReplacementRequested, setIsTokenBagReplacementRequested] = useState(false);
  const [selectedSpellSlotId, setSelectedSpellSlotId] = useState('');
  const [selectedTokenBagReplacementId, setSelectedTokenBagReplacementId] = useState('');
  const isRewardPageReady = Boolean(activeBattle);
  const currentLanguage = getGameplayLanguage(battlePlayer?.language);
  const rewardPageTranslations = getRewardPageTranslations(currentLanguage);
  const spellAssignmentTranslations = getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const isCaveRewardAssignment = activeBattle?.source === 'cave';
  const pendingCaveReward = getPendingCaveReward(miniGameResult?.caveRewardGrant);
  const caveHasLootChest = Boolean(miniGameResult?.caveRewards?.hasLootChest);

  useEffect(() => {
    if (!isRewardPageReady) {
      navigate('/gameplay', { replace: true });
    }
  }, [isRewardPageReady, navigate]);

  if (!isRewardPageReady) {
    return null;
  }

  const rewardChoices = activeBattle.rewardChoices ?? [];
  const selectedReward = rewardChoices.find(
    ({ id }) => id === activeBattle.selectedRewardChoiceId
  );
  const isSelectedTokenReward = selectedReward?.itemType === 'token';
  const rewardBackground = isCaveRewardAssignment
    ? caveBackground
    : getBattleBackgroundSource(activeBattle.environment);
  const rewardPageStyle = isSelectedTokenReward
    ? undefined
    : { backgroundImage: `url(${rewardBackground})` };

  const handleContinue = () => {
    clearActiveBattle();

    if (isCaveRewardAssignment) {
      if (pendingCaveReward) {
        navigate('/mini-game/cave', { replace: true });
        return;
      }

      if (caveHasLootChest) {
        navigate('/mini-game/loot-chest', { replace: true });
        return;
      }

      returnFromMiniGame();
      navigate('/gameplay', { replace: true });
      return;
    }

    advanceTurn();
    navigate('/gameplay');
  };

  if (selectedReward) {
    const isTokenReward = selectedReward.itemType === 'token';
    const isTokenBagAvailable = Boolean(
      battlePlayer && canAddTokenToBag(battlePlayer.tokenBag)
    );
    const rewardResolution = activeBattle.rewardResolution;
    const selectedSpellSlotIndex = battlePlayer?.spellSlots.findIndex(
      ({ id }) => id === selectedSpellSlotId
    );
    const resolvedSpellSlotIndex = battlePlayer?.spellSlots.findIndex(
      ({ id }) => id === rewardResolution?.spellSlotId
    );
    const selectedTokenBagReplacementIndex = battlePlayer?.tokenBag.findIndex(
      ({ id }) => id === selectedTokenBagReplacementId
    );
    const selectedTokenBagReplacement =
      selectedTokenBagReplacementIndex >= 0
        ? battlePlayer.tokenBag[selectedTokenBagReplacementIndex]
        : null;
    const rewardToken = isTokenReward
      ? {
          committed: false,
          id: `${selectedReward.id}-token`,
          type: selectedReward.item.type,
        }
      : null;
    const clearTokenBagReplacementDraft = () => {
      setIsTokenBagReplacementRequested(false);
      setSelectedTokenBagReplacementId('');
    };
    const handleRewardTokenDrop = (tokenId, destinationId) => {
      if (
        isRewardTokenDiscardDrop({
          destinationId,
          rewardTokenId: rewardToken?.id,
          tokenId,
        })
      ) {
        clearTokenBagReplacementDraft();
        setIsRewardTokenDiscardStaged(true);
        setIsTokenBagStaged(false);
        setSelectedSpellSlotId('');
        return;
      }

      const discardedBagTokenId = getBagTokenDiscardReplacementId({
        destinationId,
        tokenBag: battlePlayer?.tokenBag,
        tokenId,
      });

      if (discardedBagTokenId) {
        setIsTokenBagReplacementRequested(true);
        setSelectedTokenBagReplacementId(discardedBagTokenId);
        setIsRewardTokenDiscardStaged(false);
        setIsTokenBagStaged(false);
        setSelectedSpellSlotId('');
        return;
      }

      if (
        isRewardTokenFullBagDrop({
          destinationId,
          rewardTokenId: rewardToken?.id,
          tokenBag: battlePlayer?.tokenBag,
          tokenId,
        })
      ) {
        setIsTokenBagReplacementRequested(true);
        setSelectedTokenBagReplacementId('');
        setIsRewardTokenDiscardStaged(false);
        setIsTokenBagStaged(false);
        setSelectedSpellSlotId('');
        return;
      }

      if (
        isRewardTokenBagDrop({
          destinationId,
          rewardTokenId: rewardToken?.id,
          tokenBag: battlePlayer?.tokenBag,
          tokenId,
        })
      ) {
        clearTokenBagReplacementDraft();
        setIsRewardTokenDiscardStaged(false);
        setIsTokenBagStaged(true);
        setSelectedSpellSlotId('');
        return;
      }

      const nextSpellSlotId = getRewardSpellSlotDropId({
        destinationId,
        rewardTokenId: rewardToken?.id,
        spellSlots: battlePlayer?.spellSlots,
        tokenId,
      });

      if (nextSpellSlotId) {
        clearTokenBagReplacementDraft();
        setIsRewardTokenDiscardStaged(false);
        setIsTokenBagStaged(false);
        setSelectedSpellSlotId(nextSpellSlotId);
      }
    };
    const handleTokenBagTokenClick = (tokenId) => {
      const nextTokenBagReplacementId = getRequestedBagTokenReplacementId({
        isReplacementRequested: isTokenBagReplacementRequested,
        tokenBag: battlePlayer?.tokenBag,
        tokenId,
      });

      if (!nextTokenBagReplacementId) {
        return;
      }

      setIsTokenBagReplacementRequested(true);
      setSelectedTokenBagReplacementId(nextTokenBagReplacementId);
      setIsRewardTokenDiscardStaged(false);
      setIsTokenBagStaged(false);
      setSelectedSpellSlotId('');
    };
    const canConfirmTokenPlacement = Boolean(
      selectedSpellSlotIndex >= 0 ||
        isTokenBagStaged ||
        isRewardTokenDiscardStaged ||
        selectedTokenBagReplacement
    );
    const handleConfirmTokenPlacement = () => {
      if (selectedSpellSlotIndex >= 0) {
        assignSelectedRewardTokenToSpellSlot(selectedSpellSlotId);
        return;
      }

      if (isTokenBagStaged) {
        addSelectedRewardTokenToBag();
        return;
      }

      if (isRewardTokenDiscardStaged) {
        discardSelectedRewardToken();
        return;
      }

      if (selectedTokenBagReplacement) {
        replaceSelectedRewardTokenInBag(selectedTokenBagReplacementId);
      }
    };

    return (
      <main
        className={`reward-page${isTokenReward ? ' reward-page--assignment' : ''}`}
        style={rewardPageStyle}
      >
        {isTokenReward ? <MagicalNightSky /> : null}
        <section
          aria-label="Reward assignment"
          className={`reward-panel${
            isTokenReward
              ? ` reward-panel--assignment modal-panel modal-panel--default ${languageClassName}`
              : ''
          }`}
        >
          <h1 className={languageClassName}>{spellAssignmentTranslations.assignReward}</h1>
          {rewardResolution ? (
            <div className="assignment-result-modal">
              <p
                className={`assignment-result-modal-content${
                  isTokenReward ? ` ${languageClassName}` : ''
                }`}
              >
                {isTokenReward
                  ? getRewardAddedMessage(
                      currentLanguage,
                      rewardResolution.destination === 'spellSlot'
                        ? 'spellSlot'
                        : rewardResolution.destination === 'discarded'
                          ? 'discard'
                          : 'tokenBag',
                      resolvedSpellSlotIndex + 1
                    )
                  : rewardResolution.destination === 'potionSlot'
                    ? 'Reward potion added.'
                    : rewardResolution.destination === 'potionSlotReplacement'
                      ? 'Reward potion replaced an existing potion.'
                      : 'Reward potion discarded.'}
              </p>
              <div
                aria-label="Assignment result actions"
                className="assignment-result-modal-actions"
              >
                <Button
                  className={languageClassName}
                  type="button"
                  onClick={handleContinue}
                >
                  {rewardPageTranslations.continue}
                </Button>
              </div>
            </div>
          ) : isTokenReward ? (
            <>
            {battlePlayer ? (
              <>
                <SpellTokenAssignment
                  language={currentLanguage}
                  mode="rewardAssignment"
                  isRewardTokenStagedInBag={isTokenBagStaged}
                  isRewardTokenStagedForDiscard={isRewardTokenDiscardStaged}
                  onTokenBagTokenClick={handleTokenBagTokenClick}
                  onTokenDrop={handleRewardTokenDrop}
                  rewardToken={rewardToken}
                  spellSlots={battlePlayer.spellSlots}
                  stagedRewardDestinationId={selectedSpellSlotId}
                  stagedRewardTokenBagReplacementId={selectedTokenBagReplacementId}
                  tokenBag={battlePlayer.tokenBag}
                />
              </>
            ) : null}
            {!isTokenBagAvailable ? <p>Token bag is full.</p> : null}
            {!isTokenBagAvailable && battlePlayer && isTokenBagReplacementRequested ? (
              <>
                {selectedTokenBagReplacement ? (
                  <p>{`Selected token to replace: ${getDebugTokenTypeLabel(
                    selectedTokenBagReplacement.type
                  )} token ${selectedTokenBagReplacementIndex + 1}`}</p>
                ) : (
                  <p>Choose a token to remove.</p>
                )}
              </>
            ) : null}
            <Button
              className={`${languageClassName} reward-assignment-confirm`}
              disabled={!canConfirmTokenPlacement}
              onClick={handleConfirmTokenPlacement}
              type="button"
            >
              {spellAssignmentTranslations.confirm}
            </Button>
            </>
          ) : (
            <>
            <PotionIcon language={currentLanguage} potion={selectedReward.item} />
            <p>Potion slots are full.</p>
            {battlePlayer ? (
              <ul>
                {battlePlayer.potions.map((potion, index) => {
                  const potionName = getPotionName(potion, currentLanguage);

                  return (
                  <li key={`${potion.id}-${index}`}>
                    <Button
                      aria-label={`Replace ${potionName}`}
                      type="button"
                      onClick={() => resolveSelectedPotionReward(index)}
                    >
                      <PotionIcon
                        focusable={false}
                        language={currentLanguage}
                        potion={potion}
                      />
                      <span>{`Replace ${potionName}`}</span>
                    </Button>
                  </li>
                  );
                })}
              </ul>
            ) : null}
            <Button type="button" onClick={() => resolveSelectedPotionReward()}>
              Discard new potion
            </Button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="reward-page" style={rewardPageStyle}>
      <section aria-label="Reward choices" className="reward-panel">
        <h1 className={languageClassName}>{rewardPageTranslations.chooseOneReward}</h1>
        <div aria-label="Reward options" className="reward-options">
          {rewardChoices.map((rewardChoice, index) => {
          const itemName =
            rewardChoice.itemType === 'token'
              ? rewardChoice.item.label
              : rewardChoice.item.name;

          return (
            <div
              aria-label={`Reward option ${index + 1}`}
              className="reward-option"
              key={rewardChoice.id}
            >
              {rewardChoice.itemType === 'token' ? (
                <Token
                  ariaLabel={`${itemName} reward token`}
                  language={currentLanguage}
                  showName
                  tokenType={rewardChoice.item.type}
                />
              ) : (
                <PotionIcon language={currentLanguage} potion={rewardChoice.item} />
              )}
              <Button
                className={languageClassName}
                type="button"
                onClick={() => selectBattleReward(rewardChoice.id)}
              >
                {rewardPageTranslations.choose}
              </Button>
            </div>
          );
          })}
        </div>
      </section>
    </main>
  );
}

export default RewardPage;
