import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

function createToken(id, type) {
  return { committed: false, id, type };
}

function createBuyAndSellSetup(tokenBag) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'buy-and-sell'),
  ];
  setup.players[0].tokenBag = tokenBag;
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function BuyAndSellProbe() {
  const {
    completeBuyAndSell,
    gameSetup,
    resolveBuyAndSellPotion,
    startBuyAndSell,
  } = useGameSetup();
  const player = gameSetup.players[0];
  const transaction = gameSetup.buyAndSellTransaction;

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          startBuyAndSell(
            'player-1',
            0,
            ['bag-red', 'bag-blue', 'bag-green'],
            ['white', 'yellow']
          )
        }
      >
        Discard selected
      </button>
      <button
        type="button"
        onClick={() => resolveBuyAndSellPotion('player-1', 'white')}
      >
        Choose White
      </button>
      <button
        type="button"
        onClick={() => completeBuyAndSell('player-1')}
      >
        Complete
      </button>
      <p>{`Bag: ${player.tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Potions: ${player.potions.length}`}</p>
      <p>{`Board used: ${player.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Active: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Transaction: ${transaction?.status ?? 'none'}`}</p>
      <p>{`Offers: ${transaction?.rewardTokenTypes.join(',') ?? 'none'}`}</p>
    </div>
  );
}

describe('Buy and Sell context behavior', () => {
  test('discards exactly three verified tokens before consuming or locking the potion', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createBuyAndSellSetup([
          createToken('bag-red', 'red'),
          createToken('bag-blue', 'blue'),
          createToken('bag-green', 'green'),
          createToken('bag-purple', 'purple'),
        ])}
      >
        <BuyAndSellProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Discard selected' })
    );

    expect(screen.getByText('Bag: bag-purple')).toBeInTheDocument();
    expect(screen.getByText('Potions: 1')).toBeInTheDocument();
    expect(screen.getByText('Board used: false')).toBeInTheDocument();
    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Transaction: choosing')).toBeInTheDocument();
    expect(screen.getByText('Offers: white,yellow')).toBeInTheDocument();
  });

  test('adds a new chosen token, then consumes and locks Buy and Sell', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createBuyAndSellSetup([
          createToken('bag-red', 'red'),
          createToken('bag-blue', 'blue'),
          createToken('bag-green', 'green'),
        ])}
      >
        <BuyAndSellProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Discard selected' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choose White' }));

    expect(screen.getByText('Bag: player-1-white-1')).toBeInTheDocument();
    expect(screen.getByText('Potions: 0')).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Transaction: success')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));
    expect(screen.getByText('Transaction: none')).toBeInTheDocument();
  });

  test('does nothing when fewer than three verified bag tokens are supplied', () => {
    render(
      <GameSetupProvider
        initialGameSetup={createBuyAndSellSetup([
          createToken('bag-red', 'red'),
          createToken('bag-blue', 'blue'),
        ])}
      >
        <BuyAndSellProbe />
      </GameSetupProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Discard selected' })
    );

    expect(screen.getByText('Bag: bag-red,bag-blue')).toBeInTheDocument();
    expect(screen.getByText('Potions: 1')).toBeInTheDocument();
    expect(screen.getByText('Board used: false')).toBeInTheDocument();
    expect(screen.getByText('Transaction: none')).toBeInTheDocument();
  });
});
