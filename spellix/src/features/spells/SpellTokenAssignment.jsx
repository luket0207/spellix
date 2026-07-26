import { useId, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Token from '../../components/tokens/Token';
import { getTokenDescription } from '../../data/tokens';
import {
  getGameplayLanguage,
  getSpellAssignmentTranslations,
} from '../../i18n/translations';
import {
  REWARD_TOKEN_DISCARD_DROP_ZONE_ID,
  TOKEN_BAG_DROP_ZONE_ID,
} from './spellSetup';
import {
  getEffectiveSpellColumnGroups,
  getEffectiveSpellColumnCapacities,
} from './nonBattleSpellEffects';
import './spells.css';

function DraggableSpellToken({
  allowCommittedTokenMovement = false,
  ariaLabel,
  language,
  onClick,
  showName = false,
  token,
}) {
  const tokenDescriptionId = useId();
  const isMovementDisabled = token.committed && !allowCommittedTokenMovement;
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    data: { token },
    id: token.id,
    disabled: isMovementDisabled,
  });
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;
  const tokenDescription = isDragging ? '' : getTokenDescription(token.type, language);
  const describedBy = [
    attributes['aria-describedby'],
    tokenDescription ? tokenDescriptionId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...attributes}
      {...listeners}
      aria-describedby={describedBy || undefined}
      aria-label={
        ariaLabel ?? `${isMovementDisabled ? 'Committed' : 'Moveable'} ${token.type} token`
      }
      className="spell-token-button"
      disabled={isMovementDisabled}
      onClick={onClick}
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.6 : 1,
      }}
      type="button"
    >
      <Token
        ariaLabel={`${token.type} token`}
        committed={token.committed}
        descriptionId={tokenDescriptionId}
        focusable={false}
        language={language}
        showName={showName && !isDragging}
        showTooltip={!isDragging}
        tokenType={token.type}
      />
    </button>
  );
}

function TokenDropZone({ children, id, label }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      aria-label={label}
      className={`spell-drop-zone${isOver ? ' spell-drop-zone--active' : ''}`}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
}

