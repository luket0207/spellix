import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';
import ActivePotionSection from './ActivePotionSection';

const startingCharge = POTION_DEFINITIONS.find(
  ({ id }) => id === 'starting-charge'
);

function StartingChargeProbe() {
  const {
    activeBattle,
    advanceBattleTurn,
    advanceTurn,
    consumePlayerPotion,
    gameSetup,
    startBattle,
  } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'board')}
      >
        Use Starting Charge
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle('player-1', 1, 'vilewhisker-rat', 'fields')
        }
      >
        Start Battle
      </button>
      <button type="button" onClick={advanceBattleTurn}>
        End Player Battle Turn
      </button>
      <button type="button" onClick={advanceTurn}>
        End Board Turn
      </button>

      <p>{`Potions: ${player.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Active potion: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Board potion used: ${player.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Battle actor: ${activeBattle?.currentBattleActor ?? 'none'}`}</p>
      <p>{`Player charged: ${activeBattle?.playerCharged ?? 'none'}`}</p>

      <ActivePotionSection
        activePotion={player.activePotion}
        language="en"
        languageClassName="language-en"
        title="Active Potion"
      />
    </div>
  );
}

function createStartingChargeSetup() {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [startingCharge];
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

describe('Starting Charge context behavior', () => {
  test('charges the first player battle turn and then expires', () => {
    render(
      <GameSetupProvider initialGameSetup={createStartingChargeSetup()}>
        <StartingChargeProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use Starting Charge' }));

    expect(screen.getByText('Potions: none')).toBeInTheDocument();
    expect(screen.getByText('Active potion: starting-charge')).toBeInTheDocument();
    expect(screen.getByText('Board potion used: true')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Active Potion' })).getByText(
        'Starting Charge'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));

    expect(screen.getByText('Active potion: none')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Active Potion' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Battle actor: player')).toBeInTheDocument();
    expect(screen.getByText('Player charged: true')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'End Player Battle Turn' })
    );

    expect(screen.getByText('Battle actor: enemy')).toBeInTheDocument();
    expect(screen.getByText('Player charged: false')).toBeInTheDocument();
  });

  test('consumes the potion without an effect when the board turn ends', () => {
    render(
      <GameSetupProvider initialGameSetup={createStartingChargeSetup()}>
        <StartingChargeProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use Starting Charge' }));
    expect(screen.getByText('Active potion: starting-charge')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End Board Turn' }));

    expect(screen.getByText('Potions: none')).toBeInTheDocument();
    expect(screen.getByText('Active potion: none')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Active Potion' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
    expect(screen.getByText('Player charged: false')).toBeInTheDocument();
  });
});
