import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../gameSetup/gameSetup';

function getPotion(potionId) {
  return POTION_DEFINITIONS.find(({ id }) => id === potionId);
}

function createCauldronSetup() {
  const setup = createInitialGameSetup();

  setup.players[0].potions = [
    getPotion('small-heal'),
    getPotion('cauldron'),
    getPotion('heal'),
  ];
  setup.turnOrder = ['player-1', 'player-2'];

  return setup;
}

function CauldronProbe() {
  const {
    consumePlayerPotion,
    gameSetup,
    resolveCauldronChoice,
    startCauldronChoice,
  } = useGameSetup();
  const player = gameSetup.players[0];
  const choiceState = gameSetup.cauldronChoiceState;

  return (
    <div>
      <button
        type="button"
        onClick={() => consumePlayerPotion('player-1', 1, 'board')}
      >
        Generic consume
      </button>
      <button
        type="button"
        onClick={() => startCauldronChoice('player-1', 1)}
      >
        Start Cauldron
      </button>
      <button
        type="button"
        onClick={() => resolveCauldronChoice('player-1', 'devine-chance')}
      >
        Choose Devine Chance
      </button>
      <button
        type="button"
        onClick={() => resolveCauldronChoice('player-1', 'not-offered')}
      >
        Choose invalid
      </button>
      <p>{`Potions: ${player.potions.map(({ id }) => id).join(',')}`}</p>
      <p>{`Board used: ${player.turnPotionUsage.boardPotionUsedThisTurn}`}</p>
      <p>{`Active: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Choice slot: ${choiceState?.originalPotionSlotIndex ?? 'none'}`}</p>
      <p>{`Choices: ${choiceState?.potionIds.join(',') ?? 'none'}`}</p>
    </div>
  );
}

describe('Cauldron context behavior', () => {
  beforeEach(() => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.99);
  });

  test('starts a guarded choice without consuming, locking, or activating Cauldron', () => {
    render(
      <GameSetupProvider initialGameSetup={createCauldronSetup()}>
        <CauldronProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generic consume' }));
    expect(
      screen.getByText('Potions: small-heal,cauldron,heal')
    ).toBeInTheDocument();
    expect(screen.getByText('Choice slot: none')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Cauldron' }));

    expect(
      screen.getByText('Potions: small-heal,cauldron,heal')
    ).toBeInTheDocument();
    expect(screen.getByText('Board used: false')).toBeInTheDocument();
    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Choice slot: 1')).toBeInTheDocument();
    expect(
      screen.getByText('Choices: roll-choice,devine-chance,sos')
    ).toBeInTheDocument();
  });

  test('replaces the original slot and locks Board use only for an offered choice', () => {
    render(
      <GameSetupProvider initialGameSetup={createCauldronSetup()}>
        <CauldronProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Cauldron' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose invalid' }));

    expect(
      screen.getByText('Potions: small-heal,cauldron,heal')
    ).toBeInTheDocument();
    expect(screen.getByText('Board used: false')).toBeInTheDocument();
    expect(screen.getByText('Choice slot: 1')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Choose Devine Chance' })
    );

    expect(
      screen.getByText('Potions: small-heal,devine-chance,heal')
    ).toBeInTheDocument();
    expect(screen.getByText('Board used: true')).toBeInTheDocument();
    expect(screen.getByText('Active: none')).toBeInTheDocument();
    expect(screen.getByText('Choice slot: none')).toBeInTheDocument();
  });

  test('does not start after Board potion use is already locked', () => {
    const setup = createCauldronSetup();

    setup.players[0].turnPotionUsage.boardPotionUsedThisTurn = true;

    render(
      <GameSetupProvider initialGameSetup={setup}>
        <CauldronProbe />
      </GameSetupProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Cauldron' }));

    expect(screen.getByText('Choice slot: none')).toBeInTheDocument();
    expect(
      screen.getByText('Potions: small-heal,cauldron,heal')
    ).toBeInTheDocument();
  });
});
