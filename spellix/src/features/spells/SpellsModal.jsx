import Button from '../../components/common/Button/Button';
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
  isRedoMode = false,
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
          <Button
            className={languageClassName}
            disabled={isForcedSetup}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {translations.cancel}
          </Button>
          <Button
            className={languageClassName}
            disabled={isSaveDisabled}
            onClick={onSave}
            type="button"
            variant="secondary"
          >
            {translations.save}
          </Button>
        </div>
      }
      ariaLabel={translations.spells}
      isOpen={isOpen && Boolean(currentPlayer)}
      panelClassName="modal-panel--spells"
    >
      {currentPlayer ? (
        <div className="spells-layout">
          <div className="spells-header">
            <div className="spells-header-copy">
              <h1 className={`spells-title ${languageClassName}`}>
                {translations.spells}
              </h1>
              {isForcedSetup ? (
                <p className={`spells-starting-warning ${languageClassName}`}>
                  {translations.startingTokenWarning}
                </p>
              ) : (
                <p className={`spells-starting-warning ${languageClassName}`}>
                  {isRedoMode ? translations.redoWarning : translations.spellsInfo}
                </p>
              )}
              {validationMessage ? (
                <p className={languageClassName}>{validationMessage}</p>
              ) : null}
            </div>
            {pieceImageSource ? (
              <img
                alt="Spell player piece"
                aria-label="Spell player piece"
                className="spells-player-piece"
                src={pieceImageSource}
              />
            ) : (
              <span aria-label="Spell player piece">{currentPlayer.colour}</span>
            )}
          </div>
          <SpellTokenAssignment
            allowCommittedTokenMovement={isRedoMode}
            language={currentLanguage}
            mergedColumns={currentPlayer.mergedColumns}
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
