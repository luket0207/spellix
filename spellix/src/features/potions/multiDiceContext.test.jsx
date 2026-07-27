import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';
import ActivePotionSection from './ActivePotionSection';

function MultiDicePotionProbe() {
  const {
    advanceTurn,
    clearPlayerBoardDiceEffect,
    consumePlayerPotion,
    gameSetup,
  } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 0, 'board')}
      >
        Use potion
      </button>
      <button
        type="button"
        onClick={() => clearPlayerBoardDiceEffect('player-1')}
      >
        Resolve roll
      </button>
      <button type="button" onClick={advanceTurn}>
        Advance turn
      </button>
      <p>{`Potions: ${player.potions.length}`}</p>
      <p>{`Active: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Next board dice: ${player.nextBoardDiceCount ?? 1}`}</p>
      <p>{`Board used: ${player.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <ActivePotionSection
        activePotion={player.activePotion}
        language="en"
        languageClassName="language-en"
        title="Player Active Potion"
      />
    </div>
  );
}

function createMultiDiceSetup(potionId) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === potionId),
  ];
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

describe('multi-dice potion context behavior', () => {
  test.each([
    ['double-dice', 'Double Dice', 2],
    ['triple-dice', 'Triple Dice', 3],
  ])(
    'activates and resolves %s',
    (potionId, potionName, expectedDiceCount) => {
      render(
        <GameSetupProvider initialGameSetup={createMultiDiceSetup(potionId)}>
          <MultiDicePotionProbe />
        </GameSetupProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Use potion' }));

      expect(screen.getByText('Potions: 0')).toBeInTheDocument();
      expect(screen.getByText(`Active: ${potionId}`)).toBeInTheDocument();
      expect(
        screen.getByText(`Next board dice: ${expectedDiceCount}`)
      ).toBeInTheDocument();
      expect(screen.getByText('Board used: true')).toBeInTheDocument();
      expect(
        within(
          screen.getByRole('region', { name: 'Player Active Potion' })
        ).getByText(potionName)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Resolve roll' }));

      expect(screen.getByText('Active: none')).toBeInTheDocument();
      expect(screen.getByText('Next board dice: 1')).toBeInTheDocument();
    }
  );

  test('clears an unused multi-dice effect when the turn ends', () => {
    render(
      <GameSetupProvider initialGameSetup={createMultiDiceSetup('double-dice')}>
        <MultiDicePotionProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use potion' }));
    fireEvent.click(screen.getByRole('button', { name: 'Advance turn' }));

    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Next board dice: 1')).toBeInTheDocument();
  });
});
