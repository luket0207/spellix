import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RollAgainEventModal from './RollAgainEventModal';

test.each([
  [
    'en',
    'You still have energy, roll again to continue onward',
    'Continue',
  ],
  [
    'jp',
    '\u307e\u3060\u4f53\u529b\u304c\u6b8b\u3063\u3066\u3044\u307e\u3059\u3002\u3082\u3046\u4e00\u5ea6\u30b5\u30a4\u30b3\u30ed\u3092\u632f\u3063\u3066\u3001\u5148\u3078\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002',
    '\u7d9a\u3051\u308b',
  ],
])('renders the exact %s Roll Again event copy', (language, message, continueText) => {
  const onContinue = jest.fn();

  render(
    <RollAgainEventModal
      isOpen
      language={language}
      onContinue={onContinue}
    />
  );

  const dialog = screen.getByRole('dialog', { name: 'Roll Again Event' });
  const eventMessage = within(dialog).getByText(message);
  const continueButton = within(dialog).getByRole('button', {
    name: continueText,
  });

  expect(eventMessage).toHaveClass(
    'roll-again-event-message',
    'larger-text',
    `language-${language}`
  );
  expect(continueButton).toHaveClass(`language-${language}`);
  expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();

  fireEvent.click(continueButton);

  expect(onContinue).toHaveBeenCalledTimes(1);
});

test('falls back to English and centres larger yellow text', () => {
  render(<RollAgainEventModal isOpen language="unsupported" />);

  expect(
    screen.getByText(
      'You still have energy, roll again to continue onward'
    )
  ).toHaveClass('language-en');

  const stylesheet = readFileSync(
    `${__dirname}/RollAgainEventModal.css`,
    'utf8'
  );

  expect(stylesheet).toMatch(
    /\.roll-again-event-modal \.modal-body\s*{[^}]*display:\s*flex;/s
  );
  expect(stylesheet).toMatch(
    /\.roll-again-event-modal-content\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.roll-again-event-message\s*{[^}]*color:\s*#F5FA00;[^}]*margin:\s*0;[^}]*text-align:\s*center;/si
  );
});
