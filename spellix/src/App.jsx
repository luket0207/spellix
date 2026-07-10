import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Modal from './components/Modal';
import DebugModal from './features/debug/DebugModal';
import { ENEMIES, getEnemyById, selectRandomEnemyForLevel } from './features/battle/enemies';
import { useGameSetup } from './features/gameSetup/GameSetupContext';
import {
  addTokenToBag,
  canAddTokenToBag,
  createDebugToken,
  getDebugTokenTypeLabel,
  replaceTokenInBag,
} from './features/debug/tokenBagAdmin';
import './App.css';
import BattlePage from './pages/BattlePage';
import GameplayPage from './pages/GameplayPage';
import GameSetupPage from './pages/GameSetupPage';
import RewardPage from './pages/RewardPage';
import StartPage from './pages/StartPage';

function App() {
  const navigate = useNavigate();
  const { currentPlayer, resetGame, setPlayerAnywhereMode, startBattle, updatePlayerSpells } =
    useGameSetup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [selectedDebugTokenType, setSelectedDebugTokenType] = useState('red');
  const [pendingDebugTokenType, setPendingDebugTokenType] = useState('');
  const [selectedReplacementTokenId, setSelectedReplacementTokenId] = useState('');
  const [selectedDebugEnemyId, setSelectedDebugEnemyId] = useState(ENEMIES[0]?.id ?? '');
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

  const handleOpenSettings = () => {
    setIsDebugOpen(false);
    resetDebugState();
    setIsSettingsOpen(true);
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

  const handleEnableAnywhereMode = () => {
    if (!currentPlayer) {
      setDebugMessage('Anywhere Mode is only available during gameplay turns.');
      return;
    }

    if (currentPlayer.anywhereMode) {
      setDebugMessage(`Anywhere Mode is already enabled for the ${currentPlayer.colour} player.`);
      return;
    }

    setPlayerAnywhereMode(currentPlayer.id, true);
    setDebugMessage(`Anywhere Mode enabled for the ${currentPlayer.colour} player.`);
  };

  const handleStartBattle = (level) => {
    if (!currentPlayer) {
      setDebugMessage('Debug battles are only available during gameplay turns.');
      return;
    }

    const enemy = selectRandomEnemyForLevel(level);

    if (!enemy) {
      setDebugMessage(`No enemy is available for battle level ${level}.`);
      return;
    }

    startBattle(currentPlayer.id, level, enemy.id);
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/battle');
  };

  const handleStartSelectedEnemyBattle = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug battles are only available during gameplay turns.');
      return;
    }

    const enemy = getEnemyById(selectedDebugEnemyId);

    if (!enemy) {
      setDebugMessage('Select a valid enemy before starting a manual battle.');
      return;
    }

    startBattle(currentPlayer.id, enemy.level, enemy.id);
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/battle');
  };

  return (
    <>
      <button
        aria-label="Open settings"
        className="app-settings-button"
        type="button"
        onClick={handleOpenSettings}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/setup" element={<GameSetupPage />} />
        <Route path="/gameplay" element={<GameplayPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/reward" element={<RewardPage />} />
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
        onEnableAnywhereMode={handleEnableAnywhereMode}
        onClose={handleCloseDebug}
        onDiscardPendingToken={handleDiscardPendingToken}
        enemyOptions={ENEMIES.map((enemy) => ({
          id: enemy.id,
          label: `${enemy.englishName} - Level ${enemy.level}`,
        }))}
        onGiveToken={handleGiveDebugToken}
        onStartBattle={handleStartBattle}
        onStartSelectedEnemyBattle={handleStartSelectedEnemyBattle}
        onPendingTokenReplacementChange={setSelectedReplacementTokenId}
        onReplacePendingToken={handleReplacePendingToken}
        onSelectedEnemyIdChange={setSelectedDebugEnemyId}
        onSelectedTokenTypeChange={setSelectedDebugTokenType}
        pendingTokenType={pendingDebugTokenType}
        selectedEnemyId={selectedDebugEnemyId}
        selectedReplacementTokenId={selectedReplacementTokenId}
        selectedTokenType={selectedDebugTokenType}
      />
    </>
  );
}

export default App;
