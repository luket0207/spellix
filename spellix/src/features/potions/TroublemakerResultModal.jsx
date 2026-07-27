import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import Token from '../../components/tokens/Token';
import { getGameplayLanguage } from '../../i18n/translations';
import { getPieceImageSource } from '../gameSetup/pieceImages';
import './TroublemakerResultModal.css';

function formatTokenType(tokenType) {
  return tokenType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function TroublemakerResultModal({
  isOpen,
  language = 'en',
  onContinue,
  player,
  removedTokens = [],
}) {
  const currentLanguage = getGameplayLanguage(language);
  const isJapanese = currentLanguage === 'jp';
  const languageClassName = `language-${currentLanguage}`;
  const pieceImageSource = getPieceImageSource(player?.pieceImage);
  const lostToken = removedTokens[0]?.token;

  return (
    <Modal
      actions={
        <Button
          className={languageClassName}
          type="button"
          variant="secondary"
          onClick={onContinue}
        >
          {isJapanese ? '続ける' : 'Continue'}
        </Button>
      }
      ariaLabel="Troublemaker token loss"
      isOpen={isOpen}
      panelClassName="troublemaker-result-modal"
    >
      <div className="troublemaker-result-content">
        {pieceImageSource ? (
          <img
            alt={`Player ${player.number} piece`}
            aria-label={`Player ${player.number} piece`}
            className="troublemaker-result-player-image"
            src={pieceImageSource}
          />
        ) : player ? (
          <span aria-label={`Player ${player.number} piece`}>
            {player.colour}
          </span>
        ) : null}
        {lostToken ? (
          <>
            <p
              className={`troublemaker-result-message larger-text ${languageClassName}`}
            >
              {isJapanese
                ? 'このトークンを失いました。'
                : 'You lost this token'}
            </p>
            <Token
              ariaLabel={`${formatTokenType(lostToken.type)} lost token`}
              focusable={false}
              language={currentLanguage}
              showName={true}
              showTooltip={true}
              tokenType={lostToken.type}
            />
          </>
        ) : (
          <p
            className={`troublemaker-result-empty ${languageClassName}`}
          >
            {isJapanese
              ? '失うことのできるトークンはありませんでした。'
              : 'No eligible token could be lost.'}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default TroublemakerResultModal;
