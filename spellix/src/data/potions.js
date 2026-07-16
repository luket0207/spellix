export const POTION_DEFINITIONS = [
  {
    availability: 'Both',
    colour: 'blue',
    description: 'Choose the next roll of the dice',
    id: 'roll-choice',
    japaneseDescription: '次に振るサイコロの出目を選ぶ。',
    japaneseName: '出目選択',
    name: 'Roll Choice',
    rarity: 'Rare',
  },
  {
    availability: 'Both',
    colour: 'green',
    description: 'Recover 30% HP',
    id: 'small-heal',
    japaneseDescription: 'HPを30％回復する。',
    japaneseName: '小回復',
    name: 'Small Heal',
    rarity: 'Common',
  },
  {
    availability: 'Both',
    colour: 'green',
    description: 'Recover 60% HP',
    id: 'heal',
    japaneseDescription: 'HPを60％回復する。',
    japaneseName: '回復',
    name: 'Heal',
    rarity: 'Rare',
  },
  {
    availability: 'Battle',
    colour: 'green',
    description: 'Recover 50% HP',
    id: 'first-aid',
    japaneseDescription: 'HPを50％回復する。',
    japaneseName: '応急処置',
    name: 'First Aid',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'yellow',
    description: 'Teleport to *feature*, then roll the dice starting from there.',
    id: 'teleport-to-feature',
    japaneseDescription:
      '*feature*へテレポートし、そこを起点としてサイコロを振る。',
    japaneseName: '*へテレポート',
    name: 'Teleport to *',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'orange',
    description: 'Duplicate any common token in the token pouch',
    id: 'copy-and-paste',
    japaneseDescription:
      'トークンポーチにある好きなコモントークンを1個複製する。',
    japaneseName: 'コピー＆ペースト',
    name: 'Copy and Paste',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'red',
    description:
      'Discard two tokens of your choice from your token pouch and roll the dice for your turn. If the roll is even, gain a new token.',
    id: 'gambeller',
    japaneseDescription:
      'トークンポーチから好きなトークンを2個捨て、このターンのサイコロを振る。出目が偶数なら、新しいトークンを1個獲得する。',
    japaneseName: 'ギャンブラー',
    name: 'Gambeller',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'yellow',
    description:
      'If you encounter a battle this turn, all your slots are charged by 10 on your first turn in battle',
    id: 'starting-charge',
    japaneseDescription:
      'このターンにバトルが発生した場合、バトルでの最初のターンに、すべてのスロットが10チャージされる。',
    japaneseName: '初期チャージ',
    name: 'Starting Charge',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'grey',
    description: 'Remove a token from a slot and put it into your token pouch',
    id: 'tokensmith',
    japaneseDescription:
      'スロットからトークンを1個取り外し、トークンポーチに入れる。',
    japaneseName: 'トークン職人',
    name: 'Tokensmith',
    rarity: 'Common',
  },
  {
    availability: 'Battle',
    colour: 'light-blue',
    description: 'Freeze your opponent',
    id: 'ice-beam',
    japaneseDescription: '対戦相手を凍結させる。',
    japaneseName: 'アイスビーム',
    name: 'Ice Beam',
    rarity: 'Common',
  },
  {
    availability: 'Battle',
    colour: 'yellow',
    description: 'Charge your attacks by 5 next turn',
    id: 'charger',
    japaneseDescription: '次のターン、攻撃を5チャージする。',
    japaneseName: 'チャージャー',
    name: 'Charger',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'blue',
    description:
      'The nearest player to you (chosen randomly if there are two or more players of equal distance) will have their dice roll halved (rounded up) next turn. I.E if they roll a 5, they will only be able to move 3 places next turn.',
    id: 'heavy-weight',
    japaneseDescription:
      '自分に最も近いプレイヤーは、次のターンのサイコロの出目が半分になる（端数は切り上げ）。同じ距離に複数のプレイヤーがいる場合は、対象をランダムに決める。例：5が出た場合、移動できるのは3マスとなる。',
    japaneseName: 'ヘビーウェイト',
    name: 'Heavy Weight',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'purple',
    description:
      'Choose any other player and roll the dice for your turn. If even they lose all tokens from their token pouch, if odd you lose all your tokens from your token pouch',
    id: 'troublemaker',
    japaneseDescription:
      '他のプレイヤーを1人選び、このターンのサイコロを振る。出目が偶数なら、そのプレイヤーはトークンポーチ内のすべてのトークンを失う。奇数なら、自分がトークンポーチ内のすべてのトークンを失う。',
    japaneseName: 'トラブルメーカー',
    name: 'Troublemaker',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'green',
    description: 'Roll the dice for your turn. If even you heal to full HP. If odd everyone else does.',
    id: 'devine-chance',
    japaneseDescription:
      'このターンのサイコロを振る。出目が偶数なら、自分のHPが全回復する。奇数なら、自分以外のすべてのプレイヤーのHPが全回復する。',
    japaneseName: '神の好機',
    name: 'Devine Chance',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'orange',
    description:
      'Discard four tokens from your token pouch. Get a choice of 2 random token and pick one to gain.',
    id: 'buy-and-sell',
    japaneseDescription:
      'トークンポーチからトークンを4個捨てる。ランダムに選ばれた2個のトークンから1個を選んで獲得する。',
    japaneseName: '売買',
    name: 'Buy and Sell',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'red',
    description: 'See 3 different potions, they are mixed up, you must blind pick and gain 1.',
    id: 'cauldron',
    japaneseDescription:
      '異なる3つのポーションを確認する。その後ポーションがシャッフルされ、見ずに1つ選んで獲得する。',
    japaneseName: '大釜',
    name: 'Cauldron',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'red',
    description:
      'Roll the dice for your turn. If even all others players cannot move on their next turn (they must repeat the square they are currently on), if odd you may not move this turn and your turn is over.',
    id: 'storm-master',
    japaneseDescription:
      'このターンのサイコロを振る。出目が偶数なら、自分以外のすべてのプレイヤーは次のターンに移動できず、現在いるマスにとどまる。奇数なら、自分はこのターン移動できず、そのままターンを終了する。',
    japaneseName: '嵐の支配者',
    name: 'Storm Master',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'blue',
    description: 'Roll 2 dice this turn.',
    id: 'double-dice',
    japaneseDescription: 'このターンはサイコロを2個振る。',
    japaneseName: 'ダブルダイス',
    name: 'Double Dice',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'light-blue',
    description: 'Auto win a River Mini Game',
    id: 'bridge-builder',
    japaneseDescription: '川のミニゲームに自動的に勝利する。',
    japaneseName: '橋職人',
    name: 'Bridge Builder',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'orange',
    description: 'Remove any forfeits from a decision',
    id: 'good-decisions',
    japaneseDescription:
      '選択によって受けるペナルティをすべて無効にする。',
    japaneseName: '賢明な選択',
    name: 'Good Decisions',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'grey',
    description: 'Escape a cave encounter with no damage but lose any prizes you had.',
    id: 'cave-runner',
    japaneseDescription:
      'ダメージを受けずに洞窟での遭遇から脱出する。ただし、それまでに獲得した報酬はすべて失う。',
    japaneseName: '洞窟ランナー',
    name: 'Cave Runner',
    rarity: 'Common',
  },
];

function getNonEmptyText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function getPotionName(potion, language) {
  const englishName = getNonEmptyText(potion?.name);

  return language === 'jp'
    ? getNonEmptyText(potion?.japaneseName, englishName)
    : englishName;
}

export function getPotionDescription(potion, language) {
  const englishDescription = getNonEmptyText(potion?.description);

  return language === 'jp'
    ? getNonEmptyText(potion?.japaneseDescription, englishDescription)
    : englishDescription;
}
