import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import {
  getGameplayLanguage,
  getGameplayTranslations,
} from '../../i18n/translations';
import { getPieceImageSource } from '../gameSetup/pieceImages';
import './OtherPlayerChooser.css';

function OtherPlayerChooser({
  currentPlayerId,
  isOpen,
  language = 'en',
  onChoosePlayer,
  players = [],
}) {
  const activeLanguage = getGameplayLanguage(language);
  const languageClassName = `language-${activeLanguage}`;
  const translations = getGameplayTranslations(activeLanguage);
  const otherPlayers = players.filter(({ id }) => id !== currentPlayerId);

  return (
    <Modal
      ariaLabel={translations.targetPlayerPrompt}
      isOpen={isOpen}
    >
      <p className={`larger-text ${languageClassName}`}>
        {translations.targetPlayerPrompt}
      </p>
      <div className="other-player-chooser-options">
        {otherPlayers.map((player) => {
          const pieceImageSource = getPieceImageSource(player.pieceImage);

          return (
            <div
              aria-label={`Player ${player.number} option`}
              className="other-player-chooser-option"
              key={player.id}
              role="group"
            >
              {pieceImageSource ? (
                <img
                  alt={`Player ${player.number} piece`}
                  src={pieceImageSource}
                />
              ) : (
                <span>{player.colour}</span>
              )}
              <Button
                className={languageClassName}
                type="button"
                onClick={() => onChoosePlayer?.(player)}
              >
                {translations.targetPlayerChoose}
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export default OtherPlayerChooser;
