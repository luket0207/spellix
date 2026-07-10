import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import { createPlayers } from '../features/gameSetup/gameSetup';
import BattlePage from './BattlePage';
import RewardPage from './RewardPage';

function createBattleSetup() {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    hasCommittedInitialSpells: true,
    position: index === 0 ? { x: 3, y: 28 } : { x: 1, y: 29 },
    spellSlots: player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    })),
    tokenBag: [],
  }));

  players[0] = {
    ...players[0],
    currentHealth: 10,
    spellSlots: players[0].spellSlots.map((slot, index) => {
      if (index === 0) {
        return {
          ...slot,
          tokens: [
            { id: 'player-1-red-1', type: 'red', committed: true },
            { id: 'player-1-red-2', type: 'red', committed: true },
          ],
        };
      }

      if (index === 1) {
        return {
          ...slot,
          tokens: [{ id: 'player-1-blue-1', type: 'blue', committed: true }],
        };
      }

      return slot;
    }),
  };

  return {
    activeBattle: {
      enemyCurrentHealth: 120,
      enemyId: 'hellcrown-reaper',
      level: 4,
      phase: 'active',
      playerId: 'player-1',
    },
    board: {
      features: [],
      height: 31,
      squareSize: 30,
      squares: [
        { areaType: 'start-area', id: 'square-0-29', x: 0, y: 29 },
        { areaType: 'start-area', id: 'square-1-29', x: 1, y: 29 },
      ],
      width: 31,
    },
    currentTurnIndex: 0,
    playerCount: 2,
    players,
    turnOrder: ['player-1', 'player-2'],
  };
}

function GameStateSnapshot() {
  const { activeBattle, battleEnemy, battlePlayer, currentPlayer, gameSetup } = useGameSetup();

  return (
    <div>
      <p>{`Current player: ${currentPlayer?.id ?? 'none'}`}</p>
      <p>{`Battle enemy health: ${battleEnemy?.currentHealth ?? 'none'}`}</p>
      <p>{`Battle player health: ${battlePlayer?.currentHealth ?? 'none'}`}</p>
      <p>{`Battle phase: ${activeBattle?.phase ?? 'none'}`}</p>
      <p>{`Player 1 position: ${gameSetup.players[0].position.x},${gameSetup.players[0].position.y}`}</p>
    </div>
  );
}

function renderBattleFlow(initialEntries = ['/battle']) {
  return render(
    <GameSetupProvider initialGameSetup={createBattleSetup()}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={initialEntries}
      >
        <Routes>
          <Route
            path="/battle"
            element={
              <>
                <BattlePage />
                <GameStateSnapshot />
              </>
            }
          />
          <Route
            path="/reward"
            element={
              <>
                <RewardPage />
                <GameStateSnapshot />
              </>
            }
          />
          <Route path="/gameplay" element={<GameStateSnapshot />} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('BattlePage flows', () => {
  test('removes player health in steps, clamps at zero, and respawns on loss', () => {
    renderBattleFlow();
    const playerPanel = screen.getByLabelText(/battle player panel/i);
    const enemyPanel = screen.getByLabelText(/battle enemy panel/i);

    expect(screen.getByText(/battle level: 4/i)).toBeInTheDocument();
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /battle player piece/i })).toHaveClass(
      'battle-player-piece'
    );
    expect(screen.getByRole('img', { name: /battle player piece/i })).toHaveStyle({
      alignSelf: 'flex-start',
      width: 'auto',
    });
    expect(screen.getByRole('img', { name: /hellcrown reaper/i })).toHaveClass(
      'battle-enemy-piece'
    );
    expect(screen.getByText('120 / 120')).toBeInTheDocument();
    expect(within(playerPanel).getByLabelText('2 red tokens in slot 1')).toBeInTheDocument();
    expect(within(playerPanel).getByLabelText('blue token in slot 2')).toBeInTheDocument();
    expect(playerPanel.querySelectorAll('.committed-spell-slot-number')).toHaveLength(6);
    expect(enemyPanel.querySelectorAll('.committed-spell-slot-number')).toHaveLength(6);
    expect(screen.getAllByText('J')).toHaveLength(2);
    expect(screen.queryByText(/地獄冠の死神/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove 5 health/i }));
    expect(screen.getByText('5 / 100')).toBeInTheDocument();
    expect(screen.getByText(/battle player health: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/battle enemy health: 120/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove 5 health/i }));
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /battle lost/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /respawn/i }));

    expect(screen.getByText(/current player: player-2/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: none/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 position: 0,29/i)).toBeInTheDocument();
  });

  test('wins a battle, goes to reward, and continues back to gameplay on the next turn', () => {
    renderBattleFlow();

    fireEvent.click(screen.getByRole('button', { name: /^win$/i }));

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByText(/battle phase: reward/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByText(/current player: player-2/i)).toBeInTheDocument();
    expect(screen.getByText(/battle phase: none/i)).toBeInTheDocument();
    expect(screen.getByText(/player 1 position: 3,28/i)).toBeInTheDocument();
  });
});
