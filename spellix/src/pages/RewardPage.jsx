import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
import Modal from '../components/Modal';
import { getPotionName } from '../data/potions';
import { getTokenName } from '../data/tokens';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import {
  canAddTokenToBag,
  getDebugTokenTypeLabel,
} from '../features/debug/tokenBagAdmin';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getFeatureBackgroundSource } from '../features/gameBoard/featureBackgrounds';
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
import SpellMergeConfirmationModal from '../features/spells/SpellMergeConfirmationModal';
import { findNextColumnMerge } from '../features/spells/nonBattleSpellEffects';
import {
  getCaveMiniGameTranslations,
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
    activatePendingCaveTokenReward,
    addSelectedRewardTokenToBag,
    assignSelectedRewardTokenToSpellSlot,
    advanceTurn,
    battlePlayer,
    clearActiveBattle,
    completeVillageReward,
    continueCaveRewardResolution,
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
  const [pendingRewardMerge, setPendingRewardMerge] = useState(null);
  const isLeavingForVillageRef = useRef(false);
  const isRewardPageReady = Boolean(activeBattle);
  const currentLanguage = getGameplayLanguage(battlePlayer?.language);
  const rewardPageTranslations = getRewardPageTranslations(currentLanguage);
  const rewardGrantTranslations = getCaveMiniGameTranslations(
    currentLanguage
  ).rewardGrant;
  const spellAssignmentTranslations = getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const isCaveRewardAssignment = activeBattle?.source === 'cave';
  const isLootChestRewardAssignment = activeBattle?.source === 'lootChest';
  const isVillageRewardAssignment =
    activeBattle?.source === 'village' ||
    (isLootChestRewardAssignment &&
      miniGameResult?.type === 'villageLootChest');
  const pendingCaveReward = getPendingCaveReward(miniGameResult?.caveRewardGrant);
  const caveHasLootChest = Boolean(
    miniGameResult?.caveRewards?.hasLootChest && !miniGameResult?.lootChestReward
  );

  useEffect(() => {
    if (!isRewardPageReady && !isLeavingForVillageRef.current) {
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
    : getFeatureBackgroundSource(activeBattle.encounterType) ||
      getBattleBackgroundSource(activeBattle.environment);
  const usesNightSkyRewardFlow =
    isSelectedTokenReward ||
    isCaveRewardAssignment ||
    isLootChestRewardAssignment;
  const rewardPageStyle = usesNightSkyRewardFlow
    ? undefined
    : { backgroundImage: `url(${rewardBackground})` };

  const resetTokenPlacementDraft = () => {
    setIsTokenBagStaged(false);
    setIsRewardTokenDiscardStaged(false);
    setIsTokenBagReplacementRequested(false);
    setSelectedSpellSlotId('');
    setSelectedTokenBagReplacementId('');
    setPendingRewardMerge(null);
  };

  const handleContinue = () => {
    if (isVillageRewardAssignment) {
      resetTokenPlacementDraft();
      isLeavingForVillageRef.current = true;
      completeVillageReward();
      navigate('/village', { replace: true });
      return;
    }

    if (miniGameResult?.caveRewardResolution) {
      resetTokenPlacementDraft();
      const destination = continueCaveRewardResolution();

      navigate(destination, { replace: true });
      return;
    }

    if (isLootChestRewardAssignment) {
      resetTokenPlacementDraft();

      if (pendingCaveReward?.type === 'token') {
        activatePendingCaveTokenReward();
        return;
      }

      clearActiveBattle();

      if (pendingCaveReward) {
        navigate('/mini-game/cave', { replace: true });
        return;
      }

      returnFromMiniGame();
      navigate('/gameplay', { replace: true });
      return;
    }

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
    const assignmentAriaLabel = isTokenReward
      ? 'Reward assignment'
      : rewardResolution
        ? rewardPageTranslations.potionAdded
        : rewardGrantTranslations.potionSlotsFull;
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
        mergedColumns: battlePlayer?.mergedColumns,
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
        const stagedSpellSlots = battlePlayer.spellSlots.map((slot, index) =>
          index === selectedSpellSlotIndex
            ? {
                ...slot,
                tokens: [...slot.tokens, { ...rewardToken, committed: true }],
              }
            : slot
        );
        const columnMerge = findNextColumnMerge({
          columnMergesUsed: battlePlayer.columnMergesUsed ?? 0,
          mergedColumns: battlePlayer.mergedColumns ?? [],
          spellSlots: stagedSpellSlots,
        });

        if (columnMerge) {
          setPendingRewardMerge(columnMerge);
          return;
        }

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

    const rewardPanelContent = (
      <>
        <h1 className={languageClassName}>{spellAssignmentTranslations.assignReward}</h1>
        {rewardResolution ? (
            <div className="assignment-result-modal">
              <p
                className={`assignment-result-modal-content larger-text ${languageClassName}${
                  isTokenReward ? '' : ' larger-text'
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
                    ? rewardPageTranslations.potionAdded
                    : rewardResolution.destination === 'potionSlotReplacement'
                      ? rewardPageTranslations.potionReplaced
                      : rewardPageTranslations.potionDiscarded}
              </p>
              <div className="battle-reward-item-display">
                {isTokenReward ? (
                  <Token
                    ariaLabel={`${getTokenName(
                      selectedReward.item.type,
                      currentLanguage
                    )} reward token`}
                    language={currentLanguage}
                    showName
                    tokenType={selectedReward.item.type}
                  />
                ) : (
                  <PotionIcon
                    language={currentLanguage}
                    potion={selectedReward.item}
                  />
                )}
              </div>
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
                  mergedColumns={battlePlayer.mergedColumns}
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
            <div
              aria-label={rewardGrantTranslations.newPotion}
              className="new-potion-reward"
            >
              <PotionIcon language={currentLanguage} potion={selectedReward.item} />
            </div>
            <p>{`${rewardGrantTranslations.potionSlotsFull}.`}</p>
            {battlePlayer ? (
              <div
                aria-label={rewardGrantTranslations.currentPotions}
                className="potion-assignment-actions"
              >
                {battlePlayer.potions.map((potion, index) => {
                  const potionName = getPotionName(potion, currentLanguage);
                  const replacePotionLabel = rewardGrantTranslations.replacePotion(
                    potionName
                  );

                  return (
                    <Button
                      aria-label={replacePotionLabel}
                      className={`${languageClassName} potion-assignment-button`}
                      key={`${potion.id}-${index}`}
                      type="button"
                      onClick={() => resolveSelectedPotionReward(index)}
                    >
                      <PotionIcon
                        focusable={false}
                        language={currentLanguage}
                        potion={potion}
                      />
                      <span>{replacePotionLabel}</span>
                    </Button>
                  );
                })}
                <Button
                  className={`${languageClassName} potion-assignment-button potion-assignment-button-discard`}
                  type="button"
                  onClick={() => resolveSelectedPotionReward()}
                >
                  {rewardGrantTranslations.discardNewPotion}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </>
    );

    return (
      <main
        className={`reward-page${
          usesNightSkyRewardFlow ? ' reward-page--assignment' : ''
        }`}
        style={rewardPageStyle}
      >
        {usesNightSkyRewardFlow ? <MagicalNightSky /> : null}
        {usesNightSkyRewardFlow ? (
          <section
            aria-label={assignmentAriaLabel}
            aria-modal="true"
            className={`reward-panel reward-panel--assignment modal-panel modal-panel--default ${languageClassName}`}
            role="dialog"
          >
            {rewardPanelContent}
          </section>
        ) : (
          <Modal
            ariaLabel={assignmentAriaLabel}
            isOpen
            panelClassName={`reward-panel ${languageClassName}`}
          >
            {rewardPanelContent}
          </Modal>
        )}
        <SpellMergeConfirmationModal
          isOpen={Boolean(pendingRewardMerge)}
          language={currentLanguage}
          merge={pendingRewardMerge}
          onCancel={() => setPendingRewardMerge(null)}
          onConfirm={() => {
            assignSelectedRewardTokenToSpellSlot(
              selectedSpellSlotId,
              pendingRewardMerge
            );
            setPendingRewardMerge(null);
          }}
        />
      </main>
    );
  }

  return (
    <main className="reward-page" style={rewardPageStyle}>
      <Modal
        ariaLabel="Reward choices"
        isOpen
        panelClassName={`battle-reward-panel ${languageClassName}`}
      >
        <h1 className={`larger-text ${languageClassName}`}>
          {rewardPageTranslations.chooseOneReward}
        </h1>
        <div aria-label="Reward options" className="reward-options">
          {rewardChoices.map((rewardChoice, index) => {
            const itemName =
              rewardChoice.itemType === 'token'
                ? getTokenName(rewardChoice.item.type, currentLanguage)
                : getPotionName(rewardChoice.item, currentLanguage);

            return (
              <div
                aria-label={`Reward option ${index + 1}`}
                className="reward-option"
                key={rewardChoice.id}
              >
                <div className="battle-reward-icon-row">
                  {rewardChoice.itemType === 'token' ? (
                    <Token
                      ariaLabel={`${rewardChoice.item.label} reward token`}
                      language={currentLanguage}
                      showName={false}
                      tokenType={rewardChoice.item.type}
                    />
                  ) : (
                    <PotionIcon
                      language={currentLanguage}
                      potion={rewardChoice.item}
                      showName={false}
                    />
                  )}
                </div>
                <div className={`battle-reward-name ${languageClassName}`}>
                  {itemName}
                </div>
                <div
                  className="battle-reward-button-row"
                  data-testid="battle-reward-button-row"
                >
                  <Button
                    className={languageClassName}
                    type="button"
                    onClick={() => selectBattleReward(rewardChoice.id)}
                  >
                    {rewardPageTranslations.choose}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </main>
  );
}

export default RewardPage;
