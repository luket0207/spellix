import fields from '../../images/battleBackgrounds/fields.png';
import forest from '../../images/battleBackgrounds/forest.png';
import gravel from '../../images/battleBackgrounds/gravel.png';
import hills from '../../images/battleBackgrounds/hills.png';
import mountains from '../../images/battleBackgrounds/mountains.png';
import mud from '../../images/battleBackgrounds/mud.png';
import river from '../../images/battleBackgrounds/river.png';
import stream from '../../images/battleBackgrounds/stream.png';
import woods from '../../images/battleBackgrounds/woods.png';

export const BATTLE_ENVIRONMENTS = [
  'fields',
  'hills',
  'gravel',
  'mud',
  'woods',
  'forest',
  'mountains',
];

const BATTLE_BACKGROUND_SOURCES = {
  fields,
  forest,
  gravel,
  hills,
  mountains,
  mud,
  river,
  stream,
  woods,
};

export function normalizeBattleEnvironment(environment) {
  return BATTLE_BACKGROUND_SOURCES[environment] ? environment : 'fields';
}

export function getBattleBackgroundSource(environment) {
  return BATTLE_BACKGROUND_SOURCES[normalizeBattleEnvironment(environment)];
}
