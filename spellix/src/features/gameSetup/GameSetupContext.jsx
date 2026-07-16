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
import { getPlayerPieceImageName } from './pieceImages';
import { assignStartingPositions, createBoard } from '../gameBoard/board';

const GameSetupContext = createContext(null);

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
        ? { ...currentPlayer, spellSlots: penaltyResult.spellSlots }
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
      players: setup.players.map((player, index) => ({
        ...player,
        language: player.language ?? DEFAULT_PLAYER_LANGUAGE,
        number: player.number ?? index + 1,
      })),
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
      const result = calculateBattleTurn({
        chargeAvailable: (chargeUses[diceResult - 1] ?? 0) > 0,
        currentActor: isPlayerActor ? playerBattleState : enemyBattleState,
        diceResult,
        freezeAvailable: (freezeUses[diceResult - 1] ?? 0) > 0,
        opponent: isPlayerActor ? enemyBattleState : playerBattleState,
        purpleBuff: purpleBuffs[diceResult - 1] ?? 0,
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
                  index === diceResult - 1 ? Math.max(0, uses - 1) : uses
                ),
                [frozenOpponentKey]: true,
              }
            : {}),
          ...(result.chargeApplied
            ? {
                [chargeUsesKey]: chargeUses.map((uses, index) =>
                  index === diceResult - 1 ? Math.max(0, uses - 1) : uses
                ),
              }
            : {}),
          isResolvingTurn: true,
          outcome: null,
          pendingEffects: result.effects,
          playerGuard: nextPlayerState.guard,
          [nextChargedKey]: result.chargeApplied,
          [nextPurpleBuffsKey]: createAdjacentPurpleBuffs(diceResult, result.purpleBuffGranted),
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

  const assignSelectedRewardTokenToSpellSlot = (spellSlotId) => {
    setGameSetup((currentSetup) => {
      const activeBattle = currentSetup.activeBattle;
      const selectedReward = activeBattle?.rewardChoices?.find(
        ({ id }) => id === activeBattle.selectedRewardChoiceId
      );
      const player = currentSetup.players.find(({ id }) => id === activeBattle?.playerId);
      const spellSlot = player?.spellSlots.find(({ id }) => id === spellSlotId);

      if (
        !activeBattle ||
        activeBattle.phase !== 'reward' ||
        activeBattle.rewardResolution ||
        selectedReward?.itemType !== 'token' ||
        !player ||
        !spellSlot ||
        spellSlot.tokens.length >= spellSlot.maxTokens
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
        players: currentSetup.players.map((currentPlayer) =>
          currentPlayer.id === player.id
            ? {
                ...currentPlayer,
                spellSlots: currentPlayer.spellSlots.map((currentSlot) =>
                  currentSlot.id === spellSlotId
                    ? {
                        ...currentSlot,
                        tokens: [...currentSlot.tokens, rewardToken],
                      }
                    : currentSlot
                ),
              }
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
        applyBattleEffect,
        applyBattleDiceResult,
        clearActiveBattle,
        currentPlayer: getCurrentPlayer(gameSetup),
        discardSelectedRewardToken,
        grantPotionToPlayer,
        advanceTurn,
        initializeBoard,
        initializeTurnOrder,
        pendingPotionGrant: gameSetup.pendingPotionGrant ?? null,
        replaceSelectedRewardTokenInBag,
        resolvePendingPotionGrant,
        resolveSelectedPotionReward,
        finalizeBattleEffects,
        resetGame,
        resolveBattleFreezeCheck,
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
