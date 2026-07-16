import { createInitialGameSetup, createPlayers } from './gameSetup';
import { getPlayerPieceImageName } from './pieceImages';

describe('game setup player piece selection foundation', () => {
  test('starts without a pending potion grant', () => {
    expect(createInitialGameSetup().pendingPotionGrant).toBeNull();
  });

  test('creates players with default boy piece-selection data', () => {
    const players = createPlayers(2);

    expect(players[0].anywhereMode).toBe(false);
    expect(players[0].gender).toBe('boy');
    expect(players[0].currentHealth).toBe(100);
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
    expect(players[0].tokenBag).toHaveLength(7);
    expect(players[0].tokenBag).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ protected: true, source: 'starting', type: 'red' }),
        expect.objectContaining({ protected: true, source: 'starting', type: 'blue' }),
      ])
    );
    expect(players[0].tokenBag.every((token) => token.protected)).toBe(true);
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
});
