import './hills.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Hills({ variation }) {
  const imageDetails = getEnvironmentImageDetails('hills', variation);

  return (
    <div aria-hidden="true" className="hills-environment">
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

export default Hills;
