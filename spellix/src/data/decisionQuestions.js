const RESULT_LABELS = {
  commonPotion: {
    en: 'Gain a common potion',
    jp: 'コモンポーションを獲得',
  },
  commonToken: {
    en: 'Gain a common token',
    jp: 'コモントークンを獲得',
  },
  firstAidPotion: {
    en: 'Gain a First Aid potion',
    jp: '応急手当ポーションを獲得',
  },
  freezePotion: {
    en: 'Gain a Freeze potion',
    jp: '凍結ポーションを獲得',
  },
  lose10Health: {
    en: 'Lose 10 health',
    jp: '体力を10失う',
  },
  lose15Health: {
    en: 'Lose 15 health',
    jp: '体力を15失う',
  },
  lose20Health: {
    en: 'Lose 20 health',
    jp: '体力を20失う',
  },
  lose5Health: {
    en: 'Lose 5 health',
    jp: '体力を5失う',
  },
  losePotion: {
    en: 'Lose a random potion',
    jp: 'ポーションを1つ失う',
  },
  loseToken: {
    en: 'Lose a token',
    jp: 'トークンを1つ失う',
  },
  loseTurn: {
    en: 'Lose your next turn',
    jp: '次のターンを失う',
  },
  nothing: {
    en: 'Nothing',
    jp: '何もなし',
  },
  rarePotion: {
    en: 'Gain a rare potion',
    jp: 'レアポーションを獲得',
  },
  rareToken: {
    en: 'Gain a rare token',
    jp: 'レアトークンを獲得',
  },
  smallHealPotion: {
    en: 'Gain a Small Heal potion',
    jp: '小回復ポーションを獲得',
  },
  thawPotion: {
    en: 'Gain a Thaw potion',
    jp: '解凍ポーションを獲得',
  },
  token: {
    en: 'Gain a token',
    jp: 'トークンを1つ獲得',
  },
  cauldronPotion: {
    en: 'Gain a Cauldron potion',
    jp: '大釜ポーションを獲得',
  },
};

const RESULT_EFFECTS = {
  cauldronPotion: { potionId: 'cauldron', type: 'gainPotion' },
  commonPotion: { rarity: 'Common', type: 'gainPotion' },
  commonToken: { rarity: 'Common', type: 'gainToken' },
  firstAidPotion: { potionId: 'first-aid', type: 'gainPotion' },
  freezePotion: { potionId: 'ice-beam', type: 'gainPotion' },
  lose10Health: { amount: 10, type: 'loseHealth' },
  lose15Health: { amount: 15, type: 'loseHealth' },
  lose20Health: { amount: 20, type: 'loseHealth' },
  lose5Health: { amount: 5, type: 'loseHealth' },
  losePotion: { type: 'losePotion' },
  loseToken: { type: 'loseToken' },
  loseTurn: { type: 'skipNextTurn' },
  nothing: { type: 'none' },
  rarePotion: { rarity: 'Rare', type: 'gainPotion' },
  rareToken: { rarity: 'Rare', type: 'gainToken' },
  smallHealPotion: { potionId: 'small-heal', type: 'gainPotion' },
  thawPotion: { potionId: 'thaw', type: 'gainPotion' },
  token: { rarity: 'Any', type: 'gainToken' },
};

function localized(en, jp) {
  return { en, jp };
}

function outcome(resultId, en, jp) {
  return {
    effect: { ...RESULT_EFFECTS[resultId] },
    resultId,
    result: RESULT_LABELS[resultId],
    text: localized(en, jp),
  };
}

function choice(id, en, jp, chances, outcomes) {
  return {
    id,
    text: localized(en, jp),
    chances,
    outcomes,
  };
}

