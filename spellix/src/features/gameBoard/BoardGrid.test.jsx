import { render, screen } from '@testing-library/react';
import { getPlayerPieceImageName } from '../gameSetup/pieceImages';
import BoardGrid from './BoardGrid';

function createBoard() {
  return {
    height: 1,
    squareSize: 30,
    squares: [
      {
        areaType: 'normal',
        environmentType: null,
        environmentVariation: null,
        id: 'square-0-0',
        isFixedArea: false,
        section: 'main',
        x: 0,
        y: 0,
      },
    ],
    width: 1,
  };
}

describe('BoardGrid player piece images', () => {
  test('renders selected player piece images at the larger board marker size anchored to the square baseline', () => {
    render(
      <BoardGrid
        board={createBoard()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[
          {
            colour: 'red',
            id: 'player-1',
            pieceImage: getPlayerPieceImageName({ colour: 'red', gender: 'girl' }),
            position: { x: 0, y: 0 },
          },
          {
            colour: 'blue',
            id: 'player-2',
            pieceImage: getPlayerPieceImageName({ colour: 'blue', gender: 'boy' }),
            position: { x: 0, y: 0 },
          },
        ]}
      />
    );

    const redPiece = screen.getByRole('img', { name: /red player piece/i });
    const bluePiece = screen.getByRole('img', { name: /blue player piece/i });

    expect(redPiece).toHaveAttribute('src', expect.stringContaining('f-red.png'));
    expect(redPiece).toHaveStyle({ height: '40px' });
    expect(redPiece.parentElement).toHaveStyle({ bottom: '0px', left: '0px' });

    expect(bluePiece).toHaveAttribute('src', expect.stringContaining('m-blue.png'));
    expect(bluePiece).toHaveStyle({ height: '40px' });
    expect(bluePiece.parentElement).toHaveStyle({ bottom: '0px', left: '8px' });
  });

  test('cascades shared-square pieces to the right first and then upward', () => {
    render(
      <BoardGrid
        board={createBoard()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[
          {
            colour: 'red',
            id: 'player-1',
            pieceImage: getPlayerPieceImageName({ colour: 'red', gender: 'girl' }),
            position: { x: 0, y: 0 },
          },
          {
            colour: 'blue',
            id: 'player-2',
            pieceImage: getPlayerPieceImageName({ colour: 'blue', gender: 'boy' }),
            position: { x: 0, y: 0 },
          },
          {
            colour: 'green',
            id: 'player-3',
            pieceImage: getPlayerPieceImageName({ colour: 'green', gender: 'boy' }),
            position: { x: 0, y: 0 },
          },
          {
            colour: 'yellow',
            id: 'player-4',
            pieceImage: getPlayerPieceImageName({ colour: 'yellow', gender: 'girl' }),
            position: { x: 0, y: 0 },
          },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: /red player piece/i }).parentElement).toHaveStyle({
      bottom: '0px',
      left: '0px',
    });
    expect(screen.getByRole('img', { name: /blue player piece/i }).parentElement).toHaveStyle({
      bottom: '0px',
      left: '8px',
    });
    expect(screen.getByRole('img', { name: /green player piece/i }).parentElement).toHaveStyle({
      bottom: '0px',
      left: '16px',
    });
    expect(screen.getByRole('img', { name: /yellow player piece/i }).parentElement).toHaveStyle({
      bottom: '8px',
      left: '0px',
    });
  });

  test('adds a radial glow element behind the current player and keeps higher stacking on a shared square', () => {
    render(
      <BoardGrid
        board={createBoard()}
        currentPlayerId="player-2"
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[
          {
            colour: 'red',
            id: 'player-1',
            pieceImage: getPlayerPieceImageName({ colour: 'red', gender: 'girl' }),
            position: { x: 0, y: 0 },
          },
          {
            colour: 'blue',
            id: 'player-2',
            pieceImage: getPlayerPieceImageName({ colour: 'blue', gender: 'boy' }),
            position: { x: 0, y: 0 },
          },
        ]}
      />
    );

    const redPiece = screen.getByRole('img', { name: /red player piece/i });
    const bluePiece = screen.getByRole('img', { name: /blue player piece/i });
    const blueGlow = bluePiece.parentElement.querySelector('.board-player-marker-glow');

    expect(redPiece.parentElement.querySelector('.board-player-marker-glow')).toBeNull();
    expect(redPiece.parentElement).toHaveStyle({ zIndex: '1' });

    expect(blueGlow).toBeInTheDocument();
    expect(blueGlow.compareDocumentPosition(bluePiece)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(bluePiece.parentElement).toHaveAttribute('data-is-current-player', 'true');
    expect(bluePiece.parentElement).toHaveStyle({ zIndex: '7' });
  });

  test('falls back to the player colour label when a piece image is missing', () => {
    render(
      <BoardGrid
        board={createBoard()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[
          {
            colour: 'orange',
            id: 'player-1',
            pieceImage: 'missing-piece.png',
            position: { x: 0, y: 0 },
          },
        ]}
      />
    );

    expect(screen.getByLabelText(/orange player piece/i)).toHaveTextContent('orange');
    expect(screen.queryByRole('img', { name: /orange player piece/i })).not.toBeInTheDocument();
  });
});
