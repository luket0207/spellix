import { calculateBattleTurn, createAdjacentPurpleBuffs } from './battleTurn';
import { getEnemyById } from './enemies';

function createToken(type, index) {
  return { committed: true, id: `${type}-${index}`, type };
}

function createSlot(tokens = [], slot = {}) {
  return { id: 'slot', maxTokens: 5, tokens, ...slot };
}

function createSpellSlots(selectedSlot, selectedIndex = 0) {
  return Array.from({ length: 6 }, (_, index) =>
    index === selectedIndex ? selectedSlot : createSlot()
  );
}

function createActor({ currentHealth = 100, guard = 0, spellSlots = createSpellSlots(createSlot()) } = {}) {
  return { currentHealth, guard, spellSlots };
}

test('stacks all four token effects in the required calculation and animation order', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('red', 1),
        createToken('red', 2),
        createToken('red', 3),
        createToken('blue', 1),
        createToken('blue', 2),
      ])
    ),
  });
  const opponent = createActor({
    currentHealth: 120,
    guard: 10,
    spellSlots: createSpellSlots(
      createSlot([
        createToken('green', 1),
        createToken('green', 2),
        createToken('orange', 1),
        createToken('orange', 2),
      ])
    ),
  });

  expect(calculateBattleTurn({ currentActor, diceResult: 1, opponent })).toEqual({
    chargeApplied: false,
    damage: {
      counter: 10,
      greenReduction: 10,
      guardReduction: 10,
      outgoing: 10,
      rawRed: 30,
    },
    diceResult: 1,
    effects: [
      { amount: 10, source: 'currentActor', target: 'currentActor', type: 'blueGuard' },
      { amount: 10, guardReduction: 10, source: 'currentActor', target: 'opponent', type: 'redDamage' },
      { amount: 10, source: 'opponent', target: 'opponent', type: 'greenReduction' },
      { amount: 0, guardReduction: 10, source: 'opponent', target: 'currentActor', type: 'orangeCounter' },
    ],
    freezeApplied: false,
    isMiss: false,
    nextCurrentActor: { currentHealth: 100, guard: 0 },
    nextOpponent: { currentHealth: 110, guard: 0 },
    purpleBuffGranted: 0,
    tokenCounts: {
      actorBlue: 2,
      actorLightBlue: 0,
      actorPurple: 0,
      actorRed: 3,
      actorYellow: 0,
      opponentGreen: 2,
      opponentOrange: 2,
    },
  });
});

test('applies doubled outlined token values through the common animation effects', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('red-yellow-outline', 1),
        createToken('blue-yellow-outline', 1),
      ])
    ),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('green-yellow-outline', 1),
        createToken('orange-yellow-outline', 1),
      ])
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.damage).toEqual({
    counter: 10,
    greenReduction: 10,
    guardReduction: 0,
    outgoing: 10,
    rawRed: 20,
  });
  expect(result.nextCurrentActor).toEqual({ currentHealth: 100, guard: 0 });
  expect(result.nextOpponent).toEqual({ currentHealth: 90, guard: 0 });
  expect(result.effects).toEqual([
    { amount: 10, source: 'currentActor', target: 'currentActor', type: 'blueGuard' },
    { amount: 10, source: 'currentActor', target: 'opponent', type: 'redDamage' },
    { amount: 10, source: 'opponent', target: 'opponent', type: 'greenReduction' },
    { amount: 0, guardReduction: 10, source: 'opponent', target: 'currentActor', type: 'orangeCounter' },
  ]);
  expect(result.isMiss).toBe(false);
});

test('uses the same rolled slot for both actors and ignores non-active token colours', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('red', 1),
        createToken('blue', 1),
        createToken('orange', 1),
        createToken('green', 1),
        createToken('purple', 1),
      ]),
      1
    ),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('orange', 1),
        createToken('green', 1),
        createToken('red', 1),
        createToken('blue', 1),
      ]),
      1
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 2, opponent });

  expect(result.tokenCounts).toEqual({
    actorBlue: 1,
    actorLightBlue: 0,
    actorPurple: 1,
    actorRed: 1,
    actorYellow: 0,
    opponentGreen: 1,
    opponentOrange: 1,
  });
  expect(result.damage).toEqual({
    counter: 5,
    greenReduction: 5,
    guardReduction: 0,
    outgoing: 5,
    rawRed: 10,
  });
  expect(result.nextCurrentActor).toEqual({ currentHealth: 100, guard: 0 });
  expect(result.nextOpponent).toEqual({ currentHealth: 95, guard: 0 });
});

