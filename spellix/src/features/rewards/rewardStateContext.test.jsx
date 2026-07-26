import { fireEvent, render, screen } from '@testing-library/react';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

function createBattleSetup(activeBattleOverrides = {}) {
  const initialSetup = createInitialGameSetup();

  return {
    ...initialSetup,
    activeBattle: {
      enemyId: 'frostwisp-spirit',
      isResolvingTurn: false,
      level: 2,
      pendingEffects: [],
      phase: 'active',
      playerId: 'player-1',
      ...activeBattleOverrides,
    },
    players: initialSetup.players.map((player) => ({
      ...player,
      hasUnseenTokenBagTokens: false,
      tokenBag: [],
    })),
  };
}

function RewardStateProbe() {
  const {
    activeBattle,
    addSelectedRewardTokenToBag,
    assignSelectedRewardTokenToSpellSlot,
    discardSelectedRewardToken,
    finalizeBattleEffects,
    gameSetup,
    replaceSelectedRewardTokenInBag,
    resolveSelectedPotionReward,
    selectBattleReward,
    setActiveBattlePhase,
  } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => setActiveBattlePhase('reward')}>
        Win battle
      </button>
      <button type="button" onClick={() => setActiveBattlePhase('lost')}>
        Lose battle
      </button>
      <button type="button" onClick={finalizeBattleEffects}>
        Finalize battle
      </button>
      <button type="button" onClick={() => selectBattleReward('reward-choice-1')}>
        Select first reward
      </button>
      <button type="button" onClick={() => selectBattleReward('reward-choice-2')}>
        Select second reward
      </button>
      <button type="button" onClick={addSelectedRewardTokenToBag}>
        Add reward token to bag
      </button>
      <button type="button" onClick={discardSelectedRewardToken}>
        Discard reward token
      </button>
      <button
        type="button"
        onClick={() => replaceSelectedRewardTokenInBag('player-1-blue-1')}
      >
        Replace first bag token
      </button>
      <button
        type="button"
        onClick={() => assignSelectedRewardTokenToSpellSlot('slot-2')}
      >
        Assign reward to slot 2
      </button>
      <button
        type="button"
        onClick={() => assignSelectedRewardTokenToSpellSlot('slot-3')}
      >
        Assign reward to slot 3
      </button>
      <button type="button" onClick={() => resolveSelectedPotionReward(1)}>
        Replace second potion
      </button>
      <button type="button" onClick={() => resolveSelectedPotionReward()}>
        Discard reward potion
      </button>
      <p>{`Phase: ${activeBattle?.phase}`}</p>
      <p>{`Selected reward: ${activeBattle?.selectedRewardChoiceId ?? 'none'}`}</p>
      <p>{`Reward destination: ${activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <p>{`Player potions: ${gameSetup.players[0].potions.map(({ name }) => name).join(',') || 'empty'}`}</p>
      <p>{`Player token bag: ${gameSetup.players[0].tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Unseen bag tokens: ${gameSetup.players[0].hasUnseenTokenBagTokens ? 'yes' : 'no'}`}</p>
      <p>{`Player spell tokens: ${gameSetup.players[0].spellSlots.flatMap(({ tokens }) => tokens).map(({ committed, id }) => `${id}:${committed}`).join(',') || 'empty'}`}</p>
      <pre data-testid="reward-choices">{JSON.stringify(activeBattle?.rewardChoices ?? [])}</pre>
    </div>
  );
}

describe('battle reward state', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('stores generated reward choices once when a battle is won', () => {
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.96)
      .mockReturnValue(0);

    render(
      <GameSetupProvider initialGameSetup={createBattleSetup()}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /win battle/i }));

    const rewardChoices = JSON.parse(screen.getByTestId('reward-choices').textContent);

    expect(screen.getByText('Phase: reward')).toBeInTheDocument();
    expect(rewardChoices).toHaveLength(2);
    expect(rewardChoices.map(({ id }) => id)).toEqual([
      'reward-choice-1',
      'reward-choice-2',
    ]);
    expect(rewardChoices.map(({ category }) => category)).toEqual([
      'Common Token',
      'Rare Potion',
    ]);
    expect(randomSpy).toHaveBeenCalledTimes(4);

    fireEvent.click(screen.getByRole('button', { name: /win battle/i }));

    expect(JSON.parse(screen.getByTestId('reward-choices').textContent)).toEqual(rewardChoices);
    expect(randomSpy).toHaveBeenCalledTimes(4);

    fireEvent.click(screen.getByRole('button', { name: /select first reward/i }));
    fireEvent.click(screen.getByRole('button', { name: /select second reward/i }));

    expect(screen.getByText('Selected reward: reward-choice-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add reward token to bag/i }));
    fireEvent.click(screen.getByRole('button', { name: /add reward token to bag/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard reward token/i }));

    expect(screen.getByText('Reward destination: tokenBag')).toBeInTheDocument();
    expect(screen.getByText('Player token bag: player-1-red-1')).toBeInTheDocument();
    expect(screen.getByText('Unseen bag tokens: yes')).toBeInTheDocument();
  });

  test('does not generate reward choices when a battle is lost', () => {
    const randomSpy = jest.spyOn(Math, 'random');

    render(
      <GameSetupProvider initialGameSetup={createBattleSetup()}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /lose battle/i }));

    expect(screen.getByText('Phase: lost')).toBeInTheDocument();
    expect(screen.getByTestId('reward-choices')).toHaveTextContent('[]');
    expect(randomSpy).not.toHaveBeenCalled();
  });

  test('marks Cave tokens assigned to the shared token bag as unseen', () => {
    const setup = createBattleSetup({
      phase: 'reward',
      rewardChoices: [
        {
          category: 'Common Token',
          id: 'reward-choice-1',
          item: { label: 'Red', rarity: 'Common', type: 'red' },
          itemType: 'token',
        },
      ],
      selectedRewardChoiceId: 'reward-choice-1',
      source: 'cave',
    });

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add reward token to bag/i }));

    expect(screen.getByText('Reward destination: tokenBag')).toBeInTheDocument();
    expect(screen.getByText('Unseen bag tokens: yes')).toBeInTheDocument();
  });

  test('stores reward choices when combat resolution detects a win', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <GameSetupProvider initialGameSetup={createBattleSetup({ enemyCurrentHealth: 0 })}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /finalize battle/i }));

    expect(screen.getByText('Phase: reward')).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('reward-choices').textContent)).toHaveLength(2);
  });

  test('replaces one token in a full bag only once', () => {
    const setup = createBattleSetup({
      phase: 'reward',
      rewardChoices: [
        {
          category: 'Common Token',
          id: 'reward-choice-1',
          item: { label: 'Red', rarity: 'Common', type: 'red' },
          itemType: 'token',
        },
      ],
      selectedRewardChoiceId: 'reward-choice-1',
    });

    setup.players[0].tokenBag = Array.from({ length: 5 }, (_, index) => ({
      committed: false,
      id: `player-1-blue-${index + 1}`,
      type: 'blue',
    }));

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /replace first bag token/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace first bag token/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard reward token/i }));

    expect(screen.getByText('Reward destination: tokenBagReplacement')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Player token bag: player-1-red-1,player-1-blue-2,player-1-blue-3,player-1-blue-4,player-1-blue-5'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Unseen bag tokens: yes')).toBeInTheDocument();
  });

  test('commits one selected reward token to a valid spell slot only once', () => {
    const setup = createBattleSetup({
      phase: 'reward',
      rewardChoices: [
        {
          category: 'Common Token',
          id: 'reward-choice-1',
          item: { label: 'Red', rarity: 'Common', type: 'red' },
          itemType: 'token',
        },
      ],
      selectedRewardChoiceId: 'reward-choice-1',
    });

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /assign reward to slot 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /assign reward to slot 3/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard reward token/i }));

    expect(screen.getByText('Reward destination: spellSlot')).toBeInTheDocument();
    expect(screen.getByText('Player spell tokens: player-1-red-1:true')).toBeInTheDocument();
  });

  test('adds one selected potion below capacity only once', () => {
    const setup = createBattleSetup({
      phase: 'reward',
      rewardChoices: [
        {
          category: 'Rare Potion',
          id: 'reward-choice-1',
          item: { id: 'roll-choice', name: 'Roll Choice', rarity: 'Rare' },
          itemType: 'potion',
        },
      ],
    });

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /select first reward/i }));
    fireEvent.click(screen.getByRole('button', { name: /select first reward/i }));

    expect(screen.getByText('Selected reward: reward-choice-1')).toBeInTheDocument();
    expect(screen.getByText('Reward destination: potionSlot')).toBeInTheDocument();
    expect(screen.getByText('Player potions: Roll Choice')).toBeInTheDocument();
  });

  test('replaces one potion at full capacity only once', () => {
    const setup = createBattleSetup({
      phase: 'reward',
      rewardChoices: [
        {
          category: 'Rare Potion',
          id: 'reward-choice-1',
          item: { id: 'roll-choice', name: 'Roll Choice', rarity: 'Rare' },
          itemType: 'potion',
        },
      ],
    });

    setup.players[0].potions = [
      { id: 'potion-1', name: 'Potion 1' },
      { id: 'potion-2', name: 'Potion 2' },
      { id: 'potion-3', name: 'Potion 3' },
    ];

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <RewardStateProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /select first reward/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace second potion/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace second potion/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard reward potion/i }));

    expect(screen.getByText('Reward destination: potionSlotReplacement')).toBeInTheDocument();
    expect(screen.getByText('Player potions: Potion 1,Roll Choice,Potion 3')).toBeInTheDocument();
  });
});
