import { fireEvent, render, screen, within } from '@testing-library/react';
import StormMasterResultModal from './StormMasterResultModal';

describe('StormMasterResultModal', () => {
  test.each([
    [
      'movement-blocked',
      'en',
      'The storm prevents you from moving',
      'Continue',
      'language-en',
    ],
    [
      'caster-targeted',
      'en',
      'The storm targeted you',
      'Continue',
      'language-en',
    ],
    [
      'movement-blocked',
      'jp',
      '嵐のせいで移動できません。',
      '続ける',
      'language-jp',
    ],
    [
      'caster-targeted',
      'jp',
      '嵐の標的になりました。',
      '続ける',
      'language-jp',
    ],
    [
      'caster-targeted',
      'invalid',
      'The storm targeted you',
      'Continue',
      'language-en',
    ],
  ])(
    'shows the localized %s result without list markup',
    (resultType, language, expectedMessage, expectedAction, languageClass) => {
      const onContinue = jest.fn();

      render(
        <StormMasterResultModal
          isOpen
          language={language}
          onContinue={onContinue}
          resultType={resultType}
        />
      );

      const modal = screen.getByRole('dialog', {
        name: 'Storm Master result',
      });
      const message = within(modal).getByText(expectedMessage);
      const continueButton = within(modal).getByRole('button', {
        name: expectedAction,
      });

      expect(modal).toHaveClass('modal-panel--default');
      expect(message).toHaveClass('larger-text', languageClass);
      expect(continueButton).toHaveClass(languageClass);
      expect(modal.querySelector('ul, li')).toBeNull();

      fireEvent.click(continueButton);
      expect(onContinue).toHaveBeenCalledTimes(1);
    }
  );
});
