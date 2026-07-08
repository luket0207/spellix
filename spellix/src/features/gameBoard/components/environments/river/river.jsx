import './river.css';

function River({ variation }) {
  return (
    <div aria-hidden="true" className="river-environment">
      <span className="environment-variation">{variation}</span>
    </div>
  );
}

export default River;
