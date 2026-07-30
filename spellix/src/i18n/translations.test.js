import {
  getBattleLossMessage,
  getBattleTitle,
  getBattleTurnMessage,
  getCaveMiniGameTranslations,
  getDecisionTranslations,
  getEnemyDisplayName,
  getGameplayLanguage,
  getGameplayTranslations,
  getHazardTranslations,
  getLootChestTranslations,
  getMiniGameFailureTranslations,
  getNextTurnMessage,
  getPlayerColourDisplayName,
  getPotionUsageTranslations,
  getRewardAddedMessage,
  getRewardPageTranslations,
  getRiverMiniGameTranslations,
  getSpellAssignmentTranslations,
  getVillageTranslations,
} from './translations';

describe('gameplay translations', () => {
  test('returns exact Hazard copy in both languages with English fallback', () => {
    const english = getHazardTranslations('en');
    const japanese = getHazardTranslations('jp');

    expect(english).toEqual({
      environment: 'Hazard Environment',
      hazard: 'Hazard',
      hazards: 'Hazards',
      loseHealth: expect.any(Function),
      loseNextTurn: 'Lose your next turn',
      triggerHazard: 'Trigger Hazard',
    });
    expect(english.loseHealth(5)).toBe('Lose 5 health');
    expect(english.loseHealth(10)).toBe('Lose 10 health');
    expect(japanese).toEqual({
      environment: 'ハザード環境',
      hazard: 'ハザード',
      hazards: 'ハザード',
      loseHealth: expect.any(Function),
      loseNextTurn: '次のターンを失う',
      triggerHazard: 'ハザードを発生させる',
    });
    expect(japanese.loseHealth(5)).toBe('HPを5失う');
    expect(japanese.loseHealth(10)).toBe('HPを10失う');
    expect(getHazardTranslations('invalid')).toBe(english);
  });

  test('returns exact Village copy in both languages with English fallback', () => {
    const english = getVillageTranslations('en');
    const japanese = getVillageTranslations('jp');

    expect(english.continue).toBe('Continue');
    expect(english.heal).toBe(
      'Take a rest and recover in our village.'
    );
    expect(english.lootChest).toBe(
      'Thank you for visiting our village traveller. We have this old chest here if you wish to open it.'
    );
    expect(english.openLootChest).toBe('Open Loot Chest');
    expect(english.potion('Crowned Lichlord')).toBe(
      'Thank you for defeating Crowned Lichlord! The village will be much safer with you around. Please take this as a sign of our appreciation.'
    );
    expect(english.token).toBe(
      'Wow, you really are powerful. Now you have defeated both of the towers, take this to help you defeat the main boss in his castle, north east of here.'
    );
    expect(japanese.continue).toBe('\u7d9a\u3051\u308b');
    expect(japanese.heal).toBe(
      '\u79c1\u305f\u3061\u306e\u6751\u3067\u4f11\u3093\u3067\u3001\u4f53\u529b\u3092\u56de\u5fa9\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
    );
    expect(japanese.lootChest).toBe(
      '\u79c1\u305f\u3061\u306e\u6751\u3078\u3088\u3046\u3053\u305d\u3001\u65c5\u4eba\u3055\u3093\u3002\u3053\u3053\u306b\u53e4\u3044\u5b9d\u7bb1\u304c\u3042\u308a\u307e\u3059\u3002\u3088\u308d\u3057\u3051\u308c\u3070\u3001\u958b\u3051\u3066\u307f\u307e\u305b\u3093\u304b\uff1f'
    );
    expect(japanese.openLootChest).toBe(
      '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u958b\u3051\u308b'
    );
    expect(japanese.potion('\u738b\u51a0\u306e\u30ea\u30c3\u30c1\u30ed\u30fc\u30c9')).toBe(
      '\u738b\u51a0\u306e\u30ea\u30c3\u30c1\u30ed\u30fc\u30c9\u3092\u5012\u3057\u3066\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046\uff01\u3042\u306a\u305f\u304c\u3044\u3066\u304f\u308c\u308c\u3070\u3001\u3053\u306e\u6751\u3082\u305a\u3063\u3068\u5b89\u5168\u306b\u306a\u308a\u307e\u3059\u3002\u611f\u8b1d\u306e\u3057\u308b\u3057\u306b\u3001\u3053\u3061\u3089\u3092\u304a\u53d7\u3051\u53d6\u308a\u304f\u3060\u3055\u3044\u3002'
    );
    expect(japanese.token).toBe(
      '\u3059\u3054\u3044\u3001\u672c\u5f53\u306b\u5f37\u3044\u3093\u3067\u3059\u306d\u3002\u3053\u308c\u30672\u3064\u306e\u5854\u3092\u4e21\u65b9\u653b\u7565\u3057\u307e\u3057\u305f\u3002\u3053\u3053\u304b\u3089\u5317\u6771\u306b\u3042\u308b\u57ce\u306e\u30dc\u30b9\u3092\u5012\u3059\u305f\u3081\u306b\u3001\u3053\u308c\u3092\u5f79\u7acb\u3066\u3066\u304f\u3060\u3055\u3044\u3002'
    );
    expect(getVillageTranslations('invalid')).toBe(english);
  });

  test('returns exact Decision controls in both languages with English fallback', () => {
    const english = getDecisionTranslations('en');
    const japanese = getDecisionTranslations('jp');

    expect(english).toEqual({
      continue: 'Continue',
      decision: 'Decision',
      environment: 'Decision Environment',
      goodDecisionsActive: 'Active',
      startDecision: 'Start Decision',
      use: 'Use',
    });
    expect(japanese).toEqual({
      continue: '続ける',
      decision: '決断',
      environment: '決断の背景',
      goodDecisionsActive: '発動中',
      startDecision: '決断を開始',
      use: '使用する',
    });
    expect(getDecisionTranslations('invalid')).toBe(english);
  });

  test('returns exact Loot Chest copy in both languages with English fallback', () => {
    const english = getLootChestTranslations('en');
    const japanese = getLootChestTranslations('jp');

    expect(english.title).toBe('Choose your loot');
    expect(english.choose).toBe('Choose');
    expect(english.continue).toBe('Continue');
    expect(english.nothing).toBe('Nothing');
    expect(english.result('Damage token')).toBe('You got a Damage token');
    expect(english.result('Nothing', false)).toBe('You got Nothing');
    expect(japanese.title).toBe('戦利品を選んでください。');
    expect(japanese.choose).toBe('選ぶ');
    expect(japanese.continue).toBe('続ける');
    expect(japanese.nothing).toBe('何もなし');
    expect(japanese.result('ダメージトークン')).toBe(
      'ダメージトークンを手に入れました。'
    );
    expect(getLootChestTranslations('invalid')).toBe(english);
  });

  test('returns Mini Game Failed punishment translations with English fallback', () => {
    const english = getMiniGameFailureTranslations('en');
    const japanese = getMiniGameFailureTranslations('jp');

    expect(english.continue).toBe('Continue');
    expect(english.caveRunnerPreventedDamage).toBe(
      'You didn’t lose any health because the Cave Runner potion helped you get out before the ogre reached you.'
    );
    expect(english.punishment(25)).toBe('You lost 25 health');
    expect(english.respawn).toBe('Respawn');
    expect(japanese.continue).toBe('続ける');
    expect(japanese.caveRunnerPreventedDamage).toBe(
      '洞窟ランナーのポーションのおかげで、オーガに追いつかれる前に脱出できたため、HPを失いませんでした。'
    );
    expect(japanese.punishment(25)).toBe('体力を25失いました。');
    expect(japanese.respawn).toBe('リスポーン');
    expect(getMiniGameFailureTranslations('invalid')).toBe(english);
  });

  test('returns complete Cave Mini Game translations with English fallback', () => {
    const english = getCaveMiniGameTranslations('en');
    const japanese = getCaveMiniGameTranslations('jp');

    expect(english).toMatchObject({
      active: 'Active',
      continue: 'Continue',
      goDeeper: 'Go Deeper',
      openLoot: 'Open Loot',
      retreat: 'Retreat',
      rollAgainNotice:
        'Your roll again potion was used, it is your turn to roll again.',
      messages: {
        initial: 'Explore deeper into the cave, but beware of ogres.',
        loot: 'You found a loot chest',
        nothing: 'There is nothing in this part of the cave',
        ogre: 'You were chased out of the cave by an ogre, dropping all of your loot on the way out.',
        potion: 'You found a potion',
        retreated: 'You got out with your…',
        rollAgain: 'You found a potion to let you roll again this turn',
        token: 'You found a token',
      },
      summary: {
        loot: 'Loot Chest',
        none: 'No rewards found.',
        potion: 'Potion',
        rollAgain: 'Roll Again Potion',
        title: 'Rewards found:',
        token: 'Token',
      },
    });
    expect(japanese.goDeeper).toBe('さらに奥へ進む');
    expect(japanese.active).toBe('発動中');
    expect(japanese.retreat).toBe('引き返す');
    expect(japanese.continue).toBe('続ける');
    expect(japanese.openLoot).toBe('戦利品を開ける');
    expect(japanese.summary.title).toBe('見つけた報酬：');
    expect(japanese.summary.loot).toBe('戦利品の宝箱');
    expect(japanese.summary.rollAgain).toBe('もう一度サイコロを振れるポーション');
    expect(japanese.rollAgainNotice).toBe(
      'もう一度サイコロを振れるポーションが使用されました。もう一度サイコロを振る番です。'
    );
    expect(english.rewardGrant.tokenBagFull).toBe('Token bag is full');
    expect(english.rewardGrant.potionSlotsFull).toBe('Potion slots are full');
    expect(english.rewardGrant.replaceToken('Damage')).toBe('Replace Damage');
    expect(japanese.rewardGrant.tokenBagFull).toBe('トークンバッグがいっぱいです');
    expect(japanese.rewardGrant.potionSlotsFull).toBe('ポーションスロットがいっぱいです');
    expect(japanese.rewardGrant.discardNewToken).toBe('新しいトークンを破棄');
    expect(japanese.rewardGrant.discardNewPotion).toBe('新しいポーションを破棄');
    expect(japanese.messages).toEqual({
      initial: '洞窟のさらに奥を探索してください。ただし、オーガには気をつけてください。',
      loot: '戦利品の宝箱を見つけました。',
      nothing: '洞窟のこの辺りには何もありません。',
      ogre: 'オーガに追い出され、逃げる途中ですべての戦利品を落としてしまいました。',
      potion: 'ポーションを見つけました。',
      retreated: '戦利品を持って脱出しました…',
      rollAgain: 'このターン、もう一度サイコロを振れるポーションを見つけました。',
      token: 'トークンを見つけました。',
    });
    expect(getCaveMiniGameTranslations('invalid')).toBe(english);
  });

  test('returns the exact English and Japanese gameplay labels', () => {
    expect(getGameplayTranslations('en')).toEqual({
      deathLastTurn: 'You died in your last turn',
      heavyWeightDiceResult: expect.any(Function),
      potions: 'Potions',
      respawnNoTokenRemoved: 'No tokens were able to be removed',
      respawnTokenRemoved: 'This token has been removed',
      rollDice: 'Roll Dice',
      rollEvenToUnfreeze: 'Roll even to unfreeze',
      skipTurnMessage: 'You miss your turn this turn',
      spells: 'Spells',
      spellsNew: 'New',
      targetPlayerChoose: 'Choose',
      targetPlayerPrompt: 'Choose a player to target',
    });
    expect(getGameplayTranslations('jp')).toEqual({
      deathLastTurn: '前のターンで死亡しました。',
      heavyWeightDiceResult: expect.any(Function),
      potions: 'ポーション',
      respawnNoTokenRemoved: 'トークンを取り除くことができませんでした。',
      respawnTokenRemoved: 'このトークンは取り除かれました。',
      rollDice: 'サイコロを振る',
      spells: '呪文',
      spellsNew: '新規',
      rollEvenToUnfreeze:
        '\u51cd\u7d50\u72b6\u614b\u3092\u89e3\u9664\u3059\u308b\u306b\u306f\u3001\u5076\u6570\u3092\u51fa\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      skipTurnMessage:
        '\u3053\u306e\u30bf\u30fc\u30f3\u306f\u884c\u52d5\u3067\u304d\u307e\u305b\u3093\u3002',
      targetPlayerChoose: '\u9078\u3076',
      targetPlayerPrompt:
        '\u5bfe\u8c61\u306b\u3059\u308b\u30d7\u30ec\u30a4\u30e4\u30fc\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002',
    });
    expect(getGameplayTranslations('en').heavyWeightDiceResult(3)).toBe(
      '3 - Dice roll is halved because you are weighed down.'
    );
    expect(getGameplayTranslations('jp').heavyWeightDiceResult(3)).toBe(
      '3 - \u91cd\u3057\u3092\u304b\u3051\u3089\u308c\u3066\u3044\u308b\u305f\u3081\u3001\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u304c\u534a\u5206\u306b\u306a\u308a\u307e\u3059\u3002'
    );
  });

  test('falls back to English for missing or invalid player languages', () => {
    expect(getGameplayLanguage()).toBe('en');
    expect(getGameplayLanguage('invalid')).toBe('en');
    expect(getGameplayTranslations('invalid')).toEqual(getGameplayTranslations('en'));
  });

  test('returns exact potion usage copy in both languages with English fallback', () => {
    const english = getPotionUsageTranslations('en');
    const japanese = getPotionUsageTranslations('jp');

    expect(english.confirmUse('Roll Choice')).toBe(
      'Are you sure you want to use Roll Choice?'
    );
    expect(english).toMatchObject({
      activePotionTitle: 'Active Potion',
      descriptionTitle: 'Potion Description',
      no: 'No',
      noBattlePotions: 'You have no battle potions at the moment',
      rollChoiceQuestion: 'What do you want the next roll of the dice to be?',
      use: 'Use',
      yes: 'Yes',
    });
    expect(japanese.confirmUse('\u51fa\u76ee\u9078\u629e')).toBe(
      '\u51fa\u76ee\u9078\u629e\u3092\u4f7f\u7528\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f'
    );
    expect(japanese).toMatchObject({
      activePotionTitle:
        '\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3',
      descriptionTitle: '\u30dd\u30fc\u30b7\u30e7\u30f3\u306e\u8aac\u660e',
      no: '\u3044\u3044\u3048',
      noBattlePotions:
        '\u73fe\u5728\u3001\u30d0\u30c8\u30eb\u7528\u30dd\u30fc\u30b7\u30e7\u30f3\u3092\u6301\u3063\u3066\u3044\u307e\u305b\u3093\u3002',
      rollChoiceQuestion:
        '\u6b21\u306e\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u3092\u3044\u304f\u3064\u306b\u3057\u307e\u3059\u304b\uff1f',
      use: '\u4f7f\u7528\u3059\u308b',
      yes: '\u306f\u3044',
    });
    expect(getPotionUsageTranslations('invalid')).toBe(english);
  });

  test('returns every River Mini Game instruction and result in English and Japanese', () => {
    expect(getRiverMiniGameTranslations('en')).toEqual({
      bridgeBuilderSuccess:
        'The potion created a bridge over the river for you',
      continue: 'Continue',
      loss: 'You fell in the river and had to swim to the riverbank.',
      mainInstruction: 'Get over the 3 rows of rocks to make it to the other side.',
      ok: 'OK',
      returnNotice: 'You crossed the river! You may roll again.',
      rowInstructions: [
        'Choose a safe rock in the first row.',
        'Choose a safe rock in the second row.',
        'Choose a safe rock to make it to the other side.',
      ],
      win: 'You made it to the other side! Take your reward and roll again.',
    });
    expect(getRiverMiniGameTranslations('jp')).toEqual({
      bridgeBuilderSuccess: 'ポーションが川に橋を架けてくれました。',
      continue: '続ける',
      loss: '川に落ちてしまい、岸まで泳がなければなりませんでした。',
      mainInstruction: '3列の岩を越えて、反対岸にたどり着いてください。',
      ok: 'OK',
      returnNotice: '川を渡り切りました！もう一度サイコロを振ることができます。',
      rowInstructions: [
        '1列目から安全な岩を選んでください。',
        '2列目から安全な岩を選んでください。',
        '反対岸にたどり着くため、安全な岩を選んでください。',
      ],
      win: '反対岸にたどり着きました！報酬を受け取り、もう一度サイコロを振ってください。',
    });
    expect(getRiverMiniGameTranslations('invalid')).toBe(
      getRiverMiniGameTranslations('en')
    );
  });

  test('returns the required spell assignment translations and English fallback', () => {
    const english = getSpellAssignmentTranslations('en');
    const japanese = getSpellAssignmentTranslations('jp');

    expect(english).toMatchObject({
      assignReward: 'Assign Reward',
      cancel: 'Cancel',
      confirm: 'Confirm',
      discard: 'Discard',
      dropTokensHere: 'Drop tokens here',
      newRewardToken: 'New Reward Token',
      noAvailableTokens: 'No available tokens',
      rewardPlacementInstruction:
        'Place the token into your spells, token bag or discard it to continue',
      save: 'Save',
      spells: 'Spells',
      tokenBag: 'Token Bag',
      trash: 'Trash',
    });
    expect(japanese).toMatchObject({
      assignReward: '報酬を割り当てる',
      cancel: 'キャンセル',
      confirm: '確定',
      discard: '破棄',
      dropTokensHere: 'ここにトークンをドロップ',
      newRewardToken: '新しい報酬トークン',
      noAvailableTokens: '使用可能なトークンがありません',
      rewardPlacementInstruction:
        '続けるには、トークンを自分のスペルかトークンバッグに配置するか、破棄してください。',
      save: '保存',
      spells: '呪文',
      tokenBag: 'トークンバッグ',
      trash: 'ゴミ箱',
    });
    expect(japanese.placedInSpellSlot(3)).toBe('呪文スロット3に配置');
    expect(english.mergeConfirmation(2, 3, 3)).toBe(
      'Committing this change will merge columns 2 and 3. This means you will lose the tokens from column 3. Is this ok?'
    );
    expect(japanese.mergeConfirmation(2, 3, 3)).toBe(
      'この変更を確定すると、列2と列3が統合されます。そのため、列3にあるトークンは失われます。よろしいですか？'
    );
    expect(english.overCapacity([1, 3])).toBe(
      'Columns 1 and 3 exceed their token capacity.'
    );
    expect(japanese.overCapacity([1, 3])).toBe(
      '列1と列3がトークン容量を超えています。'
    );
    expect(getSpellAssignmentTranslations('invalid')).toBe(english);
  });

  test('returns localized Reward page Continue copy', () => {
    expect(getRewardPageTranslations('en').continue).toBe('Continue');
    expect(getRewardPageTranslations('jp').continue).toBe('続ける');
    expect(getRewardPageTranslations('invalid').continue).toBe('Continue');
  });

  test('formats next-turn and reward completion messages in the player language', () => {
    expect(getNextTurnMessage('en', 'blue')).toBe('Blue Players Turn');
    expect(getNextTurnMessage('jp', 'red')).toBe('プレイヤー赤のターン');
    expect(getNextTurnMessage('jp', 'orange')).toBe('プレイヤーオレンジのターン');
    expect(getNextTurnMessage('invalid', 'green')).toBe('Green Players Turn');
    expect(getRewardAddedMessage('en', 'spellSlot', 2)).toBe(
      'Reward added to spell slot 2'
    );
    expect(getRewardAddedMessage('jp', 'tokenBag')).toBe(
      '報酬をトークンバッグに追加しました'
    );
    expect(getRewardAddedMessage('jp', 'discard')).toBe(
      '報酬を破棄エリアに追加しました'
    );
  });

  test('returns reward choice translations with an English fallback', () => {
    expect(getRewardPageTranslations('en')).toEqual({
      choose: 'Choose',
      chooseOneReward: 'Choose your reward',
      continue: 'Continue',
      potionAdded: 'Reward potion added.',
      potionDiscarded: 'Reward potion discarded.',
      potionReplaced: 'Reward potion replaced an existing potion.',
    });
    expect(getRewardPageTranslations('jp')).toEqual({
      choose: '選ぶ',
      chooseOneReward: '報酬を選んでください。',
      continue: '続ける',
      potionAdded: '報酬ポーションを追加しました。',
      potionDiscarded: '報酬ポーションを破棄しました。',
      potionReplaced: '報酬ポーションで既存のポーションを交換しました。',
    });
    expect(getRewardPageTranslations('invalid')).toBe(getRewardPageTranslations('en'));
  });

  test('formats battle actors, turns, and titles in the battling player language', () => {
    const enemy = {
      englishName: 'Vilewhisker Rat',
      japaneseName: '毒ヒゲネズミ',
    };

    expect(getPlayerColourDisplayName('en', 'blue')).toBe('Blue');
    expect(getPlayerColourDisplayName('jp', 'blue')).toBe('青');
    expect(getEnemyDisplayName('en', enemy)).toBe('Vilewhisker Rat');
    expect(getEnemyDisplayName('jp', enemy)).toBe('毒ヒゲネズミ');
    expect(getBattleTurnMessage('en', 'Vilewhisker Rat')).toBe('Vilewhisker Rat Turn');
    expect(getBattleTurnMessage('jp', '毒ヒゲネズミ')).toBe('毒ヒゲネズミのターン');
    expect(getBattleLossMessage('en')).toBe('The player has lost.');
    expect(getBattleLossMessage('jp')).toBe('プレイヤーは敗北しました。');
    expect(getBattleTitle('en', enemy)).toBe('Vilewhisker Rat Battle');
    expect(getBattleTitle('jp', enemy)).toBe('毒ヒゲネズミバトル');
  });

  test('falls back to English battle names when language or Japanese enemy data is missing', () => {
    const enemy = { englishName: 'Vilewhisker Rat' };

    expect(getEnemyDisplayName('jp', enemy)).toBe('Vilewhisker Rat');
    expect(getBattleTitle('jp', enemy)).toBe('Vilewhisker Ratバトル');
    expect(getBattleTitle('invalid', enemy)).toBe('Vilewhisker Rat Battle');
  });
});
