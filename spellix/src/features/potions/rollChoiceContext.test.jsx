import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

const rollChoice = POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice');

function RollChoiceProbe() {
  const {
    activeBattle,
    clearPlayerForcedRoll,
    consumePlayerPotion,
    gameSetup,
  } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion(player.id, 0, 'board')}
      >
        Confirm Without Choice
      </button>
      {[1, 2, 3, 4, 5, 6].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() =>
            consumePlayerPotion(player.id, 0, 'board', {
              forcedRollValue: value,
            })
          }
        >
          {`Board Choice ${value}`}
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          consumePlayerPotion(player.id, 0, 'battle', {
            forcedRollValue: 2,
          })
        }
      >
        Battle Choice 2
      </button>
      <button type="button" onClick={() => clearPlayerForcedRoll(player.id)}>
        Clear Forced Roll
      </button>
      <p>{`Potions: ${player.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Board used: ${player.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Battle used: ${activeBattle?.playerPotionUsedThisTurn ?? false}`}</p>
      <p>{`Forced roll: ${player.nextForcedRoll?.value ?? 'none'}`}</p>
      <p>{`Forced source: ${player.nextForcedRoll?.sourcePotionId ?? 'none'}`}</p>
      <p>{`Forced context: ${player.nextForcedRoll?.usedFrom ?? 'none'}`}</p>
      <p>{`Active potion: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Active choice: ${player.activePotion?.chosenRoll ?? 'none'}`}</p>
    </div>
  );
}

function createRollChoiceSetup({ battle = false } = {}) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [rollChoice];
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

test('does not consume Roll Choice when confirmation has no selected value', () => {
  render(
    <GameSetupProvider initialGameSetup={createRollChoiceSetup()}>
      <RollChoiceProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Confirm Without Choice' }));

  expect(screen.getByText('Potions: roll-choice')).toBeInTheDocument();
  expect(screen.getByText('Board used: false')).toBeInTheDocument();
  expect(screen.getByText('Forced roll: none')).toBeInTheDocument();
});

test.each([1, 2, 3, 4, 5, 6])(
  'stores Board choice %s, consumes the potion, and clears it after one roll',
  (value) => {
    render(
      <GameSetupProvider initialGameSetup={createRollChoiceSetup()}>
        <RollChoiceProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: `Board Choice ${value}` })
    );

    expect(screen.getByText('Potions: none')).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    expect(screen.getByText(`Forced roll: ${value}`)).toBeInTheDocument();
    expect(screen.getByText('Forced source: roll-choice')).toBeInTheDocument();
    expect(screen.getByText('Forced context: board')).toBeInTheDocument();
    expect(screen.getByText('Active potion: roll-choice')).toBeInTheDocument();
    expect(screen.getByText(`Active choice: ${value}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Forced Roll' }));

    expect(screen.getByText('Forced roll: none')).toBeInTheDocument();
    expect(screen.getByText('Active potion: none')).toBeInTheDocument();
  }
);

test('stores Battle choice without creating a Board Active Potion', () => {
  render(
    <GameSetupProvider initialGameSetup={createRollChoiceSetup({ battle: true })}>
      <RollChoiceProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Battle Choice 2' }));

  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(screen.getByText('Battle used: true')).toBeInTheDocument();
  expect(screen.getByText('Forced roll: 2')).toBeInTheDocument();
  expect(screen.getByText('Forced context: battle')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
});
