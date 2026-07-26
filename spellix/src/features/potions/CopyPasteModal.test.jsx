import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CopyPasteModal from './CopyPasteModal';

const tokenBag = [
  { committed: false, id: 'player-1-red-1', type: 'red' },
  { committed: false, id: 'player-1-blue-1', type: 'blue' },
];

test('shows the localized non-consuming empty-bag message with an OK action', () => {
  const onClose = jest.fn();

  const { rerender } = render(
    <CopyPasteModal
      isOpen
      language="en"
      onClose={onClose}
      tokenBag={[]}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Copy and Paste' });
  const message = within(modal).getByText(
    'You have no tokens in your token bag, so this potion cannot be used. The potion was added back to your potion slots.'
  );

  expect(message).toHaveClass('larger-text', 'language-en');
  fireEvent.click(within(modal).getByRole('button', { name: 'OK' }));
  expect(onClose).toHaveBeenCalledTimes(1);

  rerender(
    <CopyPasteModal
      isOpen
      language="jp"
      onClose={onClose}
      tokenBag={[]}
    />
  );

  expect(
    screen.getByText(
      '\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u30c8\u30fc\u30af\u30f3\u304c\u306a\u3044\u305f\u3081\u3001\u3053\u306e\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u4f7f\u7528\u3067\u304d\u307e\u305b\u3093\u3002\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u30dd\u30fc\u30b7\u30e7\u30f3\u30b9\u30ed\u30c3\u30c8\u306b\u623b\u3055\u308c\u307e\u3057\u305f\u3002'
    )
  ).toHaveClass('larger-text', 'language-jp');
});

test('lists horizontal token options with each localized Duplicate action underneath', () => {
  const onDuplicate = jest.fn();
  const { container, rerender } = render(
    <CopyPasteModal
      isOpen
      language="en"
      onDuplicate={onDuplicate}
      tokenBag={tokenBag}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Copy and Paste' });
  const options = container.querySelectorAll('.copy-paste-token-option');

  expect(options).toHaveLength(2);
  expect(container.querySelector('.copy-paste-token-list')).toBeInTheDocument();
  expect(modal.querySelector('ul, li')).toBeNull();
  expect(within(options[0]).getByRole('img', { name: 'red token' })).toBeInTheDocument();
  expect(within(options[0]).getByText('Damage')).toBeInTheDocument();
  expect(within(options[0]).getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
  expect(options[0].firstElementChild).toHaveClass('token-display-wrapper');
  expect(options[0].lastElementChild).toHaveRole('button', { name: 'Duplicate' });
  fireEvent.click(within(options[1]).getByRole('button', { name: 'Duplicate' }));
  expect(onDuplicate).toHaveBeenCalledWith(tokenBag[1]);

  rerender(
    <CopyPasteModal
      isOpen
      language="jp"
      onDuplicate={onDuplicate}
      tokenBag={tokenBag}
    />
  );

  expect(
    within(screen.getByRole('dialog', { name: 'Copy and Paste' })).getAllByRole(
      'button',
      { name: '\u8907\u88fd' }
    )
  ).toHaveLength(2);
});

test('shows a localized centred Cancel button at the bottom without resolving a token', () => {
  const onClose = jest.fn();
  const { container, rerender } = render(
    <CopyPasteModal
      isOpen
      language="en"
      onClose={onClose}
      tokenBag={tokenBag}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Copy and Paste' });
  const content = container.querySelector('.copy-paste-token-modal-content');
  const cancelRow = container.querySelector('.copy-paste-cancel-row');
  const cancelButton = within(cancelRow).getByRole('button', { name: 'Cancel' });

  expect(content.firstElementChild).toHaveClass('copy-paste-token-list');
  expect(content.lastElementChild).toBe(cancelRow);
  expect(cancelRow.parentElement).toBe(content);
  expect(cancelButton).toHaveClass('fantasy-button');
  expect(cancelButton).not.toHaveStyle({ width: '100%' });
  fireEvent.click(cancelButton);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(modal.querySelector('ul, li')).toBeNull();

  rerender(
    <CopyPasteModal
      isOpen
      language="jp"
      onClose={onClose}
      tokenBag={tokenBag}
    />
  );

  expect(
    screen.getByRole('button', { name: '\u30ad\u30e3\u30f3\u30bb\u30eb' })
  ).toHaveClass('language-jp');
});

test('shows the duplicate and every full-bag discard choice in the same modal', () => {
  const onDiscardDuplicate = jest.fn();
  const onReplaceToken = jest.fn();
  const duplicateToken = {
    committed: false,
    id: 'player-1-red-2',
    type: 'red',
  };

  const { container, rerender } = render(
    <CopyPasteModal
      duplicateToken={duplicateToken}
      isOpen
      language="en"
      onDiscardDuplicate={onDiscardDuplicate}
      onReplaceToken={onReplaceToken}
      tokenBag={tokenBag}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Copy and Paste' });
  const options = container.querySelectorAll('.copy-paste-token-option');

  expect(options).toHaveLength(3);
  expect(within(options[0]).getByRole('img', { name: 'red token duplicate' })).toBeInTheDocument();
  fireEvent.click(
    within(options[0]).getByRole('button', { name: 'Discard this new token' })
  );
  expect(onDiscardDuplicate).toHaveBeenCalledTimes(1);
  fireEvent.click(
    within(options[2]).getByRole('button', {
      name: 'Discard this token and keep the duplicate',
    })
  );
  expect(onReplaceToken).toHaveBeenCalledWith(tokenBag[1]);
  expect(modal.querySelector('ul, li')).toBeNull();

  rerender(
    <CopyPasteModal
      duplicateToken={duplicateToken}
      isOpen
      language="jp"
      onDiscardDuplicate={onDiscardDuplicate}
      onReplaceToken={onReplaceToken}
      tokenBag={tokenBag}
    />
  );

  expect(
    screen.getByRole('button', {
      name: '\u3053\u306e\u65b0\u3057\u3044\u30c8\u30fc\u30af\u30f3\u3092\u6368\u3066\u308b',
    })
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('button', {
      name: '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u3092\u6368\u3066\u3066\u8907\u88fd\u30c8\u30fc\u30af\u30f3\u3092\u6b8b\u3059',
    })
  ).toHaveLength(2);
  expect(
    screen.getByRole('button', { name: '\u30ad\u30e3\u30f3\u30bb\u30eb' })
  ).toBeInTheDocument();
});

test('defines a wrapping horizontal list with centred vertical token options', () => {
  const stylesheet = readFileSync(`${__dirname}/CopyPasteModal.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.copy-paste-token-list\s*{[^}]*align-items:\s*stretch;[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*justify-content:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.copy-paste-token-option\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*justify-content:\s*flex-start;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.copy-paste-cancel-row\s*{[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*margin-top:\s*18px;/s
  );
});
