import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import {
  createInitialGameSetup,
  createPlayers,
} from '../gameSetup/gameSetup';

function createDevineChanceSetup() {
  const setup = createInitialGameSetup();

  setup.playerCount = 3;
  setup.players = createPlayers(3);
  setup.players[0] = {
    ...setup.players[0],
    baseMaxHealth: 110,
    currentHealth: 40,
    maxHealth: 110,
    potions: [
      POTION_DEFINITIONS.find(({ id }) => id === 'devine-chance'),
    ],
  };
  setup.players[1] = {
    ...setup.players[1],
    baseMaxHealth: 100,
    currentHealth: 50,
    maxHealth: 100,
  };
  setup.players[2] = {
    ...setup.players[2],
    baseMaxHealth: 120,
    currentHealth: 60,
    maxHealth: 120,
  };
  setup.turnOrder = ['player-1', 'player-2', 'player-3'];

  return setup;
}

function DevineChanceProbe() {
  const {
    consumePlayerPotion,
    dismissDevineChanceResult,
    gameSetup,
    resolveDevineChanceRoll,
  } = useGameSetup();
  const caster = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'board')}
      >
        Use Devine Chance
      </button>
      <button
        type="button"
        onClick={() => resolveDevineChanceRoll('player-1', 2)}
      >
        Roll even
      </button>
      <button
        type="button"
        onClick={() => resolveDevineChanceRoll('player-1', 3)}
      >
        Roll odd
      </button>
      <button
        type="button"
        onClick={() => dismissDevineChanceResult('player-1')}
      >
        Continue
      </button>
      <p>{`Potions: ${caster.potions.length}`}</p>
      <p>{`Active: ${caster.activePotion?.id ?? 'none'}`}</p>
      <p>{`Result: ${gameSetup.devineChanceResult?.healedGroup ?? 'none'}`}</p>
      {gameSetup.players.map((player) => (
        <p key={player.id}>
          {`${player.id} health: ${player.currentHealth}/${player.maxHealth}`}
        </p>
      ))}
    </div>
  );
}

describe('Devine Chance context behavior', () => {
  test('activates without healing, then an even roll fully heals only the caster', () => {
    render(
      <GameSetupProvider initialGameSetup={createDevineChanceSetup()}>
        <DevineChanceProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Use Devine Chance' })
    );

    expect(screen.getByText('Potions: 0')).toBeInTheDocument();
    expect(screen.getByText('Active: devine-chance')).toBeInTheDocument();
    expect(screen.getByText('player-1 health: 40/110')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll even' }));

    expect(screen.getByText('player-1 health: 110/110')).toBeInTheDocument();
    expect(screen.getByText('player-2 health: 50/100')).toBeInTheDocument();
    expect(screen.getByText('player-3 health: 60/120')).toBeInTheDocument();
    expect(screen.getByText('Result: caster')).toBeInTheDocument();
    expect(screen.getByText('Active: devine-chance')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Result: none')).toBeInTheDocument();
    expect(screen.getByText('Active: none')).toBeInTheDocument();
  });

  test('an odd roll fully heals every other player but not the caster', () => {
    render(
      <GameSetupProvider initialGameSetup={createDevineChanceSetup()}>
        <DevineChanceProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Use Devine Chance' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Roll odd' }));

    expect(screen.getByText('player-1 health: 40/110')).toBeInTheDocument();
    expect(screen.getByText('player-2 health: 100/100')).toBeInTheDocument();
    expect(screen.getByText('player-3 health: 120/120')).toBeInTheDocument();
    expect(screen.getByText('Result: others')).toBeInTheDocument();
    expect(screen.getByText('Active: devine-chance')).toBeInTheDocument();
  });
});