test.each([2, 3])(
  'uses the retained merged spell column when physical column %i is rolled',
  (diceResult) => {
    const currentActor = createActor({
      spellSlots: createSpellSlots(
        createSlot([createToken('red', 1), createToken('red', 2)]),
        1
      ),
    });
    currentActor.mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];

    const result = calculateBattleTurn({
      currentActor,
      diceResult,
      opponent: createActor({ currentHealth: 100 }),
    });

    expect(result.damage.outgoing).toBe(20);
    expect(result.nextOpponent.currentHealth).toBe(80);
  }
);

test.each([
  [1, 5],
  [2, 10],
  [3, 15],
])('%i Blue tokens grant %i guard', (blueTokenCount, expectedGuard) => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot(
        Array.from({ length: blueTokenCount }, (_, index) => createToken('blue', index + 1))
      )
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent: createActor() });

  expect(result.nextCurrentActor.guard).toBe(expectedGuard);
  expect(result.effects).toContainEqual({
    amount: expectedGuard,
    source: 'currentActor',
    target: 'currentActor',
    type: 'blueGuard',
  });
});

test('does not trigger an Orange counter when the actor only grants guard', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('blue', 1)])),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('orange', 1)])),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.damage.counter).toBe(0);
  expect(result.nextCurrentActor).toEqual({ currentHealth: 100, guard: 5 });
  expect(result.effects).toEqual([
    { amount: 5, source: 'currentActor', target: 'currentActor', type: 'blueGuard' },
  ]);
});

test('triggers an Orange counter when an available Freeze targets the opponent', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('light-blue', 1)])),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('orange', 1)])),
  });

  const result = calculateBattleTurn({
    currentActor,
    diceResult: 1,
    freezeAvailable: true,
    opponent,
  });

  expect(result.freezeApplied).toBe(true);
  expect(result.damage.counter).toBe(5);
  expect(result.nextCurrentActor).toEqual({ currentHealth: 95, guard: 0 });
  expect(result.effects).toEqual([
    { amount: 5, guardReduction: 0, source: 'opponent', target: 'currentActor', type: 'orangeCounter' },
  ]);
});

test.each([
  ['purple', { purpleBuffGranted: 5 }],
  ['yellow', { chargeApplied: true }],
])(
  'does not trigger an Orange counter for a self-only %s effect',
  (tokenType, expectedEffect) => {
    const currentActor = createActor({
      spellSlots: createSpellSlots(createSlot([createToken(tokenType, 1)])),
    });
    const opponent = createActor({
      spellSlots: createSpellSlots(createSlot([createToken('orange', 1)])),
    });

    const result = calculateBattleTurn({
      chargeAvailable: tokenType === 'yellow',
      currentActor,
      diceResult: 1,
      opponent,
    });

    expect(result).toMatchObject({
      damage: { counter: 0 },
      effects: [],
      ...expectedEffect,
    });
  }
);

test('applies same-roll guard before counter damage reaches health', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('red', 1), createToken('blue', 1)])
    ),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('orange', 1), createToken('orange', 2)])
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.damage.counter).toBe(10);
  expect(result.nextCurrentActor).toEqual({ currentHealth: 95, guard: 0 });
  expect(result.effects).toEqual([
    { amount: 5, source: 'currentActor', target: 'currentActor', type: 'blueGuard' },
    { amount: 10, source: 'currentActor', target: 'opponent', type: 'redDamage' },
    { amount: 5, guardReduction: 5, source: 'opponent', target: 'currentActor', type: 'orangeCounter' },
  ]);
});

