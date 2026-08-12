import {
  SAVE_FILE_NAME,
  createSaveFileText,
  downloadSaveFile,
  parseSaveFileText,
  readSaveFile,
} from './saveGame';

function createValidGameState() {
  const createPlayer = (id, position) => ({
    activePotion: null,
    currentHealth: 75,
    eliteProgress: {
      eliteTowerGravel: id === 'player-1',
      eliteTowerWoods: false,
    },
    id,
    maxHealth: 110,
    mergedColumns: [{ columns: [1, 2], id: `${id}-merge` }],
    pendingPotionEffects: [],
    position,
    potions: [{ id: `${id}-potion`, type: 'heal' }],
    spellSlots: [{ id: 'slot-1', tokens: [] }],
    tokenBag: [{ id: `${id}-token`, type: 'red' }],
    turnPotionUsage: { boardPotionUsedThisTurn: false },
    villageProgress: { village1: true },
  });

  return {
    board: {
      features: [{ id: 'north-west-tower' }],
      squares: [{ environment: 'woods', x: 1, y: 2 }],
    },
    currentTurnIndex: 1,
    debugMode: true,
    eliteBossEnemyAssignments: {
      bossBattle: 'hellcrown-reaper',
      eliteTowerGravel: 'amethyst-ogre',
      eliteTowerWoods: 'mossroot-elder',
    },
    playerCount: 2,
    players: [
      createPlayer('player-1', {
        featureId: 'north-west-tower',
        type: 'feature',
        x: 1,
        y: 2,
      }),
      createPlayer('player-2', { x: 3, y: 4 }),
    ],
    turnOrder: ['player-2', 'player-1'],
  };
}

describe('save game files', () => {
  test('round-trips complete UTF-8 state through versioned base64 instead of plain JSON', () => {
    const gameState = {
      ...createValidGameState(),
      miniGameResult: { message: '洞窟の報酬' },
    };
    const appState = {
      activeRollAgainEvent: { playerId: 'player-1' },
      isChooseEventModeEnabled: true,
    };
    const savedAt = new Date('2026-08-12T03:04:05.000Z');

    const fileText = createSaveFileText(gameState, appState, savedAt);

    expect(fileText).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(fileText).not.toContain('{');
    expect(parseSaveFileText(fileText)).toEqual({
      appState,
      gameState,
      savedAt: '2026-08-12T03:04:05.000Z',
      version: 1,
    });
  });

  test('rejects plain JSON, unsupported versions, and incomplete game state', () => {
    const gameState = createValidGameState();
    const unsupportedText = window.btoa(
      JSON.stringify({ gameState, savedAt: new Date().toISOString(), version: 2 })
    );
    const incompleteText = window.btoa(
      JSON.stringify({ gameState: { players: [] }, version: 1 })
    );

    expect(() => parseSaveFileText(JSON.stringify({ version: 1 }))).toThrow();
    expect(() => parseSaveFileText(unsupportedText)).toThrow();
    expect(() => parseSaveFileText(incompleteText)).toThrow();
  });

  test('reads a valid txt file and downloads saves with the required filename', async () => {
    const fileText = createSaveFileText(createValidGameState());
    const file = new File([fileText], SAVE_FILE_NAME, { type: 'text/plain' });
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const createObjectUrl = jest.fn(() => 'blob:spellix-save');
    const revokeObjectUrl = jest.fn();
    window.URL.createObjectURL = createObjectUrl;
    window.URL.revokeObjectURL = revokeObjectUrl;

    await expect(readSaveFile(file)).resolves.toEqual(
      expect.objectContaining({ gameState: createValidGameState(), version: 1 })
    );

    downloadSaveFile(fileText);

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:spellix-save');
    expect(clickSpy.mock.instances[0]).toHaveAttribute('download', SAVE_FILE_NAME);
  });
});
