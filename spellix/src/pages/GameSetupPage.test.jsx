import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { MemoryRouter } from 'react-router-dom';
import { GameSetupProvider, useGameSetup } from '../features/gameSetup/GameSetupContext';
import { createInitialGameSetup } from '../features/gameSetup/gameSetup';
import GameSetupPage from './GameSetupPage';

function GameSetupStateProbe() {
  const { gameSetup } = useGameSetup();

  return (
    <div>
      <p>{`Debug mode: ${gameSetup.debugMode ? 'on' : 'off'}`}</p>
      {gameSetup.players.map((player, index) => (
        <p key={player.id}>{`Player ${player.number ?? index + 1}: ${player.language ?? 'missing'} ${player.gender} ${player.colour} ${player.pieceImage}`}</p>
      ))}
    </div>
  );
}

function renderGameSetupPage(initialGameSetup) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MemoryRouter>
        <GameSetupPage />
        <GameSetupStateProbe />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

function addPlayers(count) {
  for (let index = 0; index < count; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Add Player' }));
  }
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
    expect(
      screen.queryByRole('group', { name: 'Number of Players - プレイヤー人数' })
    ).toBeNull();
    expect(screen.queryByText('Number of Players - プレイヤー人数')).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Number of Players - プレイヤー人数' })
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Add Player' })).toHaveTextContent(
      'Add Player - プレイヤーを追加'
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

  test('stores an off-by-default bilingual Debug Mode toggle below Start Game', () => {
    renderGameSetupPage();

    const startButton = screen.getByRole('button', { name: 'Start Game - ゲーム開始' });
    const debugToggle = screen.getByRole('checkbox', {
      name: 'Debug Mode - デバッグモード',
    });

    expect(debugToggle).not.toBeChecked();
    expect(screen.getByText('Debug mode: off')).toBeInTheDocument();
    expect(
      startButton.compareDocumentPosition(debugToggle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(debugToggle);

    expect(debugToggle).toBeChecked();
    expect(screen.getByText('Debug mode: on')).toBeInTheDocument();
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

    addPlayers(4);

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

  test('adds players in the next grid slot up to six and only added players are removable', () => {
    const { container } = renderGameSetupPage();

    expect(screen.getAllByRole('group', { name: /Player \d - プレイヤー\d/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Add Player' })).toBeInTheDocument();
    expect(container.querySelectorAll('.game-setup-empty-player-slot')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /Remove Player/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add Player' }));

    expect(screen.getByRole('group', { name: 'Player 3 - プレイヤー3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Player 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Player' })).toBeInTheDocument();
    expect(container.querySelectorAll('.game-setup-empty-player-slot')).toHaveLength(2);

    addPlayers(3);

    expect(screen.getByRole('group', { name: 'Player 6 - プレイヤー6' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Player' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Remove Player/ })).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Remove Player 1' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove Player 2' })).toBeNull();
    expect(container.querySelectorAll('.game-setup-empty-player-slot')).toHaveLength(0);
  });

  test('removes a middle added player and shifts later settings up without resetting colours', () => {
    renderGameSetupPage();
    addPlayers(2);

    const playerFour = screen.getByRole('group', { name: 'Player 4 - プレイヤー4' });

    fireEvent.change(within(playerFour).getByLabelText('Language - 言語'), {
      target: { value: 'jp' },
    });
    fireEvent.change(within(playerFour).getByLabelText('Gender - 性別'), {
      target: { value: 'girl' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Player 3' }));

    const shiftedPlayerThree = screen.getByRole('group', {
      name: 'Player 3 - プレイヤー3',
    });

    expect(within(shiftedPlayerThree).getByLabelText('Language - 言語')).toHaveValue('jp');
    expect(within(shiftedPlayerThree).getByLabelText('Gender - 性別')).toHaveValue('girl');
    expect(within(shiftedPlayerThree).getByLabelText('Colour - 色')).toHaveValue('yellow');
    expect(
      within(shiftedPlayerThree).getByRole('option', { name: 'Green - 緑' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Player 4 - プレイヤー4' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add Player' })).toBeInTheDocument();
    expect(screen.getByText(/player 3: jp girl yellow f-yellow\.png/i)).toBeInTheDocument();
  });

  test('uses only free colours when shifted players are followed by new players', () => {
    renderGameSetupPage();
    addPlayers(3);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Player 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Player 3' }));

    expect(
      within(screen.getByRole('group', { name: 'Player 3 - プレイヤー3' }))
        .getByLabelText('Colour - 色')
    ).toHaveValue('purple');

    addPlayers(2);

    const activeColours = [1, 2, 3, 4, 5].map((playerNumber) =>
      within(
        screen.getByRole('group', {
          name: `Player ${playerNumber} - プレイヤー${playerNumber}`,
        })
      ).getByLabelText('Colour - 色').value
    );

    expect(activeColours).toEqual(['red', 'blue', 'purple', 'green', 'yellow']);
    expect(new Set(activeColours).size).toBe(activeColours.length);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Player 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Player' }));

    expect(
      within(screen.getByRole('group', { name: 'Player 5 - プレイヤー5' }))
        .getByLabelText('Colour - 色')
    ).toHaveValue('green');
  });

  test('disables Start Game if duplicate colours enter setup state', () => {
    const duplicateColourSetup = createInitialGameSetup();

    duplicateColourSetup.players[1].colour = duplicateColourSetup.players[0].colour;
    renderGameSetupPage(duplicateColourSetup);

    expect(
      screen.getByRole('button', { name: 'Start Game - ゲーム開始' })
    ).toBeDisabled();
  });

  test('overlaps each remove button halfway beyond its pod without clipping it', () => {
    const stylesheet = readFileSync(`${__dirname}/GameSetupPage.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.game-setup-player-grid\s*{[^}]*overflow:\s*visible;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-player-pod\s*{[^}]*overflow:\s*visible;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-remove-player-button\s*{[^}]*height:\s*24px;[^}]*right:\s*-12px;[^}]*top:\s*-12px;[^}]*width:\s*24px;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-remove-player-button:hover\s*{[^}]*filter:\s*brightness\(1\.15\);[^}]*transform:\s*scale\(1\.12\);/s
    );
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

  test('defines the required stable panel, two-column pods, fonts, colours, and hover states', () => {
    const pageSource = readFileSync(`${__dirname}/GameSetupPage.jsx`, 'utf8');
    const stylesheet = readFileSync(`${__dirname}/GameSetupPage.css`, 'utf8');

    expect(pageSource).toMatch(/import BattleBackgroundSlideshow from/);
    expect(pageSource).not.toMatch(/ENEMIES|getEnemyImageSource|start-page-enemy/);
    expect(stylesheet).toMatch(
      /\.game-setup-panel\s*{[^}]*background-image:\s*url\('\.\.\/images\/misc\/modalBackground\.png'\);[^}]*background-size:\s*100% 100%;[^}]*height:\s*min\(670px,\s*calc\(100vh - 32px\)\);[^}]*padding:\s*0 40px;[^}]*width:\s*min\(800px,\s*calc\(100vw - 32px\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-title\s*{[^}]*font-family:\s*'Unkempt',\s*cursive;[^}]*margin:\s*0 0 40px;[^}]*padding-top:\s*40px;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-player-grid\s*{[^}]*gap:\s*20px;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*grid-template-rows:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-player-pod,[\s\S]*?\.game-setup-add-player-pod\s*{[^}]*background:\s*#302419;[^}]*border-radius:\s*12px;[^}]*padding:\s*10px;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-player-pod-title\s*{[^}]*font-size:\s*16px;[^}]*margin:\s*0 0 20px;/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-add-player-pod:hover \.add-player-icon\s*{[^}]*filter:\s*brightness\(1\.15\);[^}]*transform:\s*scale\(1\.12\);/s
    );
    expect(stylesheet).toMatch(
      /\.game-setup-debug-mode\s*{[^}]*padding-bottom:\s*40px;/s
    );
    expect(pageSource).toMatch(/faCirclePlus/);
    expect(pageSource).toMatch(/faCircleXmark/);
    expect(pageSource).toMatch(/Array\.from\(\{ length: MAX_PLAYER_COUNT \}/);
    expect(stylesheet).toMatch(/\.game-setup-panel\s+select\s*{[^}]*color:\s*#302419;/s);
    expect(stylesheet).toMatch(/@media \(max-width:\s*760px\)/);
  });
});
