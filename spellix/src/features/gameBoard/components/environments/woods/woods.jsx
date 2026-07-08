import './woods.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Woods({ variation }) {
  const imageDetails = getEnvironmentImageDetails('woods', variation);

  return (
    <div aria-hidden="true" className="woods-environment">
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

export default Woods;
