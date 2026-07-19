import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Button from './components/common/Button/Button';
import Modal from './components/Modal';
import { POTION_DEFINITIONS } from './data/potions';
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
  const {
    currentPlayer,
    gameSetup,
    grantPotionToPlayer,
    pendingPotionGrant,
    resetGame,
    resolvePendingPotionGrant,
    setPlayerAnywhereMode,
    startBattle,
    updatePlayerSpells,
  } = useGameSetup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [selectedDebugTokenType, setSelectedDebugTokenType] = useState('red');
  const [pendingDebugTokenType, setPendingDebugTokenType] = useState('');
  const [selectedReplacementTokenId, setSelectedReplacementTokenId] = useState('');
  const [selectedDebugPotionId, setSelectedDebugPotionId] = useState(
    POTION_DEFINITIONS[0]?.id ?? ''
  );
  const [selectedDebugPotionPlayerId, setSelectedDebugPotionPlayerId] = useState('player-1');
  const [selectedReplacementPotionIndex, setSelectedReplacementPotionIndex] = useState('');
  const [selectedDebugEnemyId, setSelectedDebugEnemyId] = useState(ENEMIES[0]?.id ?? '');
  const [selectedBattleEnvironment, setSelectedBattleEnvironment] = useState('fields');
  const [debugMessage, setDebugMessage] = useState('');

  const resetDebugState = () => {
    setPendingDebugTokenType('');
    setSelectedReplacementPotionIndex('');
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
    setSelectedDebugPotionPlayerId(currentPlayer?.id ?? gameSetup.players[0]?.id ?? '');
    setIsDebugOpen(true);
  };

  const handleOpenSettings = () => {
    if (isDebugOpen && pendingPotionGrant) {
      setDebugMessage('Resolve the pending potion grant before closing debug tools.');
      return;
    }

    setIsDebugOpen(false);
    resetDebugState();
    setIsSettingsOpen(true);
  };

  const handleCloseDebug = () => {
    if (pendingPotionGrant) {
      return;
    }

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

  const handleGiveDebugPotion = () => {
    const player = gameSetup.players.find(({ id }) => id === selectedDebugPotionPlayerId);
    const potion = POTION_DEFINITIONS.find(({ id }) => id === selectedDebugPotionId);

    if (!player || !potion) {
      setDebugMessage('Select a valid player and potion before granting.');
      return;
    }

    grantPotionToPlayer(player.id, potion);

    if (player.potions.length >= 3) {
      setSelectedReplacementPotionIndex('0');
      setDebugMessage(
        `The ${player.colour} player's potion collection is full. Discard the new ${potion.name} potion or replace one current potion.`
      );
      return;
    }

    setDebugMessage(`Added ${potion.name} to the ${player.colour} player's potions.`);
  };

  const handleDiscardPendingPotion = () => {
    if (!pendingPotionGrant) {
      return;
    }

    const potionName = pendingPotionGrant.potion.name;

    resolvePendingPotionGrant();
    setSelectedReplacementPotionIndex('');
    setDebugMessage(`Discarded the new ${potionName} potion.`);
  };

  const handleReplacePendingPotion = () => {
    if (!pendingPotionGrant || selectedReplacementPotionIndex === '') {
      return;
    }

    const player = gameSetup.players.find(({ id }) => id === pendingPotionGrant.playerId);
    const replacedPotion = player?.potions[Number(selectedReplacementPotionIndex)];

    resolvePendingPotionGrant(Number(selectedReplacementPotionIndex));
    setSelectedReplacementPotionIndex('');
    setDebugMessage(
      `Replaced ${replacedPotion?.name ?? 'one current potion'} with ${pendingPotionGrant.potion.name} for the ${player?.colour ?? 'selected'} player.`
    );
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

    startBattle(currentPlayer.id, level, enemy.id, selectedBattleEnvironment);
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

    startBattle(currentPlayer.id, enemy.level, enemy.id, selectedBattleEnvironment);
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
            <Button type="button" onClick={handleOpenDebug}>
              Debug
            </Button>
            <Button type="button" onClick={handleEndGame}>
              End Game
            </Button>
            <Button type="button" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
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
        onDiscardPendingPotion={handleDiscardPendingPotion}
        onDiscardPendingToken={handleDiscardPendingToken}
        enemyOptions={ENEMIES.map((enemy) => ({
          id: enemy.id,
          label: `${enemy.englishName} - Level ${enemy.level}`,
        }))}
        onGivePotion={handleGiveDebugPotion}
        onGiveToken={handleGiveDebugToken}
        onPendingPotionReplacementChange={setSelectedReplacementPotionIndex}
        onStartBattle={handleStartBattle}
        onStartSelectedEnemyBattle={handleStartSelectedEnemyBattle}
        onPendingTokenReplacementChange={setSelectedReplacementTokenId}
        onReplacePendingPotion={handleReplacePendingPotion}
        onReplacePendingToken={handleReplacePendingToken}
        onSelectedEnvironmentChange={setSelectedBattleEnvironment}
        onSelectedEnemyIdChange={setSelectedDebugEnemyId}
        onSelectedPotionIdChange={setSelectedDebugPotionId}
        onSelectedPotionPlayerIdChange={setSelectedDebugPotionPlayerId}
        onSelectedTokenTypeChange={setSelectedDebugTokenType}
        pendingPotionGrant={pendingPotionGrant}
        pendingTokenType={pendingDebugTokenType}
        players={gameSetup.players}
        selectedEnemyId={selectedDebugEnemyId}
        selectedEnvironment={selectedBattleEnvironment}
        selectedPotionId={selectedDebugPotionId}
        selectedPotionPlayerId={selectedDebugPotionPlayerId}
        selectedReplacementPotionIndex={selectedReplacementPotionIndex}
        selectedReplacementTokenId={selectedReplacementTokenId}
        selectedTokenType={selectedDebugTokenType}
      />
    </>
  );
}

export default App;
