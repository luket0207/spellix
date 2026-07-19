import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
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
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders the required bilingual setup copy and grouped player inputs', () => {
    renderGameSetupPage();

    expect(
      screen.getByRole('heading', { name: 'Game Setup - ゲームの準備' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Set up the game before play starts.')).not.toBeInTheDocument();
    const playerCountGroup = screen.getByRole('group', {
      name: 'Number of Players - プレイヤー人数',
    });

    expect(
      screen.queryByRole('combobox', { name: 'Number of Players - プレイヤー人数' })
    ).toBeNull();
    [2, 3, 4, 5, 6].forEach((count) => {
      expect(within(playerCountGroup).getByRole('button', { name: String(count) })).toHaveClass(
        'fantasy-button--secondary'
      );
    });
    expect(within(playerCountGroup).getByRole('button', { name: '2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      screen.getByRole('button', { name: 'Start Game - ゲーム開始' })
    ).toHaveClass('fantasy-button--secondary');

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

    fireEvent.click(screen.getByRole('button', { name: '6' }));

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

  test('uses count buttons to add and remove only the selected player pods', () => {
    renderGameSetupPage();

    fireEvent.click(screen.getByRole('button', { name: '6' }));

    expect(screen.getByRole('group', { name: 'Player 6 - プレイヤー6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(screen.getByRole('group', { name: 'Player 3 - プレイヤー3' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Player 4 - プレイヤー4' })).toBeNull();
    expect(screen.queryByText(/player 4:/i)).toBeNull();
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('reuses the Start slideshow without rendering decorative enemies', () => {
    renderGameSetupPage();

    const fieldsBackground = screen.getByTestId('start-page-background-fields');
    const hillsBackground = screen.getByTestId('start-page-background-hills');

    expect(fieldsBackground).toHaveClass('start-page-background--visible');
    expect(hillsBackground).not.toHaveClass('start-page-background--visible');
    expect(screen.queryByTestId('start-page-enemy')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(fieldsBackground).not.toHaveClass('start-page-background--visible');
    expect(hillsBackground).toHaveClass('start-page-background--visible');
  });

  test('defines the required fixed panel, pod columns, fonts, colours, and responsive fallback', () => {
    const pageSource = readFileSync(`${__dirname}/GameSetupPage.jsx`, 'utf8');
    const stylesheet = readFileSync(`${__dirname}/GameSetupPage.css`, 'utf8');

    expect(pageSource).toMatch(/import BattleBackgroundSlideshow from/);
    expect(pageSource).not.toMatch(/ENEMIES|getEnemyImageSource|start-page-enemy/);
    expect(stylesheet).toMatch(
      /\.game-setup-panel\s*{[^}]*background-image:\s*url\('\.\.\/images\/misc\/modalBackground\.png'\);[^}]*background-size:\s*100% 100%;[^}]*height:\s*min\(600px,\s*calc\(100vh - 32px\)\);[^}]*width:\s*min\(800px,\s*calc\(100vw - 32px\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-title\s*{[^}]*color:\s*#C6CC0C;[^}]*font-family:\s*'Fontdiner Swanky',\s*'Noto Serif JP',\s*serif;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-player-pod\s*{[^}]*height:\s*150px;[^}]*width:\s*350px;/s
    );
    expect(stylesheet).toMatch(/\.game-setup-player-pod:nth-child\(-n\+3\)[^}]*grid-column:\s*1;/s);
    expect(stylesheet).toMatch(/\.game-setup-player-pod:nth-child\(n\+4\)[^}]*grid-column:\s*2;/s);
    expect(stylesheet).toMatch(/\.game-setup-panel\s+select\s*{[^}]*color:\s*#302419;/s);
    expect(stylesheet).toMatch(/@media \(max-width:\s*760px\)/);
  });
});
