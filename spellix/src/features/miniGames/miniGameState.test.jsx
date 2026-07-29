import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getFirstStartAreaPosition } from '../gameBoard/board';
import { createPlayers } from '../gameSetup/gameSetup';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';
import MiniGameLosePage from '../../pages/MiniGames/MiniGameLosePage';
import { getPendingCaveReward } from './caveRewardGrant';

const CAVE_REWARD_METADATA = {
  hasLootChest: true,
  hasRollAgainPotion: true,
  potion: { id: 'small-heal', name: 'Small Heal', rarity: 'Common' },
  token: { rarity: 'Common', type: 'red' },
};

function createMiniGameSetup() {
  const players = createPlayers(2).map((player) => ({
    ...player,
    tokenBag: [],
  }));

  return {
    activeBattle: null,
    board: null,
    currentTurnIndex: 0,
    pendingPotionGrant: null,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function MiniGameStateProbe() {
  const {
    activeBattle,
    addSelectedRewardTokenToBag,
    applyMiniGameFailurePunishment,
    assignSelectedRewardTokenToSpellSlot,
    completeMiniGame,
    currentPlayer,
    discardSelectedRewardToken,
    gameSetup,
    dismissMiniGameReturnNotice,
    dismissNextTurnModal,
    miniGameResult,
    miniGameReturnNotice,
    pendingNextTurnModal,
    replaceSelectedRewardTokenInBag,
    resolvePendingCavePotionReward,
    returnFromMiniGame,
    startMiniGame,
  } = useGameSetup();
  const playerOne = gameSetup.players.find(({ id }) => id === 'player-1');
  const pendingCaveReward = getPendingCaveReward(miniGameResult?.caveRewardGrant);

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Player 1 health: ${playerOne?.currentHealth ?? 'none'}`}</p>
      <p>{`Player 1 died last turn: ${playerOne?.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Mini game: ${miniGameResult?.type ?? 'none'}`}</p>
      <p>{`Result: ${miniGameResult?.result ?? 'none'}`}</p>
      <p>{`Return: ${miniGameResult?.returnBehaviour ?? 'none'}`}</p>
      <p>{`Cave loot: ${miniGameResult?.caveRewards?.hasLootChest ? 'found' : 'none'}`}</p>
      <p>{`Cave token: ${miniGameResult?.caveRewards?.token?.type ?? 'none'}`}</p>
      <p>{`Cave pending reward: ${pendingCaveReward?.type ?? 'none'}`}</p>
      <p>{`Cave token status: ${miniGameResult?.caveRewardGrant?.token?.status ?? 'none'}`}</p>
      <p>{`Reward source: ${activeBattle?.source ?? 'none'}`}</p>
      <p>{`Player 1 bag: ${playerOne?.tokenBag.map(({ type }) => type).join(',') || 'empty'}`}</p>
      <p>{`Player 1 potions: ${playerOne?.potions.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Notice: ${miniGameReturnNotice?.message ?? 'none'}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
      <p>{`Punishment health: ${miniGameResult?.failurePunishment?.healthLost ?? 'none'}`}</p>
      <p>{`Removed tokens: ${miniGameResult?.failurePunishment?.deathPenalty?.removedTokens.length ?? 0}`}</p>
      <p>{`Player 1 slot tokens: ${playerOne?.spellSlots.flatMap(({ tokens }) => tokens).length ?? 0}`}</p>
      <button type="button" onClick={() => startMiniGame('river', 'player-1')}>
        Start River
      </button>
      <button type="button" onClick={() => startMiniGame('cave', 'player-1')}>
        Start Cave
      </button>
      <button type="button" onClick={() => completeMiniGame('win')}>
        Win River
      </button>
      <button type="button" onClick={() => completeMiniGame('loss')}>
        Lose River
      </button>
      <button type="button" onClick={() => completeMiniGame('win', { rollAgain: false })}>
        Retreat Cave
      </button>
      <button
        type="button"
        onClick={() =>
          completeMiniGame('win', {
            caveRewards: CAVE_REWARD_METADATA,
            rollAgain: true,
          })
        }
      >
        Retreat Cave With Roll Again
      </button>
      <button type="button" onClick={returnFromMiniGame}>
        Return
      </button>
      <button type="button" onClick={addSelectedRewardTokenToBag}>
        Add Cave Token To Bag
      </button>
      <button type="button" onClick={discardSelectedRewardToken}>
        Discard Cave Token
      </button>
      <button type="button" onClick={() => replaceSelectedRewardTokenInBag('bag-1')}>
        Replace Cave Token
      </button>
      <button type="button" onClick={() => assignSelectedRewardTokenToSpellSlot('slot-3')}>
        Assign Cave Token To Spell Slot
      </button>
      <button type="button" onClick={() => resolvePendingCavePotionReward(0)}>
        Replace Cave Potion
      </button>
      <button
        type="button"
        onClick={() => applyMiniGameFailurePunishment('player-1', 25)}
      >
        Apply Failure Punishment
      </button>
      <button type="button" onClick={dismissMiniGameReturnNotice}>
        Dismiss Notice
      </button>
      <button type="button" onClick={dismissNextTurnModal}>
        Dismiss Next Turn
      </button>
    </div>
  );
}

function renderProbe(initialGameSetup = createMiniGameSetup()) {
  render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MiniGameStateProbe />
    </GameSetupProvider>
  );
}

function ReturnedGameStateProbe() {
  const { currentPlayer, gameSetup, pendingNextTurnModal } = useGameSetup();
  const playerOne = gameSetup.players.find(({ id }) => id === 'player-1');

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Player 1 health: ${playerOne?.currentHealth ?? 'none'}`}</p>
      <p>{`Player 1 died last turn: ${playerOne?.diedLastTurn ? 'yes' : 'no'}`}</p>
      <p>{`Player 1 position: ${JSON.stringify(playerOne?.position ?? null)}`}</p>
      <p>{`Player 1 slot tokens: ${playerOne?.spellSlots.flatMap(({ tokens }) => tokens).length ?? 0}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal ? 'pending' : 'clear'}`}</p>
    </div>
  );
}

test('mini game failure punishment applies health and death-token loss only once', () => {
  const gameSetup = createMiniGameSetup();
  gameSetup.players[0] = {
    ...gameSetup.players[0],
    currentHealth: 20,
    spellSlots: gameSetup.players[0].spellSlots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            tokens: [
              {
                committed: true,
                id: 'gained-black',
                protected: false,
                type: 'black',
              },
            ],
          }
        : slot
    ),
  };
  gameSetup.miniGameResult = {
    playerId: 'player-1',
    result: 'loss',
    returnBehaviour: 'nextPlayerTurn',
    type: 'river',
  };

  renderProbe(gameSetup);

  fireEvent.click(screen.getByRole('button', { name: /apply failure punishment/i }));

  expect(screen.getByText('Player 1 health: 0')).toBeInTheDocument();
  expect(screen.getByText('Player 1 died last turn: yes')).toBeInTheDocument();
  expect(screen.getByText('Punishment health: 25')).toBeInTheDocument();
  expect(screen.getByText('Removed tokens: 1')).toBeInTheDocument();
  expect(screen.getByText('Player 1 slot tokens: 0')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /apply failure punishment/i }));

  expect(screen.getByText('Player 1 health: 0')).toBeInTheDocument();
  expect(screen.getByText('Removed tokens: 1')).toBeInTheDocument();
});

test('Mini Game Failed respawns at full health in Start Area and advances the turn', () => {
  jest.useFakeTimers();
  const gameSetup = createMiniGameSetup();
  gameSetup.players[0] = {
    ...gameSetup.players[0],
    currentHealth: 10,
    position: { x: 900, y: 900 },
    spellSlots: gameSetup.players[0].spellSlots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            tokens: [
              {
                committed: true,
                id: 'gained-black',
                protected: false,
                type: 'black',
              },
            ],
          }
        : slot
    ),
  };
  gameSetup.miniGameResult = {
    playerId: 'player-1',
    result: 'loss',
    returnBehaviour: 'nextPlayerTurn',
    type: 'river',
  };

  render(
    <GameSetupProvider initialGameSetup={gameSetup}>
      <MemoryRouter initialEntries={['/mini-game/lose']}>
        <Routes>
          <Route
            path="/mini-game/lose"
            element={<MiniGameLosePage randomFn={() => 0} />}
          />
          <Route path="/gameplay" element={<ReturnedGameStateProbe />} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  expect(screen.getByText(/black token was removed from column 1/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /respawn/i }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Player 1 health: 100')).toBeInTheDocument();
  expect(screen.getByText('Player 1 died last turn: no')).toBeInTheDocument();
  expect(
    screen.getByText(
      `Player 1 position: ${JSON.stringify(getFirstStartAreaPosition(gameSetup.board))}`
    )
  ).toBeInTheDocument();
  expect(screen.getByText('Player 1 slot tokens: 0')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();

  jest.useRealTimers();
});

test('River wins keep the same player active and create the roll-again notice', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start river/i }));
  fireEvent.click(screen.getByRole('button', { name: /win river/i }));

  expect(screen.getByText('Mini game: river')).toBeInTheDocument();
  expect(screen.getByText('Result: win')).toBeInTheDocument();
  expect(screen.getByText('Return: samePlayerRollAgain')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(
    screen.getByText('Notice: You crossed the river! You may roll again.')
  ).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }));
  expect(screen.getByText('Notice: none')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();
});

test('River losses advance to the next player when returning', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start river/i }));
  fireEvent.click(screen.getByRole('button', { name: /lose river/i }));

  expect(screen.getByText('Result: loss')).toBeInTheDocument();
  expect(screen.getByText('Return: nextPlayerTurn')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(screen.getByText('Notice: none')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /dismiss next turn/i }));
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();
});

test('Cave retreat without roll again advances and queues the next-turn modal', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start cave/i }));
  fireEvent.click(screen.getByRole('button', { name: /^retreat cave$/i }));

  expect(screen.getByText('Return: nextPlayerTurn')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: pending')).toBeInTheDocument();
  expect(screen.getByText('Notice: none')).toBeInTheDocument();
});

test('Cave roll-again retreat keeps the player and creates its return notice', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start cave/i }));
  fireEvent.click(screen.getByRole('button', { name: /retreat cave with roll again/i }));

  expect(screen.getByText('Return: samePlayerRollAgain')).toBeInTheDocument();
  expect(screen.getByText('Cave loot: found')).toBeInTheDocument();
  expect(screen.getByText('Cave token: red')).toBeInTheDocument();
  expect(screen.getByText('Player 1 bag: empty')).toBeInTheDocument();
  expect(screen.getByText('Player 1 potions: small-heal')).toBeInTheDocument();
  expect(screen.getByText('Cave pending reward: token')).toBeInTheDocument();
  expect(screen.getByText('Cave token status: pendingAssignment')).toBeInTheDocument();
  expect(screen.getByText('Reward source: cave')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));
  expect(screen.getByText('Mini game: cave')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /add cave token to bag/i }));
  expect(screen.getByText('Player 1 bag: red')).toBeInTheDocument();
  expect(screen.getByText('Cave pending reward: none')).toBeInTheDocument();
  expect(screen.getByText('Cave token status: assigned')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));

  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: clear')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Notice: Your roll again potion was used, it is your turn to roll again.'
    )
  ).toBeInTheDocument();
});

test('Cave full-capacity rewards resolve token first and block return until both choices finish', () => {
  const gameSetup = createMiniGameSetup();
  gameSetup.players[0] = {
    ...gameSetup.players[0],
    potions: Array.from({ length: 3 }, (_, index) => ({
      id: `owned-potion-${index + 1}`,
      name: `Owned Potion ${index + 1}`,
    })),
    tokenBag: Array.from({ length: 5 }, (_, index) => ({
      committed: false,
      id: `bag-${index + 1}`,
      type: index === 0 ? 'blue' : 'red',
    })),
  };

  renderProbe(gameSetup);
  fireEvent.click(screen.getByRole('button', { name: /start cave/i }));
  fireEvent.click(screen.getByRole('button', { name: /retreat cave with roll again/i }));

  expect(screen.getByText('Cave pending reward: token')).toBeInTheDocument();
  expect(screen.getByText('Player 1 bag: blue,red,red,red,red')).toBeInTheDocument();
  expect(screen.getByText('Player 1 potions: owned-potion-1,owned-potion-2,owned-potion-3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));
  expect(screen.getByText('Mini game: cave')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /replace cave token/i }));
  expect(screen.getByText('Cave pending reward: potion')).toBeInTheDocument();
  expect(screen.getByText('Cave token status: assigned')).toBeInTheDocument();
  expect(screen.getByText('Player 1 bag: red,red,red,red,red')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));
  expect(screen.getByText('Mini game: cave')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /replace cave potion/i }));
  expect(screen.getByText('Cave pending reward: none')).toBeInTheDocument();
  expect(screen.getByText('Player 1 potions: small-heal,owned-potion-2,owned-potion-3')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
  expect(screen.getByText('Notice: Your roll again potion was used, it is your turn to roll again.')).toBeInTheDocument();
});

test('Cave token assignment can discard the generated token without changing inventory', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: /start cave/i }));
  fireEvent.click(screen.getByRole('button', { name: /retreat cave with roll again/i }));

  fireEvent.click(screen.getByRole('button', { name: /discard cave token/i }));

  expect(screen.getByText('Player 1 bag: empty')).toBeInTheDocument();
  expect(screen.getByText('Cave pending reward: none')).toBeInTheDocument();
  expect(screen.getByText('Cave token status: discarded')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^return$/i }));
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
  expect(screen.getByText('Current player: player-1')).toBeInTheDocument();
});
