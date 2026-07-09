import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Modal from './components/Modal';
import DebugModal from './features/debug/DebugModal';
import { useGameSetup } from './features/gameSetup/GameSetupContext';
import {
  addTokenToBag,
  canAddTokenToBag,
  createDebugToken,
  getDebugTokenTypeLabel,
  replaceTokenInBag,
} from './features/debug/tokenBagAdmin';
import './App.css';
import GameplayPage from './pages/GameplayPage';
import GameSetupPage from './pages/GameSetupPage';
import StartPage from './pages/StartPage';

function App() {
  const navigate = useNavigate();
  const { currentPlayer, resetGame, updatePlayerSpells } = useGameSetup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [selectedDebugTokenType, setSelectedDebugTokenType] = useState('red');
  const [pendingDebugTokenType, setPendingDebugTokenType] = useState('');
  const [selectedReplacementTokenId, setSelectedReplacementTokenId] = useState('');
  const [debugMessage, setDebugMessage] = useState('');

  const resetDebugState = () => {
    setPendingDebugTokenType('');
    setSelectedReplacementTokenId('');
    setDebugMessage('');
  };

  const handleEndGame = () => {
    resetGame();
    setIsSettingsOpen(false);
    setIsDebugOpen(false);
    resetDebugState();
    navigate('/');
  };

  const handleOpenDebug = () => {
    setIsSettingsOpen(false);
    resetDebugState();
    setIsDebugOpen(true);
  };

  const handleCloseDebug = () => {
    setIsDebugOpen(false);
    resetDebugState();
  };

  const updateCurrentPlayerTokenBag = (nextTokenBag, nextMessage) => {
    if (!currentPlayer) {
      return;
    }

    updatePlayerSpells(currentPlayer.id, {
      tokenBag: nextTokenBag,
      spellSlots: currentPlayer.spellSlots,
      hasCommittedInitialSpells: currentPlayer.hasCommittedInitialSpells,
    });
    setDebugMessage(nextMessage);
  };

  const handleGiveDebugToken = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug token tools are only available during gameplay turns.');
      return;
    }

    if (!currentPlayer.hasCommittedInitialSpells) {
      setDebugMessage("Finish the current player's initial spell setup before using debug token tools.");
      return;
    }

    const nextToken = createDebugToken(currentPlayer, selectedDebugTokenType);
    const tokenTypeLabel = getDebugTokenTypeLabel(selectedDebugTokenType);

    if (canAddTokenToBag(currentPlayer.tokenBag)) {
      updateCurrentPlayerTokenBag(
        addTokenToBag(currentPlayer.tokenBag, nextToken),
        `Added a ${tokenTypeLabel} token to the ${currentPlayer.colour} player's token bag.`
      );
      setPendingDebugTokenType('');
      setSelectedReplacementTokenId('');
      return;
    }

    setPendingDebugTokenType(selectedDebugTokenType);
    setSelectedReplacementTokenId(currentPlayer.tokenBag[0]?.id ?? '');
    setDebugMessage(
      `The ${currentPlayer.colour} player's token bag is full. Discard the new ${tokenTypeLabel} token or replace one existing bag token.`
    );
  };

  const handleDiscardPendingToken = () => {
    const tokenTypeLabel = getDebugTokenTypeLabel(pendingDebugTokenType);

    setPendingDebugTokenType('');
    setSelectedReplacementTokenId('');
    setDebugMessage(`Discarded the new ${tokenTypeLabel} token.`);
  };

  const handleReplacePendingToken = () => {
    if (!currentPlayer || !pendingDebugTokenType || !selectedReplacementTokenId) {
      return;
    }

    const replacementToken = createDebugToken(currentPlayer, pendingDebugTokenType);
    const nextTokenBag = replaceTokenInBag(
      currentPlayer.tokenBag,
      selectedReplacementTokenId,
      replacementToken
    );

    updateCurrentPlayerTokenBag(
      nextTokenBag,
      `Replaced one bag token with a ${getDebugTokenTypeLabel(pendingDebugTokenType)} token for the ${currentPlayer.colour} player.`
    );
    setPendingDebugTokenType('');
    setSelectedReplacementTokenId('');
  };

  return (
    <>
      <button
        aria-label="Open settings"
        className="app-settings-button"
        type="button"
        onClick={() => setIsSettingsOpen(true)}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/setup" element={<GameSetupPage />} />
        <Route path="/gameplay" element={<GameplayPage />} />
      </Routes>

      <Modal
        actions={
          <>
            <button type="button" onClick={handleOpenDebug}>
              Debug
            </button>
            <button type="button" onClick={handleEndGame}>
              End Game
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(false)}>
              Close
            </button>
          </>
        }
        ariaLabel="Settings"
        isOpen={isSettingsOpen}
      >
        <p>Settings</p>
      </Modal>

      <DebugModal
        currentPlayer={currentPlayer}
        isOpen={isDebugOpen}
        message={debugMessage}
        onClose={handleCloseDebug}
        onDiscardPendingToken={handleDiscardPendingToken}
        onGiveToken={handleGiveDebugToken}
        onPendingTokenReplacementChange={setSelectedReplacementTokenId}
        onReplacePendingToken={handleReplacePendingToken}
        onSelectedTokenTypeChange={setSelectedDebugTokenType}
        pendingTokenType={pendingDebugTokenType}
        selectedReplacementTokenId={selectedReplacementTokenId}
        selectedTokenType={selectedDebugTokenType}
      />
    </>
  );
}

export default App;
