import {
  getPotionDescription,
  getPotionName,
  POTION_DEFINITIONS,
} from './potions';

const EXPECTED_POTIONS = [
  ['roll-choice', 'Roll Choice', '出目選択', 'Both', 'Rare', 'Choose the next roll of the dice', '次に振るサイコロの出目を選ぶ。', 'blue'],
  ['small-heal', 'Small Heal', '小回復', 'Both', 'Common', 'Recover 30% HP', 'HPを30％回復する。', 'green'],
  ['heal', 'Heal', '回復', 'Both', 'Rare', 'Recover 60% HP', 'HPを60％回復する。', 'green'],
  ['first-aid', 'First Aid', '応急処置', 'Battle', 'Common', 'Recover 50% HP', 'HPを50％回復する。', 'green'],
  ['copy-and-paste', 'Copy and Paste', 'コピー＆ペースト', 'Board', 'Common', 'Duplicate any token in your token pouch', 'トークンポーチにある好きなトークンを1個複製する。', 'orange'],
  ['metal-detector', 'Metal Detector', '金属探知機', 'Board', 'Rare', 'Find loot wherever you land this turn.', 'このターンは、どのマスに止まっても戦利品を発見する。', 'yellow'],
  ['starting-charge', 'Starting Charge', '初期チャージ', 'Board', 'Common', 'If you encounter a battle this turn, all your slots are charged on your first turn in battle', 'このターンにバトルが発生した場合、バトルの最初のターンにすべてのスロットがチャージされる。', 'orange'],
  ['tokensmith', 'Tokensmith', 'トークン職人', 'Board', 'Common', 'Remove a token from a slot and put it into your token pouch', 'スロットからトークンを1個取り外し、トークンポーチに入れる。', 'grey'],
  ['redo', 'Redo', 'やり直し', 'Board', 'Rare', 'Get one chance to rearrange your tokens.', 'トークンを一度だけ並べ替えることができる。', 'yellow'],
  ['ice-beam', 'Ice Beam', 'アイスビーム', 'Battle', 'Common', 'Freeze your opponent', '対戦相手を凍結させる。', 'light-blue'],
  ['charger', 'Charger', 'チャージャー', 'Battle', 'Common', 'Charge your attacks next turn', '次のターンの攻撃をチャージする。', 'yellow'],
  ['spellbound', 'Spellbound', '呪縛', 'Board', 'Common', 'Choose another player, they may not use potions in their next turn.', '他のプレイヤーを1人選んでください。そのプレイヤーは次のターンにポーションを使用できません。', 'green'],
  ['heavy-weight', 'Heavy Weight', 'ヘビーウェイト', 'Board', 'Rare', 'Choose another player, they may not use potions in their next turn, and their dice roll will be halved (rounded up).', '他のプレイヤーを1人選んでください。そのプレイヤーは次のターンにポーションを使用できず、サイコロの出目が半分になります（端数切り上げ）。', 'blue'],
  ['troublemaker', 'Troublemaker', 'トラブルメーカー', 'Board', 'Rare', 'Choose any other player and roll the dice for your turn. If even they lose 1 token, if odd you lose a token.', '他のプレイヤーを1人選び、このターンのサイコロを振る。出目が偶数ならそのプレイヤーはトークンを1個失い、奇数なら自分がトークンを1個失う。', 'purple'],
  ['devine-chance', 'Devine Chance', '神の好機', 'Board', 'Common', 'Roll the dice for your turn. If even you heal to full HP. If odd everyone else does.', 'このターンのサイコロを振る。出目が偶数なら、自分のHPが全回復する。奇数なら、自分以外のすべてのプレイヤーのHPが全回復する。', 'green'],
  ['buy-and-sell', 'Buy and Sell', '売買', 'Board', 'Rare', 'Discard 3 tokens from your token pouch. Get a choice of 2 random tokens and pick one to gain.', 'トークンポーチからトークンを3個捨てる。ランダムに選ばれた2個のトークンから1個を選んで獲得する。', 'orange'],
  ['cauldron', 'Cauldron', '大釜', 'Board', 'Common', 'Pick one of 3 potions to gain.', '3つのポーションから1つを選んで獲得する。', 'red'],
  ['storm-master', 'Storm Master', '嵐の支配者', 'Board', 'Rare', 'Roll the dice for your turn. If even all others players cannot move on their next turn (they must repeat the square they are currently on) and they cannot use board potions, if odd you may not move this turn and your turn is over.', 'このターンのサイコロを振る。出目が偶数なら、自分以外のすべてのプレイヤーは次のターンに移動できず、現在いるマスにとどまらなければならない。また、ボード用ポーションも使用できない。出目が奇数なら、自分はこのターン移動できず、そのままターンを終了する。', 'red'],
  ['double-dice', 'Double Dice', 'ダブルダイス', 'Board', 'Common', 'Roll 2 dice this turn.', 'このターンはサイコロを2個振る。', 'blue'],
  ['triple-dice', 'Triple Dice', 'トリプルダイス', 'Board', 'Rare', 'Roll 3 dice this turn.', 'このターンはサイコロを3個振る。', 'red'],
  ['bridge-builder', 'Bridge Builder', '橋職人', 'Mini', 'Common', 'Auto win a River Mini Game', '川のミニゲームに自動的に勝利する。', 'light-blue'],
  ['good-decisions', 'Good Decisions', '賢明な選択', 'Mini', 'Common', 'Remove any forfeits from a decision', '選択によって受けるペナルティをすべて無効にする。', 'orange'],
  ['cave-runner', 'Cave Runner', '洞窟ランナー', 'Mini', 'Common', 'Escape a cave encounter with no damage but lose any prizes you had.', 'ダメージを受けずに洞窟での遭遇から脱出する。ただし、それまでに獲得した報酬はすべて失う。', 'grey'],
  ['smokescreen', 'Smokescreen', '煙幕', 'Board', 'Common', 'You will not encounter a battle this turn.', 'このターンはバトルが発生しない。', 'grey'],
  ['cosmic-intervention', 'Cosmic Intervention', '宇宙の介入', 'Battle', 'Common', 'Deal 10 damage to your opponent', '対戦相手に10ダメージを与える。', 'red'],
  ['shields-down', 'Shields Down', 'シールドダウン', 'Battle', 'Common', 'Remove all guard from your opponent this turn', 'このターン、対戦相手のガードをすべて取り除く。', 'blue'],
  ['thaw', 'Thaw', '解凍', 'Battle', 'Common', 'Auto unfreeze yourself', '自分の凍結状態を自動的に解除する。', 'orange'],
  ['sos', 'SOS', 'SOS', 'Board', 'Common', 'Teleport to the field village', 'フィールドの村にテレポートする。', 'light-blue'],
];

