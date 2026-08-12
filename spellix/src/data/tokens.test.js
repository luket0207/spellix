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
      'light-green-yellow-outline',
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
      'light-green-yellow-outline',
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
          en: 'Plus 10 counter damage if attacked via this number',
          jp: '\u3053\u306e\u6570\u5b57\u304b\u3089\u653b\u6483\u3055\u308c\u305f\u5834\u5408\u3001\u30ab\u30a6\u30f3\u30bf\u30fc\u30c0\u30e1\u30fc\u30b8\uff0b10',
        },
        label: 'Orange/Yellow Outline',
        name: { en: 'Shiny Counter', jp: '\u8f1d\u304f\u30ab\u30a6\u30f3\u30bf\u30fc' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
      'green-yellow-outline': {
        baseColour: 'green',
        description: {
          en: 'Deflect 10 damage if attacked via this number',
          jp: '\u3053\u306e\u6570\u5b57\u304b\u3089\u653b\u6483\u3055\u308c\u305f\u5834\u5408\u300110\u30c0\u30e1\u30fc\u30b8\u3092\u53d7\u3051\u6d41\u3059',
        },
        label: 'Green/Yellow Outline',
        name: { en: 'Shiny Deflect', jp: '\u8f1d\u304f\u53d7\u3051\u6d41\u3057' },
        outlineColour: 'yellow',
        rarity: 'Rare',
      },
      'light-green-yellow-outline': {
        baseColour: 'light-green',
        description: { en: 'Plus 10 HP', jp: 'HP\uff0b10' },
        label: 'Light Green/Yellow Outline',
        name: { en: 'Shiny Health', jp: '\u8f1d\u304f\u4f53\u529b' },
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
          en: 'Plus 5 counter damage if attacked via this number',
          jp: '\u3053\u306e\u6570\u5b57\u304b\u3089\u653b\u6483\u3055\u308c\u305f\u5834\u5408\u3001\u30ab\u30a6\u30f3\u30bf\u30fc\u30c0\u30e1\u30fc\u30b8\uff0b5',
        },
        name: { en: 'Counter', jp: '\u30ab\u30a6\u30f3\u30bf\u30fc' },
      },
      green: {
        description: {
          en: 'Deflect 5 damage if attacked via this number',
          jp: '\u3053\u306e\u6570\u5b57\u304b\u3089\u653b\u6483\u3055\u308c\u305f\u5834\u5408\u30015\u30c0\u30e1\u30fc\u30b8\u3092\u53d7\u3051\u6d41\u3059',
        },
        name: { en: 'Deflect', jp: '\u53d7\u3051\u6d41\u3057' },
      },
      'light-blue': {
        description: {
          en: 'Freeze your opponent for their next turn',
          jp: '\u6b21\u306e\u30bf\u30fc\u30f3\u3001\u5bfe\u6226\u76f8\u624b\u3092\u51cd\u7d50\u3055\u305b\u308b',
        },
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
        description: {
          en: 'Put in two adjacent columns to merge them together.',
          jp: '\u96a3\u63a5\u3059\u308b2\u3064\u306e\u5217\u306b\u914d\u7f6e\u3059\u308b\u3068\u3001\u305d\u306e2\u5217\u3092\u7d71\u5408\u3059\u308b\u3002',
        },
        name: { en: 'Merge', jp: '\u5408\u6210' },
      },
      purple: {
        description: { en: 'Plus 5 Buff', jp: '\u30d0\u30d5\uff0b5' },
        name: { en: 'Buff', jp: '\u5f37\u5316' },
      },
      yellow: {
        description: {
          en: 'Charge all your slots next turn',
          jp: '\u6b21\u306e\u30bf\u30fc\u30f3\u3001\u3059\u3079\u3066\u306e\u30b9\u30ed\u30c3\u30c8\u3092\u30c1\u30e3\u30fc\u30b8\u3059\u308b\u3002',
        },
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
