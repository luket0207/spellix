import Modal from '../../components/Modal';
import { getPieceImageSource } from '../gameSetup/pieceImages';
import SpellTokenAssignment from './SpellTokenAssignment';
import './spells.css';

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
  const pieceImageSource = currentPlayer ? getPieceImageSource(currentPlayer.pieceImage) : '';

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
        <div className="spells-layout">
            <div className="spells-header">
              <h2>Spells</h2>
              {pieceImageSource ? (
                <img
                  alt="Spell player piece"
                  aria-label="Spell player piece"
                  className="spells-player-piece"
                  src={pieceImageSource}
                  style={{ height: '100px' }}
                />
              ) : (
                <span aria-label="Spell player piece">{currentPlayer.colour}</span>
              )}
            </div>
            {isForcedSetup ? (
              <p>You must place all 7 starting tokens into spell slots before rolling dice.</p>
            ) : null}
            {validationMessage ? <p>{validationMessage}</p> : null}
            <SpellTokenAssignment
              onTokenDrop={onTokenDrop}
              spellSlots={draftSpellSlots}
              tokenBag={draftTokenBag}
              tokenSourceLabel={isForcedSetup ? 'Starting Tokens' : 'Token Bag'}
            />
        </div>
      ) : null}
    </Modal>
  );
}

export default SpellsModal;