test('uses existing guard before applying an outlined Orange counter to health', () => {
  const currentActor = createActor({
    guard: 4,
    spellSlots: createSpellSlots(createSlot([createToken('red', 1)])),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('orange-yellow-outline', 1)])
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.damage.counter).toBe(10);
  expect(result.nextCurrentActor).toEqual({ currentHealth: 94, guard: 0 });
  expect(result.effects).toContainEqual({
    amount: 6,
    guardReduction: 4,
    source: 'opponent',
    target: 'currentActor',
    type: 'orangeCounter',
  });
});

test.each([2, 3])(
  'triggers counters when merged actor column %i targets the opponent',
  (diceResult) => {
    const currentActor = createActor({
      spellSlots: createSpellSlots(
        createSlot([createToken('red', 1)]),
        1
      ),
    });
    currentActor.mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];
    const opponent = createActor({
      spellSlots: createSpellSlots(
        createSlot([createToken('orange', 1)]),
        diceResult - 1
      ),
    });

    const result = calculateBattleTurn({ currentActor, diceResult, opponent });

    expect(result.damage.counter).toBe(5);
    expect(result.nextCurrentActor.currentHealth).toBe(95);
  }
);

test.each([2, 3])(
  'finds counters in joined opponent column %i',
  (diceResult) => {
    const currentActor = createActor({
      spellSlots: createSpellSlots(
        createSlot([createToken('red', 1)]),
        diceResult - 1
      ),
    });
    const opponent = createActor({
      spellSlots: createSpellSlots(
        createSlot([createToken('orange', 1)]),
        1
      ),
    });
    opponent.mergedColumns = [
      { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
    ];

    const result = calculateBattleTurn({ currentActor, diceResult, opponent });

    expect(result.damage.counter).toBe(5);
    expect(result.nextCurrentActor.currentHealth).toBe(95);
  }
);

test('keeps opponent guard in the resolved state until turn-end cleanup', () => {
  const emptyResult = calculateBattleTurn({
    currentActor: createActor(),
    diceResult: 1,
    opponent: createActor({ guard: 30 }),
  });

  expect(emptyResult).toMatchObject({
    effects: [],
    isMiss: true,
    nextCurrentActor: { currentHealth: 100, guard: 0 },
    nextOpponent: { currentHealth: 100, guard: 30 },
  });
});

test('queues normal attack guard absorption for the damage impact', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('red', 1)])),
  });
  const opponent = createActor({ guard: 7 });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.effects).toEqual([
    {
      amount: 3,
      guardReduction: 7,
      source: 'currentActor',
      target: 'opponent',
      type: 'redDamage',
    },
  ]);
  expect(result.nextOpponent).toEqual({ currentHealth: 97, guard: 0 });
});

test.each([
  ['crowned-lichlord', 1, 20],
  ['crowned-lichlord', 2, 20],
  ['hellcrown-reaper', 2, 30],
  ['hellcrown-reaper', 3, 30],
  ['hellcrown-reaper', 5, 30],
  ['hellcrown-reaper', 6, 30],
])(
  '%s resolves joined enemy roll %i from its retained column exactly once',
  (enemyId, diceResult, expectedDamage) => {
    const result = calculateBattleTurn({
      currentActor: getEnemyById(enemyId),
      diceResult,
      opponent: createActor({ currentHealth: 120 }),
    });

    expect(result.damage.rawRed).toBe(expectedDamage);
    expect(result.damage.outgoing).toBe(expectedDamage);
    expect(result.nextOpponent.currentHealth).toBe(120 - expectedDamage);
    expect(result.effects.filter(({ type }) => type === 'redDamage')).toHaveLength(1);
  }
);

test('applies Purple and charged bonuses once when a joined enemy column is rolled', () => {
  const result = calculateBattleTurn({
    currentActor: getEnemyById('hellcrown-reaper'),
    diceResult: 3,
    opponent: createActor({ currentHealth: 120 }),
    purpleBuff: 5,
    yellowCharged: true,
  });

  expect(result.damage).toMatchObject({
    outgoing: 45,
    rawRed: 45,
  });
  expect(result.effects.filter(({ type }) => type === 'redDamage')).toEqual([
    expect.objectContaining({ amount: 45 }),
  ]);
});

