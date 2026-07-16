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
    ]);
  });

  test('stores every required English and Japanese token name and tooltip', () => {
    expect(
      Object.fromEntries(
        TOKEN_TYPES.map((type) => [
          type,
          {
            description: TOKEN_DEFINITIONS[type].description,
            name: TOKEN_DEFINITIONS[type].name,
          },
        ])
      )
    ).toEqual({
      red: {
        description: { en: 'Plus 10 Damage', jp: 'ダメージ+10' },
        name: { en: 'Damage', jp: 'ダメージ' },
      },
      blue: {
        description: { en: 'Plus 5 Guard', jp: 'ガード+5' },
        name: { en: 'Guard', jp: 'ガード' },
      },
      orange: {
        description: { en: 'Plus 5 Counter Damage', jp: 'カウンターダメージ+5' },
        name: { en: 'Counter', jp: 'カウンター' },
      },
      green: {
        description: { en: 'Plus 5 Weakness', jp: '弱体化+5' },
        name: { en: 'Weaken', jp: '弱体化' },
      },
      'light-blue': {
        description: { en: 'Freeze', jp: '凍結' },
        name: { en: 'Freeze', jp: '凍結' },
      },
      'light-green': {
        description: { en: 'Plus 5 HP', jp: '体力+5' },
        name: { en: 'Health', jp: '体力' },
      },
      black: {
        description: {
          en: 'This token will be the first token to be removed if you lose a battle',
          jp: 'バトルに負けた場合、このトークンが最初に取り除かれます。',
        },
        name: { en: 'Sacrifice', jp: '身代わり' },
      },
      white: {
        description: { en: 'Merge Token', jp: '合成トークン' },
        name: { en: 'Merge', jp: '合成' },
      },
      purple: {
        description: { en: 'Plus 5 Buff', jp: '強化+5' },
        name: { en: 'Buff', jp: '強化' },
      },
      yellow: {
        description: { en: 'Charge', jp: 'チャージ' },
        name: { en: 'Charge', jp: 'チャージ' },
      },
      grey: {
        description: {
          en: 'Plus 1 Token slot to all adjacent columns',
          jp: '隣接するすべての列のトークンスロット+1',
        },
        name: { en: 'Capacity', jp: '容量' },
      },
    });
  });

  test('selects localized token text with an English fallback', () => {
    expect(getTokenName('red', 'en')).toBe('Damage');
    expect(getTokenName('red', 'jp')).toBe('ダメージ');
    expect(getTokenName('red', 'invalid')).toBe('Damage');
    expect(getTokenDescription('grey', 'jp')).toBe('隣接するすべての列のトークンスロット+1');
    expect(getTokenDescription('grey')).toBe('Plus 1 Token slot to all adjacent columns');
    expect(getTokenName('missing', 'jp')).toBe('');
  });
});
