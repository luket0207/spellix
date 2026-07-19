import {
  getBattleTitle,
  getBattleTurnMessage,
  getEnemyDisplayName,
  getGameplayLanguage,
  getGameplayTranslations,
  getNextTurnMessage,
  getPlayerColourDisplayName,
  getRewardAddedMessage,
  getRewardPageTranslations,
  getRiverMiniGameTranslations,
  getSpellAssignmentTranslations,
} from './translations';

describe('gameplay translations', () => {
  test('returns the exact English and Japanese gameplay labels', () => {
    expect(getGameplayTranslations('en')).toEqual({
      potions: 'Potions',
      rollDice: 'Roll Dice',
      spells: 'Spells',
    });
    expect(getGameplayTranslations('jp')).toEqual({
      potions: 'ポーション',
      rollDice: 'サイコロを振る',
      spells: '呪文',
    });
  });

  test('falls back to English for missing or invalid player languages', () => {
    expect(getGameplayLanguage()).toBe('en');
    expect(getGameplayLanguage('invalid')).toBe('en');
    expect(getGameplayTranslations('invalid')).toEqual(getGameplayTranslations('en'));
  });

  test('returns every River Mini Game instruction and result in English and Japanese', () => {
    expect(getRiverMiniGameTranslations('en')).toEqual({
      continue: 'Continue',
      loss: 'You fell in the river and had to swim to the riverbank.',
      mainInstruction: 'Get over the 3 rows of rocks to make it to the other side.',
      returnNotice: 'You crossed the river! You may roll again.',
      rowInstructions: [
        'Choose a safe rock in the first row.',
        'Choose a safe rock in the second row.',
        'Choose a safe rock to make it to the other side.',
      ],
      win: 'You made it to the other side! Take your reward and roll again.',
    });
    expect(getRiverMiniGameTranslations('jp')).toEqual({
      continue: '続ける',
      loss: '川に落ちてしまい、岸まで泳がなければなりませんでした。',
      mainInstruction: '3列の岩を越えて、反対岸にたどり着いてください。',
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
      assignReward: 'Assign reward',
      cancel: 'Cancel',
      confirm: 'Confirm',
      discard: 'Discard',
      dropTokensHere: 'Drop tokens here',
      newRewardToken: 'New Reward Token',
      noAvailableTokens: 'No available tokens',
      save: 'Save',
      spells: 'Spells',
      tokenBag: 'Token Bag',
    });
    expect(japanese).toMatchObject({
      assignReward: '報酬を割り当てる',
      cancel: 'キャンセル',
      confirm: '確定',
      discard: '破棄',
      dropTokensHere: 'ここにトークンをドロップ',
      newRewardToken: '新しい報酬トークン',
      noAvailableTokens: '使用可能なトークンがありません',
      save: '保存',
      spells: '呪文',
      tokenBag: 'トークンバッグ',
    });
    expect(japanese.placedInSpellSlot(3)).toBe('呪文スロット3に配置');
    expect(getSpellAssignmentTranslations('invalid')).toBe(english);
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
      chooseOneReward: 'Choose one reward',
    });
    expect(getRewardPageTranslations('jp')).toEqual({
      choose: '選ぶ',
      chooseOneReward: '報酬を1つ選んでください',
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
