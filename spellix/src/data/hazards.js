export const HAZARD_ENVIRONMENTS = [
  { background: 'fields', id: 'field', label: 'Field' },
  { background: 'hills', id: 'hills', label: 'Hills' },
  { background: 'gravel', id: 'gravel', label: 'Gravel' },
  { background: 'mud', id: 'mud', label: 'Mud' },
  { background: 'stream', id: 'stream', label: 'Stream' },
  { background: 'river', id: 'river', label: 'River' },
  { background: 'woods', id: 'woods', label: 'Woods' },
  { background: 'forest', id: 'forest', label: 'Forest' },
  { background: 'mountains', id: 'mountains', label: 'Mountains' },
];

export const HAZARDS = [
  {
    id: 'landslide',
    name: { en: 'Landslide', jp: '\u571f\u7802\u5d29\u308c' },
    chances: {
      field: 0,
      hills: 12,
      gravel: 8,
      mud: 3,
      stream: 0,
      river: 0,
      woods: 0,
      forest: 0,
      mountains: 18,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'rockfall',
    name: { en: 'Rockfall', jp: '\u843d\u77f3' },
    chances: {
      field: 0,
      hills: 10,
      gravel: 20,
      mud: 0,
      stream: 0,
      river: 0,
      woods: 0,
      forest: 0,
      mountains: 16,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'flash-flood',
    name: { en: 'Flash Flood', jp: '\u9244\u7832\u6c34' },
    chances: {
      field: 8,
      hills: 8,
      gravel: 3,
      mud: 10,
      stream: 14,
      river: 18,
      woods: 0,
      forest: 0,
      mountains: 3,
    },
    effect: { type: 'skipNextTurn' },
  },
  {
    id: 'quicksand',
    name: { en: 'Quicksand', jp: '\u6d41\u7802' },
    chances: {
      field: 5,
      hills: 2,
      gravel: 8,
      mud: 22,
      stream: 4,
      river: 2,
      woods: 0,
      forest: 2,
      mountains: 0,
    },
    effect: { type: 'skipNextTurn' },
  },
  {
    id: 'thorn-snare',
    name: { en: 'Thorn Snare', jp: '\u8328\u306e\u7f60' },
    chances: {
      field: 12,
      hills: 8,
      gravel: 0,
      mud: 4,
      stream: 0,
      river: 0,
      woods: 15,
      forest: 18,
      mountains: 0,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'falling-branches',
    name: {
      en: 'Falling Branches',
      jp: '\u843d\u4e0b\u3059\u308b\u679d',
    },
    chances: {
      field: 2,
      hills: 4,
      gravel: 0,
      mud: 0,
      stream: 0,
      river: 0,
      woods: 18,
      forest: 17,
      mountains: 2,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'wildfire',
    name: { en: 'Wildfire', jp: '\u5c71\u706b\u4e8b' },
    chances: {
      field: 18,
      hills: 12,
      gravel: 5,
      mud: 0,
      stream: 0,
      river: 0,
      woods: 12,
      forest: 8,
      mountains: 3,
    },
    effect: { type: 'skipNextTurn' },
  },
  {
    id: 'poisonous-spores',
    name: { en: 'Poisonous Spores', jp: '\u6bd2\u80de\u5b50' },
    chances: {
      field: 3,
      hills: 3,
      gravel: 0,
      mud: 12,
      stream: 4,
      river: 0,
      woods: 14,
      forest: 18,
      mountains: 0,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'swamp-gas',
    name: {
      en: 'Swamp Gas',
      jp: '\u6cbc\u306e\u6bd2\u30ac\u30b9',
    },
    chances: {
      field: 0,
      hills: 0,
      gravel: 0,
      mud: 15,
      stream: 8,
      river: 5,
      woods: 2,
      forest: 5,
      mountains: 0,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'strong-current',
    name: { en: 'Strong Current', jp: '\u6025\u6d41' },
    chances: {
      field: 0,
      hills: 0,
      gravel: 0,
      mud: 0,
      stream: 28,
      river: 40,
      woods: 0,
      forest: 0,
      mountains: 2,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'avalanche',
    name: { en: 'Avalanche', jp: '\u96ea\u5d29' },
    chances: {
      field: 0,
      hills: 2,
      gravel: 0,
      mud: 0,
      stream: 0,
      river: 0,
      woods: 0,
      forest: 0,
      mountains: 20,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'dense-enchanted-fog',
    name: {
      en: 'Dense Enchanted Fog',
      jp: '\u6fc3\u5bc6\u306a\u9b54\u6cd5\u306e\u9727',
    },
    chances: {
      field: 10,
      hills: 8,
      gravel: 5,
      mud: 8,
      stream: 10,
      river: 8,
      woods: 10,
      forest: 8,
      mountains: 5,
    },
    effect: { type: 'skipNextTurn' },
  },
  {
    id: 'lightning-strike',
    name: { en: 'Lightning Strike', jp: '\u843d\u96f7' },
    chances: {
      field: 15,
      hills: 10,
      gravel: 5,
      mud: 2,
      stream: 4,
      river: 4,
      woods: 5,
      forest: 3,
      mountains: 10,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: 'mudslide',
    name: { en: 'Mudslide', jp: '\u6ce5\u6d41' },
    chances: {
      field: 0,
      hills: 8,
      gravel: 5,
      mud: 10,
      stream: 5,
      river: 3,
      woods: 0,
      forest: 0,
      mountains: 6,
    },
    effect: { type: 'loseHealth', amount: 5 },
  },
  {
    id: 'hidden-sinkhole',
    name: {
      en: 'Hidden Sinkhole',
      jp: '\u96a0\u308c\u305f\u9665\u6ca1\u7a74',
    },
    chances: {
      field: 12,
      hills: 5,
      gravel: 15,
      mud: 5,
      stream: 0,
      river: 0,
      woods: 3,
      forest: 2,
      mountains: 2,
    },
    effect: { type: 'loseHealth', amount: 5 },
  },
  {
    id: 'cursed-brambles',
    name: {
      en: 'Cursed Brambles',
      jp: '\u546a\u308f\u308c\u305f\u8328',
    },
    chances: {
      field: 5,
      hills: 3,
      gravel: 0,
      mud: 3,
      stream: 0,
      river: 0,
      woods: 10,
      forest: 12,
      mountains: 0,
    },
    effect: { type: 'loseHealth', amount: 10 },
  },
  {
    id: "wandering-will-o'-wisps",
    name: {
      en: "Wandering Will-o'-Wisps",
      jp: '\u3055\u307e\u3088\u3046\u9b3c\u706b',
    },
    chances: {
      field: 3,
      hills: 2,
      gravel: 0,
      mud: 4,
      stream: 10,
      river: 7,
      woods: 4,
      forest: 4,
      mountains: 0,
    },
    effect: { type: 'loseHealth', amount: 5 },
  },
  {
    id: 'frozen-ground',
    name: {
      en: 'Frozen Ground',
      jp: '\u51cd\u3063\u305f\u5730\u9762',
    },
    chances: {
      field: 0,
      hills: 1,
      gravel: 3,
      mud: 0,
      stream: 3,
      river: 3,
      woods: 0,
      forest: 0,
      mountains: 8,
    },
    effect: { type: 'skipNextTurn' },
  },
  {
    id: 'mana-storm',
    name: {
      en: 'Mana Storm',
      jp: '\u30de\u30ca\u306e\u5d50',
    },
    chances: {
      field: 7,
      hills: 1,
      gravel: 8,
      mud: 2,
      stream: 10,
      river: 10,
      woods: 7,
      forest: 3,
      mountains: 2,
    },
    effect: { type: 'loseHealth', amount: 5 },
  },
  {
    id: 'crumbling-cliff-edge',
    name: {
      en: 'Crumbling Cliff Edge',
      jp: '\u5d29\u308c\u304b\u3051\u305f\u5d16\u306e\u7e01',
    },
    chances: {
      field: 0,
      hills: 1,
      gravel: 15,
      mud: 0,
      stream: 0,
      river: 0,
      woods: 0,
      forest: 0,
      mountains: 3,
    },
    effect: { type: 'skipNextTurn' },
  },
];

export function selectHazardForEnvironment(
  environment,
  hazards = HAZARDS,
  randomFn = Math.random
) {
  const weightedHazards = hazards
    .map((hazard) => ({
      hazard,
      weight: Number(hazard.chances?.[environment]) || 0,
    }))
    .filter(({ weight }) => weight > 0);
  const totalWeight = weightedHazards.reduce(
    (total, { weight }) => total + weight,
    0
  );

  if (totalWeight <= 0) {
    return null;
  }

  const roll = randomFn() * totalWeight;
  let runningTotal = 0;

  for (const { hazard, weight } of weightedHazards) {
    runningTotal += weight;

    if (roll < runningTotal) {
      return hazard;
    }
  }

  return weightedHazards[weightedHazards.length - 1].hazard;
}