export const DECISION_QUESTIONS = [
  {
    id: 'old-lantern',
    question: localized(
      'You find an old lantern glowing beside an abandoned wizard’s tower. A faint voice seems to be coming from inside. Do you:',
      '古い魔法使いの塔のそばで、古びたランタンが光っているのを見つけました。中からかすかな声が聞こえてくるようです。どうしますか？'
    ),
    choices: [
      choice(
        'ask-the-voice',
        'Ask the voice who it is',
        '中の声に正体を尋ねる',
        { good: 50, neutral: 20, bad: 30 },
        {
          good: outcome(
            'smallHealPotion',
            'The voice belongs to a grateful spirit, which rewards your kindness.',
            '声の主は感謝した精霊で、あなたの親切にお礼をくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The voice fades away without answering.',
            '声は返事をせず、そのまま消えていきました。'
          ),
          bad: outcome(
            'loseToken',
            'The voice deceives you and steals one of your tokens.',
            '声にだまされ、トークンを1つ奪われました。'
          ),
        }
      ),
      choice(
        'extinguish-the-lantern',
        'Extinguish the lantern',
        'ランタンの火を消す',
        { good: 20, neutral: 30, bad: 50 },
        {
          good: outcome(
            'commonToken',
            'When the flame goes out, a useful token appears inside the lantern.',
            '火が消えると、ランタンの中から役立つトークンが現れました。'
          ),
          neutral: outcome(
            'nothing',
            'The lantern goes dark, but nothing else happens.',
            'ランタンの明かりが消えましたが、それ以上は何も起こりませんでした。'
          ),
          bad: outcome(
            'lose10Health',
            'A burst of cursed smoke escapes from the lantern.',
            '呪われた煙がランタンから噴き出し、体力を10失いました。'
          ),
        }
      ),
      choice(
        'carry-the-lantern',
        'Pick up the lantern and carry it with you',
        'ランタンを拾って持っていく',
        { good: 30, neutral: 50, bad: 20 },
        {
          good: outcome(
            'commonPotion',
            'The lantern guides you to a hidden potion.',
            'ランタンの光が、隠されたポーションへと導いてくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The lantern remains silent as you carry it.',
            'ランタンを持ち歩いても、何も反応しませんでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The lantern drains some of your life force.',
            'ランタンに生命力を吸い取られ、体力を10失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'luminous-mushrooms',
    question: localized(
      'A circle of luminous mushrooms appears across your path. You hear distant music coming from its centre. Do you:',
      '光り輝くキノコの輪が道を塞いでいます。その中心から遠くに音楽が聞こえてきます。どうしますか？'
    ),
    choices: [
      choice(
        'step-inside',
        'Step inside the circle',
        'キノコの輪の中に入る',
        { good: 60, neutral: 20, bad: 20 },
        {
          good: outcome(
            'smallHealPotion',
            'The music fills you with warmth, and a Small Heal potion appears at your feet.',
            '音楽に包まれると温かな力を感じ、足元に小回復ポーションが現れました。'
          ),
          neutral: outcome(
            'nothing',
            'You dance to the strange music, but nothing else happens.',
            '不思議な音楽に合わせて踊りましたが、それ以上は何も起こりませんでした。'
          ),
          bad: outcome(
            'losePotion',
            'Mischievous fairies surround you and steal one of your potions.',
            'いたずら好きな妖精たちに囲まれ、ポーションを1つ奪われました。'
          ),
        }
      ),
      choice(
        'pick-mushroom',
        'Pick one of the mushrooms',
        'キノコを1つ摘む',
        { good: 30, neutral: 10, bad: 60 },
        {
          good: outcome(
            'rarePotion',
            'The mushroom transforms into a rare potion in your hand.',
            '摘んだキノコが手の中でレアポーションに変わりました。'
          ),
          neutral: outcome(
            'nothing',
            'The mushroom crumbles into harmless glowing dust.',
            'キノコは無害な光る粉となって崩れました。'
          ),
          bad: outcome(
            'lose10Health',
            'The mushroom releases poisonous spores when you touch it.',
            'キノコに触れた瞬間、毒の胞子が放出され、体力を10失いました。'
          ),
        }
      ),
      choice(
        'walk-around',
        'Walk around the circle without touching it',
        'キノコの輪に触れずに迂回する',
        { good: 30, neutral: 50, bad: 20 },
        {
          good: outcome(
            'commonPotion',
            'A friendly fairy notices your caution and leaves you a common potion.',
            'あなたの慎重な行動に気づいた親切な妖精が、コモンポーションを残してくれました。'
          ),
          neutral: outcome(
            'nothing',
            'You safely walk around the circle and continue your journey.',
            '無事にキノコの輪を迂回し、旅を続けました。'
          ),
          bad: outcome(
            'lose15Health',
            'The circle suddenly expands beneath your feet and drains your energy.',
            'キノコの輪が突然足元まで広がり、力を吸い取られて体力を15失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'magical-creature-in-thorns',
    question: localized(
      'A small magical creature is caught in a thorny bush. It growls whenever you approach. Do you:',
      '小さな魔法生物がトゲだらけの茂みに引っかかっています。近づくたびにうなり声を上げます。どうしますか？'
    ),
    choices: [
      choice(
        'cut-thorns',
        'Cut through the thorns with damage spell',
        '攻撃呪文でトゲを切り払う',
        { good: 30, neutral: 30, bad: 40 },
        {
          good: outcome(
            'commonToken',
            'The creature is grateful for your help and gives you a common token.',
            '魔法生物は助けてもらったことに感謝し、コモントークンをくれました。'
          ),
          neutral: outcome(
            'nothing',
            'You cut through the thorns, but the creature immediately runs away.',
            'トゲを切り払いましたが、魔法生物はすぐに逃げてしまいました。'
          ),
          bad: outcome(
            'lose10Health',
            'Your spell frightens the creature, and it attacks you before escaping.',
            '呪文に驚いた魔法生物に襲われ、逃げられる前に体力を10失いました。'
          ),
        }
      ),
      choice(
        'push-thorns',
        'Use a guard spell to push the thorns away',
        '防御呪文でトゲを押しのける',
        { good: 40, neutral: 30, bad: 30 },
        {
          good: outcome(
            'commonToken',
            'The thorns move aside safely, and the grateful creature gives you a common token.',
            'トゲを安全に押しのけることができ、感謝した魔法生物からコモントークンをもらいました。'
          ),
          neutral: outcome(
            'nothing',
            'The creature escapes from the bush without looking back.',
            '魔法生物は茂みから抜け出すと、振り返ることなく逃げていきました。'
          ),
          bad: outcome(
            'lose10Health',
            'The thorns spring back and strike you with poisonous spikes.',
            'トゲが勢いよく元に戻り、毒のある針が刺さって体力を10失いました。'
          ),
        }
      ),
      choice(
        'offer-food',
        'Place some food nearby and wait for it to calm down',
        '近くに食べ物を置き、落ち着くのを待つ',
        { good: 30, neutral: 40, bad: 30 },
        {
          good: outcome(
            'commonPotion',
            'The creature calms down and reveals a common potion hidden beneath the bush.',
            '魔法生物は落ち着き、茂みの下に隠されていたコモンポーションを見せてくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The creature eats the food but remains trapped in the thorns.',
            '魔法生物は食べ物を食べましたが、トゲに引っかかったままでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The food attracts a swarm of biting insects.',
            '食べ物に噛みつく虫の群れが集まり、体力を10失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'locked-spellbook',
    question: localized(
      'You discover a locked spellbook covered in warning symbols. The book begins to shake when you touch it. Do you:',
      '警告の印で覆われた、鍵のかかった魔導書を見つけました。触れると本が震え始めます。どうしますか？'
    ),
    choices: [
      choice(
        'break-lock',
        'Break the lock and open the book',
        '鍵を壊して本を開く',
        { good: 20, neutral: 40, bad: 40 },
        {
          good: outcome(
            'rareToken',
            'A powerful token falls from a hidden compartment inside the book.',
            '本の中の隠し場所から、強力なレアトークンが落ちてきました。'
          ),
          neutral: outcome(
            'nothing',
            'The pages are completely blank, and the book stops shaking.',
            'ページには何も書かれておらず、本の震えも止まりました。'
          ),
          bad: outcome(
            'loseToken',
            'The book awakens and consumes one of your tokens.',
            '魔導書が目覚め、あなたのトークンを1つ飲み込んでしまいました。'
          ),
        }
      ),
      choice(
        'protective-spell',
        'Speak a protective spell over it',
        '本に防御呪文をかける',
        { good: 50, neutral: 30, bad: 20 },
        {
          good: outcome(
            'cauldronPotion',
            'The warning symbols disappear, revealing a Cauldron potion hidden within the book.',
            '警告の印が消え、本の中に隠されていた大釜ポーションが現れました。'
          ),
          neutral: outcome(
            'nothing',
            'The protective spell calms the book, but nothing else happens.',
            '防御呪文によって本は静かになりましたが、それ以上は何も起こりませんでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The warning symbols reflect your spell back at you.',
            '警告の印が呪文を跳ね返し、体力を10失いました。'
          ),
        }
      ),
      choice(
        'find-scholar',
        'Take the book to a magical scholar',
        '魔導書を魔法学者のもとへ持っていく',
        { good: 35, neutral: 30, bad: 35 },
        {
          good: outcome(
            'commonToken',
            'The scholar rewards you with a common token for bringing them the unusual book.',
            '学者は珍しい魔導書を持ってきたお礼として、コモントークンをくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The scholar examines the book but cannot discover its secret.',
            '学者は魔導書を調べましたが、その秘密を解き明かすことはできませんでした。'
          ),
          bad: outcome(
            'loseToken',
            'The scholar secretly takes one of your tokens as payment.',
            '学者は代金として、こっそりあなたのトークンを1つ持っていきました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'traveller-in-magical-ice',
    question: localized(
      'You find a traveller trapped inside a block of magical ice. Their eyes are open, but they cannot speak. Do you:',
      '旅人が魔法の氷の中に閉じ込められています。目は開いていますが、話すことはできません。どうしますか？'
    ),
    choices: [
      choice(
        'melt-ice',
        'Melt the ice with a damage spell',
        '攻撃呪文で氷を溶かす',
        { good: 35, neutral: 30, bad: 35 },
        {
          good: outcome(
            'commonToken',
            'The traveller is freed and gives you a common token as thanks.',
            '旅人は無事に解放され、お礼としてコモントークンをくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The ice melts, but the traveller disappears into a cloud of mist.',
            '氷は溶けましたが、旅人は霧となって消えてしまいました。'
          ),
          bad: outcome(
            'lose10Health',
            'The magical ice explodes as it melts, injuring you.',
            '魔法の氷が溶ける途中で爆発し、体力を10失いました。'
          ),
        }
      ),
      choice(
        'search-belongings',
        'Search the traveller’s belongings for clues',
        '旅人の持ち物から手がかりを探す',
        { good: 50, neutral: 30, bad: 20 },
        {
          good: outcome(
            'freezePotion',
            'You find the Freeze potion that got the traveller into this mess in the first place.',
            'そもそも旅人をこんな目に遭わせた凍結ポーションを見つけました。'
          ),
          neutral: outcome(
            'nothing',
            'You find an old map, but it contains no useful information.',
            '古い地図を見つけましたが、役立つ情報はありませんでした。'
          ),
          bad: outcome(
            'loseToken',
            'A magical trap hidden among the traveller’s belongings steals one of your tokens.',
            '旅人の持ち物に仕掛けられていた魔法の罠により、トークンを1つ奪われました。'
          ),
        }
      ),
      choice(
        'leave-traveller',
        'Leave them frozen and continue on your way',
        '旅人を氷の中に残して先へ進む',
        { good: 20, neutral: 30, bad: 50 },
        {
          good: outcome(
            'thawPotion',
            'You later discover a Thaw potion that the traveller was probably looking for.',
            'その後、旅人がおそらく探していた解凍ポーションを見つけました。'
          ),
          neutral: outcome(
            'nothing',
            'You leave the frozen traveller behind and continue your journey.',
            '氷漬けの旅人を残し、そのまま旅を続けました。'
          ),
          bad: outcome(
            'loseTurn',
            'The traveller’s curse follows you, freezing you in place.',
            '旅人にかけられた呪いがあなたにも襲いかかり、その場で凍りついて次のターンを失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'ancient-well',
    question: localized(
      'An ancient well calls your name and offers to grant you knowledge in exchange for a personal memory. Do you:',
      '古代の井戸があなたの名前を呼び、個人的な思い出と引き換えに知識を授けると申し出てきました。どうしますか？'
    ),
    choices: [
      choice(
        'offer-memory',
        'Offer it a happy childhood memory',
        '幸せな子どもの頃の思い出を差し出す',
        { good: 50, neutral: 20, bad: 30 },
        {
          good: outcome(
            'commonPotion',
            'The well accepts the memory and reveals a common potion hidden in its depths.',
            '井戸はその思い出を受け取り、奥底に隠されていたコモンポーションを差し出しました。'
          ),
          neutral: outcome(
            'nothing',
            'The memory fades, but the promised knowledge never comes.',
            '思い出は薄れていきましたが、約束された知識は得られませんでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The well takes more than you offered, draining part of your life force.',
            '井戸は差し出した以上のものを奪い、生命力を吸い取られて体力を10失いました。'
          ),
        }
      ),
      choice(
        'offer-coin',
        'Drop a magical coin into the well instead',
        '代わりに魔法のコインを井戸へ投げ入れる',
        { good: 35, neutral: 30, bad: 35 },
        {
          good: outcome(
            'rarePotion',
            'The coin awakens an ancient enchantment, and a rare potion rises from the water.',
            'コインが古代の魔法を目覚めさせ、水の中からレアポーションが浮かび上がりました。'
          ),
          neutral: outcome(
            'nothing',
            'The coin disappears into the darkness, but the well remains silent.',
            'コインは暗闇の中へ消えましたが、井戸は何も語りませんでした。'
          ),
          bad: outcome(
            'lose20Health',
            'The well rejects the coin and releases a powerful curse.',
            '井戸はコインを拒み、強力な呪いを放ったため、体力を20失いました。'
          ),
        }
      ),
      choice(
        'seal-well',
        'Seal the well with a silencing spell',
        '沈黙の呪文で井戸を封じる',
        { good: 10, neutral: 30, bad: 60 },
        {
          good: outcome(
            'rareToken',
            'Your spell breaks the magic binding the well, causing a rare token to rise from within.',
            '呪文によって井戸を縛っていた魔法が解け、中からレアトークンが浮かび上がりました。'
          ),
          neutral: outcome(
            'nothing',
            'The voice falls silent, and nothing else happens.',
            '声は静まりましたが、それ以上は何も起こりませんでした。'
          ),
          bad: outcome(
            'lose5Health',
            'The trapped voice lashes out before the seal closes.',
            '封印が閉じる直前に閉じ込められた声が襲いかかり、体力を5失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'injured-goblin',
    question: localized(
      'An injured goblin lies beside the path, clutching a stolen potion. It begs you not to take it. Do you:',
      '傷ついたゴブリンが道端に倒れ、盗んだポーションを握りしめています。取らないでくれとあなたに懇願しています。どうしますか？'
    ),
    choices: [
      choice(
        'heal-goblin',
        'Heal the goblin and let it keep the potion',
        'ゴブリンを回復し、ポーションを持たせたままにする',
        { good: 40, neutral: 30, bad: 30 },
        {
          good: outcome(
            'rarePotion',
            'The grateful goblin reveals a second rare potion and gives it to you.',
            '感謝したゴブリンはもう1つのレアポーションを取り出し、あなたにくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The goblin thanks you and quickly disappears with the stolen potion.',
            'ゴブリンは礼を言うと、盗んだポーションを持ってすぐに姿を消しました。'
          ),
          bad: outcome(
            'lose10Health',
            'The goblin mistakes your spell for an attack and strikes you before fleeing.',
            'ゴブリンはあなたの呪文を攻撃だと勘違いし、逃げる前に襲いかかってきたため、体力を10失いました。'
          ),
        }
      ),
      choice(
        'take-potion',
        'Take the potion and leave the goblin behind',
        'ポーションを奪い、ゴブリンを置き去りにする',
        { good: 50, neutral: 0, bad: 50 },
        {
          good: outcome(
            'rarePotion',
            'You take the rare potion before the injured goblin can stop you.',
            '傷ついたゴブリンが止める前に、レアポーションを手に入れました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'loseToken',
            'The goblin curses you as you leave, causing one of your tokens to vanish.',
            '立ち去るあなたにゴブリンが呪いをかけ、トークンを1つ消されました。'
          ),
        }
      ),
      choice(
        'trade-food',
        'Offer to trade food for the potion',
        '食べ物とポーションの交換を申し出る',
        { good: 30, neutral: 40, bad: 30 },
        {
          good: outcome(
            'rarePotion',
            'The hungry goblin accepts your offer and trades you the rare potion.',
            '空腹のゴブリンは提案を受け入れ、食べ物と引き換えにレアポーションをくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The goblin refuses the trade but allows you to continue on your way.',
            'ゴブリンは交換を断りましたが、あなたが先へ進むことは許してくれました。'
          ),
          bad: outcome(
            'lose10Health',
            'The goblin grabs the food and attacks you to keep the potion as well.',
            'ゴブリンは食べ物を奪い、ポーションも守ろうと襲いかかってきたため、体力を10失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'young-dragon',
    question: localized(
      "A young dragon is sleeping on top of a small pile of treasure. One of the items bears your faction's symbol. Do you:",
      '若いドラゴンが小さな宝の山の上で眠っています。その中の1つには、あなたの陣営の紋章が刻まれています。どうしますか？'
    ),
    choices: [
      choice(
        'take-heirloom',
        'Carefully take only the faction heirloom',
        '陣営の家宝だけを慎重に取る',
        { good: 20, neutral: 20, bad: 60 },
        {
          good: outcome(
            'rareToken',
            "The heirloom contains a hidden rare token that responds to your faction's symbol.",
            '家宝に隠されていたレアトークンが、あなたの陣営の紋章に反応して現れました。'
          ),
          neutral: outcome(
            'nothing',
            'The dragon begins to stir, forcing you to retreat without taking anything.',
            'ドラゴンが目を覚ましそうになったため、何も取らずに退きました。'
          ),
          bad: outcome(
            'lose10Health',
            'The dragon wakes and strikes you with its tail.',
            'ドラゴンが目を覚まし、尻尾で攻撃してきたため、体力を10失いました。'
          ),
        }
      ),
      choice(
        'ask-dragon',
        'Wake the dragon and ask for the item',
        'ドラゴンを起こして、その品を返してほしいと頼む',
        { good: 40, neutral: 30, bad: 30 },
        {
          good: outcome(
            'rareToken',
            "The dragon recognises your faction's symbol and gives you a rare token from its hoard.",
            'ドラゴンはあなたの陣営の紋章に気づき、宝の山からレアトークンを1つくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The dragon refuses your request and returns to sleep.',
            'ドラゴンは頼みを断り、再び眠りにつきました。'
          ),
          bad: outcome(
            'lose15Health',
            'The irritated dragon attacks you for disturbing its sleep.',
            '眠りを邪魔されて怒ったドラゴンに襲われ、体力を15失いました。'
          ),
        }
      ),
      choice(
        'sleeping-spell',
        'Cast a sleeping spell to keep the dragon unconscious',
        'ドラゴンが目を覚まさないように眠りの呪文をかける',
        { good: 50, neutral: 0, bad: 50 },
        {
          good: outcome(
            'rareToken',
            "Your spell deepens the dragon's sleep, allowing you to recover a rare token from the treasure.",
            '呪文によってドラゴンはさらに深く眠り、宝の中からレアトークンを手に入れることができました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'lose20Health',
            'The dragon resists the spell and awakens in a fury, breathing fire at you.',
            'ドラゴンは呪文に抵抗して激怒し、炎を吐いたため、体力を20失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'silver-chained-chest',
    question: localized(
      'You discover a wooden chest wrapped in silver chains. Something inside scratches against the lid. Do you:',
      '銀の鎖が巻きつけられた木製の宝箱を見つけました。中から何かが蓋を引っかいています。どうしますか？'
    ),
    choices: [
      choice(
        'break-chains',
        'Break the chains with a spell',
        '呪文で鎖を壊す',
        { good: 30, neutral: 20, bad: 50 },
        {
          good: outcome(
            'commonToken',
            'The chains fall away, revealing a common token secured beneath the lid.',
            '鎖が外れ、蓋の下に隠されていたコモントークンが現れました。'
          ),
          neutral: outcome(
            'nothing',
            'The chest opens, but whatever was inside has already disappeared.',
            '宝箱は開きましたが、中にいたものはすでに姿を消していました。'
          ),
          bad: outcome(
            'lose10Health',
            'A furious creature bursts from the chest and attacks you.',
            '怒った魔法生物が宝箱から飛び出して襲いかかり、体力を10失いました。'
          ),
        }
      ),
      choice(
        'knock',
        'Knock on the chest and wait for a response',
        '宝箱をノックして返事を待つ',
        { good: 50, neutral: 30, bad: 20 },
        {
          good: outcome(
            'commonPotion',
            'A tiny creature opens the lid and rewards your politeness with a common potion.',
            '小さな魔法生物が蓋を開け、礼儀正しいあなたにコモンポーションをくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The scratching stops, but the chest remains locked.',
            '引っかく音は止まりましたが、宝箱は閉じたままでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The chest bites your hand when you knock on it.',
            'ノックした瞬間に宝箱に手を噛まれ、体力を10失いました。'
          ),
        }
      ),
      choice(
        'break-chest',
        'Break the chest against a tree',
        '宝箱を木に叩きつけて壊す',
        { good: 30, neutral: 0, bad: 70 },
        {
          good: outcome(
            'commonToken',
            'The chest splits open, and a common token rolls out unharmed.',
            '宝箱が割れ、中から無傷のコモントークンが転がり出てきました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'lose10Health',
            'The impact releases a violent curse from inside the chest.',
            '衝撃で宝箱の中から激しい呪いが放たれ、体力を10失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'translucent-wizard',
    question: localized(
      'A translucent wizard appears on the path and claims that they cannot remember where they died. Do you:',
      '半透明の魔法使いが道に現れ、自分がどこで死んだのか思い出せないと言っています。どうしますか？'
    ),
    choices: [
      choice(
        'help-search',
        'Offer to help them search',
        '一緒に探すと申し出る',
        { good: 70, neutral: 0, bad: 30 },
        {
          good: outcome(
            'commonPotion',
            "You find the wizard's resting place, and the grateful spirit rewards you with a common potion.",
            '魔法使いが眠る場所を見つけると、感謝した霊がコモンポーションをくれました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'loseTurn',
            'The search continues through the night, leaving you too exhausted to act next turn.',
            '捜索は夜通し続き、疲れ果てて次のターンを失いました。'
          ),
        }
      ),
      choice(
        'restore-memory',
        'Cast a spell to restore their memory',
        '記憶を取り戻す呪文をかける',
        { good: 50, neutral: 20, bad: 30 },
        {
          good: outcome(
            'commonPotion',
            'The wizard remembers a hidden cache and guides you to a common potion.',
            '魔法使いは隠し場所を思い出し、コモンポーションのある場所へ案内してくれました。'
          ),
          neutral: outcome(
            'nothing',
            'The spell restores only a few meaningless fragments of memory.',
            '呪文で戻ったのは、役に立たない記憶の断片だけでした。'
          ),
          bad: outcome(
            'lose10Health',
            "The wizard's final moments flood into your mind and overwhelm you.",
            '魔法使いの最期の記憶があなたの心に流れ込み、圧倒されて体力を10失いました。'
          ),
        }
      ),
      choice(
        'order-away',
        'Order the ghost to leave you alone',
        '幽霊に立ち去るよう命じる',
        { good: 20, neutral: 20, bad: 60 },
        {
          good: outcome(
            'rarePotion',
            'The ghost respects your confidence and leaves behind a rare potion before departing.',
            '幽霊はあなたの毅然とした態度を認め、立ち去る前にレアポーションを残しました。'
          ),
          neutral: outcome(
            'nothing',
            'The ghost quietly disappears without causing any trouble.',
            '幽霊は何もせず、静かに姿を消しました。'
          ),
          bad: outcome(
            'loseToken',
            'The offended ghost passes through you and steals one of your tokens.',
            '怒った幽霊があなたの体を通り抜け、トークンを1つ奪いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'black-rose',
    question: localized(
      'A single black rose grows in the middle of a ruined battlefield. Its petals move even though there is no wind. Do you:',
      '荒れ果てた戦場の中央に、一本の黒いバラが咲いています。風もないのに花びらが揺れています。どうしますか？'
    ),
    choices: [
      choice(
        'pick-rose',
        'Pick the rose',
        '黒いバラを摘む',
        { good: 50, neutral: 0, bad: 50 },
        {
          good: outcome(
            'commonPotion',
            'The rose transforms into a common potion as soon as you pick it.',
            'バラを摘むと、すぐにコモンポーションへと姿を変えました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'lose15Health',
            "The rose's thorns wrap around your hand and drain your strength.",
            'バラのトゲが手に巻きついて力を吸い取り、体力を15失いました。'
          ),
        }
      ),
      choice(
        'pour-healing-potion',
        'Pour a healing potion onto its roots',
        '根元に回復ポーションを注ぐ',
        { good: 70, neutral: 20, bad: 10 },
        {
          good: outcome(
            'firstAidPotion',
            'The rose blooms brightly and transforms your offering into a First Aid potion.',
            'バラが鮮やかに咲き、注いだポーションを応急手当ポーションへと変えました。'
          ),
          neutral: outcome(
            'nothing',
            'The roots absorb the potion, but the rose does not change.',
            '根がポーションを吸収しましたが、バラには何の変化もありませんでした。'
          ),
          bad: outcome(
            'lose15Health',
            'The revived roots burst from the ground and lash out at you.',
            '活力を取り戻した根が地面から飛び出して襲いかかり、体力を15失いました。'
          ),
        }
      ),
      choice(
        'destroy-rose',
        'Destroy it',
        '黒いバラを破壊する',
        { good: 20, neutral: 10, bad: 70 },
        {
          good: outcome(
            'token',
            'When the rose is destroyed, a token is revealed beneath its roots.',
            'バラを破壊すると、根の下からトークンが1つ現れました。'
          ),
          neutral: outcome(
            'nothing',
            'The rose crumbles into ash without any further effect.',
            'バラは灰になって崩れましたが、それ以上は何も起こりませんでした。'
          ),
          bad: outcome(
            'lose10Health',
            'The rose releases a cloud of cursed pollen as it is destroyed.',
            'バラを破壊した瞬間に呪われた花粉が広がり、体力を10失いました。'
          ),
        }
      ),
    ],
  },
  {
    id: 'hooded-merchant',
    question: localized(
      'A hooded merchant offers you a sealed potion in exchange for one of your tokens. They refuse to explain what the potion does. Do you:',
      'フードをかぶった商人が、トークン1つと引き換えに封をされたポーションを差し出してきました。商人はその効果を説明しようとしません。どうしますか？'
    ),
    choices: [
      choice(
        'accept-trade',
        'Accept the trade',
        '取引を受け入れる',
        { good: 70, neutral: 0, bad: 30 },
        {
          good: outcome(
            'commonPotion',
            'The sealed bottle contains a useful common potion.',
            '封を開けると、中には役立つコモンポーションが入っていました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'loseTurn',
            'The potion releases a sleeping mist, causing you to miss your next turn.',
            'ポーションから眠りの霧が放たれ、次のターンを失いました。'
          ),
        }
      ),
      choice(
        'refuse-trade',
        'Refuse the trade',
        '取引を断る',
        { good: 50, neutral: 0, bad: 50 },
        {
          good: outcome(
            'commonToken',
            'The merchant respects your caution and gives you a common token as a test of character.',
            '商人はあなたの慎重さを評価し、心を試した褒美としてコモントークンをくれました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'loseToken',
            'The merchant distracts you while leaving and secretly steals one of your tokens.',
            '商人は立ち去る際にあなたの注意をそらし、こっそりトークンを1つ盗みました。'
          ),
        }
      ),
      choice(
        'steal-potion',
        'Attempt to steal the potion while the merchant is distracted',
        '商人がよそ見をしている間にポーションを盗もうとする',
        { good: 30, neutral: 0, bad: 70 },
        {
          good: outcome(
            'rarePotion',
            'You successfully take the bottle and discover that it contains a rare potion.',
            'ポーションを盗むことに成功し、中身がレアポーションだと分かりました。'
          ),
          neutral: outcome('nothing', 'N/A', 'N/A'),
          bad: outcome(
            'loseToken',
            'The merchant catches you and takes one of your tokens as punishment.',
            '商人に見つかり、罰としてトークンを1つ奪われました。'
          ),
        }
      ),
    ],
  },
];

export function selectRandomDecision(decisions = DECISION_QUESTIONS, randomFn = Math.random) {
  if (decisions.length === 0) {
    return null;
  }

  const index = Math.min(Math.floor(randomFn() * decisions.length), decisions.length - 1);

  return decisions[index];
}

export function resolveDecisionOutcome(
  choiceToResolve,
  randomFn = Math.random,
  { preventBadOutcome = false } = {}
) {
  const { good, neutral } = choiceToResolve.chances;
  let outcomeType;

  if (preventBadOutcome) {
    const safeChanceTotal = good + neutral;

    if (safeChanceTotal <= 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Good Decisions found no good or neutral chance for ${choiceToResolve.id}; defaulting to good.`
        );
      }
      outcomeType = 'good';
    } else {
      const safeRoll = randomFn() * safeChanceTotal;
      outcomeType = safeRoll < good ? 'good' : 'neutral';
    }
  } else {
    const roll = randomFn() * 100;
    outcomeType = roll < good ? 'good' : roll < good + neutral ? 'neutral' : 'bad';
  }

  return {
    ...choiceToResolve.outcomes[outcomeType],
    type: outcomeType,
  };
}

export function warnForInvalidDecisionChances(decisions = DECISION_QUESTIONS) {
  decisions.forEach((decision) => {
    decision.choices.forEach((decisionChoice) => {
      const total =
        decisionChoice.chances.good +
        decisionChoice.chances.neutral +
        decisionChoice.chances.bad;

      if (total !== 100) {
        console.warn(
          `Decision chance total must equal 100: ${decision.id}/${decisionChoice.id} totals ${total}.`
        );
      }
    });
  });
}
