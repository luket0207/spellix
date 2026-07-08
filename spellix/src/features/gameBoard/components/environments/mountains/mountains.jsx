import './mountains.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Mountains({ variation }) {
  const imageDetails = getEnvironmentImageDetails('mountains', variation);

  return (
    <div aria-hidden="true" className="mountains-environment">
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

export default Mountains;
