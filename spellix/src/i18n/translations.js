import { DEFAULT_PLAYER_LANGUAGE, PLAYER_LANGUAGES } from '../features/gameSetup/gameSetup';

const GAMEPLAY_TRANSLATIONS = {
  en: {
    potions: 'Potions',
    rollDice: 'Roll Dice',
    spells: 'Spells',
  },
  jp: {
    potions: 'ポーション',
    rollDice: 'サイコロを振る',
    spells: '呪文',
  },
};

const REWARD_PAGE_TRANSLATIONS = {
  en: {
    choose: 'Choose',
    chooseOneReward: 'Choose your reward',
    continue: 'Continue',
    potionAdded: 'Reward potion added.',
    potionDiscarded: 'Reward potion discarded.',
    potionReplaced: 'Reward potion replaced an existing potion.',
  },
  jp: {
    choose: '選ぶ',
    chooseOneReward: '報酬を選んでください。',
    continue: '続ける',
    potionAdded: '報酬ポーションを追加しました。',
    potionDiscarded: '報酬ポーションを破棄しました。',
    potionReplaced: '報酬ポーションで既存のポーションを交換しました。',
  },
};

const LOOT_CHEST_TRANSLATIONS = {
  en: {
    choose: 'Choose',
    continue: 'Continue',
    nothing: 'Nothing',
    result: (rewardName, useArticle = true) =>
      `You got ${useArticle ? 'a ' : ''}${rewardName}`,
    title: 'Choose your loot',
  },
  jp: {
    choose: '\u9078\u3076',
    continue: '\u7d9a\u3051\u308b',
    nothing: '\u4f55\u3082\u306a\u3057',
    result: (rewardName) => `${rewardName}\u3092\u624b\u306b\u5165\u308c\u307e\u3057\u305f\u3002`,
    title: '\u6226\u5229\u54c1\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002',
  },
};

const RIVER_MINI_GAME_TRANSLATIONS = {
  en: {
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
  },
  jp: {
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
  },
};

const CAVE_MINI_GAME_TRANSLATIONS = {
  en: {
    continue: 'Continue',
    goDeeper: 'Go Deeper',
    openLoot: 'Open Loot',
    messages: {
      initial: 'Explore deeper into the cave, but beware of ogres.',
      loot: 'You found a loot chest',
      nothing: 'There is nothing in this part of the cave',
      ogre:
        'You were chased out of the cave by an ogre, dropping all of your loot on the way out.',
      potion: 'You found a potion',
      retreated: 'You got out with your…',
      rollAgain: 'You found a potion to let you roll again this turn',
      token: 'You found a token',
    },
    retreat: 'Retreat',
    rewardGrant: {
      choosePotion: 'Choose a potion to replace, or discard the new potion.',
      chooseToken: 'Choose a token to replace, or discard the new token.',
      currentPotions: 'Current potions',
      currentTokens: 'Current token bag',
      discardNewPotion: 'Discard new potion',
      discardNewToken: 'Discard new token',
      newPotion: 'New potion',
      newToken: 'New token',
      potionSlotsFull: 'Potion slots are full',
      replacePotion: (name) => `Replace ${name}`,
      replaceToken: (name) => `Replace ${name}`,
      tokenBagFull: 'Token bag is full',
    },
    rollAgainNotice:
      'Your roll again potion was used, it is your turn to roll again.',
    summary: {
      loot: 'Loot Chest',
      none: 'No rewards found.',
      potion: 'Potion',
      rollAgain: 'Roll Again Potion',
      title: 'Rewards found:',
      token: 'Token',
    },
  },
  jp: {
    continue: '続ける',
    goDeeper: 'さらに奥へ進む',
    openLoot: '戦利品を開ける',
    messages: {
      initial: '洞窟のさらに奥を探索してください。ただし、オーガには気をつけてください。',
      loot: '戦利品の宝箱を見つけました。',
      nothing: '洞窟のこの辺りには何もありません。',
      ogre: 'オーガに追い出され、逃げる途中ですべての戦利品を落としてしまいました。',
      potion: 'ポーションを見つけました。',
      retreated: '戦利品を持って脱出しました…',
      rollAgain: 'このターン、もう一度サイコロを振れるポーションを見つけました。',
      token: 'トークンを見つけました。',
    },
    retreat: '引き返す',
    rewardGrant: {
      choosePotion: '交換するポーションを選ぶか、新しいポーションを破棄してください。',
      chooseToken: '交換するトークンを選ぶか、新しいトークンを破棄してください。',
      currentPotions: '現在のポーション',
      currentTokens: '現在のトークンバッグ',
      discardNewPotion: '新しいポーションを破棄',
      discardNewToken: '新しいトークンを破棄',
      newPotion: '新しいポーション',
      newToken: '新しいトークン',
      potionSlotsFull: 'ポーションスロットがいっぱいです',
      replacePotion: (name) => `${name}を交換`,
      replaceToken: (name) => `${name}を交換`,
      tokenBagFull: 'トークンバッグがいっぱいです',
    },
    rollAgainNotice:
      'もう一度サイコロを振れるポーションが使用されました。もう一度サイコロを振る番です。',
    summary: {
      loot: '戦利品の宝箱',
      none: '報酬は見つかりませんでした。',
      potion: 'ポーション',
      rollAgain: 'もう一度サイコロを振れるポーション',
      title: '見つけた報酬：',
      token: 'トークン',
    },
  },
};

