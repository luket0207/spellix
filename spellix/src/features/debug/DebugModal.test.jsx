import { fireEvent, render, screen } from '@testing-library/react';
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

describe('DebugModal', () => {
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

    fireEvent.click(screen.getByDisplayValue('player-1-blue-1'));

    expect(handleReplacementChange).toHaveBeenCalledWith('player-1-blue-1');
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
});
