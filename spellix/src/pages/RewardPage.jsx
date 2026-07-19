import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
import { getPotionName } from '../data/potions';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import {
  canAddTokenToBag,
  getDebugTokenTypeLabel,
} from '../features/debug/tokenBagAdmin';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
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
    replaceSelectedRewardTokenInBag,
    resolveSelectedPotionReward,
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
  const rewardPageStyle = {
    backgroundImage: `url(${getBattleBackgroundSource(activeBattle.environment)})`,
  };

  const handleContinue = () => {
    clearActiveBattle();
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

    return (
      <main className="reward-page" style={rewardPageStyle}>
        <section aria-label="Reward assignment" className="reward-panel">
          <h1 className={languageClassName}>{spellAssignmentTranslations.assignReward}</h1>
          {rewardResolution ? (
            <>
            <p className={isTokenReward ? languageClassName : undefined}>
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
            <Button type="button" onClick={handleContinue}>
              Continue
            </Button>
            </>
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
                {selectedSpellSlotIndex >= 0 ? (
                  <Button
                    className={languageClassName}
                    type="button"
                    onClick={() => assignSelectedRewardTokenToSpellSlot(selectedSpellSlotId)}
                  >
                    {spellAssignmentTranslations.confirm}
                  </Button>
                ) : null}
              </>
            ) : null}
            {!isTokenBagAvailable ? <p>Token bag is full.</p> : null}
            {isTokenBagStaged ? (
              <Button
                className={languageClassName}
                type="button"
                onClick={addSelectedRewardTokenToBag}
              >
                {spellAssignmentTranslations.confirm}
              </Button>
            ) : null}
            {isRewardTokenDiscardStaged ? (
              <Button
                className={languageClassName}
                type="button"
                onClick={discardSelectedRewardToken}
              >
                {spellAssignmentTranslations.confirm}
              </Button>
            ) : null}
            {!isTokenBagAvailable && battlePlayer && isTokenBagReplacementRequested ? (
              <>
                {selectedTokenBagReplacement ? (
                  <>
                    <p>{`Selected token to replace: ${getDebugTokenTypeLabel(
                      selectedTokenBagReplacement.type
                    )} token ${selectedTokenBagReplacementIndex + 1}`}</p>
                    <Button
                      className={languageClassName}
                      type="button"
                      onClick={() =>
                        replaceSelectedRewardTokenInBag(selectedTokenBagReplacementId)
                      }
                    >
                      {spellAssignmentTranslations.confirm}
                    </Button>
                  </>
                ) : (
                  <p>Choose a token to remove.</p>
                )}
              </>
            ) : null}
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