const MINI_GAME_FAILURE_TRANSLATIONS = {
  en: {
    continue: 'Continue',
    punishment: (healthLost) => `You lost ${healthLost} health`,
    respawn: 'Respawn',
  },
  jp: {
    continue: '続ける',
    punishment: (healthLost) => `体力を${healthLost}失いました。`,
    respawn: 'リスポーン',
  },
};

const SPELL_ASSIGNMENT_TRANSLATIONS = {
  en: {
    assignReward: 'Assign Reward',
    cancel: 'Cancel',
    cancelConfirmation:
      'Are you sure you want to cancel? All changes to your spell slots will be lost',
    confirm: 'Confirm',
    discard: 'Discard',
    discardAreaLocation: 'discard area',
    dropTokensHere: 'Drop tokens here',
    newRewardToken: 'New Reward Token',
    mergeConfirmation: (firstColumn, secondColumn, removedColumn) =>
      `Committing this change will merge columns ${firstColumn} and ${secondColumn}. This means you will lose the tokens from column ${removedColumn}. Is this ok?`,
    no: 'No',
    noAvailableTokens: 'No available tokens',
    overCapacity: (columns) =>
      columns.length === 1
        ? `Column ${columns[0]} exceeds its token capacity.`
        : `Columns ${columns.join(' and ')} exceed their token capacity.`,
    rewardPlacementInstruction:
      'Place the token into your spells, token bag or discard it to continue',
    placedInDiscardArea: 'Placed in discard area',
    placedInSpellSlot: (slotNumber) => `Placed in spell slot ${slotNumber}`,
    placedInTokenBag: 'Placed in token bag',
    rewardAddedTo: (location) => `Reward added to ${location}`,
    save: 'Save',
    saveConfirmation:
      'Are you sure you want to commit your tokens to these spell slots? This cannot be changed without using potions once they are saved.',
    spellSlotLocation: (slotNumber) => `spell slot ${slotNumber}`,
    spells: 'Spells',
    startingTokenWarning:
      'You must place all 7 starting tokens into spell slots before rolling dice. Place your tokens by dragging them from your token bag into the spell slots.',
    spellsInfo:
      'Drag and drop tokens from your token bag into spell slots to assign them. Once you have committed your tokens, they cannot be moved again.',
    tokenBag: 'Token Bag',
    tokenBagLocation: 'token bag',
    trash: 'Trash',
    yes: 'Yes',
  },
  jp: {
    assignReward: '報酬を割り当てる',
    cancel: 'キャンセル',
    cancelConfirmation: 'キャンセルしますか？呪文スロットへの変更はすべて失われます。',
    confirm: '確定',
    discard: '破棄',
    discardAreaLocation: '破棄エリア',
    dropTokensHere: 'ここにトークンをドロップ',
    newRewardToken: '新しい報酬トークン',
    mergeConfirmation: (firstColumn, secondColumn, removedColumn) =>
      `この変更を確定すると、列${firstColumn}と列${secondColumn}が統合されます。そのため、列${removedColumn}にあるトークンは失われます。よろしいですか？`,
    no: 'いいえ',
    noAvailableTokens: '使用可能なトークンがありません',
    overCapacity: (columns) =>
      `列${columns.join('と列')}がトークン容量を超えています。`,
    rewardPlacementInstruction:
      '続けるには、トークンを自分のスペルかトークンバッグに配置するか、破棄してください。',
    placedInDiscardArea: '破棄エリアに配置',
    placedInSpellSlot: (slotNumber) => `呪文スロット${slotNumber}に配置`,
    placedInTokenBag: 'トークンバッグに配置',
    rewardAddedTo: (location) => `報酬を${location}に追加しました`,
    save: '保存',
    saveConfirmation:
      'これらの呪文スロットにトークンを確定しますか？保存後は、ポーションを使用しない限り変更できません。',
    spellSlotLocation: (slotNumber) => `呪文スロット${slotNumber}`,
    spells: '呪文',
     startingTokenWarning:
      'サイコロを振る前に、7個すべての初期トークンをスペルスロットに配置する必要があります。トークンバッグからスペルスロットにドラッグして、トークンを配置してください。',
    spellsInfo:
      'トークンバッグからスペルスロットにトークンをドラッグ＆ドロップして割り当ててください。一度トークンの配置を確定すると、その後は移動できません。',
    tokenBag: 'トークンバッグ',
    tokenBagLocation: 'トークンバッグ',
    trash: 'ゴミ箱',
    yes: 'はい',
  },
};

