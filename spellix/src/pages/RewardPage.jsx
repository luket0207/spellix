import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
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

  const handleContinue = () => {
    clearActiveBattle();
    advanceTurn();
    navigate('/gameplay');
  };

  if (selectedReward) {
    const itemName =
      selectedReward.itemType === 'token'
        ? selectedReward.item.label
        : selectedReward.item.name;

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
      <main>
        <h1>Assign reward</h1>
        <p>{`Selected reward: ${selectedReward.category} - ${itemName}`}</p>
        {rewardResolution ? (
          <>
            <p>
              {rewardResolution.destination === 'tokenBag'
                ? 'Reward added to token bag.'
                : rewardResolution.destination === 'tokenBagReplacement'
                  ? 'Reward replaced a token in the token bag.'
                  : rewardResolution.destination === 'spellSlot'
                    ? `Reward committed to spell slot ${resolvedSpellSlotIndex + 1}.`
                    : rewardResolution.destination === 'potionSlot'
                      ? 'Reward potion added.'
                      : rewardResolution.destination === 'potionSlotReplacement'
                        ? 'Reward potion replaced an existing potion.'
                        : rewardResolution.destination === 'potionDiscarded'
                          ? 'Reward potion discarded.'
                          : 'Reward token discarded.'}
            </p>
            <button type="button" onClick={handleContinue}>
              Continue
            </button>
          </>
        ) : isTokenReward ? (
          <>
            {battlePlayer ? (
              <>
                <SpellTokenAssignment
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
                  tokenSourceLabel="Token Bag"
                />
                {selectedSpellSlotIndex >= 0 ? (
                  <>
                    <p>{`Selected spell slot: ${selectedSpellSlotIndex + 1}`}</p>
                    <button
                      type="button"
                      onClick={() =>
                        assignSelectedRewardTokenToSpellSlot(selectedSpellSlotId)
                      }
                    >
                      {`Confirm spell slot ${selectedSpellSlotIndex + 1}`}
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
            {!isTokenBagAvailable ? <p>Token bag is full.</p> : null}
            {isTokenBagStaged ? (
              <>
                <p>Selected destination: Token Bag</p>
                <button type="button" onClick={addSelectedRewardTokenToBag}>
                  Confirm token bag
                </button>
              </>
            ) : null}
            {isRewardTokenDiscardStaged ? (
              <>
                <p>Selected destination: Discard</p>
                <button type="button" onClick={discardSelectedRewardToken}>
                  Confirm discard
                </button>
              </>
            ) : null}
            {!isTokenBagAvailable && battlePlayer && isTokenBagReplacementRequested ? (
              <>
                {selectedTokenBagReplacement ? (
                  <>
                    <p>{`Selected token to replace: ${getDebugTokenTypeLabel(
                      selectedTokenBagReplacement.type
                    )} token ${selectedTokenBagReplacementIndex + 1}`}</p>
                    <button
                      type="button"
                      onClick={() =>
                        replaceSelectedRewardTokenInBag(selectedTokenBagReplacementId)
                      }
                    >
                      Confirm replacement
                    </button>
                  </>
                ) : (
                  <p>Choose a token to remove.</p>
                )}
              </>
            ) : null}
          </>
        ) : (
          <>
            <PotionIcon potion={selectedReward.item} />
            <p>Potion slots are full.</p>
            {battlePlayer ? (
              <ul>
                {battlePlayer.potions.map((potion, index) => (
                  <li key={`${potion.id}-${index}`}>
                    <button
                      aria-label={`Replace ${potion.name}`}
                      type="button"
                      onClick={() => resolveSelectedPotionReward(index)}
                    >
                      <PotionIcon focusable={false} potion={potion} />
                      <span>{`Replace ${potion.name}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" onClick={() => resolveSelectedPotionReward()}>
              Discard new potion
            </button>
          </>
        )}
      </main>
    );
  }

  return (
    <main>
      <h1>Choose one reward</h1>
      <ul>
        {rewardChoices.map((rewardChoice) => {
          const itemName =
            rewardChoice.itemType === 'token'
              ? rewardChoice.item.label
              : rewardChoice.item.name;

          return (
            <li key={rewardChoice.id}>
              <p>{rewardChoice.category}</p>
              {rewardChoice.itemType === 'token' ? (
                <>
                  <p>{itemName}</p>
                  <Token
                    ariaLabel={`${itemName} reward token`}
                    tokenType={rewardChoice.item.type}
                  />
                </>
              ) : (
                <PotionIcon potion={rewardChoice.item} />
              )}
              <button type="button" onClick={() => selectBattleReward(rewardChoice.id)}>
                {`Choose ${itemName}`}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default RewardPage;
