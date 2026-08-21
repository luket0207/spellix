import { createInitialGameSetup, createPlayers } from './gameSetup';
import { getPlayerPieceImageName } from './pieceImages';

describe('game setup player piece selection foundation', () => {
  test('starts with debug mode off', () => {
    expect(createInitialGameSetup().debugMode).toBe(false);
  });

  test('starts before the movement dice has been rolled', () => {
    expect(createInitialGameSetup().hasRolledMovementDice).toBe(false);
  });

  test('starts without a pending potion grant', () => {
    expect(createInitialGameSetup().pendingPotionGrant).toBeNull();
  });

  test('starts with empty shared enemy history for every battle level', () => {
    expect(createInitialGameSetup().lastEnemyByLevel).toEqual({
      1: null,
      2: null,
      3: null,
      4: null,
    });
  });

  test('creates players with default boy piece-selection data', () => {
    const players = createPlayers(2);

    expect(players[0].number).toBe(1);
    expect(players[0].language).toBe('en');
    expect(players[0].anywhereMode).toBe(false);
    expect(players[0].gender).toBe('boy');
    expect(players[0].currentHealth).toBe(100);
    expect(players[0].diedLastTurn).toBe(false);
    expect(players[0].hasLeftStartArea).toBe(false);
    expect(players[0].maxHealth).toBe(100);
    expect(players[0].pieceImage).toBe('m-red.png');
    expect(players[0].potions).toEqual([]);
    expect(players[1].anywhereMode).toBe(false);
    expect(players[1].gender).toBe('boy');
    expect(players[1].currentHealth).toBe(100);
    expect(players[1].hasLeftStartArea).toBe(false);
    expect(players[1].maxHealth).toBe(100);
    expect(players[1].pieceImage).toBe('m-blue.png');
    expect(players[1].number).toBe(2);
    expect(players[1].language).toBe('en');
    expect(players[0].tokenBag).toHaveLength(5);
    expect(players[0].tokenBag.every((token) => token.type === 'red')).toBe(true);
    expect(players[0].tokenBag.every((token) => token.protected)).toBe(true);
    expect(players[0].tokenBag.every((token) => token.source === 'starting')).toBe(true);
    expect(players[0].hasUnseenTokenBagTokens).toBe(true);
    expect(players[0].eliteProgress).toEqual({
      eliteTowerGravel: false,
      eliteTowerWoods: false,
    });
    expect(players[0].villageProgress).toEqual({
      fieldVillageLootClaimed: false,
      firstEliteVillageRewardClaimed: false,
      forestVillageLootClaimed: false,
      secondEliteVillageRewardClaimed: false,
    });
    expect(players[0].villageActionState).toEqual({
      currentVillageLockId: null,
      usedActionsForCurrentVillage: {
        rest: false,
        wandsmith: false,
      },
    });
  });

  test.each([2, 3, 4, 5, 6])(
    'creates all players in a %i-player game with only five starting Damage tokens',
    (playerCount) => {
      const players = createPlayers(playerCount);

      expect(players).toHaveLength(playerCount);
      players.forEach((player, playerIndex) => {
        expect(player.tokenBag).toEqual(
          Array.from({ length: 5 }, (_, tokenIndex) => ({
            committed: false,
            id: `player-${playerIndex + 1}-red-${tokenIndex + 1}`,
            protected: true,
            source: 'starting',
            type: 'red',
          }))
        );
      });
    }
  );

  test('preserves Guard tokens already present in existing player data', () => {
    const existingPlayers = createPlayers(2);
    const legacyTokenBag = [
      {
        committed: false,
        id: 'player-1-blue-1',
        protected: true,
        source: 'starting',
        type: 'blue',
      },
    ];

    existingPlayers[0].tokenBag = legacyTokenBag;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].tokenBag).toEqual(legacyTokenBag);
    expect(recreatedPlayers[0].tokenBag).not.toBe(legacyTokenBag);
  });

  test('maps boy and girl selections to the expected piece filenames', () => {
    expect(getPlayerPieceImageName({ colour: 'purple', gender: 'girl' })).toBe('f-purple.png');
    expect(getPlayerPieceImageName({ colour: 'yellow', gender: 'boy' })).toBe('m-yellow.png');
  });

  test('preserves per-player potion ownership when recreating players', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].potions = [{ id: 'small-heal', name: 'Small Heal' }];

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].potions).toEqual([{ id: 'small-heal', name: 'Small Heal' }]);
    expect(recreatedPlayers[0].potions).not.toBe(existingPlayers[0].potions);
    expect(recreatedPlayers[1].potions).toEqual([]);
  });

  test('preserves valid player languages and falls back to English when missing', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].language = 'jp';
    delete existingPlayers[1].language;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].language).toBe('jp');
    expect(recreatedPlayers[1].language).toBe('en');
  });

  test('assigns new players the first colour unused by shifted active players', () => {
    const existingPlayers = createPlayers(5);
    const shiftedPlayers = [
      existingPlayers[0],
      existingPlayers[1],
      existingPlayers[4],
    ];

    const recreatedPlayers = createPlayers(5, shiftedPlayers);

    expect(recreatedPlayers.map(({ colour }) => colour)).toEqual([
      'red',
      'blue',
      'purple',
      'green',
      'yellow',
    ]);
    expect(new Set(recreatedPlayers.map(({ colour }) => colour)).size).toBe(5);
  });

  test('repairs duplicate existing colours without changing earlier unique players', () => {
    const existingPlayers = createPlayers(3);

    existingPlayers[1].colour = 'red';

    const recreatedPlayers = createPlayers(3, existingPlayers);

    expect(recreatedPlayers.map(({ colour }) => colour)).toEqual([
      'red',
      'blue',
      'green',
    ]);
  });

  test('preserves whether each player has unseen token bag additions', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].hasUnseenTokenBagTokens = false;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].hasUnseenTokenBagTokens).toBe(false);
    expect(recreatedPlayers[1].hasUnseenTokenBagTokens).toBe(true);
  });

  test('preserves whether a player died in their last turn', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].diedLastTurn = true;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].diedLastTurn).toBe(true);
    expect(recreatedPlayers[1].diedLastTurn).toBe(false);
  });

  test('preserves independent elite progress when recreating players', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].eliteProgress.eliteTowerGravel = true;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].eliteProgress).toEqual({
      eliteTowerGravel: true,
      eliteTowerWoods: false,
    });
    expect(recreatedPlayers[1].eliteProgress).toEqual({
      eliteTowerGravel: false,
      eliteTowerWoods: false,
    });
  });

  test('preserves independent village progress when recreating players', () => {
    const existingPlayers = createPlayers(2);
    existingPlayers[0].villageProgress.fieldVillageLootClaimed = true;
    existingPlayers[0].villageProgress.firstEliteVillageRewardClaimed = true;

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].villageProgress).toEqual({
      fieldVillageLootClaimed: true,
      firstEliteVillageRewardClaimed: true,
      forestVillageLootClaimed: false,
      secondEliteVillageRewardClaimed: false,
    });
    expect(recreatedPlayers[1].villageProgress).toEqual({
      fieldVillageLootClaimed: false,
      firstEliteVillageRewardClaimed: false,
      forestVillageLootClaimed: false,
      secondEliteVillageRewardClaimed: false,
    });
    expect(recreatedPlayers[0].villageProgress).not.toBe(
      existingPlayers[0].villageProgress
    );
  });

  test('preserves independent village action locks when recreating players', () => {
    const existingPlayers = createPlayers(2);

    existingPlayers[0].villageActionState = {
      currentVillageLockId: 'board-feature-village-field-1',
      usedActionsForCurrentVillage: {
        rest: true,
        wandsmith: true,
      },
    };

    const recreatedPlayers = createPlayers(2, existingPlayers);

    expect(recreatedPlayers[0].villageActionState).toEqual(
      existingPlayers[0].villageActionState
    );
    expect(recreatedPlayers[0].villageActionState).not.toBe(
      existingPlayers[0].villageActionState
    );
    expect(recreatedPlayers[1].villageActionState).toEqual({
      currentVillageLockId: null,
      usedActionsForCurrentVillage: {
        rest: false,
        wandsmith: false,
      },
    });
  });
});
