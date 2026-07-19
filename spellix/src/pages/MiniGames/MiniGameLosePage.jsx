import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import './MiniGameResultPage.css';

function MiniGameLosePage() {
  const navigate = useNavigate();
  const { returnFromMiniGame } = useGameSetup();

  const handleReturnToBoard = () => {
    returnFromMiniGame();
    navigate('/gameplay', { replace: true });
  };

  return (
    <main className="mini-game-result-page">
      <section className="mini-game-result-panel">
        <h1>Mini Game Failed</h1>
        <p>The mini game has ended.</p>
        <Button type="button" onClick={handleReturnToBoard}>
          Return to Board
        </Button>
      </section>
    </main>
  );
}

export default MiniGameLosePage;
