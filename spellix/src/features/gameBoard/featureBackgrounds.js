import bossCastleBackground from '../../images/featureBackgrounds/boss-castle.png';
import eliteTowerGravelBackground from '../../images/featureBackgrounds/elite-tower-gravel.png';
import eliteTowerWoodsBackground from '../../images/featureBackgrounds/elite-tower-woods.png';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
} from './eliteBossEncounters';

const FEATURE_BACKGROUND_SOURCES = {
  [BOSS_BATTLE]: bossCastleBackground,
  bossNotReady: bossCastleBackground,
  [ELITE_TOWER_GRAVEL]: eliteTowerGravelBackground,
  [ELITE_TOWER_WOODS]: eliteTowerWoodsBackground,
};

export function getFeatureBackgroundSource(encounterType) {
  return FEATURE_BACKGROUND_SOURCES[encounterType] ?? '';
}
