import { createContext, useContext, useState } from 'react';
import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_TYPES } from '../../data/tokens';
import {
  clampPlayerCount,
  cloneSpellSlots,
  cloneTokenBag,
  createInitialGameSetup,
  createPlayers,
  createTurnOrder,
  DEFAULT_PLAYER_LANGUAGE,
  getCurrentPlayer,
} from './gameSetup';
import { calculateBattleTurn, createAdjacentPurpleBuffs } from '../battle/battleTurn';
import { normalizeBattleEnvironment } from '../battle/battleEnvironments';
import { getEnemyById } from '../battle/enemies';
import { applyDeathTokenPenalty, getDeathTokenPenalty } from '../death/deathPenalty';
import {
  addTokenToBag,
  canAddTokenToBag,
  createDebugToken,
  replaceTokenInBag,
} from '../debug/tokenBagAdmin';
import { gainPotion, resolvePendingPotion } from '../potions/potionCapacity';
import {
  applyHealingPotionEffect,
  canUsePotionInContext,
} from '../potions/potionUsage';
import { createCopyPasteDuplicate } from '../potions/copyPaste';
import { generateCauldronPotionChoices } from '../potions/cauldron';
import {
  getMultiDiceCount,
  isMultiDicePotion,
} from '../potions/multiDice';
import { isTargetPlayerPotion } from '../potions/targetPlayerPotions';
import { createTokensmithMove } from '../potions/tokensmith';
import { generateBattleRewardChoices } from '../rewards/rewardItems';
import {
  createCavePotionRewardAssignment,
  createCaveTokenRewardAssignment,
  createCaveRewardGrant,
  getPendingCaveReward,
  resolveCavePotionReward as resolveCavePotionRewardGrant,
} from '../miniGames/caveRewardGrant';
import {
  addLootChestReward,
  createCaveRewardResolution,
  getNextPendingCaveReward,
  resolvePendingCaveReward as resolvePendingCaveQueuedReward,
} from '../miniGames/caveRewardResolution';
import {
  createLootChestRewardAssignment,
  resolveLootChestAssignment,
} from '../miniGames/lootChest';
import { getPlayerPieceImageName } from './pieceImages';
import {
  assignStartingPositions,
  createBoard,
  getFirstStartAreaPosition,
} from '../gameBoard/board';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
  selectEliteBossEnemyAssignments,
} from '../gameBoard/eliteBossEncounters';
import {
  applyColumnMerge,
  applyLightGreenHealthBonus,
  getEffectiveSpellColumnIndex,
  getSpellColumnCapacity,
} from '../spells/nonBattleSpellEffects';
import {
  createVillageProgress,
  createVillageVisit,
} from '../villages/villageVisits';

const GameSetupContext = createContext(null);

function clearStartingCharge(player) {
  return player?.activePotion?.id === 'starting-charge'
    ? { ...player, activePotion: null }
    : player;
}

function clearBoardTurnPotion(player) {
  const shouldClearActivePotion = [
    'devine-chance',
    'double-dice',
    'heavy-weight',
    'spellbound',
    'starting-charge',
    'storm-master',
    'triple-dice',
  ].includes(player?.activePotion?.id);

  return shouldClearActivePotion || player?.nextBoardDiceCount
    ? {
        ...player,
        activePotion: shouldClearActivePotion ? null : player.activePotion,
        nextBoardDiceCount: null,
      }
    : player;
}

function activatePendingTargetPlayerPotion(player) {
  const [pendingEffect, ...remainingEffects] = player.pendingPotionEffects ?? [];

  if (!pendingEffect) {
    return player;
  }

  const potion = POTION_DEFINITIONS.find(({ id }) => id === pendingEffect.potionId);

  return {
    ...player,
    activePotion: potion
      ? { ...potion, sourcePlayerId: pendingEffect.sourcePlayerId }
      : player.activePotion,
    pendingPotionEffects: remainingEffects,
  };
}

function transitionToPlayerTurn(currentSetup, nextTurnIndex) {
  const currentPlayerId = currentSetup.turnOrder[currentSetup.currentTurnIndex] ?? null;
  const nextPlayerId = currentSetup.turnOrder[nextTurnIndex] ?? null;

  if (!nextPlayerId) {
    return currentSetup;
  }

  const didPlayerChange = nextPlayerId !== currentPlayerId;
  const stormMasterEffect =
    currentSetup.stormMasterEffect
      ?.expiresWhenTurnReturnsToPlayerId === nextPlayerId
      ? null
      : currentSetup.stormMasterEffect;

  return {
    ...currentSetup,
    currentTurnIndex: nextTurnIndex,
    stormMasterEffect,
    stormMasterPendingPlayerId:
      didPlayerChange &&
      currentSetup.stormMasterPendingPlayerId === currentPlayerId
        ? null
        : currentSetup.stormMasterPendingPlayerId,
    players: didPlayerChange
      ? currentSetup.players.map((player) => {
          const playerWithExpiredPotion =
            player.id === currentPlayerId ? clearBoardTurnPotion(player) : player;
          const nextPlayer =
            playerWithExpiredPotion.id === nextPlayerId
              ? activatePendingTargetPlayerPotion(playerWithExpiredPotion)
              : playerWithExpiredPotion;

          return nextPlayer.id === nextPlayerId
            ? {
                ...nextPlayer,
                turnPotionUsage: {
                  ...nextPlayer.turnPotionUsage,
                  boardPotionUsedThisTurn: false,
                },
              }
            : nextPlayer;
        })
      : currentSetup.players,
    pendingNextTurnModal:
      didPlayerChange
        ? true
        : Boolean(currentSetup.pendingNextTurnModal),
  };
}

function finishMiniGameReturn(currentSetup) {
  const result = currentSetup.miniGameResult;

  if (!result?.result) {
    return { ...currentSetup, miniGameResult: null };
  }

  const playerTurnIndex = currentSetup.turnOrder.indexOf(result.playerId);
  const shouldAdvanceTurn = result.returnBehaviour === 'nextPlayerTurn';
  const nextTurnIndex =
    playerTurnIndex >= 0 && currentSetup.turnOrder.length > 0
      ? shouldAdvanceTurn
        ? (playerTurnIndex + 1) % currentSetup.turnOrder.length
        : playerTurnIndex
      : currentSetup.currentTurnIndex;
  const returnedSetup = {
    ...currentSetup,
    activeBattle: null,
    miniGameResult: null,
    miniGameReturnNotice:
      result.type === 'river' && result.result === 'win'
        ? {
            message: 'You crossed the river! You may roll again.',
            playerId: result.playerId,
            type: result.type,
          }
        : result.type === 'cave' && result.result === 'win' && result.rollAgain
          ? {
              message:
                'Your roll again potion was used, it is your turn to roll again.',
              playerId: result.playerId,
              type: result.type,
            }
          : null,
  };

  return transitionToPlayerTurn(returnedSetup, nextTurnIndex);
}

function resolveCaveTokenAssignment(miniGameResult, activeBattle, destination, details = {}) {
  const tokenGrant = miniGameResult?.caveRewardGrant?.token;

  if (activeBattle?.source !== 'cave' || tokenGrant?.status !== 'pendingAssignment') {
    return miniGameResult;
  }

  return {
    ...miniGameResult,
    caveRewardGrant: {
      ...miniGameResult.caveRewardGrant,
      token: {
        ...tokenGrant,
        ...details,
        destination,
        status: destination === 'discarded' ? 'discarded' : 'assigned',
      },
    },
  };
}

function resolveCavePotionAssignment(miniGameResult, activeBattle, destination) {
  const potionGrant = miniGameResult?.caveRewardGrant?.potion;

  if (activeBattle?.source !== 'cave' || potionGrant?.status !== 'pending') {
    return miniGameResult;
  }

  return {
    ...miniGameResult,
    caveRewardGrant: {
      ...miniGameResult.caveRewardGrant,
      potion: {
        ...potionGrant,
        destination,
        status:
          destination === 'potionSlot'
            ? 'added'
            : destination === 'potionSlotReplacement'
              ? 'replaced'
              : 'discarded',
      },
    },
  };
}

function resolveCaveAssignment(miniGameResult, activeBattle, destination, details = {}) {
  let nextResult = resolveLootChestAssignment(
    miniGameResult,
    activeBattle,
    destination
  );

  nextResult = resolveCaveTokenAssignment(
    nextResult,
    activeBattle,
    destination,
    details
  );
  nextResult = resolveCavePotionAssignment(nextResult, activeBattle, destination);

  const selectedReward = activeBattle?.rewardChoices?.find(
    ({ id }) => id === activeBattle.selectedRewardChoiceId
  );

  if (nextResult?.caveRewardResolution && selectedReward?.itemType) {
    nextResult = {
      ...nextResult,
      caveRewardResolution: resolvePendingCaveQueuedReward(
        nextResult.caveRewardResolution,
        {
          destination,
          rewardType: selectedReward.itemType,
          source: activeBattle.source,
        }
      ),
    };
  }

  return nextResult;
}

function createQueuedCaveAssignment(playerId, pendingReward) {
  if (pendingReward?.source === 'lootChest') {
    return createLootChestRewardAssignment(playerId, pendingReward.reward);
  }

  return pendingReward?.rewardType === 'token'
    ? createCaveTokenRewardAssignment(playerId, pendingReward?.item)
    : createCavePotionRewardAssignment(playerId, pendingReward?.item);
}

function advanceCaveRewardResolution(currentSetup) {
  const miniGameResult = currentSetup.miniGameResult;
  const resolution = miniGameResult?.caveRewardResolution;
  const pendingReward = getNextPendingCaveReward(resolution);
  const player = currentSetup.players.find(
    ({ id }) => id === miniGameResult?.playerId
  );

  if (!resolution || !resolution.lootResolved || !player) {
    return currentSetup;
  }

  if (!pendingReward) {
    return finishMiniGameReturn(currentSetup);
  }

  const assignment = createQueuedCaveAssignment(player.id, pendingReward);

  if (!assignment) {
    return currentSetup;
  }

  if (pendingReward.rewardType === 'token') {
    return { ...currentSetup, activeBattle: assignment };
  }

  const potionResult = gainPotion(player.potions, pendingReward.item);

  if (potionResult.pendingPotion) {
    return { ...currentSetup, activeBattle: assignment };
  }

  return {
    ...currentSetup,
    activeBattle: {
      ...assignment,
      rewardResolution: {
        choiceId: assignment.selectedRewardChoiceId,
        destination: 'potionSlot',
      },
    },
    miniGameResult: resolveCaveAssignment(
      miniGameResult,
      assignment,
      'potionSlot'
    ),
    players: currentSetup.players.map((currentPlayer) =>
      currentPlayer.id === player.id
        ? { ...currentPlayer, potions: potionResult.potions }
        : currentPlayer
    ),
  };
}

function createTokenUses(spellSlots, tokenType) {
  return Array.from({ length: 6 }, (_, index) =>
    (spellSlots?.[index]?.tokens ?? []).filter((token) => token.type === tokenType).length
  );
}