const JAPANESE_COLOUR_NAMES = {
  blue: '青',
  green: '緑',
  orange: 'オレンジ',
  purple: '紫',
  red: '赤',
  yellow: '黄色',
};

export function getGameplayLanguage(language) {
  return PLAYER_LANGUAGES.includes(language) ? language : DEFAULT_PLAYER_LANGUAGE;
}

export function getGameplayTranslations(language) {
  return GAMEPLAY_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getRewardPageTranslations(language) {
  return REWARD_PAGE_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getLootChestTranslations(language) {
  return LOOT_CHEST_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getRiverMiniGameTranslations(language) {
  return RIVER_MINI_GAME_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getCaveMiniGameTranslations(language) {
  return CAVE_MINI_GAME_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getMiniGameFailureTranslations(language) {
  return MINI_GAME_FAILURE_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getSpellAssignmentTranslations(language) {
  return SPELL_ASSIGNMENT_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getPlayerColourDisplayName(language, colour = '') {
  const normalizedLanguage = getGameplayLanguage(language);
  const normalizedColour = colour.toLowerCase();

  if (normalizedLanguage === 'jp') {
    return JAPANESE_COLOUR_NAMES[normalizedColour] ?? colour;
  }

  return normalizedColour
    ? `${normalizedColour.charAt(0).toUpperCase()}${normalizedColour.slice(1)}`
    : colour;
}

export function getEnemyDisplayName(language, enemy) {
  const normalizedLanguage = getGameplayLanguage(language);

  return normalizedLanguage === 'jp' && enemy?.japaneseName
    ? enemy.japaneseName
    : enemy?.englishName ?? '';
}

export function getBattleTurnMessage(language, actorName) {
  return getGameplayLanguage(language) === 'jp'
    ? `${actorName}のターン`
    : `${actorName} Turn`;
}

export function getBattleLossMessage(language) {
  return getGameplayLanguage(language) === 'jp'
    ? 'プレイヤーは敗北しました。'
    : 'The player has lost.';
}

export function getBattleTitle(language, enemy) {
  const normalizedLanguage = getGameplayLanguage(language);
  const enemyName = getEnemyDisplayName(normalizedLanguage, enemy);

  return normalizedLanguage === 'jp' ? `${enemyName}バトル` : `${enemyName} Battle`;
}

export function getNextTurnMessage(language, colour = '') {
  const normalizedLanguage = getGameplayLanguage(language);
  const displayedColour = getPlayerColourDisplayName(normalizedLanguage, colour);

  if (normalizedLanguage === 'jp') {
    return `プレイヤー${displayedColour}のターン`;
  }

  return `${displayedColour} Players Turn`;
}

export function getRewardAddedMessage(language, destination, spellSlotNumber) {
  const translations = getSpellAssignmentTranslations(language);
  const location =
    destination === 'spellSlot'
      ? translations.spellSlotLocation(spellSlotNumber)
      : destination === 'discard'
        ? translations.discardAreaLocation
        : translations.tokenBagLocation;

  return translations.rewardAddedTo(location);
}
