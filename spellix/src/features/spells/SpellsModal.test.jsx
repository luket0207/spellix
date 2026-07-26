import { readFileSync } from 'fs';
import { render, screen, within } from '@testing-library/react';
import { getPlayerPieceImageName } from '../gameSetup/pieceImages';
import SpellsModal from './SpellsModal';

function createDraftSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

function renderSpellsModal({
  isForcedSetup = true,
  isRedoMode = false,
  language = 'en',
} = {}) {
  return render(
    <SpellsModal
      currentPlayer={{
        id: 'player-1',
        colour: 'red',
        language,
        pieceImage: getPlayerPieceImageName({ colour: 'red', gender: 'girl' }),
      }}
      draftSpellSlots={createDraftSpellSlots()}
      draftTokenBag={[
        { id: 'red-1', type: 'red', committed: false },
        { id: 'blue-1', type: 'blue', committed: false },
      ]}
      isForcedSetup={isForcedSetup}
      isRedoMode={isRedoMode}
      isOpen
      onCancel={jest.fn()}
      onSave={jest.fn()}
      onTokenDrop={jest.fn()}
      validationMessage=""
    />
  );
}

describe('SpellsModal layout', () => {
  test('keeps the translated title and warning grouped beside the larger player image', () => {
    renderSpellsModal({ isForcedSetup: true });

    const title = screen.getByRole('heading', { name: 'Spells' });
    const warning = screen.getByText(
      'You must place all 7 starting tokens into spell slots before rolling dice.'
    );
    const playerPiece = screen.getByRole('img', { name: /spell player piece/i });
    const componentSource = readFileSync(`${__dirname}/SpellsModal.jsx`, 'utf8');
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');

    expect(title).toHaveClass('spells-title');
    expect(warning).toHaveClass('spells-starting-warning');
    expect(playerPiece).toHaveClass('spells-player-piece');
    expect(componentSource).toMatch(
      /<div className="spells-header-copy">[\s\S]*?<h1[\s\S]*?spells-starting-warning[\s\S]*?<\/div>[\s\S]*?\{pieceImageSource \?/s
    );
    expect(stylesheet).toMatch(
      /\.spells-title\s*{[^}]*font-size:\s*48px;[^}]*font-weight:\s*700;/s
    );
    expect(stylesheet).toMatch(
      /\.spells-starting-warning\s*{[^}]*margin:\s*20px 0 0;[^}]*font-size:\s*20px;/s
    );
    expect(stylesheet).toMatch(
      /\.spells-player-piece\s*{[^}]*height:\s*150px;[^}]*width:\s*auto;/s
    );
    expect(stylesheet).toMatch(
      /\.modal-panel--spells\s*{[^}]*width:\s*max-content;[^}]*max-width:\s*calc\(100vw - 32px\);/s
    );
    expect(stylesheet).toMatch(
      /\.spell-modal-actions\s*{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*gap:\s*16px;[^}]*flex-wrap:\s*wrap;/s
    );
  });

  test('shows a Spells title, the current player piece image, and forced setup tokens before the token source', () => {
    renderSpellsModal({ isForcedSetup: true });

    const spellSlotsList = screen.getByLabelText(/^spell slots$/i);
    const tokenBagHeading = screen.getByText(/^Token Bag$/i);
    const spellSlotHeadings = screen.getAllByRole('heading', { level: 4 });
    const tokenCounts = screen.getAllByText(/^0 \/ 5$/i);
    const spellPlayerPiece = screen.getByRole('img', { name: /spell player piece/i });

    expect(spellSlotsList.compareDocumentPosition(tokenBagHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(spellPlayerPiece).toHaveAttribute('src', expect.stringContaining('f-red.png'));
    expect(spellPlayerPiece).not.toHaveClass('battle-player-piece');
    expect(spellPlayerPiece).toHaveClass('spells-player-piece');
    expect(spellSlotHeadings.map(({ textContent }) => textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(tokenCounts).toHaveLength(6);
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });

  test('keeps the current player piece image during later normal spells visits', () => {
    renderSpellsModal({ isForcedSetup: false });

    const spellPlayerPiece = screen.getByRole('img', { name: /spell player piece/i });

    expect(screen.getByText(/^Spells$/i)).toBeInTheDocument();
    expect(spellPlayerPiece).toHaveAttribute('src', expect.stringContaining('f-red.png'));
    expect(spellPlayerPiece).not.toHaveClass('battle-player-piece');
    expect(spellPlayerPiece).toHaveClass('spells-player-piece');
    expect(screen.getByText(/^Token Bag$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Starting Tokens$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Red tokens:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Blue tokens:/i)).not.toBeInTheDocument();
  });

  test.each([
    [
      'en',
      'Rearrange your tokens as much as you like, but when you commit them, they become fixed again.',
    ],
    [
      'jp',
      '\u30c8\u30fc\u30af\u30f3\u306f\u597d\u304d\u306a\u3060\u3051\u4e26\u3079\u66ff\u3048\u308b\u3053\u3068\u304c\u3067\u304d\u307e\u3059\u304c\u3001\u914d\u7f6e\u3092\u78ba\u5b9a\u3059\u308b\u3068\u518d\u3073\u56fa\u5b9a\u3055\u308c\u307e\u3059\u3002',
    ],
  ])('replaces the normal warning with the Redo warning in %s', (language, warning) => {
    renderSpellsModal({
      isForcedSetup: false,
      isRedoMode: true,
      language,
    });

    const displayedWarning = screen.getByText(warning);

    expect(displayedWarning).toHaveClass(
      'spells-starting-warning',
      `language-${language}`
    );
    expect(document.querySelectorAll('.spells-starting-warning')).toHaveLength(1);
    expect(
      screen.queryByText(
        'Drag and drop tokens from your token bag into spell slots to assign them. Once you have committed your tokens, they cannot be moved again.'
      )
    ).not.toBeInTheDocument();
  });

  test('uses Japanese modal copy and font class for a Japanese player', () => {
    renderSpellsModal({ isForcedSetup: true, language: 'jp' });

    const dialog = screen.getByRole('dialog', { name: '呪文' });

    expect(within(dialog).getByRole('heading', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(
      within(dialog).getByText(
        'サイコロを振る前に、7個の初期トークンをすべて呪文スロットに配置してください。'
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByText('トークンバッグ')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: '保存' })).toBeEnabled();
    expect(within(dialog).queryByText('新しい報酬トークン')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('破棄')).not.toBeInTheDocument();
  });
});
