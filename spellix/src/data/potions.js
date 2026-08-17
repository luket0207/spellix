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
    colour: 'orange',
    description: 'Duplicate any token in your token pouch',
    id: 'copy-and-paste',
    japaneseDescription: 'トークンポーチにある好きなトークンを1個複製する。',
    japaneseName: 'コピー＆ペースト',
    name: 'Copy and Paste',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'yellow',
    description: 'Find loot wherever you land this turn.',
    id: 'metal-detector',
    japaneseDescription: 'このターンは、どのマスに止まっても戦利品を発見する。',
    japaneseName: '金属探知機',
    name: 'Metal Detector',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'orange',
    description:
      'If you encounter a battle this turn, all your slots are charged on your first turn in battle',
    id: 'starting-charge',
    japaneseDescription:
      'このターンにバトルが発生した場合、バトルの最初のターンにすべてのスロットがチャージされる。',
    japaneseName: '初期チャージ',
    name: 'Starting Charge',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'grey',
    description: 'Remove a token from a slot and put it into your token pouch',
    id: 'tokensmith',
    japaneseDescription: 'スロットからトークンを1個取り外し、トークンポーチに入れる。',
    japaneseName: 'トークン職人',
    name: 'Tokensmith',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'yellow',
    description: 'Get one chance to rearrange your tokens.',
    id: 'redo',
    japaneseDescription: 'トークンを一度だけ並べ替えることができる。',
    japaneseName: 'やり直し',
    name: 'Redo',
    rarity: 'Rare',
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
    description: 'Charge your attacks next turn',
    id: 'charger',
    japaneseDescription: '次のターンの攻撃をチャージする。',
    japaneseName: 'チャージャー',
    name: 'Charger',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'green',
    description:
      'Choose another player, they may not use potions in their next turn.',
    id: 'spellbound',
    japaneseDescription:
      '他のプレイヤーを1人選んでください。そのプレイヤーは次のターンにポーションを使用できません。',
    japaneseName: '呪縛',
    name: 'Spellbound',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'blue',
    description:
      'Choose another player, they may not use potions in their next turn, and their dice roll will be halved (rounded up).',
    id: 'heavy-weight',
    japaneseDescription:
      '他のプレイヤーを1人選んでください。そのプレイヤーは次のターンにポーションを使用できず、サイコロの出目が半分になります（端数切り上げ）。',
    japaneseName: 'ヘビーウェイト',
    name: 'Heavy Weight',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'purple',
    description:
      'Choose any other player and roll the dice for your turn. If even they lose 1 token, if odd you lose a token.',
    id: 'troublemaker',
    japaneseDescription:
      '他のプレイヤーを1人選び、このターンのサイコロを振る。出目が偶数ならそのプレイヤーはトークンを1個失い、奇数なら自分がトークンを1個失う。',
    japaneseName: 'トラブルメーカー',
    name: 'Troublemaker',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'green',
    description:
      'Roll the dice for your turn. If even you heal to full HP. If odd everyone else does.',
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
      'Discard 3 tokens from your token pouch. Get a choice of 2 random tokens and pick one to gain.',
    id: 'buy-and-sell',
    japaneseDescription:
      'トークンポーチからトークンを3個捨てる。ランダムに選ばれた2個のトークンから1個を選んで獲得する。',
    japaneseName: '売買',
    name: 'Buy and Sell',
    rarity: 'Rare',
  },
  {
    availability: 'Board',
    colour: 'red',
    description: 'Pick one of 3 potions to gain.',
    id: 'cauldron',
    japaneseDescription: '3つのポーションから1つを選んで獲得する。',
    japaneseName: '大釜',
    name: 'Cauldron',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'red',
    description:
      'Roll the dice for your turn. If even all others players cannot move on their next turn (they must repeat the square they are currently on) and they cannot use board potions, if odd you may not move this turn and your turn is over.',
    id: 'storm-master',
    japaneseDescription:
      'このターンのサイコロを振る。出目が偶数なら、自分以外のすべてのプレイヤーは次のターンに移動できず、現在いるマスにとどまらなければならない。また、ボード用ポーションも使用できない。出目が奇数なら、自分はこのターン移動できず、そのままターンを終了する。',
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
    colour: 'red',
    description: 'Roll 3 dice this turn.',
    id: 'triple-dice',
    japaneseDescription: 'このターンはサイコロを3個振る。',
    japaneseName: 'トリプルダイス',
    name: 'Triple Dice',
    rarity: 'Rare',
  },
  {
    availability: 'Mini',
    colour: 'light-blue',
    description: 'Auto win a River Mini Game',
    id: 'bridge-builder',
    japaneseDescription: '川のミニゲームに自動的に勝利する。',
    japaneseName: '橋職人',
    name: 'Bridge Builder',
    rarity: 'Common',
  },
  {
    availability: 'Mini',
    colour: 'orange',
    description: 'Remove any forfeits from a decision',
    id: 'good-decisions',
    japaneseDescription: '選択によって受けるペナルティをすべて無効にする。',
    japaneseName: '賢明な選択',
    name: 'Good Decisions',
    rarity: 'Common',
  },
  {
    availability: 'Mini',
    colour: 'grey',
    description: 'Escape a cave encounter with no damage but lose any prizes you had.',
    id: 'cave-runner',
    japaneseDescription:
      'ダメージを受けずに洞窟での遭遇から脱出する。ただし、それまでに獲得した報酬はすべて失う。',
    japaneseName: '洞窟ランナー',
    name: 'Cave Runner',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'grey',
    description: 'You will not encounter a battle this turn.',
    id: 'smokescreen',
    japaneseDescription: 'このターンはバトルが発生しない。',
    japaneseName: '煙幕',
    name: 'Smokescreen',
    rarity: 'Common',
  },
  {
    availability: 'Battle',
    colour: 'red',
    description: 'Deal 10 damage to your opponent',
    id: 'cosmic-intervention',
    japaneseDescription: '対戦相手に10ダメージを与える。',
    japaneseName: '宇宙の介入',
    name: 'Cosmic Intervention',
    rarity: 'Common',
  },
  {
    availability: 'Battle',
    colour: 'blue',
    description: 'Remove all guard from your opponent this turn',
    id: 'shields-down',
    japaneseDescription: 'このターン、対戦相手のガードをすべて取り除く。',
    japaneseName: 'シールドダウン',
    name: 'Shields Down',
    rarity: 'Common',
  },
  {
    availability: 'Battle',
    colour: 'orange',
    description: 'Auto unfreeze yourself',
    id: 'thaw',
    japaneseDescription: '自分の凍結状態を自動的に解除する。',
    japaneseName: '解凍',
    name: 'Thaw',
    rarity: 'Common',
  },
  {
    availability: 'Board',
    colour: 'light-blue',
    description: 'Teleport to the nearest village',
    id: 'sos',
    japaneseDescription: '最寄りの村にテレポートする。',
    japaneseName: 'SOS',
    name: 'SOS',
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
