import { fireEvent, render, screen } from '@testing-library/react';
import { getEnemyById } from '../battle/enemies';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
} from '../gameBoard/eliteBossEncounters';
import {
  GameSetupProvider,
  useGameSetup,
} from './GameSetupContext';
import { createInitialGameSetup } from './gameSetup';

function EliteBossProbe() {
  const {
    activeBattle,
    battleEnemy,
    gameSetup,
    setActiveBattlePhase,
    startBattle,
    startBossNotReadyEncounter,
  } = useGameSetup();

  return (
    <div>
      <p>{`Phase: ${activeBattle?.phase ?? 'none'}`}</p>
      <p>{`Encounter: ${activeBattle?.encounterType ?? 'none'}`}</p>
      <p>{`Enemy health: ${battleEnemy?.currentHealth ?? 'none'}/${battleEnemy?.maxHealth ?? 'none'}`}</p>
      <p>{`Player 1 gravel: ${gameSetup.players[0].eliteProgress.eliteTowerGravel}`}</p>
      <p>{`Player 2 gravel: ${gameSetup.players[1].eliteProgress.eliteTowerGravel}`}</p>
      <p>{`Rewards: ${activeBattle?.rewardChoices?.length ?? 0}`}</p>
      <p>{`Winner display: ${gameSetup.winnerDisplay?.id ?? 'none'}`}</p>
      <button
        type="button"
        onClick={() =>
          startBattle('player-1', 4, 'crowned-lichlord', 'fields', {
            encounterType: ELITE_TOWER_GRAVEL,
          })
        }
      >
        Start Elite
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle('player-1', 4, 'amethyst-ogre', 'fields', {
            encounterType: BOSS_BATTLE,
            enemyMaxHealth: 150,
          })
        }
      >
        Start Boss
      </button>
      <button
        type="button"
        onClick={() => startBossNotReadyEncounter('player-1')}
      >
        Start Locked Boss
      </button>
      <button
        type="button"
        onClick={() => setActiveBattlePhase('reward')}
      >
        Win
      </button>
      <button
        type="button"
        onClick={() => setActiveBattlePhase('lost')}
      >
        Lose
      </button>
    </div>
  );
}

function renderProbe() {
  render(
    <GameSetupProvider initialGameSetup={createInitialGameSetup()}>
      <EliteBossProbe />
    </GameSetupProvider>
  );
}

test('elite victory marks only the encounter player and keeps normal rewards', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Elite' }));
  expect(screen.getByText('Enemy health: 100/100')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Win' }));

  expect(screen.getByText('Phase: reward')).toBeInTheDocument();
  expect(screen.getByText('Player 1 gravel: true')).toBeInTheDocument();
  expect(screen.getByText('Player 2 gravel: false')).toBeInTheDocument();
  expect(screen.getByText(/^Rewards: [1-9]/)).toBeInTheDocument();
});

test('boss battle uses a local 150 health override and skips rewards on win', () => {
  renderProbe();
  const baseBoss = getEnemyById('amethyst-ogre');

  fireEvent.click(screen.getByRole('button', { name: 'Start Boss' }));

  expect(screen.getByText('Enemy health: 150/150')).toBeInTheDocument();
  expect(baseBoss.maxHealth).toBe(100);
  expect(baseBoss.currentHealth).toBe(100);

  fireEvent.click(screen.getByRole('button', { name: 'Win' }));

  expect(screen.getByText('Phase: wonGame')).toBeInTheDocument();
  expect(screen.getByText('Rewards: 0')).toBeInTheDocument();
  expect(screen.getByText('Winner display: player-1')).toBeInTheDocument();
});

test('boss loss remains a normal battle loss and preserves elite progress', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Elite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Win' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Boss' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lose' }));

  expect(screen.getByText('Phase: lost')).toBeInTheDocument();
  expect(screen.getByText('Player 1 gravel: true')).toBeInTheDocument();
});

test('stores a locked boss encounter without starting a battle', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Locked Boss' }));

  expect(screen.getByText('Phase: bossNotReady')).toBeInTheDocument();
  expect(screen.getByText('Encounter: bossNotReady')).toBeInTheDocument();
  expect(screen.getByText('Enemy health: none/none')).toBeInTheDocument();
});
