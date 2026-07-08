import './stream.css';

function Stream({ variation }) {
  return (
    <div aria-hidden="true" className="stream-environment">
      <span className="environment-variation">{variation}</span>
    </div>
  );
}

export default Stream;
