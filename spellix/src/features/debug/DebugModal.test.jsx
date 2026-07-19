import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import DebugModal from './DebugModal';

function createCurrentPlayer(overrides = {}) {
  return {
    anywhereMode: false,
    colour: 'red',
    hasCommittedInitialSpells: true,
    id: 'player-1',
    tokenBag: [
      { id: 'player-1-red-1', type: 'red', committed: false },
      { id: 'player-1-blue-1', type: 'blue', committed: false },
    ],
    ...overrides,
  };
}

const enemyOptions = [
  { id: 'vilewhisker-rat', label: 'Vilewhisker Rat - Level 1' },
  { id: 'hexmaw-hag', label: 'Hexmaw Hag - Level 2' },
];

const potionPlayers = [
  createCurrentPlayer({
    potions: [
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
      POTION_DEFINITIONS.find(({ id }) => id === 'small-heal'),
      POTION_DEFINITIONS.find(({ id }) => id === 'ice-beam'),
    ],
  }),
  createCurrentPlayer({ colour: 'blue', id: 'player-2', potions: [] }),
];

describe('DebugModal', () => {
  test('offers the Cave Mini Game trigger for the current player', () => {
    const handleStartCaveMiniGame = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        isOpen
        message=""
        onClose={jest.fn()}
        onStartCaveMiniGame={handleStartCaveMiniGame}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start cave mini game/i }));

    expect(handleStartCaveMiniGame).toHaveBeenCalledTimes(1);
  });

  test('renders the debug token controls for a committed current player', () => {
    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onEnableAnywhereMode={jest.fn()}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={jest.fn()}
        onStartSelectedEnemyBattle={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedEnemyIdChange={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(screen.getByRole('dialog', { name: /debug/i })).toBeInTheDocument();
    expect(screen.getByText(/current player: red/i)).toBeInTheDocument();
    expect(screen.getByText(/anywhere mode applies to the current player only/i)).toBeInTheDocument();
    expect(screen.getByText(/anywhere mode: disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/start a debug battle for the current player/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^level 1$/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^level 4$/i })).toBeEnabled();
    expect(screen.getByLabelText(/enemy/i)).toHaveValue('vilewhisker-rat');
    expect(screen.getByRole('button', { name: /start selected enemy battle/i })).toBeEnabled();
    expect(screen.getByLabelText(/token type/i)).toHaveValue('red');
    expect(screen.getByRole('button', { name: /give token/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /enable anywhere mode/i })).toBeEnabled();
    expect(screen.getByRole('dialog', { name: /debug/i })).toHaveClass('debug-modal-panel');
  });

  test('shows the replacement flow when a pending token needs a bag discard choice', () => {
    const handleReplacementChange = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        enemyOptions={enemyOptions}
        isOpen
        message="The red player's token bag is full."
        onEnableAnywhereMode={jest.fn()}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={jest.fn()}
        onStartSelectedEnemyBattle={jest.fn()}
        onPendingTokenReplacementChange={handleReplacementChange}
        onReplacePendingToken={jest.fn()}
        onSelectedEnemyIdChange={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType="purple"
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId="player-1-red-1"
        selectedTokenType="red"
      />
    );

    expect(screen.getByText(/new token: purple/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard new token/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace selected token/i })).toBeEnabled();
    const redToken = screen.getByRole('img', { name: /red token/i });
    const blueToken = screen.getByRole('img', { name: /blue token/i });

    expect(redToken).toHaveClass('token-display--glow', 'token-display--red');
    expect(redToken).toHaveAttribute('title', TOKEN_DEFINITIONS.red.description.en);
    expect(redToken).toHaveAccessibleDescription(TOKEN_DEFINITIONS.red.description.en);
    expect(screen.getByText('Damage')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();
    expect(blueToken).toHaveClass('token-display--glow', 'token-display--blue');

    fireEvent.click(screen.getByDisplayValue('player-1-blue-1'));

    expect(handleReplacementChange).toHaveBeenCalledWith('player-1-blue-1');
  });

  test('shows Japanese names and tooltips for a Japanese current player', () => {
    render(
      <DebugModal
        currentPlayer={createCurrentPlayer({ language: 'jp' })}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onClose={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        pendingTokenType="purple"
        selectedReplacementTokenId="player-1-red-1"
      />
    );

    expect(screen.getByText('ダメージ')).toBeInTheDocument();
    expect(screen.getByText('ガード')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /red token/i })).toHaveAttribute(
      'title',
      'ダメージ+10'
    );
  });

  test('disables token-giving controls until the current player finishes initial spell setup', () => {
    render(
      <DebugModal
        currentPlayer={createCurrentPlayer({ hasCommittedInitialSpells: false })}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onEnableAnywhereMode={jest.fn()}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={jest.fn()}
        onStartSelectedEnemyBattle={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedEnemyIdChange={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(
      screen.getByText(/finish the current player's initial spell setup before using debug token tools/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /give token/i })).toBeDisabled();
    expect(screen.getByLabelText(/token type/i)).toBeDisabled();
  });

  test('shows when anywhere mode is already enabled for the current player', () => {
    const handleEnableAnywhereMode = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer({ anywhereMode: true })}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onEnableAnywhereMode={handleEnableAnywhereMode}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={jest.fn()}
        onStartSelectedEnemyBattle={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedEnemyIdChange={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(screen.getByText(/anywhere mode: enabled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable anywhere mode/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /enable anywhere mode/i }));

    expect(handleEnableAnywhereMode).not.toHaveBeenCalled();
  });

  test('starts the selected debug battle level for the current player', () => {
    const handleStartBattle = jest.fn();
    const handleEnvironmentChange = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onEnableAnywhereMode={jest.fn()}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={handleStartBattle}
        onStartSelectedEnemyBattle={jest.fn()}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedEnvironmentChange={handleEnvironmentChange}
        onSelectedEnemyIdChange={jest.fn()}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    expect(screen.getByLabelText(/battle environment/i)).toHaveValue('fields');

    fireEvent.change(screen.getByLabelText(/battle environment/i), {
      target: { value: 'forest' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^level 3$/i }));

    expect(handleEnvironmentChange).toHaveBeenCalledWith('forest');
    expect(handleStartBattle).toHaveBeenCalledWith(3);
  });

  test('lets the admin choose an enemy and start a manual enemy battle', () => {
    const handleSelectedEnemyChange = jest.fn();
    const handleStartSelectedEnemyBattle = jest.fn();

    render(
      <DebugModal
        currentPlayer={createCurrentPlayer()}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onEnableAnywhereMode={jest.fn()}
        onClose={jest.fn()}
        onDiscardPendingToken={jest.fn()}
        onGiveToken={jest.fn()}
        onStartBattle={jest.fn()}
        onStartSelectedEnemyBattle={handleStartSelectedEnemyBattle}
        onPendingTokenReplacementChange={jest.fn()}
        onReplacePendingToken={jest.fn()}
        onSelectedEnemyIdChange={handleSelectedEnemyChange}
        onSelectedTokenTypeChange={jest.fn()}
        pendingTokenType=""
        selectedEnemyId="vilewhisker-rat"
        selectedReplacementTokenId=""
        selectedTokenType="red"
      />
    );

    fireEvent.change(screen.getByLabelText(/enemy/i), {
      target: { value: 'hexmaw-hag' },
    });
    fireEvent.click(screen.getByRole('button', { name: /start selected enemy battle/i }));

    expect(handleSelectedEnemyChange).toHaveBeenCalledWith('hexmaw-hag');
    expect(handleStartSelectedEnemyBattle).toHaveBeenCalled();
  });

  test('lets the admin select a target player and potion without changing token controls', () => {
    const handlePlayerChange = jest.fn();
    const handlePotionChange = jest.fn();
    const handleGivePotion = jest.fn();

    render(
      <DebugModal
        currentPlayer={potionPlayers[0]}
        enemyOptions={enemyOptions}
        isOpen
        message=""
        onClose={jest.fn()}
        onEnableAnywhereMode={jest.fn()}
        onGivePotion={handleGivePotion}
        onGiveToken={jest.fn()}
        onSelectedPotionIdChange={handlePotionChange}
        onSelectedPotionPlayerIdChange={handlePlayerChange}
        players={potionPlayers}
        selectedPotionId="roll-choice"
        selectedPotionPlayerId="player-1"
      />
    );

    expect(screen.getByLabelText(/potion target player/i)).toHaveValue('player-1');
    expect(screen.getByLabelText(/potion type/i)).toHaveValue('roll-choice');
    expect(screen.getByLabelText(/potion type/i).options).toHaveLength(21);
    expect(screen.getByRole('button', { name: /give potion/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /give token/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/potion target player/i), {
      target: { value: 'player-2' },
    });
    fireEvent.change(screen.getByLabelText(/potion type/i), {
      target: { value: 'small-heal' },
    });
    fireEvent.click(screen.getByRole('button', { name: /give potion/i }));

    expect(handlePlayerChange).toHaveBeenCalledWith('player-2');
    expect(handlePotionChange).toHaveBeenCalledWith('small-heal');
    expect(handleGivePotion).toHaveBeenCalled();
  });

  test('shows every full-capacity discard choice for the pending target player', () => {
    const handleReplacementChange = jest.fn();
    const handleDiscard = jest.fn();
    const handleReplace = jest.fn();

    render(
      <DebugModal
        currentPlayer={potionPlayers[0]}
        enemyOptions={enemyOptions}
        isOpen
        message="The red player's potion collection is full."
        onClose={jest.fn()}
        onDiscardPendingPotion={handleDiscard}
        onEnableAnywhereMode={jest.fn()}
        onGivePotion={jest.fn()}
        onGiveToken={jest.fn()}
        onPendingPotionReplacementChange={handleReplacementChange}
        onReplacePendingPotion={handleReplace}
        pendingPotionGrant={{
          playerId: 'player-1',
          potion: POTION_DEFINITIONS.find(({ id }) => id === 'heal'),
        }}
        players={potionPlayers}
        selectedPotionId="heal"
        selectedPotionPlayerId="player-1"
        selectedReplacementPotionIndex="0"
      />
    );

    expect(screen.getByText(/new potion: heal/i)).toBeInTheDocument();
    expect(screen.getByText(/target player: red/i)).toBeInTheDocument();
    const discardChoices = screen.getByRole('radiogroup', {
      name: /current potions to discard/i,
    });

    expect(discardChoices).toContainElement(
      screen.getByRole('group', { name: /roll choice potion/i })
    );
    expect(discardChoices).toContainElement(
      screen.getByRole('group', { name: /small heal potion/i })
    );
    expect(discardChoices).toContainElement(
      screen.getByRole('group', { name: /ice beam potion/i })
    );
    expect(screen.getByRole('button', { name: /discard new potion/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /replace selected potion/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^close$/i })).toBeDisabled();
    expect(screen.getByRole('group', { name: /^heal potion$/i })).toHaveClass(
      'potion-icon--green'
    );
    expect(screen.getByRole('group', { name: /small heal potion/i })).not.toHaveAttribute(
      'tabindex'
    );

    fireEvent.click(screen.getByDisplayValue('1'));
    fireEvent.click(screen.getByRole('button', { name: /discard new potion/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace selected potion/i }));

    expect(handleReplacementChange).toHaveBeenCalledWith('1');
    expect(handleDiscard).toHaveBeenCalled();
    expect(handleReplace).toHaveBeenCalled();
  });

  test('shows debug potion grant displays in the target player language', () => {
    const japanesePlayers = [
      { ...potionPlayers[0], language: 'jp' },
      potionPlayers[1],
    ];

    render(
      <DebugModal
        currentPlayer={japanesePlayers[0]}
        enemyOptions={enemyOptions}
        isOpen
        message="The red player's potion collection is full."
        onClose={jest.fn()}
        onDiscardPendingPotion={jest.fn()}
        onEnableAnywhereMode={jest.fn()}
        onGivePotion={jest.fn()}
        onGiveToken={jest.fn()}
        onPendingPotionReplacementChange={jest.fn()}
        onReplacePendingPotion={jest.fn()}
        pendingPotionGrant={{
          playerId: 'player-1',
          potion: POTION_DEFINITIONS.find(({ id }) => id === 'heal'),
        }}
        players={japanesePlayers}
        selectedPotionId="heal"
        selectedPotionPlayerId="player-1"
        selectedReplacementPotionIndex="0"
      />
    );

    expect(screen.getByText('New potion: 回復')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '回復 potion' })).toHaveAccessibleDescription(
      'HPを60％回復する。'
    );
    expect(screen.getByRole('radio', { name: 'Discard 出目選択' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '小回復 potion' })).toHaveAccessibleDescription(
      'HPを30％回復する。'
    );
  });
});