function SpellTokenAssignment({
  allowCommittedTokenMovement = false,
  isRewardTokenStagedInBag = false,
  isRewardTokenStagedForDiscard = false,
  language,
  mergedColumns = [],
  mode = 'spellsModal',
  onTokenBagTokenClick,
  onTokenDrop,
  rewardToken,
  spellSlots,
  stagedRewardDestinationId,
  stagedRewardTokenBagReplacementId,
  tokenBag,
  tokenSourceLabel,
}) {
  const [activeDragToken, setActiveDragToken] = useState(null);
  const currentLanguage = getGameplayLanguage(language);
  const translations = getSpellAssignmentTranslations(currentLanguage);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );
  const handleDragEnd = ({ active, over }) => {
    setActiveDragToken(null);

    if (!over) {
      return;
    }

    onTokenDrop?.(String(active.id), String(over.id));
  };
  const handleDragStart = ({ active }) => {
    setActiveDragToken(active.data.current?.token ?? null);
  };
  const isRewardAssignment = mode === 'rewardAssignment';
  const hasStagedRewardTokenBagReplacement = Boolean(
    rewardToken &&
      stagedRewardTokenBagReplacementId &&
      tokenBag.some(({ id }) => id === stagedRewardTokenBagReplacementId)
  );
  const displayedTokenBag = hasStagedRewardTokenBagReplacement
    ? tokenBag.map((token) =>
        token.id === stagedRewardTokenBagReplacementId ? rewardToken : token
      )
    : isRewardTokenStagedInBag && !isRewardTokenStagedForDiscard && rewardToken
      ? [...tokenBag, rewardToken]
      : tokenBag;
  const isRewardTokenPlaced = Boolean(
    isRewardTokenStagedForDiscard ||
      hasStagedRewardTokenBagReplacement ||
      isRewardTokenStagedInBag ||
      stagedRewardDestinationId
  );
  const effectiveColumnGroups = getEffectiveSpellColumnGroups(
    spellSlots,
    mergedColumns
  );
  const rewardPlacementStatus = isRewardTokenStagedForDiscard
    ? translations.placedInDiscardArea
    : hasStagedRewardTokenBagReplacement || isRewardTokenStagedInBag
      ? translations.placedInTokenBag
      : stagedRewardDestinationId
        ? translations.placedInSpellSlot(
            effectiveColumnGroups.find(
              ({ slot }) => slot.id === stagedRewardDestinationId
            )?.label ??
              spellSlots.findIndex(({ id }) => id === stagedRewardDestinationId) + 1
          )
        : '';
  const columnCapacities = getEffectiveSpellColumnCapacities(
    spellSlots,
    mergedColumns
  );

  return (
    <DndContext
      autoScroll={false}
      onDragCancel={() => setActiveDragToken(null)}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div
        aria-label={isRewardAssignment ? 'Reward token assignment' : 'Spell token assignment'}
        className={`spell-token-assignment${
          isRewardAssignment ? ' spell-token-assignment--reward' : ''
        } language-${currentLanguage}`}
      >
        {isRewardAssignment && rewardToken ? (
          <section className="reward-token-section">
            <div
              aria-disabled={isRewardTokenPlaced}
              aria-label="Reward token box"
              className={`new-reward-token-box ${
                isRewardTokenPlaced ? 'is-empty' : 'needs-placement'
              }`}
            >
              {!isRewardTokenPlaced ? (
                <DraggableSpellToken
                  ariaLabel={`New reward ${rewardToken.type} token`}
                  language={currentLanguage}
                  showName
                  token={rewardToken}
                />
              ) : null}
              {isRewardTokenPlaced && rewardPlacementStatus ? (
                <p className="reward-token-status">{rewardPlacementStatus}</p>
              ) : null}
            </div>
            <p className="reward-token-instruction">
              {translations.rewardPlacementInstruction}
            </p>
          </section>
        ) : null}
        <section className="spell-slot-section">
          <div className="spell-slot-scroll">
            <div aria-label="Spell slots" className="spell-slot-list">
              {effectiveColumnGroups.map(({ isMerged, label, slot }, groupIndex) => {
                const hasStagedReward =
                  rewardToken &&
                  !isRewardTokenStagedInBag &&
                  !isRewardTokenStagedForDiscard &&
                  !hasStagedRewardTokenBagReplacement &&
                  slot.id === stagedRewardDestinationId;
                const displayedTokens = hasStagedReward
                  ? [...slot.tokens, rewardToken]
                  : slot.tokens;

                return (
                  <div
                    aria-label={`Assignment column ${label}`}
                    className={`spell-slot-item${
                      isMerged ? ' spell-slot-item--merged' : ''
                    }`}
                    data-column-span={isMerged ? '2' : '1'}
                    key={isMerged ? `merged-${label}` : slot.id}
                  >
                    <h4>{label}</h4>
                    <TokenDropZone id={slot.id} label={`Spell slot ${label}`}>
                      {displayedTokens.length > 0 ? (
                        displayedTokens.map((token) => (
                          <DraggableSpellToken
                            allowCommittedTokenMovement={allowCommittedTokenMovement}
                            ariaLabel={
                              token.id === rewardToken?.id
                                ? `New reward ${token.type} token`
                                : undefined
                            }
                            key={token.id}
                            language={currentLanguage}
                            token={token}
                          />
                        ))
                      ) : (
                        <span>{translations.dropTokensHere}</span>
                      )}
                    </TokenDropZone>
                    <p>{`${displayedTokens.length} / ${columnCapacities[groupIndex]}`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="spell-token-source">
          <h2>{tokenSourceLabel ?? translations.tokenBag}</h2>
          <TokenDropZone id={TOKEN_BAG_DROP_ZONE_ID} label="Token bag drop zone">
            {displayedTokenBag.length > 0 ? (
              displayedTokenBag.map((token) => (
                <DraggableSpellToken
                  allowCommittedTokenMovement={allowCommittedTokenMovement}
                  ariaLabel={
                    token.id === rewardToken?.id
                      ? `New reward ${token.type} token`
                      : undefined
                  }
                  key={token.id}
                  language={currentLanguage}
                  onClick={
                    isRewardAssignment && token.id !== rewardToken?.id
                      ? () => onTokenBagTokenClick?.(token.id)
                      : undefined
                  }
                  showName
                  token={token}
                />
              ))
            ) : (
              <span>{translations.noAvailableTokens}</span>
            )}
          </TokenDropZone>
        </section>
        {isRewardAssignment ? (
          <section className="spell-trash-section">
            <h2>{translations.trash}</h2>
            <TokenDropZone
              id={REWARD_TOKEN_DISCARD_DROP_ZONE_ID}
              label="Discard token drop zone"
            >
              <FontAwesomeIcon
                aria-label="Trash can"
                className="spell-trash-icon"
                icon={faTrashCan}
                role="img"
              />
              {isRewardTokenStagedForDiscard && rewardToken ? (
                <DraggableSpellToken
                  ariaLabel={`New reward ${rewardToken.type} token`}
                  language={currentLanguage}
                  showName
                  token={rewardToken}
                />
              ) : null}
            </TokenDropZone>
          </section>
        ) : null}
      </div>
      <DragOverlay>
        {activeDragToken ? (
          <span aria-hidden="true" className="spell-token-drag-overlay">
            <Token
              focusable={false}
              language={currentLanguage}
              showTooltip={false}
              tokenType={activeDragToken.type}
            />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default SpellTokenAssignment;
