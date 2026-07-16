export const TOKEN_DEFINITIONS = {
  red: {
    description: { en: 'Plus 10 Damage', jp: 'ダメージ+10' },
    label: 'Red',
    name: { en: 'Damage', jp: 'ダメージ' },
    rarity: 'Common',
  },
  blue: {
    description: { en: 'Plus 5 Guard', jp: 'ガード+5' },
    label: 'Blue',
    name: { en: 'Guard', jp: 'ガード' },
    rarity: 'Common',
  },
  orange: {
    description: { en: 'Plus 5 Counter Damage', jp: 'カウンターダメージ+5' },
    label: 'Orange',
    name: { en: 'Counter', jp: 'カウンター' },
    rarity: 'Common',
  },
  green: {
    description: { en: 'Plus 5 Weakness', jp: '弱体化+5' },
    label: 'Green',
    name: { en: 'Weaken', jp: '弱体化' },
    rarity: 'Common',
  },
  'light-blue': {
    description: { en: 'Freeze', jp: '凍結' },
    label: 'Light Blue',
    name: { en: 'Freeze', jp: '凍結' },
    rarity: 'Common',
  },
  'light-green': {
    description: { en: 'Plus 5 HP', jp: '体力+5' },
    label: 'Light Green',
    name: { en: 'Health', jp: '体力' },
    rarity: 'Common',
  },
  black: {
    description: {
      en: 'This token will be the first token to be removed if you lose a battle',
      jp: 'バトルに負けた場合、このトークンが最初に取り除かれます。',
    },
    label: 'Black',
    name: { en: 'Sacrifice', jp: '身代わり' },
    rarity: 'Common',
  },
  white: {
    description: { en: 'Merge Token', jp: '合成トークン' },
    label: 'White',
    name: { en: 'Merge', jp: '合成' },
    rarity: 'Rare',
  },
  purple: {
    description: { en: 'Plus 5 Buff', jp: '強化+5' },
    label: 'Purple',
    name: { en: 'Buff', jp: '強化' },
    rarity: 'Rare',
  },
  yellow: {
    description: { en: 'Charge', jp: 'チャージ' },
    label: 'Yellow',
    name: { en: 'Charge', jp: 'チャージ' },
    rarity: 'Rare',
  },
  grey: {
    description: {
      en: 'Plus 1 Token slot to all adjacent columns',
      jp: '隣接するすべての列のトークンスロット+1',
    },
    label: 'Grey',
    name: { en: 'Capacity', jp: '容量' },
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