test('treats effective joined enemy columns as single neighbours for Purple buffs', () => {
  const crownedLichlord = getEnemyById('crowned-lichlord');

  expect(createAdjacentPurpleBuffs(3, 20, crownedLichlord)).toEqual([
    20,
    0,
    0,
    20,
    0,
    0,
  ]);
});

test.each(['light-green', 'light-green-yellow-outline', 'black', 'white', 'grey'])(
  'treats %s as a no-effect battle miss',
  (tokenType) => {
    const currentActor = createActor({
      spellSlots: createSpellSlots(createSlot([createToken(tokenType, 1)])),
    });

    const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent: createActor() });

    expect(result).toMatchObject({
      damage: {
        counter: 0,
        greenReduction: 0,
        guardReduction: 0,
        outgoing: 0,
        rawRed: 0,
      },
      effects: [],
      isMiss: true,
      nextCurrentActor: { currentHealth: 100, guard: 0 },
      nextOpponent: { currentHealth: 100, guard: 0 },
    });
  }
);

test.each([
  [[1, 2], [0, 0, 5, 0, 0, 0]],
  [[2, 3], [5, 0, 0, 5, 0, 0]],
  [[3, 4], [0, 5, 0, 0, 5, 0]],
  [[4, 5], [0, 0, 5, 0, 0, 5]],
  [[5, 6], [0, 0, 0, 5, 0, 0]],
])(
  'creates Purple buffs from either number in merged effective column %j',
  (columns, expectedBuffs) => {
    const currentActor = createActor();
    currentActor.mergedColumns = [
      { activeColumn: columns[0], columns, removedColumn: columns[1] },
    ];

    expect(createAdjacentPurpleBuffs(columns[0], 5, currentActor)).toEqual(expectedBuffs);
    expect(createAdjacentPurpleBuffs(columns[1], 5, currentActor)).toEqual(expectedBuffs);
  }
);

test('targets a neighbouring merged effective column once at its active slot', () => {
  const currentActor = createActor();
  currentActor.mergedColumns = [
    { activeColumn: 2, columns: [2, 3], removedColumn: 3 },
  ];

  expect(createAdjacentPurpleBuffs(4, 5, currentActor)).toEqual([0, 5, 0, 0, 5, 0]);
});

test('applies Light Blue freeze only when the rolled column has a remaining use', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('light-blue', 1), createToken('light-blue', 2)])
    ),
  });

  const availableResult = calculateBattleTurn({
    currentActor,
    diceResult: 1,
    freezeAvailable: true,
    opponent: createActor(),
  });
  const exhaustedResult = calculateBattleTurn({
    currentActor,
    diceResult: 1,
    freezeAvailable: false,
    opponent: createActor(),
  });

  expect(availableResult).toMatchObject({
    effects: [],
    freezeApplied: true,
    isMiss: false,
    tokenCounts: { actorLightBlue: 2 },
  });
  expect(exhaustedResult).toMatchObject({
    effects: [],
    freezeApplied: false,
    isMiss: true,
    tokenCounts: { actorLightBlue: 2 },
  });
});

test.each([
  [1, 5, [0, 5, 0, 0, 0, 0]],
  [2, 10, [10, 0, 10, 0, 0, 0]],
  [6, 15, [0, 0, 0, 0, 15, 0]],
])(
  'creates a %i-column Purple buff only for adjacent columns',
  (diceResult, amount, expectedBuffs) => {
    expect(createAdjacentPurpleBuffs(diceResult, amount)).toEqual(expectedBuffs);
  }
);

test('stacks Purple into a pending next-turn buff without applying it immediately', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('purple', 1),
        createToken('purple', 2),
        createToken('red', 1),
        createToken('blue', 1),
      ])
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent: createActor() });

  expect(result).toMatchObject({
    damage: { rawRed: 10 },
    isMiss: false,
    nextCurrentActor: { guard: 5 },
    purpleBuffGranted: 10,
    tokenCounts: { actorPurple: 2 },
  });
});

test('treats Purple alone as a pending effect without creating an animation', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('purple', 1)])),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent: createActor() });

  expect(result).toMatchObject({
    effects: [],
    isMiss: false,
    purpleBuffGranted: 5,
  });
});

