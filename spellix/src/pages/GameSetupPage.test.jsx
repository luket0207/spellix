import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import GameSetupPage from './GameSetupPage';

function GameSetupStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      {gameSetup.players.map((player, index) => (
        <p key={player.id}>{`Player ${player.number ?? index + 1}: ${player.language ?? 'missing'} ${player.gender} ${player.colour} ${player.pieceImage}`}</p>
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
  test('renders the required bilingual setup copy and grouped player inputs', () => {
    renderGameSetupPage();

    expect(
      screen.getByRole('heading', { name: 'Game Setup - ゲームの準備' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Set up the game before play starts.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Number of Players - プレイヤー人数')).toHaveValue('2');
    expect(
      screen.getByRole('button', { name: 'Start Game - ゲーム開始' })
    ).toBeInTheDocument();

    const playerOne = screen.getByRole('group', { name: 'Player 1 - プレイヤー1' });
    const playerTwo = screen.getByRole('group', { name: 'Player 2 - プレイヤー2' });

    expect(within(playerOne).getByLabelText('Language - 言語')).toHaveValue('en');
    expect(within(playerOne).getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(within(playerOne).getByRole('option', { name: '日本語' })).toBeInTheDocument();
    expect(within(playerOne).getByLabelText('Gender - 性別')).toHaveValue('boy');
    expect(within(playerOne).getByRole('option', { name: 'Boy - 男の子' })).toBeInTheDocument();
    expect(within(playerOne).getByRole('option', { name: 'Girl - 女の子' })).toBeInTheDocument();
    expect(within(playerOne).getByLabelText('Colour - 色')).toHaveValue('red');
    expect(within(playerOne).getByRole('option', { name: 'Red - 赤' })).toBeInTheDocument();
    expect(within(playerTwo).getByLabelText('Language - 言語')).toHaveValue('en');
  });

  test('stores independent language choices for each player', () => {
    renderGameSetupPage();

    const playerOne = screen.getByRole('group', { name: 'Player 1 - プレイヤー1' });
    const playerTwo = screen.getByRole('group', { name: 'Player 2 - プレイヤー2' });

    fireEvent.change(within(playerTwo).getByLabelText('Language - 言語'), {
      target: { value: 'jp' },
    });

    expect(within(playerOne).getByLabelText('Language - 言語')).toHaveValue('en');
    expect(within(playerTwo).getByLabelText('Language - 言語')).toHaveValue('jp');
    expect(screen.getByText(/player 1: en boy red m-red\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: jp boy blue m-blue\.png/i)).toBeInTheDocument();
  });

  test('groups language, gender, and colour inputs for all six players', () => {
    renderGameSetupPage();
    const colourLabels = [
      'Red - 赤',
      'Blue - 青',
      'Green - 緑',
      'Yellow - 黄色',
      'Purple - 紫',
      'Orange - オレンジ',
    ];

    fireEvent.change(screen.getByLabelText('Number of Players - プレイヤー人数'), {
      target: { value: '6' },
    });

    for (let playerNumber = 1; playerNumber <= 6; playerNumber += 1) {
      const playerSection = screen.getByRole('group', {
        name: `Player ${playerNumber} - プレイヤー${playerNumber}`,
      });

      expect(within(playerSection).getByLabelText('Language - 言語')).toHaveValue('en');
      expect(within(playerSection).getByLabelText('Gender - 性別')).toBeInTheDocument();
      expect(within(playerSection).getByLabelText('Colour - 色')).toBeInTheDocument();
      expect(
        within(playerSection).getByRole('option', { name: colourLabels[playerNumber - 1] })
      ).toBeInTheDocument();
    }
  });

  test('renders gender selectors with default piece-image selections', () => {
    renderGameSetupPage();

    const playerOne = screen.getByRole('group', { name: 'Player 1 - プレイヤー1' });
    const playerTwo = screen.getByRole('group', { name: 'Player 2 - プレイヤー2' });

    expect(within(playerOne).getByLabelText('Gender - 性別')).toHaveValue('boy');
    expect(within(playerTwo).getByLabelText('Gender - 性別')).toHaveValue('boy');
    expect(screen.getByText(/player 1: en boy red m-red\.png/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: en boy blue m-blue\.png/i)).toBeInTheDocument();
  });

  test('updates the stored piece image when a player changes gender', () => {
    renderGameSetupPage();

    const playerOne = screen.getByRole('group', { name: 'Player 1 - プレイヤー1' });

    fireEvent.change(within(playerOne).getByLabelText('Gender - 性別'), {
      target: { value: 'girl' },
    });

    expect(screen.getByText(/player 1: en girl red f-red\.png/i)).toBeInTheDocument();
  });

  test('keeps colours exclusive on the setup page', () => {
    renderGameSetupPage();

    const playerOne = screen.getByRole('group', { name: 'Player 1 - プレイヤー1' });
    const playerTwo = screen.getByRole('group', { name: 'Player 2 - プレイヤー2' });
    const playerOneColour = within(playerOne).getByLabelText('Colour - 色');
    const playerTwoColour = within(playerTwo).getByLabelText('Colour - 色');

    expect(within(playerOneColour).queryByRole('option', { name: 'Blue - 青' })).toBeNull();

    fireEvent.change(playerTwoColour, {
      target: { value: 'green' },
    });

    expect(within(playerOneColour).getByRole('option', { name: 'Blue - 青' })).toBeInTheDocument();
    expect(within(playerTwoColour).queryByRole('option', { name: 'Red - 赤' })).toBeNull();
  });
});
