import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import PotionIcon from '../components/potions/PotionIcon';
import Token from '../components/tokens/Token';
import { getPotionName, POTION_DEFINITIONS } from '../data/potions';
import { TOKEN_DEFINITIONS } from '../data/tokens';
import {
  DECISION_QUESTIONS,
  resolveDecisionOutcome,
  selectRandomDecision,
  warnForInvalidDecisionChances,
} from '../data/decisionQuestions';
import { getBattleBackgroundSource } from '../features/battle/battleEnvironments';
import { applyDeathTokenPenalty } from '../features/death/deathPenalty';
import {
  addTokenToBag,
  canAddTokenToBag,
  createDebugToken,
  getDebugTokenTypeLabel,
  replaceTokenInBag,
} from '../features/debug/tokenBagAdmin';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import {
  getBagTokenDiscardReplacementId,
  getRequestedBagTokenReplacementId,
  getRewardSpellSlotDropId,
  isRewardTokenBagDrop,
  isRewardTokenDiscardDrop,
  isRewardTokenFullBagDrop,
} from '../features/rewards/rewardTokenAssignment';
import SpellMergeConfirmationModal from '../features/spells/SpellMergeConfirmationModal';
import SpellTokenAssignment from '../features/spells/SpellTokenAssignment';
import {
  applyColumnMerge,
  findNextColumnMerge,
} from '../features/spells/nonBattleSpellEffects';
import {
  getCaveMiniGameTranslations,
  getDecisionTranslations,
  getGameplayLanguage,
  getSpellAssignmentTranslations,
} from '../i18n/translations';
import './DecisionPage.css';

const EFFECT_STATUS = {
  COMPLETE: 'complete',
  PENDING: 'pending',
};

const DECISION_EFFECT_MESSAGES = {
  en: {
    noPotionRemoved: 'No potions were able to be removed',
    noTokenRemoved: 'No tokens were able to be removed',
    potionRemoved: 'This potion was removed',
    tokenRemoved: 'This token has been removed',
  },
  jp: {
    noPotionRemoved:
      '\u30dd\u30fc\u30b7\u30e7\u30f3\u3092\u53d6\u308a\u9664\u304f\u3053\u3068\u304c\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002',
    noTokenRemoved:
      '\u30c8\u30fc\u30af\u30f3\u3092\u53d6\u308a\u9664\u304f\u3053\u3068\u304c\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002',
    potionRemoved:
      '\u3053\u306e\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u53d6\u308a\u9664\u304b\u308c\u307e\u3057\u305f\u3002',
    tokenRemoved:
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u306f\u53d6\u308a\u9664\u304b\u308c\u307e\u3057\u305f\u3002',
  },
};

function selectRandomItem(items, randomFn) {
  if (items.length === 0) {
    return null;
  }

  const index = Math.min(Math.floor(randomFn() * items.length), items.length - 1);
  return items[index];
}

function selectPotion(effect, randomFn) {
  if (effect.potionId) {
    return POTION_DEFINITIONS.find(({ id }) => id === effect.potionId) ?? null;
  }

  return selectRandomItem(
    POTION_DEFINITIONS.filter(({ rarity }) => rarity === effect.rarity),
    randomFn
  );
}

function selectTokenType(effect, randomFn) {
  const eligibleTypes = Object.entries(TOKEN_DEFINITIONS)
    .filter(([, definition]) =>
      effect.rarity === 'Any' ? true : definition.rarity === effect.rarity
    )
    .map(([type]) => type);

  return selectRandomItem(eligibleTypes, randomFn);
}

