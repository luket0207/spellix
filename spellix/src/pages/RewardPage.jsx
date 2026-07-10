import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';

function RewardPage() {
  const navigate = useNavigate();
  const { activeBattle, advanceTurn, clearActiveBattle } = useGameSetup();
  const isRewardPageReady = Boolean(activeBattle);

  useEffect(() => {
    if (!isRewardPageReady) {
      navigate('/gameplay', { replace: true });
    }
  }, [isRewardPageReady, navigate]);

  if (!isRewardPageReady) {
    return (
      <main>
        <p>Returning to gameplay.</p>
      </main>
    );
  }

  const handleContinue = () => {
    clearActiveBattle();
    advanceTurn();
    navigate('/gameplay');
  };

  return (
    <main>
      <button type="button" onClick={handleContinue}>
        Continue
      </button>
    </main>
  );
}

export default RewardPage;
