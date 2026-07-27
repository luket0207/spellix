import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

function createToken(id, type, { protected: isProtected = false } = {}) {
  return {
    committed: true,
    id,
    protected: isProtected,
    type,
  };
}

function createTroublemakerSetup({
  casterTokens = [],
  targetTokens = [],
} = {}) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'troublemaker'),
  ];
  setup.players[0].spellSlots[0].tokens = casterTokens;
  setup.players[1].spellSlots[0].tokens = targetTokens;
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function TroublemakerProbe() {
  const {
    dismissTroublemakerResult,
    gameSetup,
    resolveTargetPlayerPotion,
    resolveTroublemakerRoll,
  } = useGameSetup();
  const caster = gameSetup.players[0];
  const target = gameSetup.players[1];
  const result = gameSetup.troublemakerResult;

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
      <button
        type="button"
        onClick={() => resolveTroublemakerRoll('player-1', 2)}
      >
        Roll even
      </button>
      <button
        type="button"
        onClick={() => resolveTroublemakerRoll('player-1', 3)}
      >
        Roll odd
      </button>
      <button
        type="button"
        onClick={() => dismissTroublemakerResult('player-1')}
      >
        Continue
      </button>
      <p>{`Caster potions: ${caster.potions.length}`}</p>
      <p>{`Caster active: ${caster.activePotion?.id ?? 'none'}`}</p>
      <p>{`Chosen target: ${caster.activePotion?.targetPlayerId ?? 'none'}`}</p>
      <p>{`Target pending: ${target.pendingPotionEffects?.length ?? 0}`}</p>
      <p>{`Caster tokens: ${caster.spellSlots.flatMap(({ tokens }) => tokens).map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Target tokens: ${target.spellSlots.flatMap(({ tokens }) => tokens).map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Result loser: ${result?.losingPlayerId ?? 'none'}`}</p>
      <p>{`Result roll: ${result?.roll ?? 'none'}`}</p>
      <p>{`Removed tokens: ${result?.removedTokens.map(({ token }) => token.id).join(',') || 'none'}`}</p>
    </div>
  );
}

describe('Troublemaker context behavior', () => {
  test('keeps Troublemaker active on the caster and removes a target Black token for an even roll', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createTroublemakerSetup({
          targetTokens: [
            createToken('starting-red', 'red', { protected: true }),
            createToken('target-green', 'green'),
            createToken('target-black', 'black'),
          ],
        })}
      >
        <TroublemakerProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose target' }));

    expect(screen.getByText('Caster potions: 0')).toBeInTheDocument();
    expect(screen.getByText('Caster active: troublemaker')).toBeInTheDocument();
    expect(screen.getByText('Chosen target: player-2')).toBeInTheDocument();
    expect(screen.getByText('Target pending: 0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Roll even' }));

    expect(
      screen.getByText('Target tokens: starting-red,target-green')
    ).toBeInTheDocument();
    expect(screen.getByText('Result loser: player-2')).toBeInTheDocument();
    expect(screen.getByText('Result roll: 2')).toBeInTheDocument();
    expect(screen.getByText('Removed tokens: target-black')).toBeInTheDocument();
    expect(screen.getByText('Caster active: troublemaker')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Caster active: none')).toBeInTheDocument();
    expect(screen.getByText('Result loser: none')).toBeInTheDocument();
  });

  test('removes a random eligible caster token for an odd roll without removing a starting token', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    render(
      <GameSetupProvider
        initialGameSetup={createTroublemakerSetup({
          casterTokens: [
            createToken('starting-blue', 'blue', { protected: true }),
            createToken('caster-green', 'green'),
            createToken('caster-purple', 'purple'),
          ],
          targetTokens: [createToken('target-black', 'black')],
        })}
      >
        <TroublemakerProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose target' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll odd' }));

    expect(
      screen.getByText('Caster tokens: starting-blue,caster-green')
    ).toBeInTheDocument();
    expect(screen.getByText('Target tokens: target-black')).toBeInTheDocument();
    expect(screen.getByText('Result loser: player-1')).toBeInTheDocument();
    expect(screen.getByText('Removed tokens: caster-purple')).toBeInTheDocument();
    expect(Math.random).toHaveBeenCalledTimes(1);
  });

  test('records a safe no-token result when only protected tokens remain', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createTroublemakerSetup({
          targetTokens: [
            createToken('starting-red', 'red', { protected: true }),
          ],
        })}
      >
        <TroublemakerProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Choose target' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll even' }));

    expect(screen.getByText('Target tokens: starting-red')).toBeInTheDocument();
    expect(screen.getByText('Result loser: player-2')).toBeInTheDocument();
    expect(screen.getByText('Removed tokens: none')).toBeInTheDocument();
  });
});
