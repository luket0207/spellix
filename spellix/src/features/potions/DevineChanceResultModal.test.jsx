import { fireEvent, render, screen, within } from '@testing-library/react';
import DevineChanceResultModal from './DevineChanceResultModal';

describe('DevineChanceResultModal', () => {
  test('shows the exact English caster-healed result in the wooden modal', () => {
    const onContinue = jest.fn();

    render(
      <DevineChanceResultModal
        healedGroup="caster"
        isOpen
        language="en"
        onContinue={onContinue}
      />
    );

    const modal = screen.getByRole('dialog', {
      name: 'Devine Chance result',
    });

    expect(modal).toHaveClass('modal-panel--default');
    expect(
      within(modal).getByText('You recovered all your health')
    ).toHaveClass('larger-text', 'language-en');
    expect(within(modal).queryByRole('list')).not.toBeInTheDocument();
    expect(within(modal).queryByRole('listitem')).not.toBeInTheDocument();

    fireEvent.click(
      within(modal).getByRole('button', { name: 'Continue' })
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('shows the exact Japanese everyone-else result and localized action', () => {
    render(
      <DevineChanceResultModal
        healedGroup="others"
        isOpen
        language="jp"
        onContinue={() => {}}
      />
    );

    const message = screen.getByText(
      '他の全員のHPを回復させました。'
    );

    expect(message).toHaveClass('larger-text', 'language-jp');
    expect(
      screen.getByRole('button', { name: '続ける' })
    ).toHaveClass('language-jp');
  });
});
