import field1 from '../../../../images/environments/field-1.png';
import field2 from '../../../../images/environments/field-2.png';
import field3 from '../../../../images/environments/field-3.png';
import field4 from '../../../../images/environments/field-4.png';
import field5 from '../../../../images/environments/field-5.png';
import field6 from '../../../../images/environments/field-6.png';
import forest1 from '../../../../images/environments/forest-1.png';
import forest2 from '../../../../images/environments/forest-2.png';
import forest3 from '../../../../images/environments/forest-3.png';
import forest4 from '../../../../images/environments/forest-4.png';
import forest5 from '../../../../images/environments/forest-5.png';
import forest6 from '../../../../images/environments/forest-6.png';
import gravel1 from '../../../../images/environments/gravel-1.png';
import gravel2 from '../../../../images/environments/gravel-2.png';
import gravel3 from '../../../../images/environments/gravel-3.png';
import gravel4 from '../../../../images/environments/gravel-4.png';
import gravel5 from '../../../../images/environments/gravel-5.png';
import gravel6 from '../../../../images/environments/gravel-6.png';
import hills1 from '../../../../images/environments/hills-1.png';
import hills2 from '../../../../images/environments/hills-2.png';
import hills3 from '../../../../images/environments/hills-3.png';
import hills4 from '../../../../images/environments/hills-4.png';
import hills5 from '../../../../images/environments/hills-5.png';
import hills6 from '../../../../images/environments/hills-6.png';
import mountain1 from '../../../../images/environments/mountain-1.png';
import mountain2 from '../../../../images/environments/mountain-2.png';
import mountain3 from '../../../../images/environments/mountain-3.png';
import mountain4 from '../../../../images/environments/mountain-4.png';
import mountain5 from '../../../../images/environments/mountain-5.png';
import mountain6 from '../../../../images/environments/mountain-6.png';
import mud1 from '../../../../images/environments/mud-1.png';
import mud2 from '../../../../images/environments/mud-2.png';
import mud3 from '../../../../images/environments/mud-3.png';
import mud4 from '../../../../images/environments/mud-4.png';
import mud5 from '../../../../images/environments/mud-5.png';
import mud6 from '../../../../images/environments/mud-6.png';
import woods1 from '../../../../images/environments/woods-1.png';
import woods2 from '../../../../images/environments/woods-2.png';
import woods3 from '../../../../images/environments/woods-3.png';
import woods4 from '../../../../images/environments/woods-4.png';
import woods5 from '../../../../images/environments/woods-5.png';
import woods6 from '../../../../images/environments/woods-6.png';

const ENVIRONMENT_IMAGE_SOURCES = {
  field: [field1, field2, field3, field4, field5, field6],
  forest: [forest1, forest2, forest3, forest4, forest5, forest6],
  gravel: [gravel1, gravel2, gravel3, gravel4, gravel5, gravel6],
  hills: [hills1, hills2, hills3, hills4, hills5, hills6],
  mountains: [mountain1, mountain2, mountain3, mountain4, mountain5, mountain6],
  mud: [mud1, mud2, mud3, mud4, mud5, mud6],
  woods: [woods1, woods2, woods3, woods4, woods5, woods6],
};

export function getEnvironmentImageDetails(environmentType, variation) {
  const imageSources = ENVIRONMENT_IMAGE_SOURCES[environmentType];

  if (!imageSources) {
    return null;
  }

  const normalizedVariation =
    Number.isInteger(variation) && variation >= 1 && variation <= imageSources.length
      ? variation
      : 1;

  return {
    imageKey: `${environmentType}-${normalizedVariation}`,
    src: imageSources[normalizedVariation - 1],
  };
}