function createLostBattleSetup(currentSetup, activeBattle) {
  if (activeBattle.deathPenalty) {
    return {
      ...currentSetup,
      activeBattle: {
        ...activeBattle,
        isResolvingTurn: false,
        outcome: 'loss',
        pendingEffects: [],
        phase: 'lost',
      },
    };
  }

  const player = currentSetup.players.find(({ id }) => id === activeBattle.playerId);
  const removalCount = getDeathTokenPenalty({ battleLevel: activeBattle.level });
  const penaltyResult = applyDeathTokenPenalty({
    removalCount,
    spellSlots: player?.spellSlots ?? [],
  });

  return {
    ...currentSetup,
    activeBattle: {
      ...activeBattle,
      deathPenalty: {
        removalCount,
        removedTokens: penaltyResult.removedTokens,
      },
      isResolvingTurn: false,
      outcome: 'loss',
      pendingEffects: [],
      phase: 'lost',
    },
    players: currentSetup.players.map((currentPlayer) =>
      currentPlayer.id === activeBattle.playerId
        ? applyLightGreenHealthBonus(
            { ...currentPlayer, spellSlots: penaltyResult.spellSlots },
            penaltyResult.spellSlots
          )
        : currentPlayer
    ),
  };
}

function createWonBattleSetup(currentSetup, activeBattle) {
  if (activeBattle.encounterType === BOSS_BATTLE) {
    const winner = currentSetup.players.find(
      ({ id }) => id === activeBattle.playerId
    );

    return {
      ...currentSetup,
      activeBattle: {
        ...activeBattle,
        isResolvingTurn: false,
        outcome: 'win',
        pendingEffects: [],
        phase: 'wonGame',
        rewardChoices: null,
      },
      winnerDisplay: winner
        ? {
            colour: winner.colour,
            id: winner.id,
            language: winner.language,
            pieceImage: winner.pieceImage,
          }
        : null,
    };
  }

  const isEliteTowerBattle = [
    ELITE_TOWER_GRAVEL,
    ELITE_TOWER_WOODS,
  ].includes(activeBattle.encounterType);

  return {
    ...currentSetup,
    activeBattle: {
      ...activeBattle,
      isResolvingTurn: false,
      outcome: 'win',
      pendingEffects: [],
      phase: 'reward',
      rewardChoices:
        activeBattle.rewardChoices ?? generateBattleRewardChoices(activeBattle.level),
    },
    players: isEliteTowerBattle
      ? currentSetup.players.map((player) =>
          player.id === activeBattle.playerId
            ? {
                ...player,
                eliteProgress: {
                  ...player.eliteProgress,
                  [activeBattle.encounterType]: true,
                },
              }
            : player
        )
      : currentSetup.players,
  };
}

function applyTokenBagNotificationChanges(currentSetup, nextSetup) {
  if (!nextSetup || nextSetup === currentSetup) {
    return nextSetup;
  }

  let didChangeNotification = false;
  const previousPlayers = new Map(
    currentSetup.players.map((player) => [player.id, player])
  );
  const players = nextSetup.players.map((player) => {
    const previousPlayer = previousPlayers.get(player.id);

    if (!previousPlayer) {
      return player;
    }

    const previousCount = previousPlayer.tokenBag?.length ?? 0;
    const nextCount = player.tokenBag?.length ?? 0;
    const hasUnseenTokenBagTokens =
      nextCount > previousCount
        ? true
        : nextCount === 0
          ? false
          : player.hasUnseenTokenBagTokens;

    if (hasUnseenTokenBagTokens === player.hasUnseenTokenBagTokens) {
      return player;
    }

    didChangeNotification = true;

    return { ...player, hasUnseenTokenBagTokens };
  });

  return didChangeNotification ? { ...nextSetup, players } : nextSetup;
}

