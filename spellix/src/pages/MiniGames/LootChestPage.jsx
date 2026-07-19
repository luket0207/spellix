import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import './MiniGameResultPage.css';

function LootChestPage() {
  const navigate = useNavigate();
  const { returnFromMiniGame } = useGameSetup();

  const handleContinue = () => {
    returnFromMiniGame();
    navigate('/gameplay', { replace: true });
  };

  return (
    <main className="mini-game-result-page">
      <section className="mini-game-result-panel">
        <h1>Loot Chest</h1>
        <p>Mini game loot will be added here later.</p>
        <Button type="button" onClick={handleContinue}>
          Continue
        </Button>
      </section>
    </main>
  );
}

export default LootChestPage;
