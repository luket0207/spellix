import { createPlayers } from './gameSetup';
import { getPlayerPieceImageName } from './pieceImages';

describe('game setup player piece selection foundation', () => {
  test('creates players with default boy piece-selection data', () => {
    const players = createPlayers(2);

    expect(players[0].anywhereMode).toBe(false);
    expect(players[0].gender).toBe('boy');
    expect(players[0].currentHealth).toBe(100);
    expect(players[0].hasLeftStartArea).toBe(false);
    expect(players[0].maxHealth).toBe(100);
    expect(players[0].pieceImage).toBe('m-red.png');
    expect(players[1].anywhereMode).toBe(false);
    expect(players[1].gender).toBe('boy');
    expect(players[1].currentHealth).toBe(100);
    expect(players[1].hasLeftStartArea).toBe(false);
    expect(players[1].maxHealth).toBe(100);
    expect(players[1].pieceImage).toBe('m-blue.png');
  });

  test('maps boy and girl selections to the expected piece filenames', () => {
    expect(getPlayerPieceImageName({ colour: 'purple', gender: 'girl' })).toBe('f-purple.png');
    expect(getPlayerPieceImageName({ colour: 'yellow', gender: 'boy' })).toBe('m-yellow.png');
  });
});
