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
import { assignStartingPositions, createBoard } from '../gameBoard/board';

const GameSetupContext = createContext(null);

export function GameSetupProvider({ children, initialGameSetup = null }) {
  const [gameSetup, setGameSetup] = useState(() => initialGameSetup ?? createInitialGameSetup());

  const setPlayerCount = (playerCount) => {
    setGameSetup((currentSetup) => {
      const nextPlayerCount = clampPlayerCount(playerCount);

      return {
        ...currentSetup,
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
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, colour } : player
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

  const setPlayerPosition = (playerId, position) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, position } : player
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

  const resetGame = () => {
    setGameSetup(createInitialGameSetup());
  };

  return (
    <GameSetupContext.Provider
      value={{
        gameSetup,
        currentPlayer: getCurrentPlayer(gameSetup),
        advanceTurn,
        initializeBoard,
        initializeTurnOrder,
        resetGame,
        setPlayerPosition,
        setPlayerColour,
        setPlayerCount,
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
