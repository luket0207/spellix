import { useId } from 'react';
import {
  DndContext,
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
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import {
  REWARD_TOKEN_DISCARD_DROP_ZONE_ID,
  TOKEN_BAG_DROP_ZONE_ID,
} from './spellSetup';
import './spells.css';

function DraggableSpellToken({ ariaLabel, onClick, token }) {
  const tokenDescriptionId = useId();
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: token.id,
    disabled: token.committed,
  });
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;
  const tokenDescription = TOKEN_DEFINITIONS[token.type]?.description;
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
        ariaLabel ?? `${token.committed ? 'Committed' : 'Moveable'} ${token.type} token`
      }
      className="spell-token-button"
      disabled={token.committed}
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
  isRewardTokenStagedInBag = false,
  isRewardTokenStagedForDiscard = false,
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );
  const handleDragEnd = ({ active, over }) => {
    if (!over) {
      return;
    }

    onTokenDrop?.(String(active.id), String(over.id));
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

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div aria-label={isRewardAssignment ? 'Reward token assignment' : 'Spell token assignment'}>
        <section className="spell-slot-section">
          <div className="spell-slot-scroll">
            <ul aria-label="Spell slots" className="spell-slot-list">
              {spellSlots.map((slot, index) => {
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
                  <li key={slot.id} className="spell-slot-item">
                    <p>{`Slot ${index + 1}: ${displayedTokens.length} of ${slot.maxTokens} tokens`}</p>
                    <TokenDropZone id={slot.id} label={`Spell slot ${index + 1}`}>
                      {displayedTokens.length > 0 ? (
                        displayedTokens.map((token) => (
                          <DraggableSpellToken
                            ariaLabel={
                              token.id === rewardToken?.id
                                ? `New reward ${token.type} token`
                                : undefined
                            }
                            key={token.id}
                            token={token}
                          />
                        ))
                      ) : (
                        <span>Drop tokens here</span>
                      )}
                    </TokenDropZone>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        <section className="spell-token-source">
          <p>{tokenSourceLabel}</p>
          <TokenDropZone id={TOKEN_BAG_DROP_ZONE_ID} label="Token bag drop zone">
            {displayedTokenBag.length > 0 ? (
              displayedTokenBag.map((token) => (
                <DraggableSpellToken
                  ariaLabel={
                    token.id === rewardToken?.id
                      ? `New reward ${token.type} token`
                      : undefined
                  }
                  key={token.id}
                  onClick={
                    isRewardAssignment && token.id !== rewardToken?.id
                      ? () => onTokenBagTokenClick?.(token.id)
                      : undefined
                  }
                  token={token}
                />
              ))
            ) : (
              <span>No available tokens</span>
            )}
          </TokenDropZone>
        </section>
        {isRewardAssignment && rewardToken ? (
          <section>
            <p>New Reward Token</p>
            {isRewardTokenStagedForDiscard ? (
              <span>Placed in discard area</span>
            ) : hasStagedRewardTokenBagReplacement ? (
              <span>Replacing token in token bag</span>
            ) : isRewardTokenStagedInBag ? (
              <span>Placed in token bag</span>
            ) : stagedRewardDestinationId ? (
              <span>{`Placed in spell slot ${
                spellSlots.findIndex(({ id }) => id === stagedRewardDestinationId) + 1
              }`}</span>
            ) : (
              <DraggableSpellToken
                ariaLabel={`New reward ${rewardToken.type} token`}
                token={rewardToken}
              />
            )}
          </section>
        ) : null}
        {isRewardAssignment ? (
          <section>
            <p>Discard</p>
            <TokenDropZone
              id={REWARD_TOKEN_DISCARD_DROP_ZONE_ID}
              label="Discard token drop zone"
            >
              <FontAwesomeIcon aria-label="Trash can" icon={faTrashCan} role="img" />
              {isRewardTokenStagedForDiscard && rewardToken ? (
                <DraggableSpellToken
                  ariaLabel={`New reward ${rewardToken.type} token`}
                  token={rewardToken}
                />
              ) : null}
            </TokenDropZone>
          </section>
        ) : null}
      </div>
    </DndContext>
  );
}

export default SpellTokenAssignment;
