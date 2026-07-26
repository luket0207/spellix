import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

function HealingPotionProbe() {
  const { consumePlayerPotion, gameSetup } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion(player.id, 0, 'board')}
      >
        Use Board Potion
      </button>
      <button
        type="button"
        onClick={() => consumePlayerPotion(player.id, 0, 'battle')}
      >
        Use Battle Potion
      </button>
      <p>{`Health: ${player.currentHealth}/${player.maxHealth}`}</p>
      <p>{`Potions: ${player.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Active potion: ${player.activePotion?.id ?? 'none'}`}</p>
    </div>
  );
}

function createHealingSetup(potionId, { battle = false } = {}) {
  const setup = createInitialGameSetup();

  setup.players[0] = {
    ...setup.players[0],
    baseMaxHealth: 100,
    currentHealth: 40,
    maxHealth: 115,
    potions: [POTION_DEFINITIONS.find(({ id }) => id === potionId)],
    spellSlots: setup.players[0].spellSlots.map((slot, index) => ({
      ...slot,
      tokens:
        index === 0
          ? [1, 2, 3].map((number) => ({
              committed: true,
              id: `light-green-${number}`,
              type: 'light-green',
            }))
          : [],
    })),
  };
  setup.turnOrder = ['player-1', 'player-2'];
  setup.activeBattle = battle
    ? {
        currentBattleActor: 'player',
        enemyId: 'vilewhisker-rat',
        isResolvingTurn: false,
        phase: 'active',
        playerId: 'player-1',
      }
    : null;

  return setup;
}

test('Small Heal uses the current Light Green-adjusted max health and is consumed on the board', () => {
  render(
    <GameSetupProvider initialGameSetup={createHealingSetup('small-heal')}>
      <HealingPotionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Use Board Potion' }));

  expect(screen.getByText('Health: 75/115')).toBeInTheDocument();
  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
});

test('First Aid heals in battle, is consumed, and does not become active', () => {
  render(
    <GameSetupProvider
      initialGameSetup={createHealingSetup('first-aid', { battle: true })}
    >
      <HealingPotionProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Use Battle Potion' }));

  expect(screen.getByText('Health: 100/115')).toBeInTheDocument();
  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
});
