import { createContext, useContext, useState } from 'react';
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
import { assignStartingPositions, createBoard } from '../gameBoard/board';
import {
  applyColumnMerge,
  applyLightGreenHealthBonus,
  getEffectiveSpellColumnIndex,
  getSpellColumnCapacity,
} from '../spells/nonBattleSpellEffects';

const GameSetupContext = createContext(null);

function transitionToPlayerTurn(currentSetup, nextTurnIndex) {
  const currentPlayerId = currentSetup.turnOrder[currentSetup.currentTurnIndex] ?? null;
  const nextPlayerId = currentSetup.turnOrder[nextTurnIndex] ?? null;

  if (!nextPlayerId) {
    return currentSetup;
  }

  return {
    ...currentSetup,
    currentTurnIndex: nextTurnIndex,
    pendingNextTurnModal:
      nextPlayerId !== currentPlayerId
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
  };
}

export function GameSetupProvider({ children, initialGameSetup = null }) {
  const [gameSetup, setGameSetup] = useState(() => {
    const setup = initialGameSetup ?? createInitialGameSetup();

    return {
      ...setup,
      pendingNextTurnModal: Boolean(setup.pendingNextTurnModal),
      players: setup.players.map((player, index) => {
        const normalizedPlayer = {
          ...player,
          baseMaxHealth: player.baseMaxHealth ?? player.maxHealth ?? 100,
          columnMergesUsed:
            player.columnMergesUsed ?? player.mergedColumns?.length ?? 0,
          language: player.language ?? DEFAULT_PLAYER_LANGUAGE,
          mergedColumns: player.mergedColumns ?? [],
          number: player.number ?? index + 1,
        };

        return applyLightGreenHealthBonus(
          normalizedPlayer,
          normalizedPlayer.spellSlots
        );
      }),
    };
  });

  const setPlayerCount = (playerCount) => {
    setGameSetup((currentSetup) => {
      const nextPlayerCount = clampPlayerCount(playerCount);

      return {
        ...currentSetup,
        activeBattle: null,
        pendingPotionGrant: null,
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
    setGameSetup((currentSetup) => ({
      ...currentSetup,
      pendingNextTurnModal: false,
    }));
  };

  const startMiniGame = (type, playerId) => {
    setGameSetup((currentSetup) => {
      const playerExists = currentSetup.players.some((player) => player.id === playerId);

      if (!type || !playerExists) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        miniGameResult: {
          type,
          result: null,
          playerId,
          returnBehaviour: null,
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
        players:
          reward.itemType === 'potion' && !currentPotionResult.pendingPotion
            ? currentSetup.players.map((currentSetupPlayer) =>
                currentSetupPlayer.id === currentPlayer.id
                  ? { ...currentSetupPlayer, potions: currentPotionResult.potions }
                  : currentSetupPlayer
              )
            : currentSetup.players,
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
        player.id === playerId ? { ...player, currentHealth } : player
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
              const nextPlayer = {
                ...player,
                columnMergesUsed:
                  nextSpellData.columnMergesUsed ?? player.columnMergesUsed ?? 0,
                hasCommittedInitialSpells:
                  nextSpellData.hasCommittedInitialSpells ?? player.hasCommittedInitialSpells,
                mergedColumns: (nextSpellData.mergedColumns ?? player.mergedColumns ?? []).map(
                  (merge) => ({ ...merge, columns: [...merge.columns] })
                ),
                spellSlots,
                tokenBag: cloneTokenBag(nextSpellData.tokenBag),
              };

              return applyLightGreenHealthBonus(nextPlayer, spellSlots);
            })()
          : player
      ),
    }));
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

  const consumePlayerPotion = (playerId, potionIndex) => {
    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);

      if (
        !player ||
        !Number.isInteger(potionIndex) ||
        potionIndex < 0 ||
        potionIndex >= player.potions.length
      ) {
        return currentSetup;
      }

      return {
        ...currentSetup,
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === playerId
            ? {
                ...currentPlayer,
                potions: currentPlayer.potions.filter(
                  (_, index) => index !== potionIndex
                ),
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

  const startBattle = (playerId, level, enemyId, environment = 'fields') => {
    const enemy = getEnemyById(enemyId);

    if (!enemy) {
      return;
    }

    setGameSetup((currentSetup) => {
      const player = currentSetup.players.find(({ id }) => id === playerId);

      return {
        ...currentSetup,
        activeBattle: {
          currentBattleActor: 'player',
          enemyChargeUses: createTokenUses(enemy.spellSlots, 'yellow'),
          enemyCharged: false,
          enemyCurrentHealth: enemy.currentHealth,
          enemyFreezeUses: createTokenUses(enemy.spellSlots, 'light-blue'),
          enemyFrozen: false,
          enemyGuard: 0,
          enemyId,
          enemyNextCharged: null,
          enemyNextPurpleBuffs: null,
          enemyPurpleBuffs: [0, 0, 0, 0, 0, 0],
          environment: normalizeBattleEnvironment(environment),
          isResolvingTurn: false,
          level,
          outcome: null,
          pendingEffects: [],
          phase: 'active',
          playerChargeUses: createTokenUses(player?.spellSlots, 'yellow'),
          playerCharged: false,
          playerFreezeUses: createTokenUses(player?.spellSlots, 'light-blue'),
          playerFrozen: false,
          playerGuard: 0,
          playerId,
          playerNextCharged: null,
          playerNextPurpleBuffs: null,
          playerPurpleBuffs: [0, 0, 0, 0, 0, 0],
        },
      };
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
        freezeAvailable: (freezeUses[effectiveActorColumnIndex] ?? 0) > 0,
        opponent: isPlayerActor ? enemyBattleState : playerBattleState,
        purpleBuff: purpleBuffs[effectiveActorColumnIndex] ?? 0,
        yellowCharged: Boolean(activeBattle[chargedKey]),
      });
      const nextPlayerState = isPlayerActor ? result.nextCurrentActor : result.nextOpponent;
      const nextEnemyState = isPlayerActor ? result.nextOpponent : result.nextCurrentActor;

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          enemyGuard: nextEnemyState.guard,
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
          playerGuard: nextPlayerState.guard,
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

      if (isPlayerTarget) {
        return {
          ...currentSetup,
          players: currentSetup.players.map((player) =>
            player.id === activeBattle.playerId
              ? { ...player, currentHealth: Math.max(0, player.currentHealth - damage) }
              : player
          ),
        };
      }

      const enemy = getEnemyById(activeBattle.enemyId);
      const enemyCurrentHealth = activeBattle.enemyCurrentHealth ?? enemy?.currentHealth ?? 0;

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          enemyCurrentHealth: Math.max(0, enemyCurrentHealth - damage),
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

      return {
        ...currentSetup,
        activeBattle: {
          ...activeBattle,
          [frozenActorKey]: false,
          ...(passedFreezeCheck
            ? {}
            : {
                currentBattleActor: isPlayerActor ? 'enemy' : 'player',
                enemyGuard: isPlayerActor ? 0 : activeBattle.enemyGuard,
                isResolvingTurn: false,
                pendingEffects: [],
                playerGuard: isPlayerActor ? activeBattle.playerGuard : 0,
                [chargedKey]: false,
                [nextChargedKey]: null,
                [nextPurpleBuffsKey]: null,
                [purpleBuffsKey]: [0, 0, 0, 0, 0, 0],
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

      return {
        ...currentSetup,
        activeBattle: {
          ...currentSetup.activeBattle,
          currentBattleActor:
            currentSetup.activeBattle.currentBattleActor === 'enemy' ? 'player' : 'enemy',
          isResolvingTurn: false,
          pendingEffects: [],
          [chargedKey]: currentSetup.activeBattle[nextChargedKey] ?? false,
          [nextChargedKey]: null,
          [nextPurpleBuffsKey]: null,
          [purpleBuffsKey]: currentSetup.activeBattle[nextPurpleBuffsKey] ?? [0, 0, 0, 0, 0, 0],
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
        claimLootChestReward,
        continueCaveRewardResolution,
        currentPlayer: getCurrentPlayer(gameSetup),
        completeMiniGame,
        dismissMiniGameReturnNotice,
        dismissNextTurnModal,
        discardSelectedRewardToken,
        grantPotionToPlayer,
        advanceTurn,
        initializeBoard,
        initializeTurnOrder,
        miniGameResult: gameSetup.miniGameResult ?? null,
        miniGameReturnNotice: gameSetup.miniGameReturnNotice ?? null,
        pendingNextTurnModal: gameSetup.pendingNextTurnModal ?? false,
        pendingPotionGrant: gameSetup.pendingPotionGrant ?? null,
        replaceSelectedRewardTokenInBag,
        resolvePendingPotionGrant,
        resolveSelectedPotionReward,
        finalizeBattleEffects,
        resetGame,
        returnFromMiniGame,
        resolveBattleFreezeCheck,
        resolvePendingCavePotionReward,
        selectBattleReward,
        setActiveBattlePhase,
        setPlayerAnywhereMode,
        setPlayerHealth,
        setPlayerPosition,
        setPlayerColour,
        setPlayerGender,
        setPlayerLanguage,
        setPlayerCount,
        startBattle,
        startMiniGame,
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
