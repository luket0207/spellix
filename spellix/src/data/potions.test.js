import {
  getPotionDescription,
  getPotionName,
  POTION_DEFINITIONS,
} from './potions';

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

const EXPECTED_JAPANESE_POTIONS = {
  'roll-choice': ['出目選択', '次に振るサイコロの出目を選ぶ。'],
  'small-heal': ['小回復', 'HPを30％回復する。'],
  heal: ['回復', 'HPを60％回復する。'],
  'first-aid': ['応急処置', 'HPを50％回復する。'],
  'teleport-to-feature': [
    '*へテレポート',
    '*feature*へテレポートし、そこを起点としてサイコロを振る。',
  ],
  'copy-and-paste': [
    'コピー＆ペースト',
    'トークンポーチにある好きなコモントークンを1個複製する。',
  ],
  gambeller: [
    'ギャンブラー',
    'トークンポーチから好きなトークンを2個捨て、このターンのサイコロを振る。出目が偶数なら、新しいトークンを1個獲得する。',
  ],
  'starting-charge': [
    '初期チャージ',
    'このターンにバトルが発生した場合、バトルでの最初のターンに、すべてのスロットが10チャージされる。',
  ],
  tokensmith: [
    'トークン職人',
    'スロットからトークンを1個取り外し、トークンポーチに入れる。',
  ],
  'ice-beam': ['アイスビーム', '対戦相手を凍結させる。'],
  charger: ['チャージャー', '次のターン、攻撃を5チャージする。'],
  'heavy-weight': [
    'ヘビーウェイト',
    '自分に最も近いプレイヤーは、次のターンのサイコロの出目が半分になる（端数は切り上げ）。同じ距離に複数のプレイヤーがいる場合は、対象をランダムに決める。例：5が出た場合、移動できるのは3マスとなる。',
  ],
  troublemaker: [
    'トラブルメーカー',
    '他のプレイヤーを1人選び、このターンのサイコロを振る。出目が偶数なら、そのプレイヤーはトークンポーチ内のすべてのトークンを失う。奇数なら、自分がトークンポーチ内のすべてのトークンを失う。',
  ],
  'devine-chance': [
    '神の好機',
    'このターンのサイコロを振る。出目が偶数なら、自分のHPが全回復する。奇数なら、自分以外のすべてのプレイヤーのHPが全回復する。',
  ],
  'buy-and-sell': [
    '売買',
    'トークンポーチからトークンを4個捨てる。ランダムに選ばれた2個のトークンから1個を選んで獲得する。',
  ],
  cauldron: [
    '大釜',
    '異なる3つのポーションを確認する。その後ポーションがシャッフルされ、見ずに1つ選んで獲得する。',
  ],
  'storm-master': [
    '嵐の支配者',
    'このターンのサイコロを振る。出目が偶数なら、自分以外のすべてのプレイヤーは次のターンに移動できず、現在いるマスにとどまる。奇数なら、自分はこのターン移動できず、そのままターンを終了する。',
  ],
  'double-dice': ['ダブルダイス', 'このターンはサイコロを2個振る。'],
  'bridge-builder': ['橋職人', '川のミニゲームに自動的に勝利する。'],
  'good-decisions': [
    '賢明な選択',
    '選択によって受けるペナルティをすべて無効にする。',
  ],
  'cave-runner': [
    '洞窟ランナー',
    'ダメージを受けずに洞窟での遭遇から脱出する。ただし、それまでに獲得した報酬はすべて失う。',
  ],
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
        japaneseDescription: expect.any(String),
        japaneseName: expect.any(String),
        name: expect.any(String),
        rarity: expect.stringMatching(/^(Common|Rare)$/),
      });
      expect(potion.description).not.toHaveLength(0);
      expect(potion.japaneseDescription).not.toHaveLength(0);
      expect(potion.japaneseName).not.toHaveLength(0);
    });
  });

  test('contains the exact Japanese name and description for every potion', () => {
    expect(
      Object.fromEntries(
        POTION_DEFINITIONS.map(({ id, japaneseDescription, japaneseName }) => [
          id,
          [japaneseName, japaneseDescription],
        ])
      )
    ).toEqual(EXPECTED_JAPANESE_POTIONS);
  });

  test('selects text by language and safely falls back to English', () => {
    const potion = POTION_DEFINITIONS[0];

    expect(getPotionName(potion, 'jp')).toBe('出目選択');
    expect(getPotionDescription(potion, 'jp')).toBe(
      '次に振るサイコロの出目を選ぶ。'
    );
    expect(getPotionName(potion, 'en')).toBe('Roll Choice');
    expect(getPotionName(potion)).toBe('Roll Choice');
    expect(getPotionDescription(potion, 'invalid')).toBe(potion.description);
    expect(getPotionName({ name: 'Fallback', japaneseName: '' }, 'jp')).toBe(
      'Fallback'
    );
    expect(
      getPotionDescription(
        { description: 'Fallback description', japaneseDescription: '' },
        'jp'
      )
    ).toBe('Fallback description');
  });

  test('preserves exact requirement values for representative potions', () => {
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Roll Choice')).toEqual({
      availability: 'Both',
      colour: 'blue',
      description: 'Choose the next roll of the dice',
      id: 'roll-choice',
      japaneseDescription: '次に振るサイコロの出目を選ぶ。',
      japaneseName: '出目選択',
      name: 'Roll Choice',
      rarity: 'Rare',
    });
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Teleport to *')).toEqual({
      availability: 'Board',
      colour: 'yellow',
      description: 'Teleport to *feature*, then roll the dice starting from there.',
      id: 'teleport-to-feature',
      japaneseDescription:
        '*feature*へテレポートし、そこを起点としてサイコロを振る。',
      japaneseName: '*へテレポート',
      name: 'Teleport to *',
      rarity: 'Common',
    });
    expect(POTION_DEFINITIONS.find(({ name }) => name === 'Cave Runner')).toEqual({
      availability: 'Board',
      colour: 'grey',
      description: 'Escape a cave encounter with no damage but lose any prizes you had.',
      id: 'cave-runner',
      japaneseDescription:
        'ダメージを受けずに洞窟での遭遇から脱出する。ただし、それまでに獲得した報酬はすべて失う。',
      japaneseName: '洞窟ランナー',
      name: 'Cave Runner',
      rarity: 'Common',
    });
  });
});
