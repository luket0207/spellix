import { fireEvent, render, screen } from '@testing-library/react';
import { getEnemyById } from '../battle/enemies';
import {
  BOSS_BATTLE,
  ELITE_TOWER_GRAVEL,
  ELITE_TOWER_WOODS,
} from '../gameBoard/eliteBossEncounters';
import {
  GameSetupProvider,
  useGameSetup,
} from './GameSetupContext';
import { createInitialGameSetup } from './gameSetup';

function EliteBossProbe() {
  const {
    activeBattle,
    assignSelectedRewardTokenToSpellSlot,
    battleEnemy,
    discardSelectedRewardToken,
    gameSetup,
    selectBattleReward,
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
      <p>{`Player 1 woods: ${gameSetup.players[0].eliteProgress.eliteTowerWoods}`}</p>
      <p>{`Player 2 gravel: ${gameSetup.players[1].eliteProgress.eliteTowerGravel}`}</p>
      <p>{`Rewards: ${activeBattle?.rewardChoices?.length ?? 0}`}</p>
      <p>{`Reward destination: ${activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <pre data-testid="elite-reward-choices">
        {JSON.stringify(activeBattle?.rewardChoices ?? [])}
      </pre>
      <p>{`Removed tokens: ${activeBattle?.deathPenalty?.removedTokens.length ?? 0}`}</p>
      <p>{`Winner display: ${gameSetup.winnerDisplay?.id ?? 'none'}`}</p>
      <button
        type="button"
        onClick={() => startBattle('player-1', 4, 'hellcrown-reaper')}
      >
        Start Normal
      </button>
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
          startBattle('player-1', 4, 'amethyst-ogre', 'woods', {
            encounterType: ELITE_TOWER_WOODS,
          })
        }
      >
        Start Woods Elite
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle('player-1', 4, 'amethyst-ogre', 'fields', {
            encounterType: BOSS_BATTLE,
            enemyMaxHealth: 100,
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
      <button
        type="button"
        onClick={() => selectBattleReward('reward-choice-1')}
      >
        Select First Reward
      </button>
      <button type="button" onClick={discardSelectedRewardToken}>
        Discard Reward
      </button>
      <button
        type="button"
        onClick={() => assignSelectedRewardTokenToSpellSlot('slot-2')}
      >
        Assign Reward
      </button>
    </div>
  );
}

function renderProbe() {
  const setup = createInitialGameSetup();
  setup.players[0].spellSlots[0].tokens = [
    { committed: true, id: 'black-1', type: 'black' },
    { committed: true, id: 'black-2', type: 'black' },
    { committed: true, id: 'red-gained', type: 'red' },
  ];

  render(
    <GameSetupProvider initialGameSetup={setup}>
      <EliteBossProbe />
    </GameSetupProvider>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['Start Elite', 'Player 1 gravel: true', 'Discard Reward', 'discarded'],
  ['Start Woods Elite', 'Player 1 woods: true', 'Assign Reward', 'spellSlot'],
])(
  '%s victory grants three distinct rare tokens and resolves through the shared flow',
  (startAction, progressText, resolutionAction, destination) => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderProbe();

    fireEvent.click(screen.getByRole('button', { name: startAction }));
    expect(screen.getByText('Enemy health: 85/85')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Win' }));

    const choices = JSON.parse(
      screen.getByTestId('elite-reward-choices').textContent
    );
    const tokenTypes = choices.map(({ item }) => item.type);

    expect(screen.getByText('Phase: reward')).toBeInTheDocument();
    expect(screen.getByText(progressText)).toBeInTheDocument();
    expect(screen.getByText('Player 2 gravel: false')).toBeInTheDocument();
    expect(choices).toHaveLength(3);
    expect(new Set(tokenTypes)).toHaveProperty('size', 3);
    expect(
      choices.every(
        ({ category, item, itemType }) =>
          category === 'Rare Token' &&
          item.rarity === 'Rare' &&
          itemType === 'token'
      )
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Select First Reward' }));
    fireEvent.click(screen.getByRole('button', { name: resolutionAction }));

    expect(screen.getByText(`Reward destination: ${destination}`)).toBeInTheDocument();
  }
);

test('normal level four victory keeps the standard reward table', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Normal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Win' }));

  const choices = JSON.parse(
    screen.getByTestId('elite-reward-choices').textContent
  );

  expect(choices).toHaveLength(3);
  expect(choices.every(({ category }) => category === 'Common Token')).toBe(true);
  expect(screen.getByText('Player 1 gravel: false')).toBeInTheDocument();
  expect(screen.getByText('Player 1 woods: false')).toBeInTheDocument();
});

test('boss battle uses a local 100 health override and skips rewards on win', () => {
  renderProbe();
  const baseBoss = getEnemyById('amethyst-ogre');

  fireEvent.click(screen.getByRole('button', { name: 'Start Boss' }));

  expect(screen.getByText('Enemy health: 100/100')).toBeInTheDocument();
  expect(baseBoss.maxHealth).toBe(85);
  expect(baseBoss.currentHealth).toBe(85);

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
  expect(screen.getByText('Removed tokens: 2')).toBeInTheDocument();
  expect(screen.getByText('Player 1 gravel: true')).toBeInTheDocument();
});

test('normal level four loss uses the two-token battle penalty', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Normal' }));
  expect(screen.getByText('Enemy health: 85/85')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Lose' }));

  expect(screen.getByText('Phase: lost')).toBeInTheDocument();
  expect(screen.getByText('Removed tokens: 2')).toBeInTheDocument();
});

test('elite loss uses the level four two-token battle penalty', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Elite' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lose' }));

  expect(screen.getByText('Phase: lost')).toBeInTheDocument();
  expect(screen.getByText('Removed tokens: 2')).toBeInTheDocument();
  expect(screen.getByText('Player 1 gravel: false')).toBeInTheDocument();
});

test('stores a locked boss encounter without starting a battle', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Locked Boss' }));

  expect(screen.getByText('Phase: bossNotReady')).toBeInTheDocument();
  expect(screen.getByText('Encounter: bossNotReady')).toBeInTheDocument();
  expect(screen.getByText('Enemy health: none/none')).toBeInTheDocument();
});