export function GameSetupProvider({ children, initialGameSetup = null }) {
  const [gameSetup, setGameSetupState] = useState(() => {
    const setup = initialGameSetup ?? createInitialGameSetup();

    return {
      ...setup,
      debugMode: Boolean(setup.debugMode),
      eliteBossEnemyAssignments: {
        ...(setup.eliteBossEnemyAssignments ??
          selectEliteBossEnemyAssignments()),
      },
      winnerDisplay: setup.winnerDisplay
        ? { ...setup.winnerDisplay }
        : null,
      villageVisit: setup.villageVisit
        ? {
            ...setup.villageVisit,
            rewardItem: setup.villageVisit.rewardItem
              ? { ...setup.villageVisit.rewardItem }
              : null,
          }
        : null,
      buyAndSellTransaction: setup.buyAndSellTransaction
        ? {
            ...setup.buyAndSellTransaction,
            rewardTokenTypes: [
              ...setup.buyAndSellTransaction.rewardTokenTypes,
            ],
          }
        : null,
      cauldronChoiceState: setup.cauldronChoiceState
        ? {
            ...setup.cauldronChoiceState,
            potionIds: [...setup.cauldronChoiceState.potionIds],
          }
        : null,
      devineChanceResult: setup.devineChanceResult
        ? { ...setup.devineChanceResult }
        : null,
      pendingNextTurnModal: Boolean(setup.pendingNextTurnModal),
      pendingTurnRespawn: setup.pendingTurnRespawn
        ? {
            ...setup.pendingTurnRespawn,
            removedTokens:
              setup.pendingTurnRespawn.removedTokens?.map(
                ({ columnNumber, token }) => ({
                  columnNumber,
                  token: { ...token },
                })
              ) ?? [],
          }
        : null,
      stormMasterEffect: setup.stormMasterEffect
        ? {
            ...setup.stormMasterEffect,
            affectedPlayerIds: [
              ...setup.stormMasterEffect.affectedPlayerIds,
            ],
          }
        : null,
      stormMasterPendingPlayerId:
        setup.stormMasterPendingPlayerId ?? null,
      stormMasterResult: setup.stormMasterResult
        ? { ...setup.stormMasterResult }
        : null,
      troublemakerResult: setup.troublemakerResult
        ? {
            ...setup.troublemakerResult,
            removedTokens:
              setup.troublemakerResult.removedTokens?.map(
                ({ columnNumber, token }) => ({
                  columnNumber,
                  token: { ...token },
                })
              ) ?? [],
          }
        : null,
      players: setup.players.map((player, index) => {
        const normalizedPlayer = {
          ...player,
          activePotion: player.activePotion ? { ...player.activePotion } : null,
          baseMaxHealth: player.baseMaxHealth ?? player.maxHealth ?? 100,
          columnMergesUsed:
            player.columnMergesUsed ?? player.mergedColumns?.length ?? 0,
          eliteProgress: {
            eliteTowerGravel: Boolean(
              player.eliteProgress?.eliteTowerGravel
            ),
            eliteTowerWoods: Boolean(
              player.eliteProgress?.eliteTowerWoods
            ),
          },
          villageProgress: createVillageProgress(player.villageProgress),
          hasUnseenTokenBagTokens:
            player.hasUnseenTokenBagTokens ??
            Boolean(player.tokenBag?.length),
          language: player.language ?? DEFAULT_PLAYER_LANGUAGE,
          mergedColumns: player.mergedColumns ?? [],
          nextForcedRoll: player.nextForcedRoll
            ? { ...player.nextForcedRoll }
            : null,
          nextBoardDiceCount: player.nextBoardDiceCount ?? null,
          number: player.number ?? index + 1,
          pendingPotionEffects:
            player.pendingPotionEffects?.map((effect) => ({ ...effect })) ?? [],
          turnPotionUsage: {
            ...player.turnPotionUsage,
            boardPotionUsedThisTurn: Boolean(
              player.turnPotionUsage?.boardPotionUsedThisTurn
            ),
          },
        };

        return applyLightGreenHealthBonus(
          normalizedPlayer,
          normalizedPlayer.spellSlots
        );
      }),
    };
  });
  const setGameSetup = (setupUpdate) => {
    setGameSetupState((currentSetup) => {
      const nextSetup =
        typeof setupUpdate === 'function'
          ? setupUpdate(currentSetup)
          : setupUpdate;

      return applyTokenBagNotificationChanges(currentSetup, nextSetup);
    });
  };

  const setPlayerCount = (playerCount) => {
    setGameSetup((currentSetup) => {
      const nextPlayerCount = clampPlayerCount(playerCount);

      return {
        ...currentSetup,
        activeBattle: null,
        buyAndSellTransaction: null,
        cauldronChoiceState: null,
        devineChanceResult: null,
        pendingPotionGrant: null,
        stormMasterEffect: null,
        stormMasterPendingPlayerId: null,
        stormMasterResult: null,
        troublemakerResult: null,
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

  const setPlayerLanguage = (playerId, language) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: null,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, language } : player
      ),
      turnOrder: [],
      currentTurnIndex: 0,
      board: null,
    }));
  };

  const setDebugMode = (debugMode) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      debugMode: Boolean(debugMode),
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

      const nextTurnIndex =
        (currentSetup.currentTurnIndex + 1) % currentSetup.turnOrder.length;

      return transitionToPlayerTurn(currentSetup, nextTurnIndex);
    });
  };

  const dismissNextTurnModal = () => {
    setGameSetup((currentSetup) => {
      const currentPlayerId =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] ?? null;
      const shouldSkipTurn = currentSetup.players.some(
        (player) => player.id === currentPlayerId && player.skipNextTurn
      );

      if (!shouldSkipTurn || currentSetup.turnOrder.length === 0) {
        return {
          ...currentSetup,
          pendingNextTurnModal: false,
        };
      }

      const clearedSetup = {
        ...currentSetup,
        players: currentSetup.players.map((player) =>
          player.id === currentPlayerId
            ? { ...player, skipNextTurn: false }
            : player
        ),
      };
      const nextTurnIndex =
        (currentSetup.currentTurnIndex + 1) % currentSetup.turnOrder.length;

      return transitionToPlayerTurn(clearedSetup, nextTurnIndex);
    });
  };

  const beginTurnRespawn = () => {
    setGameSetup((currentSetup) => {
      const currentPlayerId =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] ?? null;
      const player = currentSetup.players.find(
        ({ id }) => id === currentPlayerId
      );

      if (
        !currentSetup.pendingNextTurnModal ||
        currentSetup.pendingTurnRespawn ||
        !player ||
        player.currentHealth !== 0
      ) {
        return currentSetup;
      }

      const penaltyResult = applyDeathTokenPenalty({
        removalCount: getDeathTokenPenalty({ deathType: 'miniGame' }),
        spellSlots: player.spellSlots,
      });

      return {
        ...currentSetup,
        pendingNextTurnModal: false,
        pendingTurnRespawn: {
          playerId: player.id,
          removedTokens: penaltyResult.removedTokens,
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id
            ? applyLightGreenHealthBonus(
                {
                  ...currentPlayer,
                  spellSlots: penaltyResult.spellSlots,
                },
                penaltyResult.spellSlots
              )
            : currentPlayer
        ),
      };
    });
  };

  const completeTurnRespawn = () => {
    setGameSetup((currentSetup) => {
      const pendingTurnRespawn = currentSetup.pendingTurnRespawn;
      const currentPlayerId =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] ?? null;
      const player = currentSetup.players.find(
        ({ id }) => id === currentPlayerId
      );

      if (
        !pendingTurnRespawn ||
        pendingTurnRespawn.playerId !== currentPlayerId ||
        !player
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        pendingNextTurnModal: Boolean(player.skipNextTurn),
        pendingTurnRespawn: null,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id
            ? {
                ...currentPlayer,
                currentHealth: currentPlayer.maxHealth,
                diedLastTurn: false,
                position: getFirstStartAreaPosition(currentSetup.board),
              }
            : currentPlayer
        ),
      };
    });
  };

  const startMiniGame = (type, playerId, options = {}) => {
    setGameSetup((currentSetup) => {
      const playerExists = currentSetup.players.some((player) => player.id === playerId);

      if (!type || !playerExists) {
        return currentSetup;
      }

      const result = ['win', 'loss'].includes(options.result)
        ? options.result
        : null;
      const returnBehaviour = [
        'nextPlayerTurn',
        'samePlayerRollAgain',
      ].includes(options.returnBehaviour)
        ? options.returnBehaviour
        : null;

      return {
        ...currentSetup,
        miniGameResult: {
          type,
          result,
          playerId,
          returnBehaviour,
          ...(options.environment
            ? { environment: options.environment }
            : {}),
          ...(options.source ? { source: options.source } : {}),
        },
        miniGameReturnNotice: null,
      };
    });
  };

  const completeMiniGame = (result, options = {}) => {
    setGameSetup((currentSetup) => {
      if (!currentSetup.miniGameResult || !['win', 'loss'].includes(result)) {
        return currentSetup;
      }

      const isCaveRetreat =
        currentSetup.miniGameResult.type === 'cave' && result === 'win';
      const preventHealthLoss = Boolean(
        currentSetup.miniGameResult.type === 'cave' &&
          result === 'loss' &&
          options.preventHealthLoss
      );
      const rollAgain = Boolean(isCaveRetreat && options.rollAgain);
      const cavePlayer = isCaveRetreat
        ? currentSetup.players.find(
            ({ id }) => id === currentSetup.miniGameResult.playerId
          )
        : null;
      const caveGrantResult =
        cavePlayer && !currentSetup.miniGameResult.caveRewardGrant
          ? createCaveRewardGrant(cavePlayer, options.caveRewards)
          : null;
      const returnBehaviour =
        result === 'loss' || (isCaveRetreat && !rollAgain)
          ? 'nextPlayerTurn'
          : 'samePlayerRollAgain';
      const caveRewardResolution =
        isCaveRetreat && cavePlayer
          ? createCaveRewardResolution({
              caveRewards: options.caveRewards,
              finalReturnBehaviour: returnBehaviour,
              playerId: cavePlayer.id,
            })
          : null;
      const completedSetup = {
        ...currentSetup,
        activeBattle: isCaveRetreat ? null : currentSetup.activeBattle,
        miniGameResult: {
          ...currentSetup.miniGameResult,
          ...(preventHealthLoss ? { preventHealthLoss: true } : {}),
          ...(isCaveRetreat
            ? {
                caveRewardGrant:
                  caveGrantResult?.rewardGrant ??
                  currentSetup.miniGameResult.caveRewardGrant ??
                  null,
                caveRewardResolution,
                caveRewards: options.caveRewards ?? null,
              }
            : {}),
          result,
          returnBehaviour,
          rollAgain,
        },
        players: caveGrantResult
          ? currentSetup.players.map((player) =>
              player.id === caveGrantResult.player.id
                ? caveGrantResult.player
                : player
            )
          : currentSetup.players,
      };

      return caveRewardResolution?.lootResolved &&
        getNextPendingCaveReward(caveRewardResolution)
        ? advanceCaveRewardResolution(completedSetup)
        : completedSetup;
    });
  };

  const resolvePendingCaveReward = (replacement) => {
    setGameSetup((currentSetup) => {
      const miniGameResult = currentSetup.miniGameResult;
      const player = currentSetup.players.find(
        ({ id }) => id === miniGameResult?.playerId
      );

      if (
        miniGameResult?.type !== 'cave' ||
        miniGameResult.result !== 'win' ||
        !miniGameResult.caveRewardGrant ||
        !player
      ) {
        return currentSetup;
      }

      const resolution = resolveCavePotionRewardGrant({
        player,
        replacedPotionIndex: replacement,
        rewardGrant: miniGameResult.caveRewardGrant,
      });

      if (!resolution) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        miniGameResult: {
          ...miniGameResult,
          caveRewardGrant: resolution.rewardGrant,
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id ? resolution.player : currentPlayer
        ),
      };
    });
  };

  const resolvePendingCavePotionReward = (replacedPotionIndex) => {
    resolvePendingCaveReward(replacedPotionIndex);
  };

  const claimLootChestReward = (reward) => {
    const miniGameResult = gameSetup.miniGameResult;
    const player = gameSetup.players.find(
      ({ id }) => id === miniGameResult?.playerId
    );

    if (
      miniGameResult?.result !== 'win' ||
      miniGameResult.lootChestReward ||
      !player ||
      !['token', 'potion', 'nothing'].includes(reward?.itemType)
    ) {
      return '/gameplay';
    }

    const isCaveReward =
      miniGameResult.type === 'cave' && miniGameResult.caveRewardResolution;
    const isVillageLootChest =
      miniGameResult.type === 'villageLootChest' &&
      gameSetup.villageVisit?.phase === 'rewardFlow';

    if (isCaveReward) {
      const nextResolution = addLootChestReward(
        miniGameResult.caveRewardResolution,
        reward
      );
      const destination = getNextPendingCaveReward(nextResolution)
        ? '/reward'
        : '/gameplay';

      setGameSetup((currentSetup) => {
        const currentResult = currentSetup.miniGameResult;

        if (
          currentResult?.lootChestReward ||
          !currentResult?.caveRewardResolution
        ) {
          return currentSetup;
        }

        const queuedResolution = addLootChestReward(
          currentResult.caveRewardResolution,
          reward
        );
        const queuedSetup = {
          ...currentSetup,
          activeBattle: null,
          miniGameResult: {
            ...currentResult,
            caveRewardResolution: queuedResolution,
            lootChestReward: {
              ...reward,
              ...(reward.item ? { item: { ...reward.item } } : {}),
              ...(reward.itemType === 'nothing'
                ? { destination: 'nothing', status: 'resolved' }
                : { status: 'processing' }),
            },
          },
        };

        return advanceCaveRewardResolution(queuedSetup);
      });

      return destination;
    }

    const potionResult =
      reward.itemType === 'potion'
        ? gainPotion(player.potions, reward.item)
        : null;
    const rewardAssignment =
      reward.itemType === 'token' || potionResult?.pendingPotion
        ? createLootChestRewardAssignment(player.id, reward)
        : null;
    const pendingCaveReward = getPendingCaveReward(
      miniGameResult.caveRewardGrant
    );
    const destination = rewardAssignment
      ? '/reward'
      : isVillageLootChest
        ? '/village'
      : gameSetup.activeBattle?.source === 'cave'
        ? '/reward'
        : pendingCaveReward
          ? '/mini-game/cave'
          : '/gameplay';

    setGameSetup((currentSetup) => {
      const currentResult = currentSetup.miniGameResult;
      const currentPlayer = currentSetup.players.find(
        ({ id }) => id === currentResult?.playerId
      );

      if (currentResult?.lootChestReward || !currentPlayer) {
        return currentSetup;
      }

      const currentPotionResult =
        reward.itemType === 'potion'
          ? gainPotion(currentPlayer.potions, reward.item)
          : null;
      const currentAssignment =
        reward.itemType === 'token' || currentPotionResult?.pendingPotion
          ? createLootChestRewardAssignment(currentPlayer.id, reward)
          : null;
      const status = currentAssignment ? 'processing' : 'resolved';
      const nextPlayers =
        reward.itemType === 'potion' && !currentPotionResult.pendingPotion
          ? currentSetup.players.map((currentSetupPlayer) =>
              currentSetupPlayer.id === currentPlayer.id
                ? {
                    ...currentSetupPlayer,
                    potions: currentPotionResult.potions,
                  }
                : currentSetupPlayer
            )
          : currentSetup.players;

      if (
        currentResult.type === 'villageLootChest' &&
        !currentAssignment
      ) {
        return {
          ...currentSetup,
          activeBattle: null,
          miniGameResult: null,
          players: nextPlayers,
          villageVisit: currentSetup.villageVisit
            ? {
                ...currentSetup.villageVisit,
                phase: 'heal',
              }
            : null,
        };
      }

      return {
        ...currentSetup,
        activeBattle: currentAssignment ?? currentSetup.activeBattle,
        miniGameResult: {
          ...currentResult,
          lootChestReward: {
            ...reward,
            ...(reward.item ? { item: { ...reward.item } } : {}),
            ...(status === 'resolved'
              ? {
                  destination:
                    reward.itemType === 'potion' ? 'potionSlot' : 'nothing',
                }
              : {}),
            status,
          },
        },
        players: nextPlayers,
      };
    });

    return destination;
  };

  const activatePendingCaveTokenReward = () => {
    setGameSetup(advanceCaveRewardResolution);
  };

  const continueCaveRewardResolution = () => {
    const hasPendingReward = Boolean(
      getNextPendingCaveReward(gameSetup.miniGameResult?.caveRewardResolution)
    );

    setGameSetup((currentSetup) =>
      advanceCaveRewardResolution({ ...currentSetup, activeBattle: null })
    );

    return hasPendingReward ? '/reward' : '/gameplay';
  };

  const applyMiniGameFailurePunishment = (playerId, healthLost) => {
    setGameSetup((currentSetup) => {
      const miniGameResult = currentSetup.miniGameResult;
      const player = currentSetup.players.find(({ id }) => id === playerId);

      if (
        miniGameResult?.result !== 'loss' ||
        miniGameResult.playerId !== playerId ||
        miniGameResult.failurePunishment?.applied ||
        !player
      ) {
        return currentSetup;
      }

      const safeHealthLost = Math.max(0, Number(healthLost) || 0);
      const nextHealth = Math.max(0, player.currentHealth - safeHealthLost);
      const removalCount =
        nextHealth === 0 ? getDeathTokenPenalty({ deathType: 'miniGame' }) : 0;
      const penaltyResult =
        removalCount > 0
          ? applyDeathTokenPenalty({
              removalCount,
              spellSlots: player.spellSlots,
            })
          : null;

      return {
        ...currentSetup,
        miniGameResult: {
          ...miniGameResult,
          failurePunishment: {
            applied: true,
            deathPenalty: penaltyResult
              ? {
                  removalCount,
                  removedTokens: penaltyResult.removedTokens,
                }
              : null,
            healthLost: safeHealthLost,
            nextHealth,
          },
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? applyLightGreenHealthBonus(
                {
                  ...currentPlayer,
                  currentHealth: nextHealth,
                  diedLastTurn:
                    currentPlayer.diedLastTurn ||
                    (currentPlayer.currentHealth > 0 && nextHealth === 0),
                  spellSlots: penaltyResult?.spellSlots ?? currentPlayer.spellSlots,
                },
                penaltyResult?.spellSlots ?? currentPlayer.spellSlots
              )
            : currentPlayer
        ),
      };
    });
  };

  const returnFromMiniGame = () => {
    setGameSetup((currentSetup) => {
      const result = currentSetup.miniGameResult;

      if (!result?.result) {
        return {
          ...currentSetup,
          miniGameResult: null,
        };
      }

      if (result.type === 'cave' && getPendingCaveReward(result.caveRewardGrant)) {
        return currentSetup;
      }

      if (result.lootChestReward?.status === 'processing') {
        return currentSetup;
      }

      return finishMiniGameReturn(currentSetup);
    });
  };

  const dismissMiniGameReturnNotice = () => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      miniGameReturnNotice: null,
    }));
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
        player.id === playerId
          ? {
              ...player,
              currentHealth,
              diedLastTurn:
                player.diedLastTurn ||
                (player.currentHealth > 0 && currentHealth <= 0),
            }
          : player
      ),
    }));
  };

  const markPlayerToSkipNextTurn = (playerId) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId ? { ...player, skipNextTurn: true } : player
      ),
    }));
  };

  const removePlayerPotion = (playerId, potionIndex) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              potions: player.potions.filter((_, index) => index !== potionIndex),
            }
          : player
      ),
    }));
  };

  const updatePlayerSpells = (playerId, nextSpellData) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      players: currentSetup.players.map((player) =>
        player.id === playerId
          ? (() => {
              const spellSlots = cloneSpellSlots(nextSpellData.spellSlots);
              const tokenBag = cloneTokenBag(nextSpellData.tokenBag);
              const savedTokenIds = new Set(
                player.tokenBag.map(({ id }) => id)
              );
              const gainedToken = tokenBag.some(
                ({ id }) => !savedTokenIds.has(id)
              );
              const nextPlayer = {
                ...player,
                columnMergesUsed:
                  nextSpellData.columnMergesUsed ?? player.columnMergesUsed ?? 0,
                hasCommittedInitialSpells:
                  nextSpellData.hasCommittedInitialSpells ?? player.hasCommittedInitialSpells,
                hasUnseenTokenBagTokens:
                  tokenBag.length > 0 &&
                  (gainedToken || player.hasUnseenTokenBagTokens),
                mergedColumns: (nextSpellData.mergedColumns ?? player.mergedColumns ?? []).map(
                  (merge) => ({ ...merge, columns: [...merge.columns] })
                ),
                spellSlots,
                tokenBag,
              };

              return applyLightGreenHealthBonus(nextPlayer, spellSlots);
            })()
          : player
      ),
    }));
  };

  const markPlayerTokenBagSeen = (playerId) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(
        (currentPlayer) => currentPlayer.id === playerId
      );

      if (!player?.hasUnseenTokenBagTokens) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? { ...currentPlayer, hasUnseenTokenBagTokens: false }
            : currentPlayer
        ),
      };
    });
  };

  const grantPotionToPlayer = (playerId, newPotion) => {
    setGameSetup((currentSetup) => {
      if (currentSetup.pendingPotionGrant) {
        return currentSetup;
      }

      const player = currentSetup.players.find(({ id }) => id === playerId);

      if (!player) {
        return currentSetup;
      }

      const result = gainPotion(player.potions, newPotion);

      return {
        ...currentSetup,
        pendingPotionGrant: result.pendingPotion
          ? { playerId, potion: result.pendingPotion }
          : null,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? { ...currentPlayer, potions: result.potions }
            : currentPlayer
        ),
      };
    });
  };

  const consumePlayerPotion = (playerId, potionIndex, context, options = {}) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[potionIndex];
      const activeBattle = currentSetup.activeBattle;
      const isBuyAndSell = potion?.id === 'buy-and-sell';
      const isCauldron = potion?.id === 'cauldron';
      const isCharger = potion?.id === 'charger';
      const isCopyPaste = potion?.id === 'copy-and-paste';
      const isCosmicIntervention = potion?.id === 'cosmic-intervention';
      const isDevineChance = potion?.id === 'devine-chance';
      const isIceBeam = potion?.id === 'ice-beam';
      const isMultiDice = isMultiDicePotion(potion);
      const isRollChoice = potion?.id === 'roll-choice';
      const isShieldsDown = potion?.id === 'shields-down';
      const isStartingCharge = potion?.id === 'starting-charge';
      const isStormMaster = potion?.id === 'storm-master';
      const isTargetingPotion = isTargetPlayerPotion(potion);
      const isThaw = potion?.id === 'thaw';
      const isTokensmith = potion?.id === 'tokensmith';
      const forcedRollValue = options.forcedRollValue;
      const hasValidForcedRollValue =
        Number.isInteger(forcedRollValue) &&
        forcedRollValue >= 1 &&
        forcedRollValue <= 6;
      const isBoardUse =
        context === 'board' &&
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;
      const isBattleUse =
        context === 'battle' &&
        activeBattle?.phase === 'active' &&
        activeBattle.playerId === playerId &&
        activeBattle.currentBattleActor !== 'enemy' &&
        !activeBattle.isResolvingTurn &&
        !activeBattle.playerPotionUsedThisTurn;

      if (
        !player ||
        !Number.isInteger(potionIndex) ||
        potionIndex < 0 ||
        potionIndex >= player.potions.length ||
        !canUsePotionInContext(potion, context) ||
        isBuyAndSell ||
        isCauldron ||
        isCopyPaste ||
        isTargetingPotion ||
        isTokensmith ||
        (isStormMaster && currentSetup.stormMasterPendingPlayerId) ||
        (isRollChoice && !hasValidForcedRollValue) ||
        (isCharger && isBattleUse && activeBattle.playerCharged) ||
        (isShieldsDown &&
          isBattleUse &&
          Math.max(0, activeBattle.enemyGuard ?? 0) === 0) ||
        (isThaw && isBattleUse && !activeBattle.playerFrozen) ||
        (!isBoardUse && !isBattleUse)
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        stormMasterPendingPlayerId:
          isStormMaster && isBoardUse
            ? playerId
            : currentSetup.stormMasterPendingPlayerId,
        activeBattle: isBattleUse
          ? {
              ...activeBattle,
              ...(isCharger ? { playerCharged: true } : {}),
              ...(isCosmicIntervention
                ? { cosmicInterventionPending: true }
                : {}),
              ...(isIceBeam
                ? {
                    enemyFrozen: true,
                    freezeAppliedByIceBeamThisTurn: true,
                  }
                : {}),
              ...(isShieldsDown ? { shieldsDownPending: true } : {}),
              ...(isThaw ? { playerFrozen: false } : {}),
              playerPotionUsedThisTurn: true,
            }
          : activeBattle,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...applyHealingPotionEffect(currentPlayer, potion),
                activePotion:
                  isRollChoice && isBoardUse
                    ? { ...potion, chosenRoll: forcedRollValue }
                    : (isDevineChance ||
                        isStartingCharge ||
                        isStormMaster ||
                        isMultiDice) &&
                      isBoardUse
                      ? { ...potion }
                      : currentPlayer.activePotion,
                nextBoardDiceCount:
                  isMultiDice && isBoardUse
                    ? getMultiDiceCount(potion)
                    : currentPlayer.nextBoardDiceCount,
                nextForcedRoll: isRollChoice
                  ? {
                      sourcePotionId: potion.id,
                      usedFrom: context,
                      value: forcedRollValue,
                    }
                  : currentPlayer.nextForcedRoll,
                potions: currentPlayer.potions.filter(
                  (_, index) => index !== potionIndex
                ),
                ...(isBoardUse
                  ? {
                      turnPotionUsage: {
                        ...currentPlayer.turnPotionUsage,
                        boardPotionUsedThisTurn: true,
                      },
                    }
                  : {}),
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolveCosmicIntervention = () => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const enemy = getEnemyById(activeBattle?.enemyId);

      if (
        !activeBattle ||
        activeBattle.phase !== 'active' ||
        !activeBattle.cosmicInterventionPending ||
        !enemy
      ) {
        return currentSetup;
      }

      const enemyGuard = Math.max(0, activeBattle.enemyGuard ?? 0);
      const enemyCurrentHealth =
        activeBattle.enemyCurrentHealth ?? enemy.currentHealth;
      const nextEnemyGuard = Math.max(0, enemyGuard - 10);
      const nextEnemyHealth = Math.max(
        0,
        enemyCurrentHealth - Math.max(0, 10 - enemyGuard)
      );
      const nextActiveBattle = {
        ...activeBattle,
        cosmicInterventionPending: false,
        enemyCurrentHealth: nextEnemyHealth,
        enemyGuard: nextEnemyGuard,
      };
      const nextSetup = {
        ...currentSetup,
        activeBattle: nextActiveBattle,
      };

      return nextEnemyHealth <= 0
        ? createWonBattleSetup(nextSetup, nextActiveBattle)
        : nextSetup;
    });
  };

  const resolveShieldsDown = () => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;

      if (
        !activeBattle ||
        activeBattle.phase !== 'active' ||
        !activeBattle.shieldsDownPending
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          enemyGuard: 0,
          shieldsDownPending: false,
        },
      };
    });
  };

  const startCauldronChoice = (playerId, potionIndex) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[potionIndex];
      const canUseBoardPotion =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;

      if (
        !player ||
        !Number.isInteger(potionIndex) ||
        potion?.id !== 'cauldron' ||
        currentSetup.cauldronChoiceState ||
        !canUseBoardPotion
      ) {
        return currentSetup;
      }

      const choices = generateCauldronPotionChoices();

      return {
        ...currentSetup,
        cauldronChoiceState: {
          originalPotionSlotIndex: potionIndex,
          playerId,
          potionIds: choices.map(({ id }) => id),
        },
      };
    });
  };

  const resolveCauldronChoice = (playerId, selectedPotionId) => {
    setGameSetup((currentSetup) => {
      const choiceState = currentSetup.cauldronChoiceState;
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const originalPotion =
        player?.potions[choiceState?.originalPotionSlotIndex];
      const selectedPotion = POTION_DEFINITIONS.find(
        ({ id }) => id === selectedPotionId
      );
      const canResolveBoardPotion =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;

      if (
        !player ||
        choiceState?.playerId !== playerId ||
        !choiceState.potionIds.includes(selectedPotionId) ||
        originalPotion?.id !== 'cauldron' ||
        !selectedPotion ||
        !canResolveBoardPotion
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        cauldronChoiceState: null,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                potions: currentPlayer.potions.map((potion, index) =>
                  index === choiceState.originalPotionSlotIndex
                    ? { ...selectedPotion }
                    : potion
                ),
                turnPotionUsage: {
                  ...currentPlayer.turnPotionUsage,
                  boardPotionUsedThisTurn: true,
                },
              }
            : currentPlayer
        ),
      };
    });
  };

  const startBuyAndSell = (
    playerId,
    potionIndex,
    selectedTokenIds,
    rewardTokenTypes
  ) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[potionIndex];
      const uniqueSelectedTokenIds = new Set(selectedTokenIds);
      const uniqueRewardTokenTypes = new Set(rewardTokenTypes);
      const isBoardUse =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;
      const hasSelectedTokens =
        uniqueSelectedTokenIds.size === 3 &&
        [...uniqueSelectedTokenIds].every((tokenId) =>
          player?.tokenBag.some((token) => token.id === tokenId)
        );
      const hasValidRewards =
        uniqueRewardTokenTypes.size === 2 &&
        [...uniqueRewardTokenTypes].every((tokenType) =>
          TOKEN_TYPES.includes(tokenType)
        );

      if (
        !player ||
        potion?.id !== 'buy-and-sell' ||
        currentSetup.buyAndSellTransaction ||
        !Number.isInteger(potionIndex) ||
        !isBoardUse ||
        !hasSelectedTokens ||
        !hasValidRewards
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        buyAndSellTransaction: {
          playerId,
          potionIndex,
          rewardTokenTypes: [...uniqueRewardTokenTypes],
          status: 'choosing',
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                tokenBag: currentPlayer.tokenBag.filter(
                  (token) => !uniqueSelectedTokenIds.has(token.id)
                ),
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolveBuyAndSellPotion = (playerId, selectedRewardType) => {
    setGameSetup((currentSetup) => {
      const transaction = currentSetup.buyAndSellTransaction;
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[transaction?.potionIndex];

      if (
        transaction?.status !== 'choosing' ||
        transaction.playerId !== playerId ||
        !transaction.rewardTokenTypes.includes(selectedRewardType) ||
        potion?.id !== 'buy-and-sell'
      ) {
        return currentSetup;
      }

      const rewardToken = createDebugToken(player, selectedRewardType);

      return {
        ...currentSetup,
        buyAndSellTransaction: {
          ...transaction,
          selectedRewardType,
          status: 'success',
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                activePotion: currentPlayer.activePotion,
                potions: currentPlayer.potions.filter(
                  (_, index) => index !== transaction.potionIndex
                ),
                tokenBag: addTokenToBag(currentPlayer.tokenBag, rewardToken),
                turnPotionUsage: {
                  ...currentPlayer.turnPotionUsage,
                  boardPotionUsedThisTurn: true,
                },
              }
            : currentPlayer
        ),
      };
    });
  };

  const completeBuyAndSell = (playerId) => {
    setGameSetup((currentSetup) =>
      currentSetup.buyAndSellTransaction?.playerId === playerId &&
      currentSetup.buyAndSellTransaction.status === 'success'
        ? { ...currentSetup, buyAndSellTransaction: null }
        : currentSetup
    );
  };

  const clearPlayerBoardDiceEffect = (playerId) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(
        (currentPlayer) => currentPlayer.id === playerId
      );

      if (
        !player?.nextBoardDiceCount &&
        !isMultiDicePotion(player?.activePotion)
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                activePotion: isMultiDicePotion(currentPlayer.activePotion)
                  ? null
                  : currentPlayer.activePotion,
                nextBoardDiceCount: null,
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolveTargetPlayerPotion = (playerId, potionIndex, targetPlayerId) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const targetPlayer = currentSetup.players.find(
        ({ id }) => id === targetPlayerId
      );
      const potion = player?.potions[potionIndex];
      const canUseBoardPotion =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;

      if (
        !player ||
        !targetPlayer ||
        playerId === targetPlayerId ||
        !Number.isInteger(potionIndex) ||
        potionIndex < 0 ||
        potionIndex >= player.potions.length ||
        !isTargetPlayerPotion(potion) ||
        !canUsePotionInContext(potion, 'board') ||
        !canUseBoardPotion
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) => {
          if (currentPlayer.id === playerId) {
            return {
              ...currentPlayer,
              activePotion:
                potion.id === 'troublemaker'
                  ? { ...potion, targetPlayerId }
                  : currentPlayer.activePotion,
              potions: currentPlayer.potions.filter(
                (_, index) => index !== potionIndex
              ),
              turnPotionUsage: {
                ...currentPlayer.turnPotionUsage,
                boardPotionUsedThisTurn: true,
              },
            };
          }

          if (
            currentPlayer.id === targetPlayerId &&
            potion.id !== 'troublemaker'
          ) {
            return {
              ...currentPlayer,
              pendingPotionEffects: [
                ...(currentPlayer.pendingPotionEffects ?? []),
                {
                  potionId: potion.id,
                  sourcePlayerId: playerId,
                },
              ],
            };
          }

          return currentPlayer;
        }),
      };
    });
  };

  const resolveTroublemakerRoll = (playerId, roll) => {
    setGameSetup((currentSetup) => {
      const caster = currentSetup.players.find(({ id }) => id === playerId);
      const activePotion = caster?.activePotion;
      const targetPlayer = currentSetup.players.find(
        ({ id }) => id === activePotion?.targetPlayerId
      );
      const isCurrentPlayer =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId;

      if (
        !caster ||
        !targetPlayer ||
        activePotion?.id !== 'troublemaker' ||
        !isCurrentPlayer ||
        currentSetup.troublemakerResult ||
        !Number.isInteger(roll) ||
        roll < 1 ||
        roll > 6
      ) {
        return currentSetup;
      }

      const losingPlayerId =
        roll % 2 === 0 ? targetPlayer.id : caster.id;
      const losingPlayer = currentSetup.players.find(
        ({ id }) => id === losingPlayerId
      );
      const penaltyResult = applyDeathTokenPenalty({
        removalCount: 1,
        spellSlots: losingPlayer?.spellSlots ?? [],
      });

      return {
        ...currentSetup,
        troublemakerResult: {
          casterPlayerId: playerId,
          losingPlayerId,
          removedTokens: penaltyResult.removedTokens,
          roll,
        },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === losingPlayerId
            ? applyLightGreenHealthBonus(
                {
                  ...currentPlayer,
                  spellSlots: penaltyResult.spellSlots,
                },
                penaltyResult.spellSlots
              )
            : currentPlayer
        ),
      };
    });
  };

  const dismissTroublemakerResult = (playerId) => {
    setGameSetup((currentSetup) => {
      const result = currentSetup.troublemakerResult;

      if (!result || result.casterPlayerId !== playerId) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        troublemakerResult: null,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId &&
          currentPlayer.activePotion?.id === 'troublemaker'
            ? { ...currentPlayer, activePotion: null }
            : currentPlayer
        ),
      };
    });
  };

  const resolveDevineChanceRoll = (playerId, roll) => {
    setGameSetup((currentSetup) => {
      const caster = currentSetup.players.find(({ id }) => id === playerId);
      const isCurrentPlayer =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId;

      if (
        !caster ||
        caster.activePotion?.id !== 'devine-chance' ||
        !isCurrentPlayer ||
        currentSetup.devineChanceResult ||
        !Number.isInteger(roll) ||
        roll < 1 ||
        roll > 6
      ) {
        return currentSetup;
      }

      const healedGroup = roll % 2 === 0 ? 'caster' : 'others';

      return {
        ...currentSetup,
        devineChanceResult: {
          casterPlayerId: playerId,
          healedGroup,
          roll,
        },
        players: currentSetup.players.map((currentPlayer) => {
          const shouldHeal =
            healedGroup === 'caster'
              ? currentPlayer.id === playerId
              : currentPlayer.id !== playerId;

          return shouldHeal
            ? {
                ...currentPlayer,
                currentHealth: currentPlayer.maxHealth,
              }
            : currentPlayer;
        }),
      };
    });
  };

  const dismissDevineChanceResult = (playerId) => {
    setGameSetup((currentSetup) => {
      const result = currentSetup.devineChanceResult;

      if (!result || result.casterPlayerId !== playerId) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        devineChanceResult: null,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId &&
          currentPlayer.activePotion?.id === 'devine-chance'
            ? { ...currentPlayer, activePotion: null }
            : currentPlayer
        ),
      };
    });
  };

  const resolveStormMasterRoll = (playerId, roll) => {
    setGameSetup((currentSetup) => {
      const caster = currentSetup.players.find(({ id }) => id === playerId);
      const isCurrentPlayer =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId;

      if (
        !caster ||
        currentSetup.stormMasterPendingPlayerId !== playerId ||
        !isCurrentPlayer ||
        currentSetup.stormMasterResult ||
        !Number.isInteger(roll) ||
        roll < 1
      ) {
        return currentSetup;
      }

      const isEven = roll % 2 === 0;

      return {
        ...currentSetup,
        stormMasterEffect: isEven
          ? {
              affectedPlayerIds: currentSetup.players
                .filter(({ id }) => id !== playerId)
                .map(({ id }) => id),
              casterPlayerId: playerId,
              expiresWhenTurnReturnsToPlayerId: playerId,
            }
          : null,
        stormMasterPendingPlayerId: null,
        stormMasterResult: isEven
          ? null
          : {
              casterPlayerId: playerId,
              playerId,
              resultType: 'caster-targeted',
              roll,
            },
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId &&
          currentPlayer.activePotion?.id === 'storm-master'
            ? { ...currentPlayer, activePotion: null }
            : currentPlayer
        ),
      };
    });
  };

  const startStormMasterBlockedTurn = (playerId, roll) => {
    setGameSetup((currentSetup) => {
      const isCurrentPlayer =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId;
      const isAffected =
        currentSetup.stormMasterEffect?.affectedPlayerIds.includes(playerId);

      if (
        !isCurrentPlayer ||
        !isAffected ||
        currentSetup.stormMasterResult ||
        !Number.isInteger(roll) ||
        roll < 1
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        stormMasterResult: {
          casterPlayerId: currentSetup.stormMasterEffect.casterPlayerId,
          playerId,
          resultType: 'movement-blocked',
          roll,
        },
      };
    });
  };

  const completeStormMasterForcedTurn = (playerId) => {
    setGameSetup((currentSetup) => {
      const result = currentSetup.stormMasterResult;
      const isCurrentPlayer =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId;

      if (
        !result ||
        result.playerId !== playerId ||
        !isCurrentPlayer ||
        currentSetup.turnOrder.length === 0
      ) {
        return currentSetup;
      }

      const nextTurnIndex =
        (currentSetup.currentTurnIndex + 1) % currentSetup.turnOrder.length;
      const stormMasterEffect =
        result.resultType === 'movement-blocked' &&
        currentSetup.stormMasterEffect
          ? {
              ...currentSetup.stormMasterEffect,
              affectedPlayerIds:
                currentSetup.stormMasterEffect.affectedPlayerIds.filter(
                  (affectedPlayerId) => affectedPlayerId !== playerId
                ),
            }
          : currentSetup.stormMasterEffect;

      return transitionToPlayerTurn(
        {
          ...currentSetup,
          stormMasterEffect,
          stormMasterResult: null,
        },
        nextTurnIndex
      );
    });
  };

  const resolveCopyPastePotion = (
    playerId,
    potionIndex,
    sourceTokenId,
    resolution = {}
  ) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[potionIndex];
      const sourceToken = player?.tokenBag.find(({ id }) => id === sourceTokenId);
      const isBoardUse =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;

      if (
        !player ||
        !Number.isInteger(potionIndex) ||
        potionIndex < 0 ||
        potionIndex >= player.potions.length ||
        potion?.id !== 'copy-and-paste' ||
        !sourceToken ||
        !canUsePotionInContext(potion, 'board') ||
        !isBoardUse
      ) {
        return currentSetup;
      }

      const hasSpace = canAddTokenToBag(player.tokenBag);
      const discardsDuplicate = resolution.discardDuplicate === true;
      const replacesExisting = player.tokenBag.some(
        ({ id }) => id === resolution.replacedTokenId
      );

      if (!hasSpace && !discardsDuplicate && !replacesExisting) {
        return currentSetup;
      }

      const duplicateToken = createCopyPasteDuplicate(player, sourceToken);
      const nextTokenBag = hasSpace
        ? addTokenToBag(player.tokenBag, duplicateToken)
        : discardsDuplicate
          ? cloneTokenBag(player.tokenBag)
          : replaceTokenInBag(
              player.tokenBag,
              resolution.replacedTokenId,
              duplicateToken
            );

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                potions: currentPlayer.potions.filter(
                  (_, index) => index !== potionIndex
                ),
                tokenBag: nextTokenBag,
                turnPotionUsage: {
                  ...currentPlayer.turnPotionUsage,
                  boardPotionUsedThisTurn: true,
                },
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolveTokensmithPotion = (playerId, potionIndex, tokenId) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const potion = player?.potions[potionIndex];
      const isBoardUse =
        currentSetup.turnOrder[currentSetup.currentTurnIndex] === playerId &&
        !player?.turnPotionUsage?.boardPotionUsedThisTurn;

      if (
        !player ||
        !Number.isInteger(potionIndex) ||
        potionIndex < 0 ||
        potionIndex >= player.potions.length ||
        potion?.id !== 'tokensmith' ||
        !canUsePotionInContext(potion, 'board') ||
        !isBoardUse
      ) {
        return currentSetup;
      }

      const move = createTokensmithMove({
        mergedColumns: player.mergedColumns,
        spellSlots: player.spellSlots,
        tokenBag: player.tokenBag,
        tokenId,
      });

      if (move.status !== 'moved') {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? applyLightGreenHealthBonus(
                {
                  ...currentPlayer,
                  potions: currentPlayer.potions.filter(
                    (_, index) => index !== potionIndex
                  ),
                  tokenBag: move.tokenBag,
                  turnPotionUsage: {
                    ...currentPlayer.turnPotionUsage,
                    boardPotionUsedThisTurn: true,
                  },
                },
                move.spellSlots
              )
            : currentPlayer
        ),
      };
    });
  };

  const clearPlayerForcedRoll = (playerId) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(
        (currentPlayer) => currentPlayer.id === playerId
      );

      if (!player?.nextForcedRoll) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                activePotion:
                  currentPlayer.activePotion?.id === 'roll-choice'
                    ? null
                    : currentPlayer.activePotion,
                nextForcedRoll: null,
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolvePendingPotionGrant = (replacedPotionIndex) => {
    setGameSetup((currentSetup) => {
      const pendingGrant = currentSetup.pendingPotionGrant;

      if (!pendingGrant) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        pendingPotionGrant: null,
        players: currentSetup.players.map((player) =>
          player.id === pendingGrant.playerId
            ? {
                ...player,
                potions: resolvePendingPotion({
                  pendingPotion: pendingGrant.potion,
                  potions: player.potions,
                  replacedPotionIndex,
                }),
              }
            : player
        ),
      };
    });
  };

  const startBattle = (
    playerId,
    level,
    enemyId,
    environment = 'fields',
    options = {}
  ) => {
    const enemy = getEnemyById(enemyId);

    if (!enemy) {
      return;
    }

    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const hasStartingCharge =
        player?.activePotion?.id === 'starting-charge';

      return {
        ...currentSetup,
        activeBattle: {
          cosmicInterventionPending: false,
          currentBattleActor: 'player',
          enemyChargeUses: createTokenUses(enemy.spellSlots, 'yellow'),
          enemyCharged: false,
          enemyCurrentHealth:
            options.enemyMaxHealth ?? enemy.currentHealth,
          enemyMaxHealth: options.enemyMaxHealth ?? enemy.maxHealth,
          enemyFreezeUses: createTokenUses(enemy.spellSlots, 'light-blue'),
          enemyFrozen: false,
          freezeAppliedByIceBeamThisTurn: false,
          enemyGuard: 0,
          enemyId,
          enemyNextCharged: null,
          enemyNextPurpleBuffs: null,
          enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
          environment: normalizeBattleEnvironment(environment),
          encounterType: options.encounterType ?? null,
          isResolvingTurn: false,
          level,
          outcome: null,
          pendingEffects: [],
          phase: 'active',
          playerChargeUses: createTokenUses(player?.spellSlots, 'yellow'),
          playerCharged: hasStartingCharge,
          playerFreezeUses: createTokenUses(player?.spellSlots, 'light-blue'),
          playerFrozen: false,
          playerGuard: 0,
          playerId,
          playerNextCharged: null,
          playerNextPurpleBuffs: null,
          playerPotionUsedThisTurn: false,
          playerPurpleBuffs: [0, 0, 0, 0, 0, 0],
          shieldsDownPending: false,
        },
        players: hasStartingCharge
          ? currentSetup.players.map((currentPlayer) =>
              currentPlayer.id === playerId
                ? clearStartingCharge(currentPlayer)
                : currentPlayer
            )
          : currentSetup.players,
      };
    });
  };

  const startBossNotReadyEncounter = (playerId) => {
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      activeBattle: {
        encounterType: 'bossNotReady',
        phase: 'bossNotReady',
        playerId,
      },
    }));
  };

  const startVillageVisit = (
    playerId,
    villageId,
    randomFn = Math.random
  ) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);
      const villageVisit = createVillageVisit({
        assignments: currentSetup.eliteBossEnemyAssignments,
        player,
        randomFn,
        villageId,
      });

      if (!villageVisit) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        villageVisit,
        players: villageVisit.rewardType
          ? currentSetup.players.map((currentPlayer) =>
              currentPlayer.id === playerId
                ? {
                    ...currentPlayer,
                    villageProgress: {
                      ...currentPlayer.villageProgress,
                      [villageId]: {
                        claimedEliteCounts: [
                          ...(currentPlayer.villageProgress?.[villageId]
                            ?.claimedEliteCounts ?? []),
                          villageVisit.defeatedEliteCount,
                        ],
                      },
                    },
                  }
                : currentPlayer
            )
          : currentSetup.players,
      };
    });
  };

  const startVillageReward = () => {
    setGameSetup((currentSetup) => {
      const villageVisit = currentSetup.villageVisit;
      const player = currentSetup.players.find(
        ({ id }) => id === villageVisit?.playerId
      );

      if (
        villageVisit?.phase !== 'reward' ||
        !villageVisit.rewardType ||
        !player
      ) {
        return currentSetup;
      }

      if (villageVisit.rewardType === 'lootChest') {
        return {
          ...currentSetup,
          miniGameResult: {
            playerId: player.id,
            result: 'win',
            returnBehaviour: null,
            type: 'villageLootChest',
          },
          villageVisit: {
            ...villageVisit,
            phase: 'rewardFlow',
          },
        };
      }

      if (!villageVisit.rewardItem) {
        return {
          ...currentSetup,
          villageVisit: {
            ...villageVisit,
            phase: 'heal',
            rewardType: null,
          },
        };
      }

      const rewardChoice = {
        category: villageVisit.rewardItem.rarity,
        id: `village-${villageVisit.villageId}-${villageVisit.defeatedEliteCount}`,
        item: { ...villageVisit.rewardItem },
        itemType: villageVisit.rewardType,
      };
      const activeBattle = {
        encounterType: villageVisit.villageId,
        environment: 'fields',
        phase: 'reward',
        playerId: player.id,
        rewardChoices: [rewardChoice],
        selectedRewardChoiceId: rewardChoice.id,
        source: 'village',
      };
      const potionResult =
        villageVisit.rewardType === 'potion'
          ? gainPotion(player.potions, villageVisit.rewardItem)
          : null;

      return {
        ...currentSetup,
        activeBattle:
          potionResult && !potionResult.pendingPotion
            ? {
                ...activeBattle,
                rewardResolution: {
                  choiceId: rewardChoice.id,
                  destination: 'potionSlot',
                },
              }
            : activeBattle,
        players:
          potionResult && !potionResult.pendingPotion
            ? currentSetup.players.map((currentPlayer) =>
                currentPlayer.id === player.id
                  ? { ...currentPlayer, potions: potionResult.potions }
                  : currentPlayer
              )
            : currentSetup.players,
        villageVisit: {
          ...villageVisit,
          phase: 'rewardFlow',
        },
      };
    });
  };

  const completeVillageReward = () => {
    setGameSetup((currentSetup) => {
      if (
        currentSetup.villageVisit?.phase !== 'rewardFlow' ||
        (currentSetup.activeBattle &&
          !currentSetup.activeBattle.rewardResolution)
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        activeBattle: null,
        miniGameResult: null,
        villageVisit: {
          ...currentSetup.villageVisit,
          phase: 'heal',
        },
      };
    });
  };

  const healVillagePlayer = () => {
    setGameSetup((currentSetup) => {
      const villageVisit = currentSetup.villageVisit;
      const playerExists = currentSetup.players.some(
        ({ id }) => id === villageVisit?.playerId
      );

      if (villageVisit?.phase !== 'heal' || !playerExists) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((player) =>
          player.id === villageVisit.playerId
            ? {
                ...player,
                currentHealth: player.maxHealth,
                diedLastTurn: false,
              }
            : player
        ),
        villageVisit: {
          ...villageVisit,
          phase: 'healed',
        },
      };
    });
  };

  const finishVillageVisit = () => {
    setGameSetup((currentSetup) => {
      const villageVisit = currentSetup.villageVisit;
      const playerTurnIndex = currentSetup.turnOrder.indexOf(
        villageVisit?.playerId
      );

      if (
        villageVisit?.phase !== 'healed' ||
        playerTurnIndex < 0 ||
        currentSetup.turnOrder.length === 0
      ) {
        return currentSetup;
      }

      return transitionToPlayerTurn(
        {
          ...currentSetup,
          villageVisit: null,
        },
        (playerTurnIndex + 1) % currentSetup.turnOrder.length
      );
    });
  };

  const applyBattleDiceResult = (diceResult) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;

      if (!activeBattle || activeBattle.phase !== 'active') {
        return currentSetup;
      }

      const player = currentSetup.players.find(({ id }) => id === activeBattle.playerId);
      const enemy = getEnemyById(activeBattle.enemyId);

      if (!player || !enemy) {
        return currentSetup;
      }

      const playerBattleState = {
        ...player,
        guard: activeBattle.playerGuard ?? 0,
      };
      const enemyBattleState = {
        ...enemy,
        currentHealth: activeBattle.enemyCurrentHealth ?? enemy.currentHealth,
        guard: activeBattle.enemyGuard ?? 0,
      };
      const isPlayerActor = activeBattle.currentBattleActor !== 'enemy';
      const chargeUsesKey = isPlayerActor ? 'playerChargeUses' : 'enemyChargeUses';
      const chargedKey = isPlayerActor ? 'playerCharged' : 'enemyCharged';
      const freezeUsesKey = isPlayerActor ? 'playerFreezeUses' : 'enemyFreezeUses';
      const frozenOpponentKey = isPlayerActor ? 'enemyFrozen' : 'playerFrozen';
      const nextPurpleBuffsKey = isPlayerActor
        ? 'playerNextPurpleBuffs'
        : 'enemyNextPurpleBuffs';
      const purpleBuffsKey = isPlayerActor ? 'playerPurpleBuffs' : 'enemyPurpleBuffs';
      const nextChargedKey = isPlayerActor ? 'playerNextCharged' : 'enemyNextCharged';
      const chargeUses = activeBattle[chargeUsesKey] ?? [0, 0, 0, 0, 0, 0];
      const freezeUses = activeBattle[freezeUsesKey] ?? [0, 0, 0, 0, 0, 0];
      const isRedundantIceBeamFreeze = Boolean(
        isPlayerActor &&
          activeBattle.freezeAppliedByIceBeamThisTurn &&
          activeBattle.enemyFrozen
      );
      const purpleBuffs = activeBattle[purpleBuffsKey] ?? [0, 0, 0, 0, 0, 0];
      const currentActor = isPlayerActor ? playerBattleState : enemyBattleState;
      const effectiveActorColumnIndex = getEffectiveSpellColumnIndex(
        currentActor.mergedColumns,
        diceResult
      );
      const result = calculateBattleTurn({
        chargeAvailable: (chargeUses[effectiveActorColumnIndex] ?? 0) > 0,
        currentActor,
        diceResult,
        freezeAvailable:
          (freezeUses[effectiveActorColumnIndex] ?? 0) > 0 &&
          !isRedundantIceBeamFreeze,
        opponent: isPlayerActor ? enemyBattleState : playerBattleState,
        purpleBuff: purpleBuffs[effectiveActorColumnIndex] ?? 0,
        yellowCharged: Boolean(activeBattle[chargedKey]),
      });
      const counterGuardReduction =
        result.effects.find(({ type }) => type === 'orangeCounter')
          ?.guardReduction ?? 0;
      const currentActorGuardBeforeCounter =
        result.nextCurrentActor.guard + counterGuardReduction;

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          enemyGuard: isPlayerActor
            ? activeBattle.enemyGuard ?? 0
            : currentActorGuardBeforeCounter,
          ...(result.freezeApplied
            ? {
                [freezeUsesKey]: freezeUses.map((uses, index) =>
                  index === effectiveActorColumnIndex ? Math.max(0, uses - 1) : uses
                ),
                [frozenOpponentKey]: true,
              }
            : {}),
          ...(result.chargeApplied
            ? {
                [chargeUsesKey]: chargeUses.map((uses, index) =>
                  index === effectiveActorColumnIndex ? Math.max(0, uses - 1) : uses
                ),
              }
            : {}),
          isResolvingTurn: true,
          outcome: null,
          pendingEffects: result.effects,
          playerGuard: isPlayerActor
            ? currentActorGuardBeforeCounter
            : activeBattle.playerGuard ?? 0,
          [nextChargedKey]: result.chargeApplied,
          [nextPurpleBuffsKey]: createAdjacentPurpleBuffs(
            diceResult,
            result.purpleBuffGranted,
            currentActor
          ),
        },
      };
    });
  };

  const applyBattleEffect = (effect) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;

      if (
        !activeBattle ||
        activeBattle.phase !== 'active' ||
        !effect ||
        (effect.type !== 'redDamage' && effect.type !== 'orangeCounter')
      ) {
        return currentSetup;
      }

      const isPlayerActor = activeBattle.currentBattleActor !== 'enemy';
      const isPlayerTarget =
        effect.target === 'currentActor' ? isPlayerActor : !isPlayerActor;
      const damage = Math.max(0, effect.amount ?? 0);
      const guardReduction = Math.max(0, effect.guardReduction ?? 0);

      if (isPlayerTarget) {
        return {
          ...currentSetup,
          activeBattle: {
            ...activeBattle,
            playerGuard: Math.max(
              0,
              (activeBattle.playerGuard ?? 0) - guardReduction
            ),
          },
          players: currentSetup.players.map((player) => {
            if (player.id !== activeBattle.playerId) {
              return player;
            }

            const nextHealth = Math.max(0, player.currentHealth - damage);

            return {
              ...player,
              currentHealth: nextHealth,
              diedLastTurn:
                player.diedLastTurn ||
                (player.currentHealth > 0 && nextHealth === 0),
            };
          }),
        };
      }

      const enemy = getEnemyById(activeBattle.enemyId);
      const enemyCurrentHealth = activeBattle.enemyCurrentHealth ?? enemy?.currentHealth ?? 0;

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          enemyCurrentHealth: Math.max(0, enemyCurrentHealth - damage),
          enemyGuard: Math.max(
            0,
            (activeBattle.enemyGuard ?? 0) - guardReduction
          ),
        },
      };
    });
  };

  const finalizeBattleEffects = () => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;

      if (!activeBattle || activeBattle.phase !== 'active') {
        return currentSetup;
      }

      const player = currentSetup.players.find(({ id }) => id === activeBattle.playerId);
      const enemy = getEnemyById(activeBattle.enemyId);
      const enemyCurrentHealth = activeBattle.enemyCurrentHealth ?? enemy?.currentHealth ?? 0;
      const outcome =
        (player?.currentHealth ?? 0) <= 0 ? 'loss' : enemyCurrentHealth <= 0 ? 'win' : null;

      if (!outcome) {
        return currentSetup;
      }

      if (outcome === 'loss') {
        return createLostBattleSetup(currentSetup, activeBattle);
      }

      return createWonBattleSetup(currentSetup, activeBattle);
    });
  };

  const resolveBattleFreezeCheck = (diceResult) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;

      if (!activeBattle || activeBattle.phase !== 'active') {
        return currentSetup;
      }

      const isPlayerActor = activeBattle.currentBattleActor !== 'enemy';
      const chargedKey = isPlayerActor ? 'playerCharged' : 'enemyCharged';
      const frozenActorKey = isPlayerActor ? 'playerFrozen' : 'enemyFrozen';
      const nextPurpleBuffsKey = isPlayerActor
        ? 'playerNextPurpleBuffs'
        : 'enemyNextPurpleBuffs';
      const purpleBuffsKey = isPlayerActor ? 'playerPurpleBuffs' : 'enemyPurpleBuffs';
      const nextChargedKey = isPlayerActor ? 'playerNextCharged' : 'enemyNextCharged';

      if (!activeBattle[frozenActorKey]) {
        return currentSetup;
      }

      const passedFreezeCheck = diceResult % 2 === 0;
      const nextBattleActor = isPlayerActor ? 'enemy' : 'player';

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          [frozenActorKey]: false,
          ...(passedFreezeCheck
            ? {}
            : {
                currentBattleActor: nextBattleActor,
                enemyGuard: isPlayerActor ? 0 : activeBattle.enemyGuard,
                isResolvingTurn: false,
                pendingEffects: [],
                playerGuard: isPlayerActor ? activeBattle.playerGuard : 0,
                [chargedKey]: false,
                [nextChargedKey]: null,
                [nextPurpleBuffsKey]: null,
                [purpleBuffsKey]: [0, 0, 0, 0, 0, 0],
                ...(isPlayerActor
                  ? { freezeAppliedByIceBeamThisTurn: false }
                  : {}),
                ...(nextBattleActor === 'player'
                  ? { playerPotionUsedThisTurn: false }
                  : {}),
              }),
        },
      };
    });
  };

  const advanceBattleTurn = () => {
    setGameSetup((currentSetup) => {
      if (!currentSetup.activeBattle || currentSetup.activeBattle.phase !== 'active') {
        return currentSetup;
      }

      const isPlayerActor = currentSetup.activeBattle.currentBattleActor !== 'enemy';
      const chargedKey = isPlayerActor ? 'playerCharged' : 'enemyCharged';
      const nextPurpleBuffsKey = isPlayerActor
        ? 'playerNextPurpleBuffs'
        : 'enemyNextPurpleBuffs';
      const purpleBuffsKey = isPlayerActor ? 'playerPurpleBuffs' : 'enemyPurpleBuffs';
      const nextChargedKey = isPlayerActor ? 'playerNextCharged' : 'enemyNextCharged';
      const nextBattleActor =
        currentSetup.activeBattle.currentBattleActor === 'enemy'
          ? 'player'
          : 'enemy';

      return {
        ...currentSetup,
        activeBattle: {
          ...currentSetup.activeBattle,
          currentBattleActor: nextBattleActor,
          enemyGuard: isPlayerActor
            ? 0
            : currentSetup.activeBattle.enemyGuard,
          freezeAppliedByIceBeamThisTurn: isPlayerActor
            ? false
            : currentSetup.activeBattle.freezeAppliedByIceBeamThisTurn,
          isResolvingTurn: false,
          pendingEffects: [],
          playerGuard: isPlayerActor
            ? currentSetup.activeBattle.playerGuard
            : 0,
          [chargedKey]: currentSetup.activeBattle[nextChargedKey] ?? false,
          [nextChargedKey]: null,
          [nextPurpleBuffsKey]: null,
          [purpleBuffsKey]: currentSetup.activeBattle[nextPurpleBuffsKey] ?? [0, 0, 0, 0, 0, 0],
          ...(nextBattleActor === 'player'
            ? { playerPotionUsedThisTurn: false }
            : {}),
        },
      };
    });
  };

  const setActiveBattlePhase = (phase) => {
    setGameSetup((currentSetup) => {
      if (!currentSetup.activeBattle) {
        return currentSetup;
      }

      if (phase === 'lost') {
        return createLostBattleSetup(currentSetup, currentSetup.activeBattle);
      }

      if (phase === 'reward') {
        return createWonBattleSetup(currentSetup, currentSetup.activeBattle);
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

  const selectBattleReward = (rewardChoiceId) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const selectedReward = activeBattle?.rewardChoices?.find(
        ({ id }) => id === rewardChoiceId
      );

      if (
        !activeBattle ||
        activeBattle.phase !== 'reward' ||
        activeBattle.selectedRewardChoiceId ||
        !selectedReward
      ) {
        return currentSetup;
      }

      if (selectedReward.itemType === 'potion') {
        const player = currentSetup.players.find(
          ({ id }) => id === activeBattle.playerId
        );

        if (!player) {
          return currentSetup;
        }

        const potionResult = gainPotion(player.potions, selectedReward.item);

        if (!potionResult.pendingPotion) {
          return {
            ...currentSetup,
            activeBattle: {
              ...activeBattle,
              rewardResolution: {
                choiceId: selectedReward.id,
                destination: 'potionSlot',
              },
              selectedRewardChoiceId: selectedReward.id,
            },
            players: currentSetup.players.map((currentPlayer) =>
              currentPlayer.id === player.id
                ? { ...currentPlayer, potions: potionResult.potions }
                : currentPlayer
            ),
          };
        }
      }

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          selectedRewardChoiceId: rewardChoiceId,
        },
      };
    });
  };

  const resolveSelectedPotionReward = (replacedPotionIndex) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const selectedReward = activeBattle?.rewardChoices?.find(
        ({ id }) => id === activeBattle.selectedRewardChoiceId
      );
      const player = currentSetup.players.find(({ id }) => id === activeBattle?.playerId);
      const isDiscardingNewPotion = replacedPotionIndex === undefined;
      const isValidReplacement =
        Number.isInteger(replacedPotionIndex) &&
        replacedPotionIndex >= 0 &&
        replacedPotionIndex < (player?.potions.length ?? 0);

      if (
        !activeBattle ||
        activeBattle.phase !== 'reward' ||
        activeBattle.rewardResolution ||
        selectedReward?.itemType !== 'potion' ||
        !player ||
        (!isDiscardingNewPotion && !isValidReplacement)
      ) {
        return currentSetup;
      }

      const potionResult = gainPotion(player.potions, selectedReward.item);

      if (!potionResult.pendingPotion) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          rewardResolution: {
            choiceId: selectedReward.id,
            destination: isDiscardingNewPotion
              ? 'potionDiscarded'
              : 'potionSlotReplacement',
          },
        },
        miniGameResult: resolveCaveAssignment(
          currentSetup.miniGameResult,
          activeBattle,
          isDiscardingNewPotion ? 'potionDiscarded' : 'potionSlotReplacement'
        ),
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id
            ? {
                ...currentPlayer,
                potions: resolvePendingPotion({
                  pendingPotion: potionResult.pendingPotion,
                  potions: potionResult.potions,
                  replacedPotionIndex,
                }),
              }
            : currentPlayer
        ),
      };
    });
  };

  const resolveSelectedTokenReward = (destination, replacedTokenId = null) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const selectedReward = activeBattle?.rewardChoices?.find(
        ({ id }) => id === activeBattle.selectedRewardChoiceId
      );
      const player = currentSetup.players.find(({ id }) => id === activeBattle?.playerId);

      if (
        !activeBattle ||
        activeBattle.phase !== 'reward' ||
        activeBattle.rewardResolution ||
        selectedReward?.itemType !== 'token' ||
        !player ||
        !['tokenBag', 'tokenBagReplacement', 'discarded'].includes(destination) ||
        (destination === 'tokenBag' && !canAddTokenToBag(player.tokenBag)) ||
        (destination === 'tokenBagReplacement' &&
          (canAddTokenToBag(player.tokenBag) ||
            !player.tokenBag.some(({ id }) => id === replacedTokenId)))
      ) {
        return currentSetup;
      }

      const nextToken =
        destination !== 'discarded' ? createDebugToken(player, selectedReward.item.type) : null;

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          rewardResolution: {
            choiceId: selectedReward.id,
            destination,
            ...(replacedTokenId ? { replacedTokenId } : {}),
          },
        },
        miniGameResult: resolveCaveAssignment(
          currentSetup.miniGameResult,
          activeBattle,
          destination,
          replacedTokenId ? { replacedTokenId } : {}
        ),
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id && nextToken
            ? {
                ...currentPlayer,
                hasUnseenTokenBagTokens: true,
                tokenBag:
                  destination === 'tokenBag'
                    ? addTokenToBag(currentPlayer.tokenBag, nextToken)
                    : replaceTokenInBag(
                        currentPlayer.tokenBag,
                        replacedTokenId,
                        nextToken
                      ),
              }
            : currentPlayer
        ),
      };
    });
  };

  const addSelectedRewardTokenToBag = () => {
    resolveSelectedTokenReward('tokenBag');
  };

  const discardSelectedRewardToken = () => {
    resolveSelectedTokenReward('discarded');
  };

  const replaceSelectedRewardTokenInBag = (replacedTokenId) => {
    resolveSelectedTokenReward('tokenBagReplacement', replacedTokenId);
  };

  const assignSelectedRewardTokenToSpellSlot = (spellSlotId, columnMerge = null) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const selectedReward = activeBattle?.rewardChoices?.find(
        ({ id }) => id === activeBattle.selectedRewardChoiceId
      );
      const player = currentSetup.players.find(({ id }) => id === activeBattle?.playerId);
      const spellSlot = player?.spellSlots.find(({ id }) => id === spellSlotId);
      const spellSlotIndex = player?.spellSlots.findIndex(({ id }) => id === spellSlotId) ?? -1;
      const spellSlotColumn = spellSlotIndex + 1;

      if (
        !activeBattle ||
        activeBattle.phase !== 'reward' ||
        activeBattle.rewardResolution ||
        selectedReward?.itemType !== 'token' ||
        !player ||
        !spellSlot ||
        player.mergedColumns?.some(
          ({ removedColumn }) => removedColumn === spellSlotColumn
        ) ||
        spellSlot.tokens.length >=
          getSpellColumnCapacity(
            player.spellSlots,
            spellSlotIndex,
            player.mergedColumns
          )
      ) {
        return currentSetup;
      }

      const rewardToken = {
        ...createDebugToken(player, selectedReward.item.type),
        committed: true,
      };

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          rewardResolution: {
            choiceId: selectedReward.id,
            destination: 'spellSlot',
            spellSlotId,
          },
        },
        miniGameResult: resolveCaveAssignment(
          currentSetup.miniGameResult,
          activeBattle,
          'spellSlot',
          { spellSlotId }
        ),
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id
            ? (() => {
                const placedSpellSlots = currentPlayer.spellSlots.map((currentSlot) =>
                  currentSlot.id === spellSlotId
                    ? {
                        ...currentSlot,
                        tokens: [...currentSlot.tokens, rewardToken],
                      }
                    : currentSlot
                );
                const shouldMerge = Boolean(
                  columnMerge &&
                    (currentPlayer.columnMergesUsed ?? 0) < 2 &&
                    !(currentPlayer.mergedColumns ?? []).some(({ columns = [] }) =>
                      columns.some((column) => columnMerge.columns.includes(column))
                    )
                );
                const spellSlots = shouldMerge
                  ? applyColumnMerge(placedSpellSlots, columnMerge)
                  : placedSpellSlots;
                const mergedColumns = shouldMerge
                  ? [...(currentPlayer.mergedColumns ?? []), columnMerge]
                  : currentPlayer.mergedColumns ?? [];

                return applyLightGreenHealthBonus(
                  {
                    ...currentPlayer,
                    columnMergesUsed:
                      (currentPlayer.columnMergesUsed ?? 0) + (shouldMerge ? 1 : 0),
                    mergedColumns,
                    spellSlots,
                  },
                  spellSlots
                );
              })()
            : currentPlayer
        ),
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
        activatePendingCaveTokenReward,
        activeBattle: gameSetup.activeBattle ?? null,
        addSelectedRewardTokenToBag,
        assignSelectedRewardTokenToSpellSlot,
        advanceBattleTurn,
        battleEnemy: gameSetup.activeBattle?.enemyId
          ? (() => {
              const enemy = getEnemyById(gameSetup.activeBattle.enemyId);

              return enemy
                ? {
                    ...enemy,
                    currentHealth: gameSetup.activeBattle.enemyCurrentHealth ?? enemy.currentHealth,
                    maxHealth:
                      gameSetup.activeBattle.enemyMaxHealth ??
                      enemy.maxHealth,
                  }
                : null;
            })()
          : null,
        battlePlayer: gameSetup.activeBattle
          ? gameSetup.players.find((player) => player.id === gameSetup.activeBattle.playerId) ?? null
          : null,
        gameSetup,
        applyMiniGameFailurePunishment,
        applyBattleEffect,
        applyBattleDiceResult,
        clearActiveBattle,
        clearPlayerBoardDiceEffect,
        clearPlayerForcedRoll,
        claimLootChestReward,
        completeBuyAndSell,
        completeTurnRespawn,
        completeStormMasterForcedTurn,
        completeVillageReward,
        continueCaveRewardResolution,
        currentPlayer: getCurrentPlayer(gameSetup),
        completeMiniGame,
        dismissDevineChanceResult,
        dismissTroublemakerResult,
        dismissMiniGameReturnNotice,
        dismissNextTurnModal,
        discardSelectedRewardToken,
        grantPotionToPlayer,
        healVillagePlayer,
        advanceTurn,
        beginTurnRespawn,
        initializeBoard,
        initializeTurnOrder,
        miniGameResult: gameSetup.miniGameResult ?? null,
        miniGameReturnNotice: gameSetup.miniGameReturnNotice ?? null,
        markPlayerTokenBagSeen,
        markPlayerToSkipNextTurn,
        pendingNextTurnModal: gameSetup.pendingNextTurnModal ?? false,
        pendingTurnRespawn: gameSetup.pendingTurnRespawn ?? null,
        pendingPotionGrant: gameSetup.pendingPotionGrant ?? null,
        replaceSelectedRewardTokenInBag,
        removePlayerPotion,
        resolvePendingPotionGrant,
        resolveCopyPastePotion,
        resolveCosmicIntervention,
        resolveShieldsDown,
        resolveDevineChanceRoll,
        resolveStormMasterRoll,
        resolveTargetPlayerPotion,
        resolveTroublemakerRoll,
        resolveTokensmithPotion,
        resolveSelectedPotionReward,
        finalizeBattleEffects,
        finishVillageVisit,
        resetGame,
        returnFromMiniGame,
        resolveBattleFreezeCheck,
        resolveBuyAndSellPotion,
        resolveCauldronChoice,
        resolvePendingCavePotionReward,
        selectBattleReward,
        setActiveBattlePhase,
        setPlayerAnywhereMode,
        setPlayerHealth,
        setPlayerPosition,
        startBuyAndSell,
        startCauldronChoice,
        startStormMasterBlockedTurn,
        setDebugMode,
        setPlayerColour,
        setPlayerGender,
        setPlayerLanguage,
        setPlayerCount,
        startBattle,
        startBossNotReadyEncounter,
        startMiniGame,
        startVillageReward,
        startVillageVisit,
        updatePlayerSpells,
        consumePlayerPotion,
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
