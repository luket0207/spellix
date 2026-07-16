import { POTION_DEFINITIONS } from './potions';

const EXPECTED_POTION_NAMES = [
  'Roll Choice',
  'Small Heal',
  'Heal',
  'First Aid',
  'Teleport to *',
  'Copy and Paste',
  'Gambeller',
  'Starting Charge',
  'Tokensmith',
  'Ice Beam',
  'Charger',
  'Heavy Weight',
  'Troublemaker',
  'Devine Chance',
  'Buy and Sell',
  'Cauldron',
  'Storm Master',
  'Double Dice',
  'Bridge Builder',
  'Good Decisions',
  'Cave Runner',
];

const EXPECTED_POTION_COLOURS = {
  'roll-choice': 'blue',
  'small-heal': 'green',
  heal: 'green',
  'first-aid': 'green',
  'teleport-to-feature': 'yellow',
  'copy-and-paste': 'orange',
  gambeller: 'red',
  'starting-charge': 'yellow',
  tokensmith: 'grey',
  'ice-beam': 'light-blue',
  charger: 'yellow',
  'heavy-weight': 'blue',
  troublemaker: 'purple',
  'devine-chance': 'green',
  'buy-and-sell': 'orange',
  cauldron: 'red',
  'storm-master': 'red',
  'double-dice': 'blue',
  'bridge-builder': 'light-blue',
  'good-decisions': 'orange',
  'cave-runner': 'grey',
};

describe('potion definitions', () => {
  test('contains every preliminary potion with required data', () => {
    expect(POTION_DEFINITIONS.map(({ name }) => name)).toEqual(EXPECTED_POTION_NAMES);
    expect(POTION_DEFINITIONS).toHaveLength(21);

    POTION_DEFINITIONS.forEach((potion) => {
      expect(potion).toEqual({
        availability: expect.stringMatching(/^(Both|Battle|Board)$/),
        colour: EXPECTED_POTION_COLOURS[potion.id],
        description: expect.any(String),
        id: expect.any(String),
        name: expect.any(String),
        rarity: expect.stringMatching(/^(Common|Rare)$/),
      });
      expect(potion.description).not.toHaveLength(0);
    });
  });

  test('preserves exact requirement values for representative potions', () => {
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Roll Choice')).toEqual({
      availability: 'Both',
      colour: 'blue',
      description: 'Choose the next roll of the dice',
      id: 'roll-choice',
      name: 'Roll Choice',
      rarity: 'Rare',
    });
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Teleport to *')).toEqual({
      availability: 'Board',
      colour: 'yellow',
      description: 'Teleport to *feature*, then roll the dice starting from there.',
      id: 'teleport-to-feature',
      name: 'Teleport to *',
      rarity: 'Common',
    });
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Cave Runner')).toEqual({
      availability: 'Board',
      colour: 'grey',
      description: 'Escape a cave encounter with no damage but lose any prizes you had.',
      id: 'cave-runner',
      name: 'Cave Runner',
      rarity: 'Common',
    });
  });
});
