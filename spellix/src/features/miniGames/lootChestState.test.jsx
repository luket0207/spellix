import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { createPlayers } from '../gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';

const CAVE_REWARDS = {
  hasLootChest: true,
  hasRollAgainPotion: false,
  potion: null,
  token: { label: 'Red', rarity: 'Common', type: 'red' },
};

const CAVE_REWARDS_WITH_POTION = {
  ...CAVE_REWARDS,
  potion: {
    colour: 'blue',
    id: 'cave-potion',
    name: 'Cave Potion',
    rarity: 'Common',
  },
  token: null,
};

const LOOT_TOKEN = {
  category: 'Rare Token',
  id: 'loot-token',
  item: { label: 'Guard', rarity: 'Rare', type: 'blue' },
  itemType: 'token',
};

const LOOT_POTION = {
  category: 'Common Potion',
  id: 'loot-potion',
  item: {
    colour: 'green',
    id: 'small-heal',
    name: 'Small Heal',
    rarity: 'Common',
  },
  itemType: 'potion',
};

function createSetup({ fullPotions = false } = {}) {
  const players = createPlayers(2).map((player) => ({
    ...player,
    hasUnseenTokenBagTokens: false,
    potions: fullPotions && player.id === 'player-1'
      ? [
          { id: 'potion-1', name: 'One' },
          { id: 'potion-2', name: 'Two' },
          { id: 'potion-3', name: 'Three' },
        ]
      : [],
    tokenBag: [],
  }));

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    miniGameResult: null,
    pendingNextTurnModal: false,
    pendingPotionGrant: null,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function LootChestStateProbe() {
  const {
    activatePendingCaveTokenReward,
    activeBattle,
    addSelectedRewardTokenToBag,
    claimLootChestReward,
    completeMiniGame,
    continueCaveRewardResolution,
    currentPlayer,
    discardSelectedRewardToken,
    gameSetup,
    miniGameResult,
    pendingNextTurnModal,
    resolveSelectedPotionReward,
    returnFromMiniGame,
    startMiniGame,
  } = useGameSetup();
  const [destination, setDestination] = useState('none');
  const playerOne = gameSetup.players.find(({ id }) => id === 'player-1');

  return (
    <div>
      <p>{`Current: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Destination: ${destination}`}</p>
      <p>{`Reward source: ${activeBattle?.source ?? 'none'}`}</p>
      <p>{`Loot status: ${miniGameResult?.lootChestReward?.status ?? 'none'}`}</p>
      <p>{`Cave token status: ${miniGameResult?.caveRewardGrant?.token?.status ?? 'none'}`}</p>
      <p>{`Resolution stage: ${miniGameResult?.caveRewardResolution?.stage ?? 'none'}`}</p>
      <p>{`Potions: ${playerOne?.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Unseen bag tokens: ${playerOne?.hasUnseenTokenBagTokens ? 'yes' : 'no'}`}</p>
      <p>{`Next turn: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <button type="button" onClick={() => startMiniGame('river', 'player-1')}>
        Start River
      </button>
      <button
        type="button"
        onClick={() =>
          startMiniGame('lootChest', 'player-1', {
            environment: 'field',
            result: 'win',
            returnBehaviour: 'nextPlayerTurn',
            source: 'boardLanding',
          })
        }
      >
        Start Board Loot Chest
      </button>
      <button type="button" onClick={() => completeMiniGame('win')}>
        Win River
      </button>
      <button type="button" onClick={() => startMiniGame('cave', 'player-1')}>
        Start Cave
      </button>
      <button
        type="button"
        onClick={() =>
          completeMiniGame('win', { caveRewards: CAVE_REWARDS, rollAgain: false })
        }
      >
        Retreat Cave With Loot
      </button>
      <button
        type="button"
        onClick={() =>
          completeMiniGame('win', {
            caveRewards: CAVE_REWARDS_WITH_POTION,
            rollAgain: false,
          })
        }
      >
        Retreat Cave With Loot And Potion
      </button>
      <button
        type="button"
        onClick={() => setDestination(claimLootChestReward(LOOT_TOKEN))}
      >
        Claim Loot Token
      </button>
      <button
        type="button"
        onClick={() => setDestination(claimLootChestReward(LOOT_POTION))}
      >
        Claim Loot Potion
      </button>
      <button
        type="button"
        onClick={() =>
          setDestination(
            claimLootChestReward({
              category: 'Nothing',
              id: 'loot-nothing',
              itemType: 'nothing',
            })
          )
        }
      >
        Claim Nothing
      </button>
      <button type="button" onClick={discardSelectedRewardToken}>
        Discard Active Token
      </button>
      <button type="button" onClick={addSelectedRewardTokenToBag}>
        Add Active Token To Bag
      </button>
      <button type="button" onClick={activatePendingCaveTokenReward}>
        Activate Cave Token
      </button>
      <button type="button" onClick={() => resolveSelectedPotionReward(0)}>
        Replace Potion
      </button>
      <button type="button" onClick={() => resolveSelectedPotionReward()}>
        Discard Active Potion
      </button>
      <button
        type="button"
        onClick={() => setDestination(continueCaveRewardResolution())}
      >
        Continue Cave Rewards
      </button>
      <button type="button" onClick={returnFromMiniGame}>
        Return
      </button>
    </div>
  );
}

function renderProbe(options) {
  return render(
    <GameSetupProvider initialGameSetup={createSetup(options)}>
      <LootChestStateProbe />
    </GameSetupProvider>
  );
}

test('adds an available loot potion and preserves River same-player return', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Win River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Potion' }));

  expect(screen.getByText('Destination: /gameplay')).toBeInTheDocument();
  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();
  expect(screen.getByText('Potions: small-heal')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Return' }));

  expect(screen.getByText('Current: player-1')).toBeInTheDocument();
  expect(screen.getByText('Next turn: clear')).toBeInTheDocument();
});

test('advances after a board Loot Chest sequence resolves directly', () => {
  renderProbe();

  fireEvent.click(
    screen.getByRole('button', { name: 'Start Board Loot Chest' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Claim Nothing' }));

  expect(screen.getByText('Destination: /gameplay')).toBeInTheDocument();
  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Return' }));

  expect(screen.getByText('Current: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn: pending')).toBeInTheDocument();
});

test('advances after a board Loot Chest token assignment is complete', () => {
  renderProbe();

  fireEvent.click(
    screen.getByRole('button', { name: 'Start Board Loot Chest' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Token' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Add Active Token To Bag' })
  );

  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Return' }));

  expect(screen.getByText('Current: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn: pending')).toBeInTheDocument();
});

test('marks a Loot Chest token added to the bag as unseen', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Win River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Token' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add Active Token To Bag' }));

  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();
  expect(screen.getByText('Unseen bag tokens: yes')).toBeInTheDocument();
});

test('uses the existing full-potion assignment and replacement flow', () => {
  renderProbe({ fullPotions: true });

  fireEvent.click(screen.getByRole('button', { name: 'Start River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Win River' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Potion' }));

  expect(screen.getByText('Destination: /reward')).toBeInTheDocument();
  expect(screen.getByText('Reward source: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Loot status: processing')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Replace Potion' }));

  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();
  expect(screen.getByText('Potions: small-heal,potion-2,potion-3')).toBeInTheDocument();
});

test('queues a Loot token before the preserved Cave token and then advances the turn', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Cave' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retreat Cave With Loot' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Token' }));

  expect(screen.getByText('Destination: /reward')).toBeInTheDocument();
  expect(screen.getByText('Reward source: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Loot status: processing')).toBeInTheDocument();
  expect(screen.getByText('Cave token status: pendingAssignment')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Active Token' }));
  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Activate Cave Token' }));
  expect(screen.getByText('Reward source: cave')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Active Token' }));
  expect(screen.getByText('Cave token status: discarded')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Return' }));
  expect(screen.getByText('Current: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn: pending')).toBeInTheDocument();
});

test('grants Nothing and keeps the existing Cave token assignment next', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Start Cave' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retreat Cave With Loot' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Nothing' }));

  expect(screen.getByText('Destination: /reward')).toBeInTheDocument();
  expect(screen.getByText('Loot status: resolved')).toBeInTheDocument();
  expect(screen.getByText('Reward source: cave')).toBeInTheDocument();
  expect(screen.getByText('Potions: none')).toBeInTheDocument();
});

test('processes Loot and Cave potions separately before advancing the turn', () => {
  renderProbe({ fullPotions: true });

  fireEvent.click(screen.getByRole('button', { name: 'Start Cave' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Retreat Cave With Loot And Potion' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Claim Loot Potion' }));

  expect(screen.getByText('Reward source: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Resolution stage: potionResolution')).toBeInTheDocument();
  expect(screen.getByText('Potions: potion-1,potion-2,potion-3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Active Potion' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue Cave Rewards' }));

  expect(screen.getByText('Reward source: cave')).toBeInTheDocument();
  expect(screen.getByText('Resolution stage: potionResolution')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Active Potion' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue Cave Rewards' }));

  expect(screen.getByText('Current: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn: pending')).toBeInTheDocument();
  expect(screen.getByText('Resolution stage: none')).toBeInTheDocument();
});
