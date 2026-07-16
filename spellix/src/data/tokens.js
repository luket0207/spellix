export const TOKEN_DEFINITIONS = {
  red: { description: 'Plus 10 Damage', label: 'Red', rarity: 'Common' },
  blue: { description: 'Plus 5 Guard', label: 'Blue', rarity: 'Common' },
  orange: {
    description: 'Plus 5 Counter Damage',
    label: 'Orange',
    rarity: 'Common',
  },
  green: { description: 'Plus 5 Weakness', label: 'Green', rarity: 'Common' },
  'light-blue': { description: 'Freeze', label: 'Light Blue', rarity: 'Common' },
  'light-green': { description: 'Plus 5 HP', label: 'Light Green', rarity: 'Common' },
  black: {
    description: 'This token will be the first token to be removed if you lose a battle',
    label: 'Black',
    rarity: 'Common',
  },
  white: { description: 'Merge Token', label: 'White', rarity: 'Rare' },
  purple: { description: 'Plus 5 Buff', label: 'Purple', rarity: 'Rare' },
  yellow: { description: 'Charge', label: 'Yellow', rarity: 'Rare' },
  grey: {
    description: 'Plus 1 Token slot to all adjacent columns',
    label: 'Grey',
    rarity: 'Rare',
  },
};

export const TOKEN_TYPES = Object.keys(TOKEN_DEFINITIONS);
