import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import LootChestFoundModal from './LootChestFoundModal';

test.each([
  ['en', 'You found a Loot Chest!', 'Open Chest'],
  [
    'jp',
    '\u6226\u5229\u54c1\u306e\u5b9d\u7bb1\u3092\u898b\u3064\u3051\u307e\u3057\u305f\uff01',
    '\u5b9d\u7bb1\u3092\u958b\u3051\u308b',
  ],
])('renders the exact %s Loot Chest prompt', (language, message, openText) => {
  const onOpen = jest.fn();

  render(
    <LootChestFoundModal
      isOpen
      language={language}
      onOpen={onOpen}
    />
  );

  const dialog = screen.getByRole('dialog', { name: 'Loot Chest Found' });
  const prompt = within(dialog).getByText(message);
  const openButton = within(dialog).getByRole('button', { name: openText });

  expect(prompt).toHaveClass(
    'loot-chest-found-message',
    'larger-text',
    `language-${language}`
  );
  expect(openButton).toHaveClass(`language-${language}`);
  expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();

  fireEvent.click(openButton);

  expect(onOpen).toHaveBeenCalledTimes(1);
});

test('falls back to English and centres larger yellow text', () => {
  render(<LootChestFoundModal isOpen language="unsupported" />);

  expect(screen.getByText('You found a Loot Chest!')).toHaveClass(
    'language-en'
  );

  const stylesheet = readFileSync(
    `${__dirname}/LootChestFoundModal.css`,
    'utf8'
  );

  expect(stylesheet).toMatch(
    /\.loot-chest-found-modal \.modal-body\s*{[^}]*display:\s*flex;/s
  );
  expect(stylesheet).toMatch(
    /\.loot-chest-found-modal-content\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.loot-chest-found-message\s*{[^}]*color:\s*#F5FA00;[^}]*margin:\s*0;[^}]*text-align:\s*center;/si
  );
});
