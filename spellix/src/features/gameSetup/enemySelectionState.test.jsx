import { fireEvent, render, screen } from '@testing-library/react';
import { getEnemiesForLevel } from '../battle/enemies';
import { GameSetupProvider, useGameSetup } from './GameSetupContext';

function EnemySelectionStateProbe({ randomFn }) {
  const {
    activeBattle,
    gameSetup,
    restoreGame,
    startBattle,
  } = useGameSetup();

  const startRandomBattle = (playerId, level) => {
    startBattle(playerId, level, null, 'fields', { randomFn });
  };

  const restoreLegacyState = () => {
    const legacySetup = { ...gameSetup };

    delete legacySetup.lastEnemyByLevel;
    restoreGame(legacySetup);
  };

  return (
    <div>
      <p>{`Enemy: ${activeBattle?.enemyId ?? 'none'}`}</p>
      <p>{`Player: ${activeBattle?.playerId ?? 'none'}`}</p>
      <p>{`Has history: ${Object.hasOwn(gameSetup, 'lastEnemyByLevel') ? 'yes' : 'no'}`}</p>
      {[1, 2, 3, 4].map((level) => (
        <p key={level}>{`Level ${level} history: ${
          gameSetup.lastEnemyByLevel?.[level] ?? 'none'
        }`}</p>
      ))}
      <button type="button" onClick={() => startRandomBattle('player-1', 1)}>
        Player 1 Level 1
      </button>
      <button type="button" onClick={() => startRandomBattle('player-2', 1)}>
        Player 2 Level 1
      </button>
      <button type="button" onClick={() => startRandomBattle('player-1', 2)}>
        Player 1 Level 2
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle(
            'player-1',
            4,
            getEnemiesForLevel(4)[0].id,
            'fields',
            { randomFn }
          )
        }
      >
        Fixed Level 4
      </button>
      <button type="button" onClick={restoreLegacyState}>
        Restore Legacy State
      </button>
    </div>
  );
}

function renderProbe({ initialGameSetup, randomFn = () => 0 } = {}) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <EnemySelectionStateProbe randomFn={randomFn} />
    </GameSetupProvider>
  );
}

test('tracks random enemy history globally and independently by level', () => {
  const randomFn = jest.fn(() => 0);
  const levelOneEnemies = getEnemiesForLevel(1);
  const levelTwoEnemies = getEnemiesForLevel(2);

  renderProbe({ randomFn });

  fireEvent.click(screen.getByRole('button', { name: 'Player 1 Level 1' }));
  expect(screen.getByText(`Enemy: ${levelOneEnemies[0].id}`)).toBeInTheDocument();
  expect(
    screen.getByText(`Level 1 history: ${levelOneEnemies[0].id}`)
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Player 1 Level 2' }));
  expect(screen.getByText(`Enemy: ${levelTwoEnemies[0].id}`)).toBeInTheDocument();
  expect(
    screen.getByText(`Level 1 history: ${levelOneEnemies[0].id}`)
  ).toBeInTheDocument();
  expect(
    screen.getByText(`Level 2 history: ${levelTwoEnemies[0].id}`)
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Player 2 Level 1' }));
  expect(screen.getByText('Player: player-2')).toBeInTheDocument();
  expect(screen.getByText(`Enemy: ${levelOneEnemies[1].id}`)).toBeInTheDocument();
  expect(
    screen.getByText(`Level 1 history: ${levelOneEnemies[1].id}`)
  ).toBeInTheDocument();
  expect(
    screen.getByText(`Level 2 history: ${levelTwoEnemies[0].id}`)
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Player 1 Level 1' }));
  expect(screen.getByText(`Enemy: ${levelOneEnemies[0].id}`)).toBeInTheDocument();
  expect(randomFn).toHaveBeenCalledTimes(4);
});

test('explicit fixed enemies bypass random history tracking', () => {
  const randomFn = jest.fn(() => 0);
  const fixedEnemy = getEnemiesForLevel(4)[0];

  renderProbe({ randomFn });
  fireEvent.click(screen.getByRole('button', { name: 'Fixed Level 4' }));

  expect(screen.getByText(`Enemy: ${fixedEnemy.id}`)).toBeInTheDocument();
  expect(screen.getByText('Level 4 history: none')).toBeInTheDocument();
  expect(randomFn).not.toHaveBeenCalled();
});

test('normalizes enemy history when legacy state is loaded without it', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Restore Legacy State' }));

  expect(screen.getByText('Has history: yes')).toBeInTheDocument();
  [1, 2, 3, 4].forEach((level) => {
    expect(screen.getByText(`Level ${level} history: none`)).toBeInTheDocument();
  });
});
