import './field.css';
import { getEnvironmentImageDetails } from '../environmentImages';

function Field({ variation }) {
  const imageDetails = getEnvironmentImageDetails('field', variation);

  return (
    <div aria-hidden="true" className="field-environment">
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

export default Field;
