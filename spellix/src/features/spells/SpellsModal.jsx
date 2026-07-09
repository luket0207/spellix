import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../../components/Modal';
import SpellToken from './SpellToken';
import { TOKEN_BAG_DROP_ZONE_ID } from './spellSetup';
import './spells.css';

function DraggableSpellToken({ token }) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: token.id,
    disabled: token.committed,
  });
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={`${token.committed ? 'Committed' : 'Moveable'} ${token.type} token`}
      className="spell-token-button"
      disabled={token.committed}
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.6 : 1,
      }}
      type="button"
    >
      <SpellToken ariaLabel={`${token.type} token`} isLocked={token.committed} tokenType={token.type} />
    </button>
  );
}

function TokenDropZone({ children, id, label, readOnly = false }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: readOnly,
  });

  return (
    <div
      aria-label={label}
      className={`spell-drop-zone${isOver ? ' spell-drop-zone--active' : ''}${
        readOnly ? ' spell-drop-zone--read-only' : ''
      }`}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
}

function SpellsModal({
  currentPlayer,
  draftSpellSlots,
  draftTokenBag,
  isForcedSetup,
  isOpen,
  onCancel,
  onSave,
  isSaveDisabled = false,
  onTokenDrop,
  validationMessage,
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

    onTokenDrop(String(active.id), String(over.id));
  };

  return (
    <Modal
      actions={
        <div className="spell-modal-actions">
          <button disabled={isForcedSetup} onClick={onCancel} type="button">
            Cancel
          </button>
          <button disabled={isSaveDisabled} onClick={onSave} type="button">
            Save
          </button>
        </div>
      }
      ariaLabel="Spells"
      isOpen={isOpen && Boolean(currentPlayer)}
      panelClassName="modal-panel--spells"
    >
      {currentPlayer ? (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="spells-layout">
            <p>{`Spells for ${currentPlayer.colour} player.`}</p>
            {isForcedSetup ? (
              <p>You must place all 7 starting tokens into spell slots before rolling dice.</p>
            ) : null}
            {validationMessage ? <p>{validationMessage}</p> : null}
            <section className="spell-slot-section">
              <div className="spell-slot-scroll">
                <ul aria-label="Spell slots" className="spell-slot-list">
                  {draftSpellSlots.map((slot, index) => (
                    <li key={slot.id} className="spell-slot-item">
                      <p>{`Slot ${index + 1}: ${slot.tokens.length} of ${slot.maxTokens} tokens`}</p>
                      <TokenDropZone id={slot.id} label={`Spell slot ${index + 1}`}>
                        {slot.tokens.length > 0 ? (
                          slot.tokens.map((token) => <DraggableSpellToken key={token.id} token={token} />)
                        ) : (
                          <span>Drop tokens here</span>
                        )}
                      </TokenDropZone>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <section className="spell-token-source">
              <p>{isForcedSetup ? 'Starting Tokens' : 'Token Bag'}</p>
              <TokenDropZone id={TOKEN_BAG_DROP_ZONE_ID} label="Token bag drop zone">
                {draftTokenBag.length > 0 ? (
                  draftTokenBag.map((token) => <DraggableSpellToken key={token.id} token={token} />)
                ) : (
                  <span>No available tokens</span>
                )}
              </TokenDropZone>
            </section>
          </div>
        </DndContext>
      ) : null}
    </Modal>
  );
}

export default SpellsModal;
