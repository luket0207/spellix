import AO from '../../images/enemies/AO.png';
import BA from '../../images/enemies/BA.png';
import CD from '../../images/enemies/CD.png';
import CL from '../../images/enemies/CL.png';
import DK from '../../images/enemies/DK.png';
import DW from '../../images/enemies/DW.png';
import EI from '../../images/enemies/EI.png';
import FG from '../../images/enemies/FG.png';
import FS from '../../images/enemies/FS.png';
import GN from '../../images/enemies/GN.png';
import HH from '../../images/enemies/HH.png';
import HR from '../../images/enemies/HR.png';
import HS from '../../images/enemies/HS.png';
import ME from '../../images/enemies/ME.png';
import NR from '../../images/enemies/NR.png';
import RW from '../../images/enemies/RW.png';
import SW from '../../images/enemies/SW.png';
import VR from '../../images/enemies/VR.png';
import VS from '../../images/enemies/VS.png';
import WB from '../../images/enemies/WB.png';

const ENEMY_IMAGE_SOURCES = {
  'AO.png': AO,
  'BA.png': BA,
  'CD.png': CD,
  'CL.png': CL,
  'DK.png': DK,
  'DW.png': DW,
  'EI.png': EI,
  'FG.png': FG,
  'FS.png': FS,
  'GN.png': GN,
  'HH.png': HH,
  'HR.png': HR,
  'HS.png': HS,
  'ME.png': ME,
  'NR.png': NR,
  'RW.png': RW,
  'SW.png': SW,
  'VR.png': VR,
  'VS.png': VS,
  'WB.png': WB,
};

export function getEnemyImageSource(imageFileName) {
  return ENEMY_IMAGE_SOURCES[imageFileName] ?? '';
}
