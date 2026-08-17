import { getMovementNodeIdFromSquare } from './movement';

const BOARD_HOVER_LABELS = {
  field: { en: 'Field', jp: '\u91ce\u539f' },
  hills: { en: 'Hills', jp: '\u4e18\u9675' },
  gravel: { en: 'Gravel', jp: '\u7802\u5229\u5730' },
  mud: { en: 'Mud', jp: '\u6ce5\u5730' },
  stream: { en: 'Stream', jp: '\u5c0f\u5ddd' },
  river: { en: 'River', jp: '\u5ddd' },
  woods: { en: 'Woods', jp: '\u6797' },
  forest: { en: 'Forest', jp: '\u68ee' },
  mountains: { en: 'Mountains', jp: '\u5c71\u5cb3' },
  village: { en: 'Village', jp: '\u6751' },
  eliteTower: {
    en: 'Elite Tower',
    jp: '\u30a8\u30ea\u30fc\u30c8\u30bf\u30ef\u30fc',
  },
  bossBattle: {
    en: 'Boss Battle',
    jp: '\u30dc\u30b9\u30d0\u30c8\u30eb',
  },
};

function getFeatureLabelKey(board, square) {
  const movementNodeId = getMovementNodeIdFromSquare(square);

  if (movementNodeId.startsWith('elite-battle-')) {
    return 'eliteTower';
  }

  if (movementNodeId === 'boss-battle') {
    return 'bossBattle';
  }

  if (!square.featureId) {
    return null;
  }

  const imageName = board?.featureImages?.find(
    ({ id }) => id === square.featureId
  )?.imageName;

  if (imageName?.startsWith('village-')) {
    return 'village';
  }

  if (imageName?.startsWith('elite-tower-')) {
    return 'eliteTower';
  }

  if (imageName === 'boss-castle.png') {
    return 'bossBattle';
  }

  return null;
}

export function getBoardHoverLabel({ board, language, square }) {
  if (!square) {
    return '';
  }

  const labelKey = getFeatureLabelKey(board, square) ?? square.environmentType;
  const currentLanguage = language === 'jp' ? 'jp' : 'en';

  return BOARD_HOVER_LABELS[labelKey]?.[currentLanguage] ?? '';
}

export function getBoardHoverLabelPosition(board, square) {
  return square.y >= board.height / 2 ? 'top' : 'bottom';
}
