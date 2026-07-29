import { createInitialGameSetup, createPlayers } from './gameSetup';
import { getPlayerPieceImageName } from './pieceImages';

describe('game setup player piece selection foundation', () => {
  test('starts without a pending potion grant', () => {
    expect(createInitialGameSetup().pendingPotionGrant).toBeNull();
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
    expect(players[0].tokenBag).toHaveLength(7);
    expect(players[0].tokenBag).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ protected: true, source: 'starting', type: 'red' }),
        expect.objectContaining({ protected: true, source: 'starting', type: 'blue' }),
      ])
    );
    expect(players[0].tokenBag.every((token) => token.protected)).toBe(true);
    expect(players[0].hasUnseenTokenBagTokens).toBe(true);
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
});
