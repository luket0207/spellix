import {
  getBoardHoverEnemyName,
  getBoardHoverLabel,
  getBoardHoverLabelPosition,
} from './boardHoverLabels';

const ENVIRONMENT_LABELS = [
  ['field', 'Field', '\u91ce\u539f'],
  ['hills', 'Hills', '\u4e18\u9675'],
  ['gravel', 'Gravel', '\u7802\u5229\u5730'],
  ['mud', 'Mud', '\u6ce5\u5730'],
  ['stream', 'Stream', '\u5c0f\u5ddd'],
  ['river', 'River', '\u5ddd'],
  ['woods', 'Woods', '\u6797'],
  ['forest', 'Forest', '\u68ee'],
  ['mountains', 'Mountains', '\u5c71\u5cb3'],
];

function createSquare(overrides = {}) {
  return {
    environmentType: 'field',
    featureId: null,
    x: 4,
    y: 4,
    ...overrides,
  };
}

describe('board hover labels', () => {
  test.each(ENVIRONMENT_LABELS)(
    'localizes the %s environment label',
    (environmentType, englishLabel, japaneseLabel) => {
      const square = createSquare({ environmentType });

      expect(getBoardHoverLabel({ board: null, language: 'en', square })).toBe(
        englishLabel
      );
      expect(getBoardHoverLabel({ board: null, language: 'jp', square })).toBe(
        japaneseLabel
      );
    }
  );

  test.each([
    ['village-field.png', 'Village', '\u6751'],
    ['village-forest.png', 'Village', '\u6751'],
    ['elite-tower-gravel.png', 'Elite Tower', '\u30a8\u30ea\u30fc\u30c8\u30bf\u30ef\u30fc'],
    ['elite-tower-woods.png', 'Elite Tower', '\u30a8\u30ea\u30fc\u30c8\u30bf\u30ef\u30fc'],
    ['boss-castle.png', 'Boss Battle', '\u30dc\u30b9\u30d0\u30c8\u30eb'],
  ])(
    'uses the %s feature label instead of underlying terrain',
    (imageName, englishLabel, japaneseLabel) => {
      const board = {
        featureImages: [{ id: 'feature-1', imageName }],
      };
      const square = createSquare({
        environmentType: 'mountains',
        featureId: 'feature-1',
      });

      expect(getBoardHoverLabel({ board, language: 'en', square })).toBe(
        englishLabel
      );
      expect(getBoardHoverLabel({ board, language: 'jp', square })).toBe(
        japaneseLabel
      );
    }
  );

  test('labels fixed Elite Tower and Boss Battle footprints', () => {
    const board = { featureImages: [], height: 31, width: 31 };

    expect(
      getBoardHoverLabel({
        board,
        language: 'en',
        square: createSquare({ x: 0, y: 0 }),
      })
    ).toBe('Elite Tower');
    expect(
      getBoardHoverLabel({
        board,
        language: 'jp',
        square: createSquare({ x: 30, y: 0 }),
      })
    ).toBe('\u30dc\u30b9\u30d0\u30c8\u30eb');
  });

  test.each([
    [0, 0, 'en', 'Crowned Lichlord'],
    [1, 1, 'jp', '\u51a0\u306e\u30ea\u30c3\u30c1\u738b'],
    [29, 29, 'en', 'Amethyst Ogre'],
    [30, 30, 'jp', '\u7d2b\u6676\u306e\u30aa\u30fc\u30ac'],
    [29, 0, 'en', 'Hellcrown Reaper'],
    [30, 1, 'jp', '\u5730\u7344\u51a0\u306e\u6b7b\u795e'],
  ])(
    'uses the assigned enemy for fixed square %s,%s in %s',
    (x, y, language, expectedName) => {
      const board = {
        featureImages: [
          {
            id: 'elite-top-left',
            imageName: 'elite-tower-gravel.png',
          },
          {
            id: 'elite-bottom-right',
            imageName: 'elite-tower-woods.png',
          },
          { id: 'boss', imageName: 'boss-castle.png' },
        ],
      };
      const assignments = {
        bossBattle: 'hellcrown-reaper',
        eliteTowerGravel: 'crowned-lichlord',
        eliteTowerWoods: 'amethyst-ogre',
      };

      expect(
        getBoardHoverEnemyName({
          assignments,
          board,
          language,
          square: createSquare({ x, y }),
        })
      ).toBe(expectedName);
    }
  );

  test('omits an enemy line when assignments are missing or the square is not an encounter', () => {
    const board = {
      featureImages: [
        { id: 'elite-top-left', imageName: 'elite-tower-gravel.png' },
      ],
    };

    expect(
      getBoardHoverEnemyName({
        assignments: null,
        board,
        language: 'en',
        square: createSquare({ x: 0, y: 0 }),
      })
    ).toBe('');
    expect(
      getBoardHoverEnemyName({
        assignments: { eliteTowerGravel: 'crowned-lichlord' },
        board,
        language: 'en',
        square: createSquare({ x: 4, y: 4 }),
      })
    ).toBe('');
  });

  test('positions labels opposite the hovered board half', () => {
    const board = { height: 31 };

    expect(
      getBoardHoverLabelPosition(board, createSquare({ y: 5 }))
    ).toBe('bottom');
    expect(
      getBoardHoverLabelPosition(board, createSquare({ y: 20 }))
    ).toBe('top');
  });
});