function toComparablePotion(potion) {
  return [
    potion.id,
    potion.name,
    potion.japaneseName,
    potion.availability,
    potion.rarity,
    potion.description,
    potion.japaneseDescription,
    potion.colour,
  ];
}

describe('potion definitions', () => {
  test('matches the complete revamped source-of-truth table', () => {
    expect(POTION_DEFINITIONS.map(toComparablePotion)).toEqual(EXPECTED_POTIONS);
    expect(POTION_DEFINITIONS).toHaveLength(28);
    expect(new Set(POTION_DEFINITIONS.map(({ id }) => id)).size).toBe(28);
  });

  test('contains no deprecated potion records', () => {
    expect(POTION_DEFINITIONS.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining(['teleport-to-feature', 'gambeller'])
    );
  });

  test('supports exact Japanese text and English fallback helpers', () => {
    const rollChoice = POTION_DEFINITIONS[0];

    expect(getPotionName(rollChoice, 'jp')).toBe('出目選択');
    expect(getPotionDescription(rollChoice, 'jp')).toBe(
      '次に振るサイコロの出目を選ぶ。'
    );
    expect(getPotionName(rollChoice, 'en')).toBe('Roll Choice');
    expect(getPotionName(rollChoice, 'invalid')).toBe('Roll Choice');
    expect(getPotionDescription(rollChoice, 'invalid')).toBe(
      'Choose the next roll of the dice'
    );
    expect(getPotionName({ ...rollChoice, japaneseName: '' }, 'jp')).toBe(
      'Roll Choice'
    );
    expect(
      getPotionDescription({ ...rollChoice, japaneseDescription: '' }, 'jp')
    ).toBe('Choose the next roll of the dice');
  });
});
