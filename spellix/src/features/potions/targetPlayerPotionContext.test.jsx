import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';
import ActivePotionSection from './ActivePotionSection';

function TargetPotionProbe() {
  const {
    advanceTurn,
    gameSetup,
    resolveTargetPlayerPotion,
  } = useGameSetup();
  const caster = gameSetup.players[0];
  const target = gameSetup.players[1];

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          resolveTargetPlayerPotion('player-1', 0, 'player-2')
        }
      >
        Choose target
      </button>
      <button type="button" onClick={advanceTurn}>
        Advance turn
      </button>
      <p>{`Caster potions: ${caster.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Caster board used: ${caster.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Target pending: ${target.pendingPotionEffects?.map(({ potionId }) => potionId).join(',') || 'none'}`}</p>
      <p>{`Target active: ${target.activePotion?.id ?? 'none'}`}</p>
      <ActivePotionSection
        activePotion={target.activePotion}
        language="en"
        languageClassName="language-en"
        title="Target Active Potion"
      />
    </div>
  );
}

function createTargetPotionSetup(potionId) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === potionId),
  ];
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

describe('target player potion context behavior', () => {
  test.each([
    ['spellbound', 'Spellbound'],
    ['heavy-weight', 'Heavy Weight'],
  ])('queues, activates, and expires %s', (potionId, potionName) => {
    render(
      <GameSetupProvider initialGameSetup={createTargetPotionSetup(potionId)}>
        <TargetPotionProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose target' }));

    expect(screen.getByText('Caster potions: none')).toBeInTheDocument();
    expect(screen.getByText('Caster board used: true')).toBeInTheDocument();
    expect(screen.getByText(`Target pending: ${potionId}`)).toBeInTheDocument();
    expect(screen.getByText('Target active: none')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Advance turn' }));

    expect(screen.getByText('Target pending: none')).toBeInTheDocument();
    expect(screen.getByText(`Target active: ${potionId}`)).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', {
        name: 'Target Active Potion',
      })).getByText(potionName)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Advance turn' }));

    expect(screen.getByText('Target active: none')).toBeInTheDocument();
    expect(screen.queryByRole('region', {
      name: 'Target Active Potion',
    })).not.toBeInTheDocument();
  });

  test('does not consume a targeting potion for an invalid self target', () => {
    function SelfTargetProbe() {
      const { gameSetup, resolveTargetPlayerPotion } = useGameSetup();
      const caster = gameSetup.players[0];

      return (
        <>
          <button
            type="button"
            onClick={() =>
              resolveTargetPlayerPotion('player-1', 0, 'player-1')
            }
          >
            Target self
          </button>
          <p>{`Caster potions: ${caster.potions.length}`}</p>
        </>
      );
    }

    render(
      <GameSetupProvider initialGameSetup={createTargetPotionSetup('spellbound')}>
        <SelfTargetProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Target self' }));

    expect(screen.getByText('Caster potions: 1')).toBeInTheDocument();
  });
});
