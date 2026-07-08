import { useNavigate } from 'react-router-dom';

function StartPage() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Spellix</h1>
      <p>Start a new game.</p>
      <button type="button" onClick={() => navigate('/setup')}>
        Go to game setup
      </button>
    </main>
  );
}

export default StartPage;
