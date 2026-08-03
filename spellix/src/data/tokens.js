export const TOKEN_DEFINITIONS = {
  red: {
    description: { en: 'Plus 10 Damage', jp: '\u30c0\u30e1\u30fc\u30b8\uff0b10' },
    label: 'Red',
    name: { en: 'Damage', jp: '\u30c0\u30e1\u30fc\u30b8' },
    rarity: 'Common',
  },
  blue: {
    description: { en: 'Plus 5 Guard', jp: '\u30ac\u30fc\u30c9\uff0b5' },
    label: 'Blue',
    name: { en: 'Guard', jp: '\u30ac\u30fc\u30c9' },
    rarity: 'Common',
  },
  orange: {
    description: { en: 'Plus 5 Counter Damage', jp: '\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\uff0b5' },
    label: 'Orange',
    name: { en: 'Counter', jp: '\u30ab\u30a6\u30f3\u30bf\u30fc' },
    rarity: 'Common',
  },
  green: {
    description: { en: 'Plus 5 Weakness', jp: '\u5f31\u4f53\u5316\uff0b5' },
    label: 'Green',
    name: { en: 'Weaken', jp: '\u5f31\u4f53\u5316' },
    rarity: 'Common',
  },
  'light-blue': {
    description: { en: 'Freeze', jp: '\u51cd\u7d50' },
    label: 'Light Blue',
    name: { en: 'Freeze', jp: '\u51cd\u7d50' },
    rarity: 'Common',
  },
  'light-green': {
    description: { en: 'Plus 5 HP', jp: 'HP\uff0b5' },
    label: 'Light Green',
    name: { en: 'Health', jp: '\u4f53\u529b' },
    rarity: 'Common',
  },
  black: {
    description: {
      en: 'This token will be the first token to be removed if you lose a battle',
      jp: '\u30d0\u30c8\u30eb\u306b\u6557\u5317\u3057\u305f\u5834\u5408\u3001\u3053\u306e\u30c8\u30fc\u30af\u30f3\u304c\u6700\u521d\u306b\u53d6\u308a\u9664\u304b\u308c\u308b',
    },
    label: 'Black',
    name: { en: 'Sacrifice', jp: '\u8eab\u4ee3\u308f\u308a' },
    rarity: 'Common',
  },
  white: {
    description: { en: 'Merge Token', jp: '\u5408\u6210\u30c8\u30fc\u30af\u30f3' },
    label: 'White',
    name: { en: 'Merge', jp: '\u5408\u6210' },
    rarity: 'Rare',
  },
  purple: {
    description: { en: 'Plus 5 Buff', jp: '\u30d0\u30d5\uff0b5' },
    label: 'Purple',
    name: { en: 'Buff', jp: '\u5f37\u5316' },
    rarity: 'Rare',
  },
  yellow: {
    description: { en: 'Charge', jp: '\u30c1\u30e3\u30fc\u30b8' },
    label: 'Yellow',
    name: { en: 'Charge', jp: '\u30c1\u30e3\u30fc\u30b8' },
    rarity: 'Rare',
  },
  grey: {
    description: {
      en: 'Plus 1 Token slot to all adjacent columns',
      jp: '\u96a3\u63a5\u3059\u308b\u3059\u3079\u3066\u306e\u5217\u306e\u30c8\u30fc\u30af\u30f3\u30b9\u30ed\u30c3\u30c8\u30921\u3064\u5897\u3084\u3059',
    },
    label: 'Grey',
    name: { en: 'Capacity', jp: '\u5bb9\u91cf' },
    rarity: 'Rare',
  },
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
    description: { en: 'Plus 10 Counter Damage', jp: '\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\uff0b10' },
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
};

export const TOKEN_TYPES = Object.keys(TOKEN_DEFINITIONS);

function getTokenLanguage(language) {
  return language === 'jp' ? 'jp' : 'en';
}

export function getTokenName(tokenType, language) {
  return TOKEN_DEFINITIONS[tokenType]?.name?.[getTokenLanguage(language)] ?? '';
}

export function getTokenDescription(tokenType, language) {
  return TOKEN_DEFINITIONS[tokenType]?.description?.[getTokenLanguage(language)] ?? '';
}
