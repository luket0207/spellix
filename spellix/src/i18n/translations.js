import { DEFAULT_PLAYER_LANGUAGE, PLAYER_LANGUAGES } from '../features/gameSetup/gameSetup';

const GAMEPLAY_TRANSLATIONS = {
  en: {
    deathLastTurn: 'You died in your last turn',
    heavyWeightDiceResult: (roll) =>
      `${roll} - Dice roll is halved because you are weighed down.`,
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
  },
  jp: {
    deathLastTurn:
      '\u524d\u306e\u30bf\u30fc\u30f3\u3067\u6b7b\u4ea1\u3057\u307e\u3057\u305f\u3002',
    heavyWeightDiceResult: (roll) =>
      `${roll} - \u91cd\u3057\u3092\u304b\u3051\u3089\u308c\u3066\u3044\u308b\u305f\u3081\u3001\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u304c\u534a\u5206\u306b\u306a\u308a\u307e\u3059\u3002`,
    respawnNoTokenRemoved:
      '\u30c8\u30fc\u30af\u30f3\u3092\u53d6\u308a\u9664\u304f\u3053\u3068\u304c\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002',
    respawnTokenRemoved:
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u306f\u53d6\u308a\u9664\u304b\u308c\u307e\u3057\u305f\u3002',
    potions: 'ポーション',
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
  },
};

const DECISION_TRANSLATIONS = {
  en: {
    continue: 'Continue',
    decision: 'Decision',
    environment: 'Decision Environment',
    goodDecisionsActive: 'Active',
    startDecision: 'Start Decision',
    use: 'Use',
  },
  jp: {
    continue: '続ける',
    decision: '決断',
    environment: '決断の背景',
    goodDecisionsActive: '\u767a\u52d5\u4e2d',
    startDecision: '決断を開始',
    use: '\u4f7f\u7528\u3059\u308b',
  },
};

const HAZARD_TRANSLATIONS = {
  en: {
    environment: 'Hazard Environment',
    hazard: 'Hazard',
    hazards: 'Hazards',
    loseHealth: (amount) => `Lose ${amount} health`,
    loseNextTurn: 'Lose your next turn',
    triggerHazard: 'Trigger Hazard',
  },
  jp: {
    environment: '\u30cf\u30b6\u30fc\u30c9\u74b0\u5883',
    hazard: '\u30cf\u30b6\u30fc\u30c9',
    hazards: '\u30cf\u30b6\u30fc\u30c9',
    loseHealth: (amount) => `HP\u3092${amount}\u5931\u3046`,
    loseNextTurn:
      '\u6b21\u306e\u30bf\u30fc\u30f3\u3092\u5931\u3046',
    triggerHazard:
      '\u30cf\u30b6\u30fc\u30c9\u3092\u767a\u751f\u3055\u305b\u308b',
  },
};

const VILLAGE_TRANSLATIONS = {
  en: {
    continue: 'Continue',
    heal:
      'Take a rest and recover in our village.',
    lootChest:
      'Thank you for visiting our village traveller. We have this old chest here if you wish to open it.',
    openLootChest: 'Open Loot Chest',
    potion: (enemyName) =>
      `Thank you for defeating ${enemyName}! The village will be much safer with you around. Please take this as a sign of our appreciation.`,
    token:
      'Wow, you really are powerful. Now you have defeated both of the towers, take this to help you defeat the main boss in his castle, north east of here.',
  },
  jp: {
    continue: '\u7d9a\u3051\u308b',
    heal:
      '\u79c1\u305f\u3061\u306e\u6751\u3067\u4f11\u3093\u3067\u3001\u4f53\u529b\u3092\u56de\u5fa9\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    lootChest:
      '\u79c1\u305f\u3061\u306e\u6751\u3078\u3088\u3046\u3053\u305d\u3001\u65c5\u4eba\u3055\u3093\u3002\u3053\u3053\u306b\u53e4\u3044\u5b9d\u7bb1\u304c\u3042\u308a\u307e\u3059\u3002\u3088\u308d\u3057\u3051\u308c\u3070\u3001\u958b\u3051\u3066\u307f\u307e\u305b\u3093\u304b\uff1f',
    openLootChest:
      '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u958b\u3051\u308b',
    potion: (enemyName) =>
      `${enemyName}\u3092\u5012\u3057\u3066\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046\uff01\u3042\u306a\u305f\u304c\u3044\u3066\u304f\u308c\u308c\u3070\u3001\u3053\u306e\u6751\u3082\u305a\u3063\u3068\u5b89\u5168\u306b\u306a\u308a\u307e\u3059\u3002\u611f\u8b1d\u306e\u3057\u308b\u3057\u306b\u3001\u3053\u3061\u3089\u3092\u304a\u53d7\u3051\u53d6\u308a\u304f\u3060\u3055\u3044\u3002`,
    token:
      '\u3059\u3054\u3044\u3001\u672c\u5f53\u306b\u5f37\u3044\u3093\u3067\u3059\u306d\u3002\u3053\u308c\u30672\u3064\u306e\u5854\u3092\u4e21\u65b9\u653b\u7565\u3057\u307e\u3057\u305f\u3002\u3053\u3053\u304b\u3089\u5317\u6771\u306b\u3042\u308b\u57ce\u306e\u30dc\u30b9\u3092\u5012\u3059\u305f\u3081\u306b\u3001\u3053\u308c\u3092\u5f79\u7acb\u3066\u3066\u304f\u3060\u3055\u3044\u3002',
  },
};