test('applies an active Purple buff only to Red attack and Blue guard', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('red', 1),
        createToken('blue', 1),
        createToken('light-blue', 1),
        createToken('purple', 1),
      ])
    ),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('green', 1), createToken('orange', 1)])
    ),
  });

  const result = calculateBattleTurn({
    currentActor,
    diceResult: 1,
    freezeAvailable: true,
    opponent,
    purpleBuff: 5,
  });

  expect(result.damage).toEqual({
    counter: 5,
    greenReduction: 5,
    guardReduction: 0,
    outgoing: 10,
    rawRed: 15,
  });
  expect(result.nextCurrentActor).toEqual({ currentHealth: 100, guard: 5 });
  expect(result.freezeApplied).toBe(true);
  expect(result.purpleBuffGranted).toBe(5);
});

test('applies one pending Yellow charge when the rolled column has remaining uses', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('yellow', 1),
        createToken('yellow', 2),
        createToken('yellow', 3),
        createToken('red', 1),
        createToken('blue', 1),
      ])
    ),
  });

  const result = calculateBattleTurn({
    chargeAvailable: true,
    currentActor,
    diceResult: 1,
    opponent: createActor(),
  });

  expect(result).toMatchObject({
    chargeApplied: true,
    damage: { rawRed: 10 },
    isMiss: false,
    nextCurrentActor: { guard: 5 },
    tokenCounts: { actorYellow: 3 },
  });
});

test('treats Yellow alone as a miss when its rolled-column uses are exhausted', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('yellow', 1)])),
  });

  const result = calculateBattleTurn({
    chargeAvailable: false,
    currentActor,
    diceResult: 1,
    opponent: createActor(),
  });

  expect(result).toMatchObject({
    chargeApplied: false,
    effects: [],
    isMiss: true,
  });
});

test('treats available Yellow alone as a pending effect without an animation', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(createSlot([createToken('yellow', 1)])),
  });

  const result = calculateBattleTurn({
    chargeAvailable: true,
    currentActor,
    diceResult: 1,
    opponent: createActor(),
  });

  expect(result).toMatchObject({
    chargeApplied: true,
    effects: [],
    isMiss: false,
  });
});

test('combines active Yellow and Purple buffs only for Red attack and Blue guard', () => {
  const currentActor = createActor({
    spellSlots: createSpellSlots(
      createSlot([
        createToken('red', 1),
        createToken('blue', 1),
        createToken('light-blue', 1),
        createToken('purple', 1),
      ])
    ),
  });
  const opponent = createActor({
    spellSlots: createSpellSlots(
      createSlot([createToken('green', 1), createToken('orange', 1)])
    ),
  });

  const result = calculateBattleTurn({
    currentActor,
    diceResult: 1,
    freezeAvailable: true,
    opponent,
    purpleBuff: 5,
    yellowCharged: true,
  });

  expect(result.damage).toEqual({
    counter: 5,
    greenReduction: 5,
    guardReduction: 0,
    outgoing: 20,
    rawRed: 25,
  });
  expect(result.nextCurrentActor).toEqual({ currentHealth: 100, guard: 15 });
  expect(result.freezeApplied).toBe(true);
  expect(result.purpleBuffGranted).toBe(5);
});

test('clamps health and reductions while keeping Orange counter damage separate from guard', () => {
  const currentActor = createActor({
    currentHealth: 3,
    spellSlots: createSpellSlots(createSlot([createToken('red', 1)])),
  });
  const opponent = createActor({
    currentHealth: 4,
    guard: 50,
    spellSlots: createSpellSlots(
      createSlot([
        createToken('green', 1),
        createToken('green', 2),
        createToken('green', 3),
        createToken('orange', 1),
      ])
    ),
  });

  const result = calculateBattleTurn({ currentActor, diceResult: 1, opponent });

  expect(result.damage).toEqual({
    counter: 5,
    greenReduction: 10,
    guardReduction: 0,
    outgoing: 0,
    rawRed: 10,
  });
  expect(result.nextCurrentActor.currentHealth).toBe(0);
  expect(result.nextOpponent).toEqual({ currentHealth: 4, guard: 50 });
});
