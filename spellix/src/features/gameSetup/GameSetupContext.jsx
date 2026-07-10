import { createContext, useContext, useState } from 'react';
import {
  clampPlayerCount,
  cloneSpellSlots,
  cloneTokenBag,
  createInitialGameSetup,
  createPlayers,
  createTurnOrder,
  getCurrentPlayer,
} from './gameSetup';
import { getEnemyById } from '../battle/enemies';
import { getPlayerPieceImageName } from './pieceImages';
import { assignStartingPositions, createBoard } from '../gameBoard/board';

const GameSetupContext = createContext(null);

export function GameSetupProvider({ children, initialGameSetup = null }) {
  const [gameSetup, setGameSetup] = useState(() => initialGameSetup ?? createInitialGameSetup());

  const setPlayerCount = (playerCount) => {
    setGameSetup((currentSetup) => {
      const nextPlayerCount = clampPlayerCount(playerCount);

      return {
        ...currentSetup,
        activeBattle: null,
        playerCount: nextPlayerCount,
        players: createPlayers(nextPlayerCount, currentSetup.players),
        turnOrder: [],
        currentTurnIndex: 0,
        board: null,
      };
    });
  };

  const setPlayerColour = (playerId, colour) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: null,
      players: currentSetup.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              colour,
              pieceImage: getPlayerPieceImageName({ colour, gender: player.gender }),
            }
          : player
      ),
      turnOrder: [],
      currentTurnIndex: 0,
      board: null,
    }));
  };

  const setPlayerGender = (playerId, gender) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: null,
      players: currentSetup.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              gender,
              pieceImage: getPlayerPieceImageName({ colour: player.colour, gender }),
            }
          : player
      ),
      turnOrder: [],
      currentTurnIndex: 0,
      board: null,
    }));
  };

  const initializeTurnOrder = () => {
    setGameSetup((currentSetup) => {
      if (currentSetup.turnOrder.length === currentSetup.players.length) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        turnOrder: createTurnOrder(currentSetup.players),
        currentTurnIndex: 0,
      };
    });
  };

  const advanceTurn = () => {
    setGameSetup((currentSetup) => {
      if (currentSetup.turnOrder.length === 0) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        currentTurnIndex: (currentSetup.currentTurnIndex + 1) % currentSetup.turnOrder.length,
      };
    });
  };

  const initializeBoard = () => {
    setGameSetup((currentSetup) => {
      if (currentSetup.board) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        board: createBoard(),
        players: assignStartingPositions(currentSetup.players),
      };
    });
  };

  const setPlayerPosition = (playerId, position, playerUpdates = {}) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, ...playerUpdates, position } : player
      ),
    }));
  };

  const setPlayerAnywhereMode = (playerId, anywhereMode) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, anywhereMode } : player
      ),
    }));
  };

  const setPlayerHealth = (playerId, currentHealth) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, currentHealth } : player
      ),
    }));
  };

  const updatePlayerSpells = (playerId, nextSpellData) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              tokenBag: cloneTokenBag(nextSpellData.tokenBag),
              spellSlots: cloneSpellSlots(nextSpellData.spellSlots),
              hasCommittedInitialSpells:
                nextSpellData.hasCommittedInitialSpells ?? player.hasCommittedInitialSpells,
            }
          : player
      ),
    }));
  };

  const startBattle = (playerId, level, enemyId) => {
    const enemy = getEnemyById(enemyId);

    if (!enemy) {
      return;
    }

    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: {
        enemyCurrentHealth: enemy.currentHealth,
        enemyId,
        level,
        phase: 'active',
        playerId,
      },
    }));
  };

  const setActiveBattlePhase = (phase) => {
    setGameSetup((currentSetup) => {
      if (!currentSetup.activeBattle) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        activeBattle: {
          ...currentSetup.activeBattle,
          phase,
        },
      };
    });
  };

  const clearActiveBattle = () => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: null,
    }));
  };

  const resetGame = () => {
    setGameSetup(createInitialGameSetup());
  };

  return (
    <GameSetupContext.Provider
      value={{
        activeBattle: gameSetup.activeBattle ?? null,
        battleEnemy: gameSetup.activeBattle?.enemyId
          ? (() => {
              const enemy = getEnemyById(gameSetup.activeBattle.enemyId);

              return enemy
                ? {
                    ...enemy,
                    currentHealth: gameSetup.activeBattle.enemyCurrentHealth ?? enemy.currentHealth,
                  }
                : null;
            })()
          : null,
        battlePlayer: gameSetup.activeBattle
          ? gameSetup.players.find((player) => player.id === gameSetup.activeBattle.playerId) ?? null
          : null,
        gameSetup,
        clearActiveBattle,
        currentPlayer: getCurrentPlayer(gameSetup),
        advanceTurn,
        initializeBoard,
        initializeTurnOrder,
        resetGame,
        setActiveBattlePhase,
        setPlayerAnywhereMode,
        setPlayerHealth,
        setPlayerPosition,
        setPlayerColour,
        setPlayerGender,
        setPlayerCount,
        startBattle,
        updatePlayerSpells,
      }}
    >
      {children}
    </GameSetupContext.Provider>
  );
}

export function useGameSetup() {
  const context = useContext(GameSetupContext);

  if (!context) {
    throw new Error('useGameSetup must be used within a GameSetupProvider');
  }

  return context;
}
