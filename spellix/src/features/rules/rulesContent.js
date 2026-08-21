export const RULES_CONTENT = {
  en: {
    backLabel: 'Back to Start',
    title: 'Rules of the game',
    introduction: [
      'Spellix is a turn-based adventure game. Each player travels around the board, collects tokens and potions, survives dangerous encounters, and grows stronger.',
      'To win the game, a player must defeat both Elite Towers first. One Elite Tower is in the north west, and the other is in the south east. After defeating both Elite Towers, that player may enter the boss castle in the north east and challenge the final boss. The first player to defeat the final boss wins the game.',
    ],
    sections: [
      {
        heading: 'Browser Compatibility',
        paragraphs: [
          "If the board or menus do not fit onto your screen naturally, please use the browser's zoom feature to adjust this. Either hold Ctrl and scroll with your mouse, or hold Ctrl and then press + or - to zoom in and out.",
        ],
      },
      {
        heading: 'Tokens',
        paragraphs: [
          'Tokens are the main way players become stronger. Tokens can be placed into spell columns. When you roll a number in battle, the tokens in that matching column activate.',
          'You can gain tokens from rewards such as battles, loot chests, villages, decisions, and other events. Some tokens are common, and some are rare. Some rare tokens are shiny versions of common tokens and have stronger effects.',
          'If you lose a battle or respawn, you may lose tokens. Starting tokens cannot be removed. Sacrifice tokens are removed first, then a random eligible token is removed.',
          'Damage tokens deal damage. Guard tokens protect you. Counter tokens damage an enemy if they attack you through that number. Deflect tokens reduce damage if you are attacked through that number. Freeze tokens can freeze your opponent. Health tokens increase your maximum and current HP. Merge tokens can combine adjacent spell columns. Buff tokens increase nearby spell power. Charge tokens charge your slots. Capacity tokens increase the number of tokens that adjacent columns can hold.',
          'To see a description of what each Token does, hover over the Token icon to make a tooltip appear.',
        ],
      },
      {
        heading: 'Battles',
        paragraphs: [
          'Battles are fought by rolling dice. On your turn in battle, you roll the dice and activate the spell column matching the number you rolled. Your opponent does the same on their turn.',
          'For example, if column 3 has a Damage token and you roll a 3, you deal damage. If column 3 has a Guard token, you gain guard. If you have both Damage and Guard in the same column, both effects happen.',
          'Counter and Deflect depend on the number used to attack. If your opponent attacks you through a number where you have Counter, you can deal counter damage back. If you have Deflect, you can reduce damage from that attack.',
          'Some columns can be merged. A merged column such as 2+3 activates if either 2 or 3 is rolled.',
        ],
      },
      {
        heading: 'Potions',
        paragraphs: [
          'Potions are special items that can help on the board, in battle, or during mini games. Some potions are used manually with a Use button. Others, such as Cave Runner, can activate automatically when their condition happens.',
          'Usually, you can only use one board potion per board turn and one battle potion per battle turn. Mini potions are separate and work only in their relevant mini game or event.',
          'Potions can heal you, help you roll, duplicate tokens, affect other players, protect you from danger, or change the outcome of an event.',
          'To see a description of what each Potion does, hover over the Potion icon to make a tooltip appear.',
        ],
      },
      {
        heading: 'Environments',
        paragraphs: [
          'The board has different environments. Each environment has different risks and rewards.',
          'Fields are safer and often have simple events. Hills can lead to caves. Gravel and mud are more dangerous and have more hazards. Streams and rivers often lead to river mini games. Woods and forests have stronger battles. Mountains are among the most dangerous areas, with stronger enemies, caves, and hazards.',
        ],
      },
      {
        heading: 'Features',
        paragraphs: [
          'The start zone is where players begin the game and where they return if they respawn.',
          'Villages are helpful places. When you visit a village, you recover to full health. Villages can also give rewards depending on your progress against the Elite Towers.',
          'Elite Towers are special battle locations. Each tower has a powerful enemy. Defeating both Elite Towers is required before you can challenge the final boss.',
          'The boss castle is in the north east. If you enter before defeating both Elite Towers, you are struck down. If you have defeated both Elite Towers, you may fight the final boss. Defeat the boss to win the game.',
        ],
      },
      {
        heading: 'Village Actions',
        paragraphs: [
          'When you visit a village, you can choose what to do there.',
          'Rest lets you recover your health before continuing your journey.',
          'Wandsmith lets you rearrange your spell tokens. Once your tokens are committed, they normally cannot be moved unless you use a Wandsmith or certain potions.',
          'Leave lets you leave the village without resting or using the Wandsmith.',
          'If you visit the same village again without visiting another feature first, the option you chose last time may be disabled. Rest and Wandsmith can become disabled this way. Leave is always available.',
          'These options reset when you visit another feature, visit a different village, or die and respawn.',
        ],
      },
    ],
  },
  jp: {
    backLabel: 'スタートに戻る',
    title: 'ゲームのルール',
    introduction: [
      'Spellixはターン制の冒険ゲームです。プレイヤーはボードを移動し、トークンやポーションを集め、危険な出来事を乗り越えながら強くなっていきます。',
      'ゲームに勝つには、まず2つのエリートタワーを両方攻略する必要があります。1つは北西にあり、もう1つは南東にあります。両方のエリートタワーを攻略すると、そのプレイヤーは北東にあるボスの城に入り、最後のボスに挑戦できます。最初に最後のボスを倒したプレイヤーが勝者です。',
    ],
    sections: [
      {
        heading: 'ブラウザの互換性',
        paragraphs: [
          'ボードやメニューが画面に自然に収まらない場合は、ブラウザのズーム機能で調整してください。Ctrlキーを押しながらマウスホイールをスクロールするか、Ctrlキーを押しながら＋または－を押すと、拡大・縮小できます。',
        ],
      },
      {
        heading: 'トークン',
        paragraphs: [
          'トークンは、プレイヤーを強くするための主な要素です。トークンは呪文の列に配置できます。バトル中にサイコロを振り、出た数字と同じ列のトークンが発動します。',
          'トークンは、バトル、戦利品の宝箱、村、決断、その他のイベントなどで手に入ります。トークンにはコモンとレアがあります。一部のレアトークンは、コモントークンの強化版である輝くトークンです。',
          'バトルに負けたり、リスポーンしたりすると、トークンを失うことがあります。初期トークンは取り除かれません。身代わりトークンが最初に取り除かれ、その後、取り除けるトークンからランダムに選ばれます。',
          'ダメージトークンはダメージを与えます。ガードトークンは自分を守ります。カウンタートークンは、その数字から攻撃された時に反撃ダメージを与えます。受け流しトークンは、その数字から攻撃された時にダメージを減らします。凍結トークンは相手を凍結させます。体力トークンは最大HPと現在HPを増やします。合成トークンは隣接する呪文列を統合できます。強化トークンは近くの呪文を強くします。チャージトークンはスロットをチャージします。容量トークンは隣接する列に入れられるトークン数を増やします。',
          '各トークンの効果を確認するには、トークンアイコンにカーソルを合わせてツールチップを表示してください。',
        ],
      },
      {
        heading: 'バトル',
        paragraphs: [
          'バトルはサイコロを振って行います。自分のバトルターンではサイコロを振り、出た数字と同じ呪文列を発動します。相手も自分のターンで同じように行動します。',
          '例えば、3列目にダメージトークンがあり、3を出した場合、相手にダメージを与えます。3列目にガードトークンがあれば、自分にガードを付与します。同じ列にダメージとガードが両方ある場合、両方の効果が発動します。',
          'カウンターと受け流しは、どの数字から攻撃されたかに関係します。相手がカウンターのある数字から攻撃してきた場合、反撃ダメージを与えられます。受け流しがある場合、その攻撃のダメージを減らせます。',
          '列が合成されている場合もあります。例えば2+3の列は、2か3のどちらかが出ると発動します。',
        ],
      },
      {
        heading: 'ポーション',
        paragraphs: [
          'ポーションは、ボード上、バトル中、ミニゲーム中に役立つ特別なアイテムです。Useボタンで手動で使うポーションもあります。洞窟ランナーのように、条件を満たした時に自動で発動するポーションもあります。',
          '通常、ボード用ポーションは1回のボードターンに1つ、バトル用ポーションは1回のバトルターンに1つだけ使用できます。ミニ用ポーションは別扱いで、対応するミニゲームやイベントでのみ使えます。',
          'ポーションはHPを回復したり、サイコロを助けたり、トークンを複製したり、他のプレイヤーに影響を与えたり、危険から守ったり、イベントの結果を変えたりします。',
          '各ポーションの効果を確認するには、ポーションアイコンにカーソルを合わせてツールチップを表示してください。',
        ],
      },
      {
        heading: '環境',
        paragraphs: [
          'ボードにはさまざまな環境があります。環境によって危険度や起こるイベントが変わります。',
          '野原は比較的安全で、簡単なイベントが多く起こります。丘では洞窟に出会うことがあります。砂利や泥はより危険で、ハザードも多くなります。小川や川では川のミニゲームが起こりやすくなります。林や森ではより強いバトルが発生します。山は特に危険な場所で、強い敵、洞窟、ハザードが発生します。',
        ],
      },
      {
        heading: '特徴',
        paragraphs: [
          'スタートゾーンはプレイヤーがゲームを開始する場所であり、リスポーンした時に戻る場所でもあります。',
          '村はプレイヤーを助けてくれる場所です。村を訪れるとHPが全回復します。また、エリートタワーの攻略状況に応じて報酬をもらえることがあります。',
          'エリートタワーは特別なバトル地点です。それぞれの塔には強力な敵がいます。最後のボスに挑むには、両方のエリートタワーを攻略する必要があります。',
          'ボスの城は北東にあります。両方のエリートタワーを攻略する前に入ると、強大な力に打ち倒されます。両方のエリートタワーを攻略していれば、最後のボスに挑戦できます。ボスを倒すとゲームに勝利します。',
        ],
      },
      {
        heading: '村でできること',
        paragraphs: [
          '村を訪れると、そこで何をするかを選べます。',
          '休むを選ぶと、冒険を続ける前にHPを回復できます。',
          '杖職人を選ぶと、スペルトークンを並べ替えることができます。一度トークンを確定すると、通常は杖職人や一部のポーションを使わない限り動かせません。',
          '出発するを選ぶと、休んだり杖職人を使ったりせずに村を出ます。',
          '別の特徴マスを訪れずに同じ村を再び訪れた場合、前回選んだ選択肢が無効になることがあります。休むと杖職人はこの条件で無効になることがあります。出発するは常に選べます。',
          'これらの選択肢は、別の特徴マスを訪れる、別の村を訪れる、または死亡してリスポーンすると再び選べるようになります。',
        ],
      },
    ],
  },
};
