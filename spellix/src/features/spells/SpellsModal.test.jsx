import { readFileSync } from 'fs';
import { render, screen, within } from '@testing-library/react';
import { getPlayerPieceImageName } from '../gameSetup/pieceImages';
import { getSpellAssignmentTranslations } from '../../i18n/translations';
import SpellsModal from './SpellsModal';

function createDraftSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

function renderSpellsModal({
  draftSpellSlots = createDraftSpellSlots(),
  isForcedSetup = true,
  isRedoMode = false,
  isWandsmithMode = false,
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
      draftSpellSlots={draftSpellSlots}
      draftTokenBag={Array.from({ length: 5 }, (_, index) => ({
        id: `red-${index + 1}`,
        type: 'red',
        committed: false,
      }))}
      isForcedSetup={isForcedSetup}
      isRedoMode={isRedoMode}
      isWandsmithMode={isWandsmithMode}
      isOpen
      onCancel={jest.fn()}
      onSave={jest.fn()}
      onTokenDrop={jest.fn()}
      validationMessage=""
    />
  );
}

describe('SpellsModal layout', () => {
  test.each([
    ['normal', false],
    ['Wandsmith', true],
  ])('prevents horizontal modal overflow in %s mode only', (_mode, isWandsmithMode) => {
    renderSpellsModal({
      isForcedSetup: false,
      isWandsmithMode,
    });

    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');
    const sharedModalStylesheet = readFileSync(
      `${__dirname}/../../components/Modal.css`,
      'utf8'
    );
    const spellsModalRule = stylesheet.match(
      /\.modal-panel--spells\s*{([^}]*)}/s
    )?.[1];
    const defaultModalRule = sharedModalStylesheet.match(
      /\.modal-panel--default\s*{([^}]*)}/s
    )?.[1];

    expect(screen.getByRole('dialog', { name: 'Spells' })).toHaveClass(
      'modal-panel--spells'
    );
    expect(spellsModalRule).toMatch(/overflow-x:\s*hidden;/);
    expect(spellsModalRule).toMatch(/overflow-y:\s*auto;/);
    expect(defaultModalRule).toMatch(/overflow:\s*auto;/);
    expect(defaultModalRule).not.toMatch(/overflow-x:\s*hidden;/);
  });

  test('keeps the translated title and warning grouped beside the larger player image', () => {
    renderSpellsModal({ isForcedSetup: true });

    const title = screen.getByRole('heading', { name: 'Spells' });
    const warning = screen.getByText(
      'You must place all 5 starting tokens into spell slots before rolling dice. Place your tokens by dragging them from your token bag into the spell slots.'
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
    const tokenBagHeading = screen.getByRole('heading', { name: /^Token Bag 5\/5$/i });
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
    expect(screen.getAllByRole('button', { name: /moveable red token/i })).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /blue token/i })).not.toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: /^Token Bag 5\/5$/i })).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { level: 2, name: /5\/5$/ })).toBeInTheDocument();
    expect(document.querySelectorAll('.spells-starting-warning')).toHaveLength(1);
    expect(
      screen.queryByText(
        'Drag and drop tokens from your token bag into spell slots to assign them. Once you have committed your tokens, they cannot be moved again.'
      )
    ).not.toBeInTheDocument();
  });

  test.each([
    [
      'en',
      'The Wandsmith helps you arrange your tokens however you wish.',
    ],
    [
      'jp',
      '\u6756\u8077\u4eba\u304c\u3001\u30c8\u30fc\u30af\u30f3\u3092\u597d\u304d\u306a\u3088\u3046\u306b\u4e26\u3079\u66ff\u3048\u308b\u306e\u3092\u624b\u4f1d\u3063\u3066\u304f\u308c\u307e\u3059\u3002',
    ],
  ])('shows movable tokens and the Wandsmith warning in %s', (language, warning) => {
    const draftSpellSlots = createDraftSpellSlots();

    draftSpellSlots[0].tokens = [
      { committed: false, id: 'wandsmith-red', type: 'red' },
    ];
    renderSpellsModal({
      draftSpellSlots,
      isForcedSetup: false,
      isWandsmithMode: true,
      language,
    });

    expect(screen.getByText(warning)).toHaveClass(
      'spells-starting-warning',
      `language-${language}`
    );
    expect(screen.getByRole('heading', { level: 2, name: /5\/5$/ })).toBeInTheDocument();
    screen
      .getAllByRole('button', { name: /moveable red token/i })
      .forEach((tokenButton) => expect(tokenButton).toBeEnabled());
  });

  test('uses Japanese modal copy and font class for a Japanese player', () => {
    renderSpellsModal({ isForcedSetup: true, language: 'jp' });

    const dialog = screen.getByRole('dialog', { name: '呪文' });

    expect(within(dialog).getByRole('heading', { name: '呪文' })).toHaveClass(
      'language-jp'
    );
    expect(
      within(dialog).getByText(
        getSpellAssignmentTranslations('jp').startingTokenWarning
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByText('トークンバッグ')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: '保存' })).toBeEnabled();
    expect(within(dialog).queryByText('新しい報酬トークン')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('破棄')).not.toBeInTheDocument();
  });
});

test('uses the updated shared commit warning in English and Japanese', () => {
  expect(getSpellAssignmentTranslations('en').saveConfirmation).toBe(
    'Are you sure you want to commit your tokens to these spell slots? This cannot be changed without using a Wandsmith or potions once they are saved.'
  );
  expect(getSpellAssignmentTranslations('jp').saveConfirmation).toBe(
    '\u3053\u308c\u3089\u306e\u30b9\u30da\u30eb\u30b9\u30ed\u30c3\u30c8\u306b\u30c8\u30fc\u30af\u30f3\u3092\u914d\u7f6e\u3057\u3066\u78ba\u5b9a\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f\u4e00\u5ea6\u4fdd\u5b58\u3059\u308b\u3068\u3001\u6756\u8077\u4eba\u307e\u305f\u306f\u30dd\u30fc\u30b7\u30e7\u30f3\u3092\u4f7f\u7528\u3057\u306a\u3044\u9650\u308a\u3001\u914d\u7f6e\u3092\u5909\u66f4\u3059\u308b\u3053\u3068\u306f\u3067\u304d\u307e\u305b\u3093\u3002'
  );
});
