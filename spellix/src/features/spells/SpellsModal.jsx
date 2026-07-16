import Modal from '../../components/Modal';
import {
  getGameplayLanguage,
  getSpellAssignmentTranslations,
} from '../../i18n/translations';
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
  const currentLanguage = getGameplayLanguage(currentPlayer?.language);
  const translations = getSpellAssignmentTranslations(currentLanguage);
  const languageClassName = `language-${currentLanguage}`;

  return (
    <Modal
      actions={
        <div className="spell-modal-actions">
          <button
            className={languageClassName}
            disabled={isForcedSetup}
            onClick={onCancel}
            type="button"
          >
            {translations.cancel}
          </button>
          <button
            className={languageClassName}
            disabled={isSaveDisabled}
            onClick={onSave}
            type="button"
          >
            {translations.save}
          </button>
        </div>
      }
      ariaLabel={translations.spells}
      isOpen={isOpen && Boolean(currentPlayer)}
      panelClassName="modal-panel--spells"
    >
      {currentPlayer ? (
        <div className="spells-layout">
            <div className="spells-header">
              <h2 className={languageClassName}>{translations.spells}</h2>
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
              <p className={languageClassName}>{translations.startingTokenWarning}</p>
            ) : null}
            {validationMessage ? <p className={languageClassName}>{validationMessage}</p> : null}
            <SpellTokenAssignment
              language={currentLanguage}
              onTokenDrop={onTokenDrop}
              spellSlots={draftSpellSlots}
              tokenBag={draftTokenBag}
            />
        </div>
      ) : null}
    </Modal>
  );
}

export default SpellsModal;
