import './gravel.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Gravel({ variation }) {
  const imageDetails = getEnvironmentImageDetails('gravel', variation);

  return (
    <div aria-hidden="true" className="gravel-environment">
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

export default Gravel;
