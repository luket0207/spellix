import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

const tokensmith = POTION_DEFINITIONS.find(({ id }) => id === 'tokensmith');

function TokensmithProbe() {
  const { currentPlayer, resolveTokensmithPotion } = useGameSetup();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          resolveTokensmithPotion(
            currentPlayer.id,
            0,
            'player-1-light-green-1'
          )
        }
      >
        Move Light Green
      </button>
      <button
        type="button"
        onClick={() =>
          resolveTokensmithPotion(currentPlayer.id, 0, 'player-1-grey-1')
        }
      >
        Move Grey
      </button>
      <p>{`Potions: ${currentPlayer.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Token bag: ${currentPlayer.tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Spell tokens: ${currentPlayer.spellSlots.flatMap(({ tokens }) => tokens.map(({ id }) => id)).join(',') || 'none'}`}</p>
      <p>{`Health: ${currentPlayer.currentHealth}/${currentPlayer.maxHealth}`}</p>
      <p>{`Board used: ${currentPlayer.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Active potion: ${currentPlayer.activePotion?.id ?? 'none'}`}</p>
      <p>{`Unseen tokens: ${currentPlayer.hasUnseenTokenBagTokens ? 'yes' : 'no'}`}</p>
    </div>
  );
}

function createTokensmithSetup({ fullBag = false, invalidGrey = false } = {}) {
  const setup = createInitialGameSetup();
  const player = setup.players[0];

  player.hasCommittedInitialSpells = true;
  player.hasUnseenTokenBagTokens = false;
  player.potions = [tokensmith];
  player.tokenBag = Array.from(
    { length: fullBag ? 5 : 1 },
    (_, index) => ({
      committed: false,
      id: `bag-${index + 1}`,
      type: 'blue',
    })
  );
  player.spellSlots = player.spellSlots.map((slot) => ({
    ...slot,
    tokens: [],
  }));
  player.spellSlots[0].tokens = invalidGrey
    ? Array.from({ length: 6 }, (_, index) => ({
        committed: true,
        id: `player-1-red-${index + 1}`,
        type: 'red',
      }))
    : [
        {
          committed: true,
          id: 'player-1-light-green-1',
          type: 'light-green',
        },
      ];
  if (invalidGrey) {
    player.spellSlots[1].tokens = [
      {
        committed: true,
        id: 'player-1-grey-1',
        type: 'grey',
      },
    ];
  }
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

test('moves a committed token, consumes Tokensmith, and recalculates health', () => {
  render(
    <GameSetupProvider initialGameSetup={createTokensmithSetup()}>
      <TokensmithProbe />
    </GameSetupProvider>
  );

  expect(screen.getByText('Health: 105/105')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Move Light Green' }));

  expect(
    screen.getByText('Token bag: bag-1,player-1-light-green-1')
  ).toBeInTheDocument();
  expect(screen.getByText('Spell tokens: none')).toBeInTheDocument();
  expect(screen.getByText('Health: 100/100')).toBeInTheDocument();
  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(screen.getByText('Board used: true')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: yes')).toBeInTheDocument();
});

test('does not consume or lock Tokensmith for a full bag or invalid Grey move', () => {
  const { unmount } = render(
    <GameSetupProvider initialGameSetup={createTokensmithSetup({ fullBag: true })}>
      <TokensmithProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Move Light Green' }));
  expect(screen.getByText('Potions: tokensmith')).toBeInTheDocument();
  expect(screen.getByText('Board used: false')).toBeInTheDocument();
  unmount();

  render(
    <GameSetupProvider
      initialGameSetup={createTokensmithSetup({ invalidGrey: true })}
    >
      <TokensmithProbe />
    </GameSetupProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'Move Grey' }));
  expect(screen.getByText('Potions: tokensmith')).toBeInTheDocument();
  expect(screen.getByText('Board used: false')).toBeInTheDocument();
  expect(screen.getByText(/Spell tokens: .*player-1-grey-1/)).toBeInTheDocument();
});
