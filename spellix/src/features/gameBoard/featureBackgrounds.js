import bossCastleBackground from '../../images/featureBackgrounds/boss-castle.png';
import eliteTowerGravelBackground from '../../images/featureBackgrounds/elite-tower-gravel.png';
import eliteTowerWoodsBackground from '../../images/featureBackgrounds/elite-tower-woods.png';
import fieldVillageBackground from '../../images/featureBackgrounds/field-village.png';
import forestVillageBackground from '../../images/featureBackgrounds/forest-village.png';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
} from './eliteBossEncounters';
import {
  FIELD_VILLAGE,
  FOREST_VILLAGE,
} from '../villages/villageVisits';

const FEATURE_BACKGROUND_SOURCES = {
  [BOSS_BATTLE]: bossCastleBackground,
  bossNotReady: bossCastleBackground,
  [ELITE_TOWER_GRAVEL]: eliteTowerGravelBackground,
  [ELITE_TOWER_WOODS]: eliteTowerWoodsBackground,
  [FIELD_VILLAGE]: fieldVillageBackground,
  [FOREST_VILLAGE]: forestVillageBackground,
};

export function getFeatureBackgroundSource(encounterType) {
  return FEATURE_BACKGROUND_SOURCES[encounterType] ?? '';
}
