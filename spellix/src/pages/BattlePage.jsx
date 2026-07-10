import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthBar from '../components/health/HealthBar';
import Modal from '../components/Modal';
import CommittedSpellSlotList from '../components/spells/CommittedSpellSlotList';
import { getEnemyImageSource } from '../features/battle/enemyImages';
import { getFirstStartAreaPosition } from '../features/gameBoard/board';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import { getPieceImageSource } from '../features/gameSetup/pieceImages';
import './BattlePage.css';

function BattlePage() {
  const navigate = useNavigate();
  const {
    activeBattle,
    advanceTurn,
    battleEnemy,
    battlePlayer,
    clearActiveBattle,
    gameSetup,
    setActiveBattlePhase,
    setPlayerHealth,
    setPlayerPosition,
  } = useGameSetup();
  const [showLoseModal, setShowLoseModal] = useState(false);
  const hasBattleContext = Boolean(activeBattle && battleEnemy && battlePlayer);
  const isActiveBattle = Boolean(activeBattle?.phase === 'active' && battlePlayer);

  useEffect(() => {
    if (!hasBattleContext) {
      navigate('/gameplay', { replace: true });
    }
  }, [hasBattleContext, navigate]);

  if (!hasBattleContext) {
    return null;
  }

  const enemyImageSource = getEnemyImageSource(battleEnemy.imageFileName);
  const pieceImageSource = getPieceImageSource(battlePlayer.pieceImage);

  const handleRemoveHealth = () => {
    const nextHealth = Math.max(0, battlePlayer.currentHealth - 5);

    setPlayerHealth(battlePlayer.id, nextHealth);

    if (nextHealth <= 0) {
      setShowLoseModal(true);
    }
  };

  const handleWin = () => {
    setActiveBattlePhase('reward');
    navigate('/reward');
  };

  const handleRespawn = () => {
    setPlayerPosition(battlePlayer.id, getFirstStartAreaPosition(gameSetup.board), {
      currentHealth: battlePlayer.maxHealth,
    });
    clearActiveBattle();
    advanceTurn();
    setShowLoseModal(false);
    navigate('/gameplay');
  };

  return (
    <main className="battle-page">
      <h1>Battle</h1>
      <p>{`Battle level: ${activeBattle.level}`}</p>

      <div className="battle-display">
        <section aria-label="Battle player panel" className="battle-side battle-side--player">
          {pieceImageSource ? (
            <img
              alt="Battle player piece"
              aria-label="Battle player piece"
              className="battle-player-piece"
              src={pieceImageSource}
              style={{ alignSelf: 'flex-start', width: 'auto' }}
            />
          ) : (
            <p aria-label="Battle player piece">{battlePlayer.colour}</p>
          )}
          <HealthBar currentHealth={battlePlayer.currentHealth} maxHealth={battlePlayer.maxHealth} />
          <CommittedSpellSlotList spellSlots={battlePlayer.spellSlots} title="" />
        </section>

        <section aria-label="Battle enemy panel" className="battle-side battle-side--enemy">
          {enemyImageSource ? (
            <img
              alt={`Battle enemy ${battleEnemy.englishName}`}
              aria-label={`Battle enemy ${battleEnemy.englishName}`}
              className="battle-enemy-piece"
              src={enemyImageSource}
            />
          ) : (
            <p aria-label="Battle enemy fallback">{battleEnemy.englishName}</p>
          )}
          <HealthBar currentHealth={battleEnemy.currentHealth} maxHealth={battleEnemy.maxHealth} />
          <CommittedSpellSlotList spellSlots={battleEnemy.spellSlots} title="" />
        </section>
      </div>

      <div className="battle-debug-controls">
        <button type="button" onClick={handleRemoveHealth}>
          Remove 5 health
        </button>
        <button type="button" disabled={!isActiveBattle} onClick={handleWin}>
          Win
        </button>
        <button type="button" disabled={!isActiveBattle} onClick={() => setShowLoseModal(true)}>
          Lose
        </button>
      </div>

      <Modal
        actions={
          <button type="button" onClick={handleRespawn}>
            Respawn
          </button>
        }
        ariaLabel="Battle lost"
        isOpen={showLoseModal}
      >
        <p>The player has lost.</p>
      </Modal>
    </main>
  );
}

export default BattlePage;
