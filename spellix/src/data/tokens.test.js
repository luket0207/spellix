import {
  getTokenDescription,
  getTokenName,
  TOKEN_DEFINITIONS,
  TOKEN_TYPES,
} from './tokens';

describe('token definitions', () => {
  test('assigns the required rarity to every existing token type', () => {
    expect(TOKEN_TYPES).toEqual([
      'red',
      'blue',
      'orange',
      'green',
      'light-blue',
      'light-green',
      'black',
      'white',
      'purple',
      'yellow',
      'grey',
      'red-yellow-outline',
      'blue-yellow-outline',
      'orange-yellow-outline',
      'green-yellow-outline',
    ]);
    expect(TOKEN_TYPES.filter((type) => TOKEN_DEFINITIONS[type].rarity === 'Common')).toEqual([
      'red',
      'blue',
      'orange',
      'green',
      'light-blue',
      'light-green',
      'black',
    ]);
    expect(TOKEN_TYPES.filter((type) => TOKEN_DEFINITIONS[type].rarity === 'Rare')).toEqual([
      'white',
      'purple',
      'yellow',
      'grey',
      'red-yellow-outline',
      'blue-yellow-outline',
      'orange-yellow-outline',
      'green-yellow-outline',
    ]);
  });

  test('stores the required outlined token data', () => {
    expect(
      Object.fromEntries(
        TOKEN_TYPES.filter((type) => type.endsWith('-yellow-outline')).map(
          (type) => [type, TOKEN_DEFINITIONS[type]]
        )
      )
    ).toEqual({
      'red-yellow-outline': {
        baseColour: 'red',
        description: { en: 'Plus 20 Damage', jp: '\u30c0\u30e1\u30fc\u30b8\uff0b20' },
        label: 'Red/Yellow Outline',
        name: { en: 'Shiny Damage', jp: '\u8f1d\u304f\u30c0\u30e1\u30fc\u30b8' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
      'blue-yellow-outline': {
        baseColour: 'blue',
        description: { en: 'Plus 10 Guard', jp: '\u30ac\u30fc\u30c9\uff0b10' },
        label: 'Blue/Yellow Outline',
        name: { en: 'Shiny Guard', jp: '\u8f1d\u304f\u30ac\u30fc\u30c9' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
      'orange-yellow-outline': {
        baseColour: 'orange',
        description: {
          en: 'Plus 10 Counter Damage',
          jp: '\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\uff0b10',
        },
        label: 'Orange/Yellow Outline',
        name: { en: 'Shiny Counter', jp: '\u8f1d\u304f\u30ab\u30a6\u30f3\u30bf\u30fc' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
      'green-yellow-outline': {
        baseColour: 'green',
        description: { en: 'Plus 10 Weakness', jp: '\u5f31\u4f53\u5316\uff0b10' },
        label: 'Green/Yellow Outline',
        name: { en: 'Shiny Weaken', jp: '\u8f1d\u304f\u5f31\u4f53\u5316' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
    });
  });

  test('stores every required English and Japanese token name and description', () => {
    const localizedTokenData = Object.fromEntries(
      TOKEN_TYPES.filter((type) => !type.endsWith('-yellow-outline')).map((type) => [
        type,
        {
          description: TOKEN_DEFINITIONS[type].description,
          name: TOKEN_DEFINITIONS[type].name,
        },
      ])
    );

    expect(localizedTokenData).toEqual({
      red: {
        description: { en: 'Plus 10 Damage', jp: '\u30c0\u30e1\u30fc\u30b8\uff0b10' },
        name: { en: 'Damage', jp: '\u30c0\u30e1\u30fc\u30b8' },
      },
      blue: {
        description: { en: 'Plus 5 Guard', jp: '\u30ac\u30fc\u30c9\uff0b5' },
        name: { en: 'Guard', jp: '\u30ac\u30fc\u30c9' },
      },
      orange: {
        description: {
          en: 'Plus 5 Counter Damage',
          jp: '\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\uff0b5',
        },
        name: { en: 'Counter', jp: '\u30ab\u30a6\u30f3\u30bf\u30fc' },
      },
      green: {
        description: { en: 'Plus 5 Weakness', jp: '\u5f31\u4f53\u5316\uff0b5' },
        name: { en: 'Weaken', jp: '\u5f31\u4f53\u5316' },
      },
      'light-blue': {
        description: { en: 'Freeze', jp: '\u51cd\u7d50' },
        name: { en: 'Freeze', jp: '\u51cd\u7d50' },
      },
      'light-green': {
        description: { en: 'Plus 5 HP', jp: 'HP\uff0b5' },
        name: { en: 'Health', jp: '\u4f53\u529b' },
      },
      black: {
        description: {
          en: 'This token will be the first token to be removed if you lose a battle',
          jp: '\u30d0\u30c8\u30eb\u306b\u6557\u5317\u3057\u305f\u5834\u5408\u3001\u3053\u306e\u30c8\u30fc\u30af\u30f3\u304c\u6700\u521d\u306b\u53d6\u308a\u9664\u304b\u308c\u308b',
        },
        name: { en: 'Sacrifice', jp: '\u8eab\u4ee3\u308f\u308a' },
      },
      white: {
        description: { en: 'Merge Token', jp: '\u5408\u6210\u30c8\u30fc\u30af\u30f3' },
        name: { en: 'Merge', jp: '\u5408\u6210' },
      },
      purple: {
        description: { en: 'Plus 5 Buff', jp: '\u30d0\u30d5\uff0b5' },
        name: { en: 'Buff', jp: '\u5f37\u5316' },
      },
      yellow: {
        description: { en: 'Charge', jp: '\u30c1\u30e3\u30fc\u30b8' },
        name: { en: 'Charge', jp: '\u30c1\u30e3\u30fc\u30b8' },
      },
      grey: {
        description: {
          en: 'Plus 1 Token slot to all adjacent columns',
          jp: '\u96a3\u63a5\u3059\u308b\u3059\u3079\u3066\u306e\u5217\u306e\u30c8\u30fc\u30af\u30f3\u30b9\u30ed\u30c3\u30c8\u30921\u3064\u5897\u3084\u3059',
        },
        name: { en: 'Capacity', jp: '\u5bb9\u91cf' },
      },
    });
  });

  test('selects localized token text with an English fallback', () => {
    expect(getTokenName('red', 'en')).toBe('Damage');
    expect(getTokenName('red', 'jp')).toBe('\u30c0\u30e1\u30fc\u30b8');
    expect(getTokenName('red', 'invalid')).toBe('Damage');
    expect(getTokenDescription('grey', 'jp')).toBe(
      '\u96a3\u63a5\u3059\u308b\u3059\u3079\u3066\u306e\u5217\u306e\u30c8\u30fc\u30af\u30f3\u30b9\u30ed\u30c3\u30c8\u30921\u3064\u5897\u3084\u3059'
    );
    expect(getTokenDescription('grey')).toBe('Plus 1 Token slot to all adjacent columns');
    expect(getTokenName('missing', 'jp')).toBe('');
  });
});