function DecisionPage({ environment = 'fields', randomFn = Math.random }) {
  const navigate = useNavigate();
  const {
    advanceTurn,
    currentPlayer,
    gameSetup,
    grantPotionToPlayer,
    markPlayerToSkipNextTurn,
    pendingPotionGrant,
    removePlayerPotion,
    resolvePendingPotionGrant,
    setPlayerHealth,
    updatePlayerSpells,
  } = useGameSetup();
  const [currentDecision] = useState(() =>
    selectRandomDecision(DECISION_QUESTIONS, randomFn)
  );
  const [decisionPlayerId] = useState(() => currentPlayer?.id);
  const [decisionOutcome, setDecisionOutcome] = useState(null);
  const [displayedDecisionHealth, setDisplayedDecisionHealth] = useState(
    () => currentPlayer?.currentHealth ?? 0
  );
  const [effectStatus, setEffectStatus] = useState(null);
  const [rewardPotion, setRewardPotion] = useState(null);
  const [rewardToken, setRewardToken] = useState(null);
  const [removedPotion, setRemovedPotion] = useState(null);
  const [removedToken, setRemovedToken] = useState(null);
  const [isGoodDecisionsActive, setIsGoodDecisionsActive] = useState(false);
  const [isTokenAssignmentOpen, setIsTokenAssignmentOpen] = useState(false);
  const [isTokenBagStaged, setIsTokenBagStaged] = useState(false);
  const [isRewardTokenDiscardStaged, setIsRewardTokenDiscardStaged] =
    useState(false);
  const [isTokenBagReplacementRequested, setIsTokenBagReplacementRequested] =
    useState(false);
  const [selectedSpellSlotId, setSelectedSpellSlotId] = useState('');
  const [selectedTokenBagReplacementId, setSelectedTokenBagReplacementId] =
    useState('');
  const [pendingRewardMerge, setPendingRewardMerge] = useState(null);
  const healthTimerRef = useRef(null);
  const activeDecisionPlayer =
    gameSetup.players.find(({ id }) => id === decisionPlayerId) ?? null;

  useEffect(() => {
    warnForInvalidDecisionChances();

    return () => {
      if (healthTimerRef.current) {
        clearTimeout(healthTimerRef.current);
      }
    };
  }, []);

  if (!activeDecisionPlayer || !currentDecision) {
    return null;
  }

  const currentLanguage = getGameplayLanguage(activeDecisionPlayer.language);
  const translations = getDecisionTranslations(currentLanguage);
  const effectMessages = DECISION_EFFECT_MESSAGES[currentLanguage];
  const rewardGrantTranslations =
    getCaveMiniGameTranslations(currentLanguage).rewardGrant;
  const spellAssignmentTranslations =
    getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;
  const playerImageSource = getPieceImageSource(activeDecisionPlayer.pieceImage);
  const selectedSpellSlotIndex = activeDecisionPlayer.spellSlots.findIndex(
    ({ id }) => id === selectedSpellSlotId
  );
  const selectedTokenBagReplacementIndex = activeDecisionPlayer.tokenBag.findIndex(
    ({ id }) => id === selectedTokenBagReplacementId
  );
  const selectedTokenBagReplacement =
    selectedTokenBagReplacementIndex >= 0
      ? activeDecisionPlayer.tokenBag[selectedTokenBagReplacementIndex]
      : null;
  const goodDecisionsPotionIndex = activeDecisionPlayer.potions.findIndex(
    ({ id }) => id === 'good-decisions'
  );
  const goodDecisionsPotion =
    activeDecisionPlayer.potions[goodDecisionsPotionIndex] ?? null;
  const isEffectComplete = effectStatus === EFFECT_STATUS.COMPLETE;
  const canConfirmTokenPlacement = Boolean(
    selectedSpellSlotIndex >= 0 ||
      isTokenBagStaged ||
      isRewardTokenDiscardStaged ||
      selectedTokenBagReplacement
  );
  const outcomeResultLabel =
    decisionOutcome?.result?.[currentLanguage] ?? decisionOutcome?.result?.en;
  const shouldShowOutcomeResult = Boolean(
    decisionOutcome?.effect?.type !== 'none' &&
      outcomeResultLabel &&
      !['Nothing', 'N/A'].includes(decisionOutcome.result.en)
  );

  const finishDecision = () => {
    advanceTurn();
    navigate('/gameplay', { replace: true });
  };

  const finishTokenReward = (nextSpellData) => {
    if (nextSpellData) {
      updatePlayerSpells(activeDecisionPlayer.id, nextSpellData);
    }

    setPendingRewardMerge(null);
    finishDecision();
  };

  const placeTokenInSpellSlot = (columnMerge = null) => {
    const placedSpellSlots = activeDecisionPlayer.spellSlots.map((slot, index) =>
      index === selectedSpellSlotIndex
        ? {
            ...slot,
            tokens: [...slot.tokens, { ...rewardToken, committed: true }],
          }
        : slot
    );
    const shouldMerge = Boolean(
      columnMerge &&
        (activeDecisionPlayer.columnMergesUsed ?? 0) < 2 &&
        !(activeDecisionPlayer.mergedColumns ?? []).some(({ columns = [] }) =>
          columns.some((column) => columnMerge.columns.includes(column))
        )
    );

    finishTokenReward({
      columnMergesUsed:
        (activeDecisionPlayer.columnMergesUsed ?? 0) + (shouldMerge ? 1 : 0),
      mergedColumns: shouldMerge
        ? [...(activeDecisionPlayer.mergedColumns ?? []), columnMerge]
        : activeDecisionPlayer.mergedColumns,
      spellSlots: shouldMerge
        ? applyColumnMerge(placedSpellSlots, columnMerge)
        : placedSpellSlots,
      tokenBag: activeDecisionPlayer.tokenBag,
    });
  };

  const handleConfirmTokenPlacement = () => {
    if (selectedSpellSlotIndex >= 0) {
      const stagedSpellSlots = activeDecisionPlayer.spellSlots.map((slot, index) =>
        index === selectedSpellSlotIndex
          ? {
              ...slot,
              tokens: [...slot.tokens, { ...rewardToken, committed: true }],
            }
          : slot
      );
      const columnMerge = findNextColumnMerge({
        columnMergesUsed: activeDecisionPlayer.columnMergesUsed ?? 0,
        mergedColumns: activeDecisionPlayer.mergedColumns ?? [],
        spellSlots: stagedSpellSlots,
      });

      if (columnMerge) {
        setPendingRewardMerge(columnMerge);
        return;
      }

      placeTokenInSpellSlot();
      return;
    }

    if (isTokenBagStaged) {
      finishTokenReward({
        spellSlots: activeDecisionPlayer.spellSlots,
        tokenBag: addTokenToBag(activeDecisionPlayer.tokenBag, rewardToken),
      });
      return;
    }

    if (isRewardTokenDiscardStaged) {
      finishTokenReward();
      return;
    }

    if (selectedTokenBagReplacement) {
      finishTokenReward({
        spellSlots: activeDecisionPlayer.spellSlots,
        tokenBag: replaceTokenInBag(
          activeDecisionPlayer.tokenBag,
          selectedTokenBagReplacementId,
          rewardToken
        ),
      });
    }
  };

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
      tokenBag: activeDecisionPlayer.tokenBag,
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
        tokenBag: activeDecisionPlayer.tokenBag,
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
        tokenBag: activeDecisionPlayer.tokenBag,
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
      mergedColumns: activeDecisionPlayer.mergedColumns,
      rewardTokenId: rewardToken?.id,
      spellSlots: activeDecisionPlayer.spellSlots,
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
      tokenBag: activeDecisionPlayer.tokenBag,
      tokenId,
    });

    if (nextTokenBagReplacementId) {
      setSelectedTokenBagReplacementId(nextTokenBagReplacementId);
    }
  };

  const applyOutcomeEffect = (outcome) => {
    const effect = outcome.effect;

    if (effect.type === 'none') {
      setEffectStatus(EFFECT_STATUS.COMPLETE);
      return;
    }

    if (effect.type === 'gainPotion') {
      const potion = selectPotion(effect, randomFn);

      setRewardPotion(potion);
      if (potion) {
      grantPotionToPlayer(activeDecisionPlayer.id, potion);
      }
      setEffectStatus(
        potion && activeDecisionPlayer.potions.length >= 3
          ? EFFECT_STATUS.PENDING
          : EFFECT_STATUS.COMPLETE
      );
      return;
    }

    if (effect.type === 'gainToken') {
      const tokenType = selectTokenType(effect, randomFn);

      setRewardToken(
        tokenType ? createDebugToken(activeDecisionPlayer, tokenType) : null
      );
      setEffectStatus(EFFECT_STATUS.COMPLETE);
      return;
    }

    if (effect.type === 'loseHealth') {
      setEffectStatus(EFFECT_STATUS.PENDING);
      healthTimerRef.current = setTimeout(() => {
        const nextHealth = Math.max(
          0,
          activeDecisionPlayer.currentHealth - effect.amount
        );

        setPlayerHealth(activeDecisionPlayer.id, nextHealth);
        setDisplayedDecisionHealth(nextHealth);
        setEffectStatus(EFFECT_STATUS.COMPLETE);
      }, 1000);
      return;
    }

    if (effect.type === 'loseToken') {
      const penalty = applyDeathTokenPenalty({
        randomFn,
        removalCount: 1,
        spellSlots: activeDecisionPlayer.spellSlots,
      });

      setRemovedToken(penalty.removedTokens[0]?.token ?? null);
      if (penalty.removedTokens.length > 0) {
        updatePlayerSpells(activeDecisionPlayer.id, {
          spellSlots: penalty.spellSlots,
          tokenBag: activeDecisionPlayer.tokenBag,
        });
      }
      setEffectStatus(EFFECT_STATUS.COMPLETE);
      return;
    }

    if (effect.type === 'losePotion') {
      const potionIndex = activeDecisionPlayer.potions.length
        ? Math.min(
            Math.floor(randomFn() * activeDecisionPlayer.potions.length),
            activeDecisionPlayer.potions.length - 1
          )
        : -1;

      setRemovedPotion(activeDecisionPlayer.potions[potionIndex] ?? null);
      if (potionIndex >= 0) {
        removePlayerPotion(activeDecisionPlayer.id, potionIndex);
      }
      setEffectStatus(EFFECT_STATUS.COMPLETE);
      return;
    }

    if (effect.type === 'skipNextTurn') {
      markPlayerToSkipNextTurn(activeDecisionPlayer.id);
      setEffectStatus(EFFECT_STATUS.COMPLETE);
    }
  };

  const handleChoice = (decisionChoice) => {
    const outcome = resolveDecisionOutcome(decisionChoice, randomFn, {
      preventBadOutcome: isGoodDecisionsActive,
    });

    if (isGoodDecisionsActive && goodDecisionsPotionIndex >= 0) {
      removePlayerPotion(activeDecisionPlayer.id, goodDecisionsPotionIndex);
    }

    setDecisionOutcome(outcome);
    applyOutcomeEffect(outcome);
  };

  const handlePotionResolution = (replacedPotionIndex) => {
    resolvePendingPotionGrant(replacedPotionIndex);
    setEffectStatus(EFFECT_STATUS.COMPLETE);
  };

  const handleContinue = () => {
    if (!isEffectComplete) {
      return;
    }

    if (decisionOutcome.effect.type === 'gainToken' && rewardToken) {
      setIsTokenAssignmentOpen(true);
      return;
    }

    finishDecision();
  };

  const renderEffect = () => {
    const effect = decisionOutcome.effect;

    if (effect.type === 'gainPotion' && rewardPotion) {
      return (
        <>
          <div className="decision-effect-item">
            <PotionIcon language={currentLanguage} potion={rewardPotion} />
          </div>
          {effectStatus === EFFECT_STATUS.PENDING && pendingPotionGrant ? (
            <>
              <p className={languageClassName}>
                {rewardGrantTranslations.potionSlotsFull}.
              </p>
              <div
                className="decision-potion-actions"
              >
                <div
                  aria-label={rewardGrantTranslations.currentPotions}
                  className="decision-potion-choice-row"
                >
                  {activeDecisionPlayer.potions.map((potion, index) => (
                    <Button
                      aria-label={rewardGrantTranslations.replacePotion(
                        getPotionName(potion, currentLanguage)
                      )}
                      className={`${languageClassName} decision-potion-replace-button`}
                      key={`${potion.id}-${index}`}
                      type="button"
                      onClick={() => handlePotionResolution(index)}
                    >
                      <PotionIcon
                        focusable={false}
                        language={currentLanguage}
                        potion={potion}
                      />
                    </Button>
                  ))}
                </div>
                <Button
                  className={`${languageClassName} decision-potion-discard-button`}
                  type="button"
                  onClick={() => handlePotionResolution()}
                >
                  {rewardGrantTranslations.discardNewPotion}
                </Button>
              </div>
            </>
          ) : null}
        </>
      );
    }

    if (effect.type === 'gainToken' && rewardToken) {
      return (
        <div className="decision-effect-item">
          <Token
            ariaLabel={`${rewardToken.type} reward token`}
            language={currentLanguage}
            showName
            tokenType={rewardToken.type}
          />
        </div>
      );
    }

    if (effect.type === 'loseHealth') {
      return (
        <div className="decision-health-effect">
          <HealthBar
            currentHealth={displayedDecisionHealth}
            maxHealth={activeDecisionPlayer.maxHealth}
          />
        </div>
      );
    }

    if (effect.type === 'loseToken') {
      return (
        <div className="decision-effect-item">
          <p className={languageClassName}>
            {removedToken
              ? effectMessages.tokenRemoved
              : effectMessages.noTokenRemoved}
          </p>
          {removedToken ? (
            <Token
              ariaLabel={`${removedToken.type} removed token`}
              language={currentLanguage}
              showName
              tokenType={removedToken.type}
            />
          ) : null}
        </div>
      );
    }

    if (effect.type === 'losePotion') {
      return (
        <div className="decision-effect-item">
          <p className={languageClassName}>
            {removedPotion
              ? effectMessages.potionRemoved
              : effectMessages.noPotionRemoved}
          </p>
          {removedPotion ? (
            <PotionIcon language={currentLanguage} potion={removedPotion} />
          ) : null}
        </div>
      );
    }

    return null;
  };

  return (
    <main
      className="decision-page"
      data-testid="decision-page"
      style={{ backgroundImage: `url(${getBattleBackgroundSource(environment)})` }}
    >
      <Modal
        ariaLabel={translations.decision}
        isOpen
        panelClassName={`decision-modal ${languageClassName}`}
      >
        <div className="decision-modal-content">
          {playerImageSource ? (
            <img
              alt="Current player character"
              className="decision-player-image"
              src={playerImageSource}
            />
          ) : null}

          {isTokenAssignmentOpen ? (
            <div className="decision-token-assignment">
              <SpellTokenAssignment
                language={currentLanguage}
                mergedColumns={activeDecisionPlayer.mergedColumns}
                mode="rewardAssignment"
                isRewardTokenStagedInBag={isTokenBagStaged}
                isRewardTokenStagedForDiscard={isRewardTokenDiscardStaged}
                onTokenBagTokenClick={handleTokenBagTokenClick}
                onTokenDrop={handleRewardTokenDrop}
                rewardToken={rewardToken}
                spellSlots={activeDecisionPlayer.spellSlots}
                stagedRewardDestinationId={selectedSpellSlotId}
                stagedRewardTokenBagReplacementId={selectedTokenBagReplacementId}
                tokenBag={activeDecisionPlayer.tokenBag}
              />
              {!canAddTokenToBag(activeDecisionPlayer.tokenBag) ? (
                <p>{rewardGrantTranslations.tokenBagFull}.</p>
              ) : null}
              {isTokenBagReplacementRequested ? (
                <p>
                  {selectedTokenBagReplacement
                    ? `${getDebugTokenTypeLabel(
                        selectedTokenBagReplacement.type,
                        currentLanguage
                      )} token ${selectedTokenBagReplacementIndex + 1}`
                    : rewardGrantTranslations.chooseToken}
                </p>
              ) : null}
              <Button
                className={languageClassName}
                disabled={!canConfirmTokenPlacement}
                type="button"
                onClick={handleConfirmTokenPlacement}
              >
                {spellAssignmentTranslations.confirm}
              </Button>
            </div>
          ) : decisionOutcome ? (
            <div className="decision-outcome">
              <p className={`decision-outcome-text larger-text ${languageClassName}`}>
                {decisionOutcome.text[currentLanguage] ?? decisionOutcome.text.en}
              </p>
              {shouldShowOutcomeResult ? (
                <p className={`decision-outcome-result ${languageClassName}`}>
                  {outcomeResultLabel}
                </p>
              ) : null}
              {renderEffect()}
              <Button
                className={`decision-continue-button ${languageClassName}`}
                disabled={!isEffectComplete}
                type="button"
                onClick={handleContinue}
              >
                {translations.continue}
              </Button>
            </div>
          ) : (
            <>
              <p className={`decision-question larger-text ${languageClassName}`}>
                {currentDecision.question[currentLanguage] ??
                  currentDecision.question.en}
              </p>
              {goodDecisionsPotion ? (
                <section className="decision-mini-potion-section">
                  <PotionIcon
                    language={currentLanguage}
                    potion={goodDecisionsPotion}
                  />
                  {isGoodDecisionsActive ? (
                    <p
                      className={`decision-mini-potion-active-text ${languageClassName}`}
                    >
                      {translations.goodDecisionsActive}
                    </p>
                  ) : (
                    <Button
                      className={`decision-mini-potion-use-button ${languageClassName}`}
                      type="button"
                      onClick={() => setIsGoodDecisionsActive(true)}
                    >
                      {translations.use}
                    </Button>
                  )}
                </section>
              ) : null}
              <div className="decision-choice-list">
                {currentDecision.choices.map((decisionChoice) => (
                  <Button
                    key={decisionChoice.id}
                    className={`decision-choice-button ${languageClassName}`}
                    type="button"
                    onClick={() => handleChoice(decisionChoice)}
                  >
                    {decisionChoice.text[currentLanguage] ??
                      decisionChoice.text.en}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>
      <SpellMergeConfirmationModal
        isOpen={Boolean(pendingRewardMerge)}
        language={currentLanguage}
        merge={pendingRewardMerge}
        onCancel={() => setPendingRewardMerge(null)}
        onConfirm={() => placeTokenInSpellSlot(pendingRewardMerge)}
      />
    </main>
  );
}

export default DecisionPage;
