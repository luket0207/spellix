import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import BoardGrid from './features/gameBoard/BoardGrid';
import { createBoard } from './features/gameBoard/board';
import { GameSetupProvider } from './features/gameSetup/GameSetupContext';

function renderApp(initialRoute = '/') {
  return render(
    <GameSetupProvider>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[initialRoute]}
      >
        <App />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('App routing flow', () => {
  test('renders the start page by default', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /spellix/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /go to game setup/i })
    ).toBeInTheDocument();
  });

  test('shows a valid default setup on the setup page', () => {
    renderApp('/setup');

    expect(screen.getByLabelText(/number of players/i)).toHaveValue('2');
    expect(screen.getByLabelText(/player 1 colour/i)).toHaveValue('red');
    expect(screen.getByLabelText(/player 2 colour/i)).toHaveValue('blue');
  });

  test('navigates from the start page to setup and gameplay with stored setup data', () => {
    renderApp();

    userEvent.click(screen.getByRole('button', { name: /go to game setup/i }));
    expect(screen.getByRole('heading', { name: /game setup/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText(/player 3 colour/i), {
      target: { value: 'orange' },
    });
    fireEvent.change(screen.getByLabelText(/player 4 colour/i), {
      target: { value: 'purple' },
    });

    userEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(screen.getByLabelText(/board panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
    expect(screen.getByText(/player count: 4/i)).toBeInTheDocument();
    expect(screen.getByText(/player 3: orange/i)).toBeInTheDocument();
    expect(screen.getByText(/player 4: purple/i)).toBeInTheDocument();
  });

  test('renders the setup page from its route', () => {
    renderApp('/setup');

    expect(screen.getByRole('heading', { name: /game setup/i })).toBeInTheDocument();
  });

  test('renders the gameplay page from its route', () => {
    renderApp('/gameplay');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/board panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gameplay panel/i)).toBeInTheDocument();
    expect(screen.getByText(/player count: 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
    expect(screen.getByText(/it is currently .* player's turn\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/game board/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /gameplay/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /board/i })).not.toBeInTheDocument();
  });

  test('keeps the settings button visible across app pages', () => {
    const startRender = renderApp('/');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    startRender.unmount();

    const setupRender = renderApp('/setup');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();

    setupRender.unmount();
    renderApp('/gameplay');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
  });

  test('updates the number of colour selectors when the player count changes', () => {
    renderApp('/setup');

    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: '6' },
    });

    expect(screen.queryByLabelText(/player 7 colour/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/player 6 colour/i)).toHaveValue('orange');
  });

  test('shows the dice result and ends the turn after moving', () => {
    const randomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.9);

    renderApp('/gameplay');

    userEvent.click(screen.getByRole('button', { name: /roll dice/i }));

    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /dice result/i })).toBeInTheDocument();
    expect(screen.getByText(/dice result: 4/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled();

    userEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    expect(screen.queryByRole('dialog', { name: /dice result/i })).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText(/square 0, 27/i));

    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();
    expect(screen.getByText(/it is now blue player's turn\./i)).toBeInTheDocument();
    expect(screen.getByText(/player 1: red at 0, 27/i)).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  test('creates a fixed 31x31 board with the required area colours and starting positions', () => {
    renderApp('/gameplay');

    const board = screen.getByLabelText(/game board/i);

    expect(board).toHaveStyle({ width: '930px', height: '930px' });
    expect(board.children).toHaveLength(31 * 31);

    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute('data-area-type', 'start-area');
    expect(screen.getByLabelText(/square 0, 0/i)).toHaveAttribute('data-area-type', 'elite-battle');
    expect(screen.getByLabelText(/square 29, 29/i)).toHaveAttribute(
      'data-area-type',
      'elite-battle'
    );
    expect(screen.getByLabelText(/square 29, 0/i)).toHaveAttribute('data-area-type', 'boss-battle');

    expect(screen.getByText(/player 1: red at 0, 28/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: blue at 1, 28/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/red player piece/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blue player piece/i)).toBeInTheDocument();
  });

  test('does not regenerate the board when turns change', () => {
    renderApp('/gameplay');

    const startingSquare = screen.getByLabelText(/square 0, 28/i);

    userEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    userEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.getByLabelText(/square 0, 28/i)).toBe(startingSquare);
    expect(screen.getByText(/player 1: red at 0, 28/i)).toBeInTheDocument();
    expect(screen.getByText(/player 2: blue at 1, 28/i)).toBeInTheDocument();
  });

  test('opens the settings modal, closes it, and can end the game with reset state', () => {
    renderApp();

    userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /go to game setup/i }));
    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText(/player 4 colour/i), {
      target: { value: 'orange' },
    });
    userEvent.click(screen.getByRole('button', { name: /start game/i }));

    expect(screen.getByText(/player count: 4/i)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /open settings/i }));
    userEvent.click(screen.getByRole('button', { name: /end game/i }));

    expect(screen.getByRole('heading', { name: /spellix/i })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /go to game setup/i }));
    expect(screen.getByLabelText(/number of players/i)).toHaveValue('2');
    expect(screen.queryByLabelText(/player 4 colour/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/player 1 colour/i)).toHaveValue('red');
    expect(screen.getByLabelText(/player 2 colour/i)).toHaveValue('blue');
  });

  test('highlights legal destinations after rolling and moves the current player', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.5);

    renderApp('/gameplay');

    userEvent.click(screen.getByRole('button', { name: /roll dice/i }));
    userEvent.click(screen.getByRole('button', { name: /^ok$/i }));

    expect(screen.getByLabelText(/square 0, 28/i)).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByLabelText(/square 3, 28/i)).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlight-colour', 'red');
    expect(screen.getByLabelText(/square 0, 27/i)).toHaveAttribute('data-highlight-opacity', '0.5');

    userEvent.click(screen.getByLabelText(/square 0, 28/i));
    expect(screen.getByText(/player 1: red at 0, 28/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /turn change/i })).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText(/square 3, 28/i));

    expect(screen.getByText(/player 1: red at 3, 28/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/square 3, 28/i)).toHaveAttribute('data-highlighted', 'false');
    expect(screen.getByRole('dialog', { name: /turn change/i })).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  test('renders grouped areas without internal borders and keeps shared-square player pieces visible', () => {
    const board = createBoard();
    const players = [
      { id: 'player-1', colour: 'red', position: { x: 0, y: 28 } },
      { id: 'player-2', colour: 'blue', position: { x: 0, y: 28 } },
      { id: 'player-3', colour: 'green', position: { x: 0, y: 28 } },
      { id: 'player-4', colour: 'yellow', position: { x: 0, y: 28 } },
      { id: 'player-5', colour: 'purple', position: { x: 0, y: 28 } },
      { id: 'player-6', colour: 'orange', position: { x: 0, y: 28 } },
    ];

    render(
      <BoardGrid
        board={board}
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={jest.fn()}
        players={players}
      />
    );

    expect(screen.getByLabelText(/square 1, 29/i)).toHaveClass(
      'board-square--hide-top-border',
      'board-square--hide-right-border',
      'board-square--hide-bottom-border',
      'board-square--hide-left-border'
    );

    expect(screen.getByLabelText(/red player piece/i)).toHaveStyle({
      height: '14px',
      left: '0px',
      top: '0px',
      width: '14px',
    });
    expect(screen.getByLabelText(/blue player piece/i)).toHaveStyle({
      left: '8px',
      top: '0px',
    });
    expect(screen.getByLabelText(/orange player piece/i)).toHaveStyle({
      left: '16px',
      top: '10px',
    });
  });
});
