import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
      {
        id: 'feature-3',
        imageName: 'village-field.png',
        x: 4,
        y: 16,
        width: 2,
        height: 2,
      },
      {
        id: 'feature-4',
        imageName: 'village-forest.png',
        x: 24,
        y: 12,
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
              : x >= 4 && x <= 5 && y >= 16 && y <= 17
                ? 'feature-3'
                : x >= 24 && x <= 25 && y >= 12 && y <= 13
                  ? 'feature-4'
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

    expect(featureImages).toHaveLength(8);
    [
      'home.png',
      'elite-tower-gravel.png',
      'elite-tower-woods.png',
      'boss-castle.png',
    ].forEach((imageName) => {
      expect(
        featureImages.filter((image) => image.getAttribute('src').includes(imageName))
      ).toHaveLength(1);
    });
    ['village-field.png', 'village-forest.png'].forEach((imageName) => {
      expect(
        featureImages.filter((image) => image.getAttribute('src').includes(imageName))
      ).toHaveLength(2);
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

describe('BoardGrid objective highlights', () => {
  test('renders one expanded glow behind each Elite Tower without changing movement highlighting', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour="red"
        highlightedNodeIds={['boss-battle']}
        objectiveHighlightMode="eliteTowers"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const overlayLayer = screen.getByTestId('board-feature-overlay-layer');
    const topLeftGlow = screen.getByTestId(
      'board-objective-glow-elite-top-left'
    );
    const bottomRightGlow = screen.getByTestId(
      'board-objective-glow-elite-bottom-right'
    );

    expect(overlayLayer).toContainElement(topLeftGlow);
    expect(screen.getAllByTestId(/board-objective-glow-/)).toHaveLength(2);
    expect(topLeftGlow).toHaveStyle({
      height: '72px',
      left: '-6px',
      top: '-6px',
      width: '72px',
    });
    expect(bottomRightGlow).toHaveStyle({
      height: '72px',
      left: '864px',
      top: '864px',
      width: '72px',
    });
    expect(
      topLeftGlow.compareDocumentPosition(
        screen.getByTestId('board-feature-elite-top-left')
      )
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByTestId('board-objective-glow-boss')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Square 29, 0' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Square 0, 0' })).toHaveAttribute(
      'data-highlighted',
      'false'
    );
  });

  test('renders only the expanded Boss footprint glow in Boss goal mode', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour=""
        highlightedNodeIds={[]}
        objectiveHighlightMode="bossBattle"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const bossGlow = screen.getByTestId('board-objective-glow-boss');

    expect(screen.getAllByTestId(/board-objective-glow-/)).toHaveLength(1);
    expect(bossGlow).toHaveStyle({
      height: '72px',
      left: '864px',
      top: '-6px',
      width: '72px',
    });
    expect(
      screen.queryByTestId('board-objective-glow-elite-top-left')
    ).not.toBeInTheDocument();
  });

  test('keeps objective glows non-interactive and behind feature images', () => {
    const stylesheet = readFileSync(`${__dirname}/BoardGrid.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.board-feature-objective-glow\s*{[^}]*position:\s*absolute;[^}]*border-radius:\s*8px;[^}]*background:\s*radial-gradient\([^}]*box-shadow:\s*0 0 18px 8px[^}]*pointer-events:\s*none;[^}]*z-index:\s*0;/s
    );
    expect(stylesheet).toMatch(
      /\.board-feature-image\s*{[^}]*z-index:\s*1;/s
    );
  });
});

describe('BoardGrid square hover labels', () => {
  test('shows environment labels on highlighted and non-highlighted squares opposite the hovered board half', () => {
    const board = {
      ...createBoard(),
      height: 10,
      squares: [
        {
          ...createBoard().squares[0],
          environmentType: 'field',
          id: 'square-4-4',
          x: 4,
          y: 4,
        },
        {
          ...createBoard().squares[0],
          environmentType: 'hills',
          id: 'square-4-5',
          x: 4,
          y: 5,
        },
      ],
    };

    render(
      <BoardGrid
        board={board}
        currentPlayerId=""
        highlightedColour="red"
        highlightedNodeIds={['square-4-4']}
        language="en"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    const nonHighlightedSquare = screen.getByRole('button', { name: 'Square 4, 5' });

    expect(nonHighlightedSquare).toHaveAttribute('data-highlighted', 'false');
    expect(nonHighlightedSquare).toHaveAttribute('tabindex', '-1');
    fireEvent.mouseEnter(nonHighlightedSquare);
    expect(screen.getByText('Hills')).toHaveClass(
      'board-hover-label',
      'board-hover-label--top',
      'larger-text',
      'language-en'
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 4, 4' }));
    expect(screen.getByText('Field')).toHaveClass(
      'board-hover-label',
      'board-hover-label--bottom',
      'larger-text',
      'language-en'
    );

    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Square 4, 4' }));
    expect(screen.queryByText('Field')).not.toBeInTheDocument();
  });

  test('shows one localized feature label from any highlighted footprint cell', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        highlightedColour="red"
        highlightedNodeIds={['board-feature-feature-1']}
        language="jp"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 8, 20' }));
    expect(screen.getByText('\u6751')).toHaveClass(
      'board-hover-label--top',
      'larger-text',
      'language-jp'
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 9, 21' }));
    expect(screen.getAllByText('\u6751')).toHaveLength(1);
  });

  test('shows the assigned enemy on every cell in an Elite Tower footprint', () => {
    render(
      <BoardGrid
        board={createBoardWithFeatureImages()}
        currentPlayerId=""
        eliteBossEnemyAssignments={{
          bossBattle: 'hellcrown-reaper',
          eliteTowerGravel: 'crowned-lichlord',
          eliteTowerWoods: 'amethyst-ogre',
        }}
        highlightedColour="red"
        highlightedNodeIds={[]}
        language="en"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 0, 0' }));
    expect(screen.getByText('Elite Tower')).toHaveClass(
      'board-hover-label-feature-name'
    );
    expect(screen.getByText('Crowned Lichlord')).toHaveClass(
      'board-hover-label-enemy-name'
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 1, 1' }));
    expect(screen.getAllByText('Elite Tower')).toHaveLength(1);
    expect(screen.getAllByText('Crowned Lichlord')).toHaveLength(1);
  });

  test('localizes the assigned Boss enemy and falls back to the feature name', () => {
    const board = createBoardWithFeatureImages();
    const { rerender } = render(
      <BoardGrid
        board={board}
        currentPlayerId=""
        eliteBossEnemyAssignments={{ bossBattle: 'hellcrown-reaper' }}
        highlightedColour=""
        highlightedNodeIds={[]}
        language="jp"
        onSquareClick={() => {}}
        players={[]}
      />
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 29, 0' }));
    expect(screen.getByText('\u30dc\u30b9\u30d0\u30c8\u30eb')).toBeInTheDocument();
    expect(screen.getByText('\u5730\u7344\u51a0\u306e\u6b7b\u795e')).toBeInTheDocument();

    rerender(
      <BoardGrid
        board={board}
        currentPlayerId=""
        eliteBossEnemyAssignments={null}
        highlightedColour=""
        highlightedNodeIds={[]}
        language="en"
        onSquareClick={() => {}}
        players={[]}
      />
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Square 30, 1' }));
    expect(screen.getByText('Boss Battle')).toBeInTheDocument();
    expect(screen.queryByText('Hellcrown Reaper')).not.toBeInTheDocument();
  });

  test('positions the non-interactive label in the existing board color style', () => {
    const stylesheet = readFileSync(`${__dirname}/BoardGrid.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.board-hover-label\s*{[^}]*position:\s*absolute;[^}]*left:\s*50%;[^}]*transform:\s*translateX\(-50%\);[^}]*background:\s*#3a2013;[^}]*color:\s*#F5FA00;[^}]*padding:\s*12px 24px;[^}]*border-radius:\s*10px;[^}]*z-index:\s*20;[^}]*pointer-events:\s*none;[^}]*text-align:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.board-hover-label--top\s*{[^}]*top:\s*50px;/s
    );
    expect(stylesheet).toMatch(
      /\.board-hover-label--bottom\s*{[^}]*bottom:\s*50px;/s
    );
    expect(stylesheet).toMatch(
      /\.board-hover-label-feature-name\s*{[^}]*display:\s*block;[^}]*font-size:\s*16px;[^}]*line-height:\s*1\.2;/s
    );
    expect(stylesheet).toMatch(
      /\.board-hover-label-enemy-name\s*{[^}]*display:\s*block;[^}]*font-size:\s*inherit;[^}]*line-height:\s*1\.2;/s
    );
  });
});
