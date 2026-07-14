import { ENEMIES } from './enemies';
import { getEnemyImageSource } from './enemyImages';

test.each(ENEMIES)('resolves the image asset for $englishName', ({ imageFileName }) => {
  expect(getEnemyImageSource(imageFileName)).toContain(imageFileName);
});

test('fails safely when an enemy image file name is unknown', () => {
  expect(getEnemyImageSource('unknown.png')).toBe('');
});
