import { fireEvent, render, screen } from '@testing-library/react';
import { GameSetupProvider, useGameSetup } from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

const rollChoice = { id: 'roll-choice', name: 'Roll Choice' };
const smallHeal = { id: 'small-heal', name: 'Small Heal' };
const iceBeam = { id: 'ice-beam', name: 'Ice Beam' };
const heal = { id: 'heal', name: 'Heal' };

function PotionCapacityProbe() {
  const {
    gameSetup,
    grantPotionToPlayer,
    pendingPotionGrant,
    resolvePendingPotionGrant,
    consumePlayerPotion,
  } = useGameSetup();

  return (
    <div>
      <button type="button" onClick={() => grantPotionToPlayer('player-1', heal)}>
        Grant Player 1
      </button>
      <button type="button" onClick={() => grantPotionToPlayer('player-2', heal)}>
        Grant Player 2
      </button>
      <button type="button" onClick={() => resolvePendingPotionGrant()}>
        Discard New
      </button>
      <button type="button" onClick={() => resolvePendingPotionGrant(1)}>
        Replace Second
      </button>
      <button type="button" onClick={() => consumePlayerPotion('player-1', 1)}>
        Use Player 1 Second
      </button>
      <p>{`Player 1 potions: ${gameSetup.players[0].potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Player 2 potions: ${gameSetup.players[1].potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Pending player: ${pendingPotionGrant?.playerId ?? 'none'}`}</p>
      <p>{`Pending potion: ${pendingPotionGrant?.potion.id ?? 'none'}`}</p>
    </div>
  );
}

function createPotionSetup(playerOnePotions = [], playerTwoPotions = []) {
  const gameSetup = createInitialGameSetup();

  gameSetup.players[0].potions = playerOnePotions;
  gameSetup.players[1].potions = playerTwoPotions;

  return gameSetup;
}

describe('potion capacity context integration', () => {
  test('immediately grants below capacity to only the selected player', () => {
    render(
      <GameSetupProvider initialGameSetup={createPotionSetup([], [smallHeal])}>
        <PotionCapacityProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /grant player 1/i }));

    expect(screen.getByText('Player 1 potions: heal')).toBeInTheDocument();
    expect(screen.getByText('Player 2 potions: small-heal')).toBeInTheDocument();
    expect(screen.getByText('Pending player: none')).toBeInTheDocument();
  });

  test('keeps a full-capacity grant pending until the new potion is discarded', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionSetup([rollChoice, smallHeal, iceBeam])}
      >
        <PotionCapacityProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /grant player 1/i }));

    expect(
      screen.getByText('Player 1 potions: roll-choice,small-heal,ice-beam')
    ).toBeInTheDocument();
    expect(screen.getByText('Pending player: player-1')).toBeInTheDocument();
    expect(screen.getByText('Pending potion: heal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /grant player 2/i }));

    expect(screen.getByText('Player 2 potions: none')).toBeInTheDocument();
    expect(screen.getByText('Pending player: player-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /discard new/i }));

    expect(
      screen.getByText('Player 1 potions: roll-choice,small-heal,ice-beam')
    ).toBeInTheDocument();
    expect(screen.getByText('Pending player: none')).toBeInTheDocument();
  });

  test('replaces one selected potion and resolves a pending grant only once', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionSetup([], [rollChoice, smallHeal, iceBeam])}
      >
        <PotionCapacityProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /grant player 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace second/i }));

    expect(screen.getByText('Player 1 potions: none')).toBeInTheDocument();
    expect(screen.getByText('Player 2 potions: roll-choice,heal,ice-beam')).toBeInTheDocument();
    expect(screen.getByText('Pending player: none')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /replace second/i }));

    expect(screen.getByText('Player 2 potions: roll-choice,heal,ice-beam')).toBeInTheDocument();
  });

  test('uses only the selected potion instance when duplicate ids exist', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createPotionSetup([rollChoice, rollChoice, iceBeam])}
      >
        <PotionCapacityProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /use player 1 second/i }));

    expect(screen.getByText('Player 1 potions: roll-choice,ice-beam')).toBeInTheDocument();
    expect(screen.getByText('Player 2 potions: none')).toBeInTheDocument();
  });
});
