import { render, screen, within } from '@testing-library/react';
import { getPlayerPieceImageName } from '../gameSetup/pieceImages';
import BoardGrid from './BoardGrid';

function createBoard() {
  return {
    featureImages: [],
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

function createBoardWithFeatureImages() {
  return {
    ...createBoard(),
    featureImages: [
      { id: 'start', imageName: 'home.png', x: 0, y: 29, width: 2, height: 2 },
      {
        id: 'elite-top-left',
        imageName: 'elite-tower-gravel.png',
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      },
      { id: 'boss', imageName: 'boss-castle.png', x: 29, y: 0, width: 2, height: 2 },
      {
        id: 'elite-bottom-right',
        imageName: 'elite-tower-woods.png',
        x: 29,
        y: 29,
        width: 2,
        height: 2,
      },
      {
        id: 'feature-1',
        imageName: 'village-field.png',
        x: 8,
        y: 20,
        width: 2,
        height: 2,
      },
      {
        id: 'feature-2',
        imageName: 'village-forest.png',
        x: 20,
        y: 8,
        width: 2,
        height: 2,
      },
    ],
    height: 31,
    squares: Array.from({ length: 31 * 31 }, (_, index) => {
      const x = index % 31;
      const y = Math.floor(index / 31);

      return {
        areaType: 'normal',
        environmentType: null,
        environmentVariation: null,
        featureId:
          x >= 8 && x <= 9 && y >= 20 && y <= 21
            ? 'feature-1'
            : x >= 20 && x <= 21 && y >= 8 && y <= 9
              ? 'feature-2'
              : null,
        id: `square-${x}-${y}`,
        isFixedArea: false,
        section: y >= x ? 'easy' : 'hard',
        x,
        y,
      };
    }),
    width: 31,
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
    expect(redPiece.parentElement).toHaveStyle({ zIndex: '3' });

    expect(blueGlow).toBeInTheDocument();
    expect(blueGlow.compareDocumentPosition(bluePiece)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(bluePiece.parentElement).toHaveAttribute('data-is-current-player', 'true');
    expect(bluePiece.parentElement).toHaveStyle({ zIndex: '9' });
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

describe('BoardGrid feature images', () => {
  test('keeps feature images in a non-displacing absolute overlay layer', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const board = screen.getByLabelText('Game board');
    const overlayLayer = screen.getByTestId('board-feature-overlay-layer');
    const startImage = screen.getByTestId('board-feature-start');

    expect(board).toHaveStyle({ height: '930px', position: 'relative', width: '930px' });
    expect(within(board).getAllByRole('button')).toHaveLength(31 * 31);
    expect(overlayLayer).toContainElement(startImage);
    expect(overlayLayer).toHaveStyle({
      height: '930px',
      pointerEvents: 'none',
      position: 'absolute',
      width: '930px',
    });
    expect(startImage).toHaveStyle({
      height: '60px',
      left: '0px',
      pointerEvents: 'none',
      position: 'absolute',
      top: '870px',
      width: '60px',
    });
  });

  test('renders each fixed and generated zone once using the lowercase feature image', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const featureImages = screen.getAllByRole('img', { name: /board feature/i });

    expect(featureImages).toHaveLength(6);
    [
      'home.png',
      'elite-tower-gravel.png',
      'elite-tower-woods.png',
      'boss-castle.png',
      'village-field.png',
      'village-forest.png',
    ].forEach((imageName) => {
      expect(
        featureImages.filter((image) => image.getAttribute('src').includes(imageName))
      ).toHaveLength(1);
    });
  });

  test('positions one complete image across each multi-square zone', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const startImage = screen.getByTestId('board-feature-start');
    const hardFeatureImage = screen.getByTestId('board-feature-feature-2');

    expect(startImage).toHaveStyle({
      height: '60px',
      left: '0px',
      top: '870px',
      width: '60px',
    });
    expect(hardFeatureImage).toHaveStyle({
      height: '60px',
      left: '600px',
      top: '240px',
      width: '60px',
    });
  });

  test('highlights every cell in a reachable generated feature footprint', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour="red"
        highlightedNodeIds={['board-feature-feature-1']}
        onSquareClick={() => {}}
        players={[]}
      />
    );

    [
      [8, 20],
      [9, 20],
      [8, 21],
      [9, 21],
    ].forEach(([x, y]) => {
      expect(screen.getByRole('button', { name: `Square ${x}, ${y}` })).toHaveAttribute(
        'data-highlighted',
        'true'
      );
    });
    expect(screen.getByRole('button', { name: 'Square 10, 20' })).toHaveAttribute(
      'data-highlighted',
      'false'
    );
  });

  test('highlights every cell in fixed elite and boss footprints', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour="red"
        highlightedNodeIds={[
          'elite-battle-top-left',
          'elite-battle-bottom-right',
          'boss-battle',
        ]}
        onSquareClick={() => {}}
        players={[]}
      />
    );

    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [29, 0],
      [30, 0],
      [29, 1],
      [30, 1],
      [29, 29],
      [30, 29],
      [29, 30],
      [30, 30],
    ].forEach(([x, y]) => {
      expect(screen.getByRole('button', { name: `Square ${x}, ${y}` })).toHaveAttribute(
        'data-highlighted',
        'true'
      );
    });
  });

});
