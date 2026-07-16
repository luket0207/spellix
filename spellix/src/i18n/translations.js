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
    chooseOneReward: 'Choose one reward',
  },
  jp: {
    choose: '選ぶ',
    chooseOneReward: '報酬を1つ選んでください',
  },
};

const SPELL_ASSIGNMENT_TRANSLATIONS = {
  en: {
    assignReward: 'Assign reward',
    cancel: 'Cancel',
    cancelConfirmation:
      'Are you sure you want to cancel? All changes to your spell slots will be lost',
    confirm: 'Confirm',
    discard: 'Discard',
    discardAreaLocation: 'discard area',
    dropTokensHere: 'Drop tokens here',
    newRewardToken: 'New Reward Token',
    no: 'No',
    noAvailableTokens: 'No available tokens',
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
      'You must place all 7 starting tokens into spell slots before rolling dice.',
    tokenBag: 'Token Bag',
    tokenBagLocation: 'token bag',
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
    no: 'いいえ',
    noAvailableTokens: '使用可能なトークンがありません',
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
      'サイコロを振る前に、7個の初期トークンをすべて呪文スロットに配置してください。',
    tokenBag: 'トークンバッグ',
    tokenBagLocation: 'トークンバッグ',
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
