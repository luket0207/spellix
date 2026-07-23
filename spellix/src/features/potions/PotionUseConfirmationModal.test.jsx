import { fireEvent, render, screen, within } from '@testing-library/react';
import PotionUseConfirmationModal from './PotionUseConfirmationModal';

const englishPotion = {
  description: 'Choose the next roll of the dice',
  name: 'Roll Choice',
};

describe('PotionUseConfirmationModal', () => {
  test('shows the required English copy and calls both confirmation actions', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { rerender } = render(
      <PotionUseConfirmationModal
        isOpen
        language="en"
        onCancel={onCancel}
        onConfirm={onConfirm}
        potion={englishPotion}
      />
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Use potion confirmation',
    });
    expect(
      within(dialog).getByText('Are you sure you want to use Roll Choice?')
    ).toHaveClass('larger-text', 'language-en');
    expect(within(dialog).getByText('Potion Description')).toHaveClass(
      'language-en'
    );
    expect(
      within(dialog).getByText('Choose the next roll of the dice')
    ).toHaveClass('language-en');
    expect(dialog.querySelector('ul, li')).toBeNull();

    fireEvent.click(within(dialog).getByRole('button', { name: 'No' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <PotionUseConfirmationModal
        isOpen
        language="en"
        onCancel={onCancel}
        onConfirm={onConfirm}
        potion={englishPotion}
      />
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes' })
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('shows exact Japanese copy and uses Japanese font classes', () => {
    const japanesePotion = {
      description: 'English description',
      japaneseDescription: '\u6b21\u306b\u632f\u308b\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u3092\u9078\u3076\u3002',
      japaneseName: '\u51fa\u76ee\u9078\u629e',
      name: 'Roll Choice',
    };

    render(
      <PotionUseConfirmationModal
        isOpen
        language="jp"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        potion={japanesePotion}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        '\u51fa\u76ee\u9078\u629e\u3092\u4f7f\u7528\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f'
      )
    ).toHaveClass('larger-text', 'language-jp');
    expect(
      within(dialog).getByText('\u30dd\u30fc\u30b7\u30e7\u30f3\u306e\u8aac\u660e')
    ).toHaveClass('language-jp');
    expect(
      within(dialog).getByText(
        '\u6b21\u306b\u632f\u308b\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u3092\u9078\u3076\u3002'
      )
    ).toHaveClass('language-jp');
    expect(
      within(dialog).getByRole('button', { name: '\u306f\u3044' })
    ).toHaveClass('language-jp');
    expect(
      within(dialog).getByRole('button', { name: '\u3044\u3044\u3048' })
    ).toHaveClass('language-jp');
  });

  test('renders nothing without a selected potion', () => {
    const { container } = render(
      <PotionUseConfirmationModal
        isOpen
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        potion={null}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
