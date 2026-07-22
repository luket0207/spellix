import { fireEvent, render, screen, within } from '@testing-library/react';
import SpellMergeConfirmationModal from './SpellMergeConfirmationModal';

describe('SpellMergeConfirmationModal', () => {
  test('shows the required English merge consequence in the shared modal', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(
      <SpellMergeConfirmationModal
        isOpen
        language="en"
        merge={{ columns: [2, 3], removedColumn: 3 }}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /merge columns confirmation/i });
    const message = within(dialog).getByText(
      'Committing this change will merge columns 2 and 3. This means you will lose the tokens from column 3. Is this ok?'
    );

    expect(dialog).toHaveClass('modal-panel');
    expect(message).toHaveClass('larger-text', 'language-en');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Yes' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'No' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('uses Japanese copy, controls, and font class', () => {
    render(
      <SpellMergeConfirmationModal
        isOpen
        language="jp"
        merge={{ columns: [4, 5], removedColumn: 4 }}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /merge columns confirmation/i });

    expect(
      within(dialog).getByText(
        'この変更を確定すると、列4と列5が統合されます。そのため、列4にあるトークンは失われます。よろしいですか？'
      )
    ).toHaveClass('larger-text', 'language-jp');
    expect(within(dialog).getByRole('button', { name: 'はい' })).toHaveClass('language-jp');
    expect(within(dialog).getByRole('button', { name: 'いいえ' })).toHaveClass('language-jp');
  });
});
