import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import GameSetupPage from './GameSetupPage';

function GameSetupStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      {gameSetup.players.map((player, index) => (
        <p key={player.id}>{`Player ${index + 1}: ${player.gender} ${player.colour} ${player.pieceImage}`}</p>
      ))}
    </div>
  );
}

function renderGameSetupPage() {
  return render(
    <GameSetupProvider>
      <MemoryRouter>
        <GameSetupPage />
        <GameSetupStateProbe />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('GameSetupPage piece selection foundation', () => {
  test('renders gender selectors with default piece-image selections', () => {
    renderGameSetupPage();

    expect(screen.getByLabelText(/player 1 gender/i)).toHaveValue('boy');
    expect(screen.getByLabelText(/player 2 gender/i)).toHaveValue('boy');
    expect(screen.getByText(/player 1: boy red m-red\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: boy blue m-blue\.png/i)).toBeInTheDocument();
  });

  test('updates the stored piece image when a player changes gender', () => {
    renderGameSetupPage();

    fireEvent.change(screen.getByLabelText(/player 1 gender/i), {
      target: { value: 'girl' },
    });

    expect(screen.getByText(/player 1: girl red f-red\.png/i)).toBeInTheDocument();
  });

  test('keeps colours exclusive on the setup page', () => {
    renderGameSetupPage();

    expect(screen.getByLabelText(/player 1 colour/i).querySelector('option[value="blue"]')).toBeNull();

    fireEvent.change(screen.getByLabelText(/player 2 colour/i), {
      target: { value: 'green' },
    });

    expect(screen.getByLabelText(/player 1 colour/i).querySelector('option[value="blue"]')).not.toBeNull();
    expect(screen.getByLabelText(/player 2 colour/i).querySelector('option[value="red"]')).toBeNull();
  });
});
