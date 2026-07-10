import fBlue from '../../images/pieces/f-blue.png';
import fGreen from '../../images/pieces/f-green.png';
import fOrange from '../../images/pieces/f-orange.png';
import fPurple from '../../images/pieces/f-purple.png';
import fRed from '../../images/pieces/f-red.png';
import fYellow from '../../images/pieces/f-yellow.png';
import mBlue from '../../images/pieces/m-blue.png';
import mGreen from '../../images/pieces/m-green.png';
import mOrange from '../../images/pieces/m-orange.png';
import mPurple from '../../images/pieces/m-purple.png';
import mRed from '../../images/pieces/m-red.png';
import mYellow from '../../images/pieces/m-yellow.png';

export const DEFAULT_PLAYER_GENDER = 'boy';
export const PLAYER_GENDERS = ['boy', 'girl'];

const PIECE_IMAGE_NAMES_BY_GENDER = {
  boy: {
    blue: 'm-blue.png',
    green: 'm-green.png',
    orange: 'm-orange.png',
    purple: 'm-purple.png',
    red: 'm-red.png',
    yellow: 'm-yellow.png',
  },
  girl: {
    blue: 'f-blue.png',
    green: 'f-green.png',
    orange: 'f-orange.png',
    purple: 'f-purple.png',
    red: 'f-red.png',
    yellow: 'f-yellow.png',
  },
};

const PIECE_IMAGE_SOURCES = {
  'f-blue.png': fBlue,
  'f-green.png': fGreen,
  'f-orange.png': fOrange,
  'f-purple.png': fPurple,
  'f-red.png': fRed,
  'f-yellow.png': fYellow,
  'm-blue.png': mBlue,
  'm-green.png': mGreen,
  'm-orange.png': mOrange,
  'm-purple.png': mPurple,
  'm-red.png': mRed,
  'm-yellow.png': mYellow,
};

export function getPlayerPieceImageName({ colour, gender }) {
  return PIECE_IMAGE_NAMES_BY_GENDER[gender]?.[colour] ?? '';
}

export function getPieceImageSource(pieceImageName) {
  return PIECE_IMAGE_SOURCES[pieceImageName] ?? '';
}