const POTION_USAGE_TRANSLATIONS = {
  en: {
    activePotionTitle: 'Active Potion',
    confirmUse: (potionName) => `Are you sure you want to use ${potionName}?`,
    copyPasteCancel: 'Cancel',
    copyPasteDiscardDuplicate: 'Discard this new token',
    copyPasteDiscardExisting: 'Discard this token and keep the duplicate',
    copyPasteDuplicate: 'Duplicate',
    copyPasteEmptyBag:
      'You have no tokens in your token bag, so this potion cannot be used. The potion was added back to your potion slots.',
    descriptionTitle: 'Potion Description',
    no: 'No',
    noBattlePotions: 'You have no battle potions at the moment',
    rollChoiceQuestion: 'What do you want the next roll of the dice to be?',
    tokensmithConfirmation:
      'Are you sure you want to move this token back to your token bag?',
    tokensmithFullBag:
      'This potion can only be used when you have at least 1 free slot in your token bag.',
    tokensmithInstruction: 'Click a token to move it back to your token bag',
    tokensmithInvalidSpellState:
      'This token cannot be moved because another spell column would exceed its capacity.',
    tokensmithNoAssignedTokens:
      'You have no assigned tokens to move back to your token bag.',
    use: 'Use',
    yes: 'Yes',
  },
  jp: {
    activePotionTitle:
      '\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3',
    confirmUse: (potionName) =>
      `${potionName}\u3092\u4f7f\u7528\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f`,
    copyPasteCancel: '\u30ad\u30e3\u30f3\u30bb\u30eb',
    copyPasteDiscardDuplicate:
      '\u3053\u306e\u65b0\u3057\u3044\u30c8\u30fc\u30af\u30f3\u3092\u6368\u3066\u308b',
    copyPasteDiscardExisting:
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u3092\u6368\u3066\u3066\u8907\u88fd\u30c8\u30fc\u30af\u30f3\u3092\u6b8b\u3059',
    copyPasteDuplicate: '\u8907\u88fd',
    copyPasteEmptyBag:
      '\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u30c8\u30fc\u30af\u30f3\u304c\u306a\u3044\u305f\u3081\u3001\u3053\u306e\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u4f7f\u7528\u3067\u304d\u307e\u305b\u3093\u3002\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u30dd\u30fc\u30b7\u30e7\u30f3\u30b9\u30ed\u30c3\u30c8\u306b\u623b\u3055\u308c\u307e\u3057\u305f\u3002',
    descriptionTitle:
      '\u30dd\u30fc\u30b7\u30e7\u30f3\u306e\u8aac\u660e',
    no: '\u3044\u3044\u3048',
    noBattlePotions:
      '\u73fe\u5728\u3001\u30d0\u30c8\u30eb\u7528\u30dd\u30fc\u30b7\u30e7\u30f3\u3092\u6301\u3063\u3066\u3044\u307e\u305b\u3093\u3002',
    rollChoiceQuestion:
      '\u6b21\u306e\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u3092\u3044\u304f\u3064\u306b\u3057\u307e\u3059\u304b\uff1f',
    tokensmithConfirmation:
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u3092\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f',
    tokensmithFullBag:
      '\u3053\u306e\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u3001\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u7a7a\u304d\u30b9\u30ed\u30c3\u30c8\u304c1\u3064\u4ee5\u4e0a\u3042\u308b\u5834\u5408\u306b\u306e\u307f\u4f7f\u7528\u3067\u304d\u307e\u3059\u3002',
    tokensmithInstruction:
      '\u30c8\u30fc\u30af\u30f3\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u3001\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    tokensmithInvalidSpellState:
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u3092\u623b\u3059\u3068\u30b9\u30da\u30eb\u5217\u306e\u5bb9\u91cf\u3092\u8d85\u3048\u308b\u305f\u3081\u3001\u79fb\u52d5\u3067\u304d\u307e\u305b\u3093\u3002',
    tokensmithNoAssignedTokens:
      '\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u305b\u308b\u914d\u7f6e\u6e08\u307f\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002',
    use: '\u4f7f\u7528\u3059\u308b',
    yes: '\u306f\u3044',
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
  },
  jp: {
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
  },
};

const CAVE_MINI_GAME_TRANSLATIONS = {
  en: {
    active: 'Active',
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
    active: '\u767a\u52d5\u4e2d',
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
    caveRunnerPreventedDamage:
      'You didn’t lose any health because the Cave Runner potion helped you get out before the ogre reached you.',
    continue: 'Continue',
    punishment: (healthLost) => `You lost ${healthLost} health`,
    respawn: 'Respawn',
  },
  jp: {
    caveRunnerPreventedDamage:
      '洞窟ランナーのポーションのおかげで、オーガに追いつかれる前に脱出できたため、HPを失いませんでした。',
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
    redoWarning:
      'Rearrange your tokens as much as you like, but when you commit them, they become fixed again.',
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
    redoWarning:
      '\u30c8\u30fc\u30af\u30f3\u306f\u597d\u304d\u306a\u3060\u3051\u4e26\u3079\u66ff\u3048\u308b\u3053\u3068\u304c\u3067\u304d\u307e\u3059\u304c\u3001\u914d\u7f6e\u3092\u78ba\u5b9a\u3059\u308b\u3068\u518d\u3073\u56fa\u5b9a\u3055\u308c\u307e\u3059\u3002',
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

export function getDecisionTranslations(language) {
  return DECISION_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getHazardTranslations(language) {
  return HAZARD_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getVillageTranslations(language) {
  return VILLAGE_TRANSLATIONS[getGameplayLanguage(language)];
}

export function getPotionUsageTranslations(language) {
  return POTION_USAGE_TRANSLATIONS[getGameplayLanguage(language)];
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
