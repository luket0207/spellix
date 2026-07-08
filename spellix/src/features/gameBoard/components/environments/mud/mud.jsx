import './mud.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Mud({ variation }) {
  const imageDetails = getEnvironmentImageDetails('mud', variation);

  return (
    <div aria-hidden="true" className="mud-environment">
      <img
        alt=""
        aria-hidden="true"
        className="environment-image"
        data-environment-image={imageDetails.imageKey}
        src={imageDetails.src}
      />
    </div>
  );
}

export default Mud;
