import './forest.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Forest({ variation }) {
  const imageDetails = getEnvironmentImageDetails('forest', variation);

  return (
    <div aria-hidden="true" className="forest-environment">
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

export default Forest;
