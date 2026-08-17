import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Button from './components/common/Button/Button';
import Modal from './components/Modal';
import { HAZARDS, selectHazardForEnvironment } from './data/hazards';
import { getNothingEventForEnvironment } from './data/nothingEvents';
import { POTION_DEFINITIONS } from './data/potions';
import { getBattleEnvironmentForBoardEnvironment } from './data/environmentEvents';
import DebugModal from './features/debug/DebugModal';
import { ENEMIES, getEnemyById, selectRandomEnemyForLevel } from './features/battle/enemies';
import { useGameSetup } from './features/gameSetup/GameSetupContext';
import RulesBody from './features/rules/RulesBody';
import { RULES_CONTENT } from './features/rules/rulesContent';
import {
  createSaveFileText,
  downloadSaveFile,
} from './features/saveGame/saveGame';
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
import HazardPage from './pages/HazardPage';
import RewardPage from './pages/RewardPage';
import RulesPage from './pages/RulesPage';
import StartPage from './pages/StartPage';
import StoryPage from './pages/StoryPage';
import DecisionPage from './pages/DecisionPage';
import CaveMiniGame from './pages/MiniGames/CaveMiniGame';
import LootChestPage from './pages/MiniGames/LootChestPage';
import MiniGameLosePage from './pages/MiniGames/MiniGameLosePage';
import RiverMiniGame from './pages/MiniGames/RiverMiniGame';
import BossNotReadyPage from './pages/BossNotReadyPage';
import WinnerPage from './pages/WinnerPage';
import VillagePage from './pages/VillagePage';
import NothingEventPage from './pages/NothingEventPage';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentPlayer,
    gameSetup,
    grantPotionToPlayer,
    pendingNextTurnModal,
    pendingPotionGrant,
    resetGame,
    restoreGame,
    resolvePendingPotionGrant,
    setPlayerAnywhereMode,
    startBattle,
    startMiniGame,
    updatePlayerSpells,
  } = useGameSetup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsModalView, setSettingsModalView] = useState('main');
  const [settingsRulesLanguage, setSettingsRulesLanguage] = useState('en');
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isChooseEventModeEnabled, setIsChooseEventModeEnabled] = useState(false);
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
  const [selectedDecisionEnvironment, setSelectedDecisionEnvironment] = useState('fields');
  const [selectedHazardEnvironment, setSelectedHazardEnvironment] = useState('field');
  const [selectedNothingEnvironment, setSelectedNothingEnvironment] = useState('field');
  const [activeHazard, setActiveHazard] = useState(null);
  const [activeDecisionEnvironment, setActiveDecisionEnvironment] = useState('fields');
  const [activeLootChestEvent, setActiveLootChestEvent] = useState(null);
  const [activeNothingEvent, setActiveNothingEvent] = useState(null);
  const [activeRollAgainEvent, setActiveRollAgainEvent] = useState(null);
  const [debugMessage, setDebugMessage] = useState('');
  const settingsPlayerLanguage =
    currentPlayer?.language ??
    gameSetup.players[gameSetup.currentTurnIndex]?.language ??
    'en';

  const resetDebugState = () => {
    setPendingDebugTokenType('');
    setSelectedReplacementPotionIndex('');
    setSelectedReplacementTokenId('');
    setDebugMessage('');
  };

  const handleSaveGame = () => {
    const appState = {
      activeDecisionEnvironment,
      activeHazard,
      activeLootChestEvent,
      activeNothingEvent,
      activeRollAgainEvent,
      isChooseEventModeEnabled,
    };

    downloadSaveFile(createSaveFileText(gameSetup, appState));
  };

  const handleLoadGame = ({ appState = {}, gameState }) => {
    restoreGame(gameState);
    setIsChooseEventModeEnabled(Boolean(appState.isChooseEventModeEnabled));
    setActiveHazard(appState.activeHazard ?? null);
    setActiveDecisionEnvironment(appState.activeDecisionEnvironment ?? 'fields');
    setActiveLootChestEvent(appState.activeLootChestEvent ?? null);
    setActiveNothingEvent(appState.activeNothingEvent ?? null);
    setActiveRollAgainEvent(appState.activeRollAgainEvent ?? null);
    setIsSettingsOpen(false);
    setIsDebugOpen(false);
    resetDebugState();
    navigate('/gameplay');
  };

  const handleEndGame = () => {
    resetGame();
    setIsSettingsOpen(false);
    setIsDebugOpen(false);
    setActiveHazard(null);
    setActiveDecisionEnvironment('fields');
    setActiveLootChestEvent(null);
    setActiveNothingEvent(null);
    setActiveRollAgainEvent(null);
    resetDebugState();
    navigate('/');
  };

  const handleWinnerBackToStart = () => {
    navigate('/');
  };

  const handleOpenDebug = () => {
    setIsSettingsOpen(false);
    resetDebugState();
    setSelectedDebugPotionPlayerId(currentPlayer?.id ?? gameSetup.players[0]?.id ?? '');
    setIsDebugOpen(true);
  };

  const handleOpenSettings = () => {
    if (pendingNextTurnModal) {
      return;
    }

    if (isDebugOpen && pendingPotionGrant) {
      setDebugMessage('Resolve the pending potion grant before closing debug tools.');
      return;
    }

    setIsDebugOpen(false);
    resetDebugState();
    setSettingsModalView('main');
    setSettingsRulesLanguage(settingsPlayerLanguage);
    setIsSettingsOpen(true);
  };

  const handleOpenSettingsRules = () => {
    setSettingsRulesLanguage(settingsPlayerLanguage);
    setSettingsModalView('rules');
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
    const tokenTypeLabel = getDebugTokenTypeLabel(
      selectedDebugTokenType,
      currentPlayer.language
    );

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
    const tokenTypeLabel = getDebugTokenTypeLabel(
      pendingDebugTokenType,
      currentPlayer?.language
    );

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
      `Replaced one bag token with a ${getDebugTokenTypeLabel(
        pendingDebugTokenType,
        currentPlayer.language
      )} token for the ${currentPlayer.colour} player.`
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

  const handleStartRiverMiniGame = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug mini games are only available during gameplay turns.');
      return;
    }

    startMiniGame('river', currentPlayer.id);
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/mini-game/river');
  };

  const handleStartCaveMiniGame = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug mini games are only available during gameplay turns.');
      return;
    }

    startMiniGame('cave', currentPlayer.id);
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/mini-game/cave');
  };

  const handleStartDecision = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug decisions are only available during gameplay turns.');
      return;
    }

    setActiveDecisionEnvironment(selectedDecisionEnvironment);
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/decision');
  };

  const handleStartHazard = () => {
    if (!currentPlayer) {
      setDebugMessage('Debug hazards are only available during gameplay turns.');
      return;
    }

    const hazard = selectHazardForEnvironment(
      selectedHazardEnvironment,
      HAZARDS
    );

    if (!hazard) {
      setDebugMessage('No hazard is available for the selected environment.');
      return;
    }

    setActiveHazard({
      environment: selectedHazardEnvironment,
      hazard,
      playerId: currentPlayer.id,
    });
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/hazard');
  };

  const handleStartNothingEvent = () => {
    if (!currentPlayer) {
      setDebugMessage(
        'Debug Nothing events are only available during gameplay turns.'
      );
      return;
    }

    const event = getNothingEventForEnvironment(selectedNothingEnvironment);

    if (!event) {
      setDebugMessage(
        'No Nothing event is available for the selected environment.'
      );
      return;
    }

    setActiveNothingEvent({
      event,
      playerId: currentPlayer.id,
    });
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/nothing-event');
  };

  const handleStartRollAgainEvent = () => {
    if (!currentPlayer?.hasCommittedInitialSpells) {
      setDebugMessage(
        'Debug Roll Again events are only available during active gameplay turns.'
      );
      return;
    }

    setActiveRollAgainEvent({
      isModalOpen: true,
      playerId: currentPlayer.id,
    });
    setIsDebugOpen(false);
    setIsSettingsOpen(false);
    resetDebugState();
    navigate('/gameplay');
  };

  const handleContinueRollAgainEvent = () => {
    setActiveRollAgainEvent((event) =>
      event ? { ...event, isModalOpen: false } : null
    );
  };

  const handleTriggerBoardEvent = ({
    environment,
    eventType,
    playerId,
  }) => {
    const battleEnvironment =
      getBattleEnvironmentForBoardEnvironment(environment);

    if (eventType === 'nothing') {
      const event = getNothingEventForEnvironment(environment);

      if (event) {
        setActiveNothingEvent({ event, playerId });
        navigate('/nothing-event');
      }
      return;
    }

    if (/^level[1-3]Battle$/.test(eventType)) {
      const level = Number(eventType.slice(5, 6));
      const enemy = selectRandomEnemyForLevel(level);

      if (enemy) {
        startBattle(playerId, level, enemy.id, battleEnvironment);
        navigate('/battle');
      }
      return;
    }

    if (eventType === 'riverMiniGame' || eventType === 'caveMiniGame') {
      const type = eventType === 'riverMiniGame' ? 'river' : 'cave';

      startMiniGame(type, playerId, {
        environment,
        source: 'boardLanding',
      });
      navigate(`/mini-game/${type}`);
      return;
    }

    if (eventType === 'decision') {
      setActiveDecisionEnvironment(battleEnvironment);
      navigate('/decision');
      return;
    }

    if (eventType === 'hazard') {
      const hazard = selectHazardForEnvironment(environment, HAZARDS);

      if (hazard) {
        setActiveHazard({ environment, hazard, playerId });
        navigate('/hazard');
      }
      return;
    }

    if (eventType === 'lootChest') {
      setActiveLootChestEvent({ environment, playerId });
      return;
    }

    if (eventType === 'rollAgain') {
      setActiveRollAgainEvent({
        isModalOpen: true,
        playerId,
      });
    }
  };

  const handleOpenLootChest = () => {
    if (!activeLootChestEvent) {
      return;
    }

    startMiniGame('lootChest', activeLootChestEvent.playerId, {
      environment: activeLootChestEvent.environment,
      result: 'win',
      returnBehaviour: 'nextPlayerTurn',
      source: 'boardLanding',
    });
    setActiveLootChestEvent(null);
    navigate('/mini-game/loot-chest');
  };

  return (
    <>
      {location.pathname === '/gameplay' &&
      !gameSetup.hasRolledMovementDice &&
      !pendingNextTurnModal &&
      !gameSetup.pendingTurnRespawn ? (
        <button
          aria-label="Open settings"
          className="app-settings-button"
          disabled={pendingNextTurnModal}
          type="button"
          onClick={handleOpenSettings}
        >
          <FontAwesomeIcon icon={faGear} />
        </button>
      ) : null}

      <Routes>
        <Route
          path="/"
          element={<StartPage onLoadGame={handleLoadGame} onStart={resetGame} />}
        />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/setup" element={<GameSetupPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route
          path="/gameplay"
          element={
            <GameplayPage
              activeLootChestEvent={activeLootChestEvent}
              activeRollAgainEvent={activeRollAgainEvent}
              isChooseEventModeEnabled={isChooseEventModeEnabled}
              onOpenLootChest={handleOpenLootChest}
              onConsumeRollAgainEvent={() => setActiveRollAgainEvent(null)}
              onContinueRollAgainEvent={handleContinueRollAgainEvent}
              onNavigate={navigate}
              onTriggerBoardEvent={handleTriggerBoardEvent}
            />
          }
        />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/boss-not-ready" element={<BossNotReadyPage />} />
        <Route path="/village" element={<VillagePage />} />
        <Route
          path="/decision"
          element={<DecisionPage environment={activeDecisionEnvironment} />}
        />
        <Route
          path="/hazard"
          element={
            <HazardPage
              encounter={activeHazard}
              onComplete={() => setActiveHazard(null)}
            />
          }
        />
        <Route
          path="/nothing-event"
          element={
            <NothingEventPage
              encounter={activeNothingEvent}
              onComplete={() => setActiveNothingEvent(null)}
            />
          }
        />
        <Route path="/reward" element={<RewardPage />} />
        <Route path="/mini-game/cave" element={<CaveMiniGame />} />
        <Route path="/mini-game/river" element={<RiverMiniGame />} />
        <Route path="/mini-game/loot-chest" element={<LootChestPage />} />
        <Route path="/mini-game/lose" element={<MiniGameLosePage />} />
        <Route
          path="/winner"
          element={
            <WinnerPage onBackToStart={handleWinnerBackToStart} />
          }
        />
      </Routes>

      <Modal
        actions={
          settingsModalView === 'main' ? (
            <>
              {gameSetup.debugMode ? (
                <Button type="button" onClick={handleOpenDebug}>
                  Debug
                </Button>
              ) : null}
              {location.pathname === '/gameplay' ? (
                <Button type="button" onClick={handleSaveGame}>
                  {currentPlayer?.language === 'jp' ? 'ゲームを保存' : 'Save Game'}
                </Button>
              ) : null}
              <Button type="button" onClick={handleOpenSettingsRules}>
                {settingsPlayerLanguage === 'jp' ? 'ルール' : 'Rules'}
              </Button>
              <Button type="button" onClick={handleEndGame}>
                End Game
              </Button>
              <Button type="button" onClick={() => setIsSettingsOpen(false)}>
                Close
              </Button>
            </>
          ) : null
        }
        ariaLabel={
          settingsModalView === 'rules'
            ? RULES_CONTENT[settingsRulesLanguage].title
            : 'Settings'
        }
        isOpen={isSettingsOpen}
      >
        {settingsModalView === 'rules' ? (
          <RulesBody
            backLabels={{ en: 'Back to Settings', jp: '設定に戻る' }}
            language={settingsRulesLanguage}
            onBack={() => setSettingsModalView('main')}
            onLanguageChange={setSettingsRulesLanguage}
          />
        ) : (
          <p>Settings</p>
        )}
      </Modal>

      {gameSetup.debugMode ? (
        <DebugModal
          currentPlayer={currentPlayer}
          eliteBossEnemyAssignments={gameSetup.eliteBossEnemyAssignments}
          isOpen={isDebugOpen}
          isChooseEventModeEnabled={isChooseEventModeEnabled}
          message={debugMessage}
          onEnableAnywhereMode={handleEnableAnywhereMode}
          onToggleChooseEventMode={() =>
            setIsChooseEventModeEnabled((isEnabled) => !isEnabled)
          }
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
          onStartCaveMiniGame={handleStartCaveMiniGame}
          onStartDecision={handleStartDecision}
          onStartHazard={handleStartHazard}
          onStartNothingEvent={handleStartNothingEvent}
          onStartRollAgainEvent={handleStartRollAgainEvent}
          onStartBattle={handleStartBattle}
          onStartRiverMiniGame={handleStartRiverMiniGame}
          onStartSelectedEnemyBattle={handleStartSelectedEnemyBattle}
          onPendingTokenReplacementChange={setSelectedReplacementTokenId}
          onReplacePendingPotion={handleReplacePendingPotion}
          onReplacePendingToken={handleReplacePendingToken}
          onSelectedEnvironmentChange={setSelectedBattleEnvironment}
          onSelectedEnemyIdChange={setSelectedDebugEnemyId}
          onSelectedHazardEnvironmentChange={setSelectedHazardEnvironment}
          onSelectedNothingEnvironmentChange={setSelectedNothingEnvironment}
          onSelectedDecisionEnvironmentChange={setSelectedDecisionEnvironment}
          onSelectedPotionIdChange={setSelectedDebugPotionId}
          onSelectedPotionPlayerIdChange={setSelectedDebugPotionPlayerId}
          onSelectedTokenTypeChange={setSelectedDebugTokenType}
          pendingPotionGrant={pendingPotionGrant}
          pendingTokenType={pendingDebugTokenType}
          players={gameSetup.players}
          selectedEnemyId={selectedDebugEnemyId}
          selectedDecisionEnvironment={selectedDecisionEnvironment}
          selectedEnvironment={selectedBattleEnvironment}
          selectedHazardEnvironment={selectedHazardEnvironment}
          selectedNothingEnvironment={selectedNothingEnvironment}
          selectedPotionId={selectedDebugPotionId}
          selectedPotionPlayerId={selectedDebugPotionPlayerId}
          selectedReplacementPotionIndex={selectedReplacementPotionIndex}
          selectedReplacementTokenId={selectedReplacementTokenId}
          selectedTokenType={selectedDebugTokenType}
        />
      ) : null}
    </>
  );
}

export default App;
