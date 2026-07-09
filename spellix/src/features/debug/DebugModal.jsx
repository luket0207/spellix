import Modal from '../../components/Modal';
import SpellToken from '../spells/SpellToken';
import { DEBUG_TOKEN_TYPES, getDebugTokenTypeLabel } from './tokenBagAdmin';
import './debug.css';

function DebugModal({
  currentPlayer,
  isOpen,
  message,
  onClose,
  onDiscardPendingToken,
  onGiveToken,
  onPendingTokenReplacementChange,
  onReplacePendingToken,
  onSelectedTokenTypeChange,
  pendingTokenType = '',
  selectedReplacementTokenId = '',
  selectedTokenType = 'red',
}) {
  const isCurrentPlayerReady = Boolean(currentPlayer?.hasCommittedInitialSpells);
  const isTokenSelectionDisabled = !currentPlayer || !isCurrentPlayerReady || Boolean(pendingTokenType);

  return (
    <Modal
      actions={
        <button type="button" onClick={onClose}>
          Close
        </button>
      }
      ariaLabel="Debug"
      isOpen={isOpen}
      panelClassName="debug-modal-panel"
    >
      <div className="debug-modal-layout">
        <p>Debug</p>
        <p>
          {currentPlayer
            ? `Current player: ${currentPlayer.colour}`
            : 'No current player is available outside gameplay turns.'}
        </p>

        {currentPlayer && !isCurrentPlayerReady ? (
          <p>Finish the current player&apos;s initial spell setup before using debug token tools.</p>
        ) : null}

        <div className="debug-token-give-controls">
          <label htmlFor="debug-token-type">Token type</label>
          <select
            id="debug-token-type"
            value={selectedTokenType}
            disabled={isTokenSelectionDisabled}
            onChange={(event) => onSelectedTokenTypeChange(event.target.value)}
          >
            {DEBUG_TOKEN_TYPES.map((tokenType) => (
              <option key={tokenType} value={tokenType}>
                {getDebugTokenTypeLabel(tokenType)}
              </option>
            ))}
          </select>

          <button type="button" disabled={isTokenSelectionDisabled} onClick={onGiveToken}>
            Give Token
          </button>
        </div>

        {message ? <p>{message}</p> : null}

        {pendingTokenType ? (
          <div className="debug-token-replacement-flow">
            <p>{`New token: ${getDebugTokenTypeLabel(pendingTokenType)}`}</p>
            <div className="debug-token-choice-list" role="radiogroup" aria-label="Bag tokens to discard">
              {currentPlayer.tokenBag.map((token) => (
                <label key={token.id} className="debug-token-choice">
                  <input
                    checked={selectedReplacementTokenId === token.id}
                    name="debug-token-replacement"
                    type="radio"
                    value={token.id}
                    onChange={(event) => onPendingTokenReplacementChange(event.target.value)}
                  />
                  <SpellToken
                    ariaLabel={`${getDebugTokenTypeLabel(token.type)} token`}
                    tokenType={token.type}
                  />
                  <span>{getDebugTokenTypeLabel(token.type)}</span>
                </label>
              ))}
            </div>

            <div className="debug-token-replacement-actions">
              <button type="button" onClick={onDiscardPendingToken}>
                Discard New Token
              </button>
              <button
                type="button"
                disabled={!selectedReplacementTokenId}
                onClick={onReplacePendingToken}
              >
                Replace Selected Token
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default DebugModal;
