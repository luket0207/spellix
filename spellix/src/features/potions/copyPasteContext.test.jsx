import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

const copyPaste = POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste');

function CopyPasteProbe() {
  const {
    consumePlayerPotion,
    currentPlayer,
    resolveCopyPastePotion,
  } = useGameSetup();
  const firstTokenId = currentPlayer.tokenBag[0]?.id;
  const secondTokenId = currentPlayer.tokenBag[1]?.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion(currentPlayer.id, 0, 'board')}
      >
        Generic consume
      </button>
      <button
        type="button"
        onClick={() =>
          resolveCopyPastePotion(currentPlayer.id, 0, firstTokenId)
        }
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={() =>
          resolveCopyPastePotion(currentPlayer.id, 0, firstTokenId, {
            discardDuplicate: true,
          })
        }
      >
        Discard duplicate
      </button>
      <button
        type="button"
        onClick={() =>
          resolveCopyPastePotion(currentPlayer.id, 0, firstTokenId, {
            replacedTokenId: secondTokenId,
          })
        }
      >
        Replace second
      </button>
      <p>{`Potions: ${currentPlayer.potions.map(({ id }) => id).join(',') || 'none'}`}</p>
      <p>{`Bag: ${currentPlayer.tokenBag.map(({ id }) => id).join(',') || 'empty'}`}</p>
      <p>{`Types: ${currentPlayer.tokenBag.map(({ type }) => type).join(',') || 'empty'}`}</p>
      <p>{`Board used: ${currentPlayer.turnPotionUsage?.boardPotionUsedThisTurn ?? false}`}</p>
      <p>{`Active potion: ${currentPlayer.activePotion?.id ?? 'none'}`}</p>
      <p>{`Unseen tokens: ${currentPlayer.hasUnseenTokenBagTokens ? 'yes' : 'no'}`}</p>
    </div>
  );
}

function createCopyPasteSetup(tokenBag) {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [copyPaste];
  setup.players[0].hasUnseenTokenBagTokens = false;
  setup.players[0].tokenBag = tokenBag;
  setup.players[0].spellSlots = [];
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function renderProbe(tokenBag) {
  render(
    <GameSetupProvider initialGameSetup={createCopyPasteSetup(tokenBag)}>
      <CopyPasteProbe />
    </GameSetupProvider>
  );
}

test('cannot consume Copy and Paste through the generic action or with an empty bag', () => {
  renderProbe([]);

  fireEvent.click(screen.getByRole('button', { name: 'Generic consume' }));
  fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

  expect(screen.getByText('Potions: copy-and-paste')).toBeInTheDocument();
  expect(screen.getByText('Bag: empty')).toBeInTheDocument();
  expect(screen.getByText('Board used: false')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: no')).toBeInTheDocument();
});

test('adds a separate duplicate and consumes the potion when the bag has space', () => {
  renderProbe([
    { committed: false, id: 'player-1-red-1', type: 'red' },
  ]);

  fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(screen.getByText('Bag: player-1-red-1,player-1-red-2')).toBeInTheDocument();
  expect(screen.getByText('Types: red,red')).toBeInTheDocument();
  expect(screen.getByText('Board used: true')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: yes')).toBeInTheDocument();
});

test('requires a discard decision while the token bag is full', () => {
  renderProbe([
    { committed: false, id: 'player-1-red-1', type: 'red' },
    { committed: false, id: 'player-1-blue-1', type: 'blue' },
    { committed: false, id: 'player-1-green-1', type: 'green' },
    { committed: false, id: 'player-1-orange-1', type: 'orange' },
    { committed: false, id: 'player-1-purple-1', type: 'purple' },
  ]);

  fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

  expect(screen.getByText('Potions: copy-and-paste')).toBeInTheDocument();
  expect(screen.getByText('Board used: false')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: no')).toBeInTheDocument();
});

test('consumes the potion and leaves a full bag unchanged when discarding the duplicate', () => {
  const tokenBag = [
    { committed: false, id: 'player-1-red-1', type: 'red' },
    { committed: false, id: 'player-1-blue-1', type: 'blue' },
    { committed: false, id: 'player-1-green-1', type: 'green' },
    { committed: false, id: 'player-1-orange-1', type: 'orange' },
    { committed: false, id: 'player-1-purple-1', type: 'purple' },
  ];

  renderProbe(tokenBag);
  fireEvent.click(screen.getByRole('button', { name: 'Discard duplicate' }));

  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(
    screen.getByText(`Bag: ${tokenBag.map(({ id }) => id).join(',')}`)
  ).toBeInTheDocument();
  expect(screen.getByText('Board used: true')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: no')).toBeInTheDocument();
});

test('replaces a chosen existing token with the duplicate in a full bag', () => {
  renderProbe([
    { committed: false, id: 'player-1-red-1', type: 'red' },
    { committed: false, id: 'player-1-blue-1', type: 'blue' },
    { committed: false, id: 'player-1-green-1', type: 'green' },
    { committed: false, id: 'player-1-orange-1', type: 'orange' },
    { committed: false, id: 'player-1-purple-1', type: 'purple' },
  ]);

  fireEvent.click(screen.getByRole('button', { name: 'Replace second' }));

  expect(screen.getByText('Potions: none')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Bag: player-1-red-1,player-1-red-2,player-1-green-1,player-1-orange-1,player-1-purple-1'
    )
  ).toBeInTheDocument();
  expect(screen.getByText('Types: red,red,green,orange,purple')).toBeInTheDocument();
  expect(screen.getByText('Board used: true')).toBeInTheDocument();
  expect(screen.getByText('Active potion: none')).toBeInTheDocument();
  expect(screen.getByText('Unseen tokens: no')).toBeInTheDocument();
});
