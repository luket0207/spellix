import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import CauldronChoiceModal from './CauldronChoiceModal';

const CHOICES = POTION_DEFINITIONS.slice(0, 3);

test.each([
  ['English', undefined, 'Choose a new potion to gain', 'language-en'],
  [
    'Japanese',
    'jp',
    '獲得する新しいポーションを選んでください。',
    'language-jp',
  ],
  ['invalid language fallback', 'invalid', 'Choose a new potion to gain', 'language-en'],
])('shows the %s title above the potion choices', (
  _label,
  language,
  expectedTitle,
  expectedLanguageClass
) => {
  render(
    <CauldronChoiceModal
      choices={CHOICES}
      isOpen
      language={language}
      onChoose={jest.fn()}
    />
  );

  const title = screen.getByText(expectedTitle);
  const choiceList = document.querySelector('.cauldron-choice-list');

  expect(title.tagName).toBe('P');
  expect(title).toHaveClass(
    'cauldron-choice-title',
    'larger-text',
    expectedLanguageClass
  );
  expect(
    title.compareDocumentPosition(choiceList) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test('shows three horizontal potion choices with buttons underneath', () => {
  const onChoose = jest.fn();

  render(
    <CauldronChoiceModal
      choices={CHOICES}
      isOpen
      language="en"
      onChoose={onChoose}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Cauldron choices' });
  const options = within(modal).getAllByRole('group', {
    name: /cauldron potion option/i,
  });

  expect(modal).toHaveClass('modal-panel--default');
  expect(options).toHaveLength(3);
  options.forEach((option, index) => {
    const potion = within(option).getByRole('group', {
      name: `${CHOICES[index].name} potion`,
    });
    const chooseButton = within(option).getByRole('button', {
      name: 'Choose',
    });

    expect(potion).toHaveAccessibleDescription(CHOICES[index].description);
    expect(
      potion.compareDocumentPosition(chooseButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
  expect(modal.querySelector('ul, li')).toBeNull();

  fireEvent.click(
    within(options[1]).getByRole('button', { name: 'Choose' })
  );
  expect(onChoose).toHaveBeenCalledWith(CHOICES[1]);
});

test('uses Japanese potion translations and Choose controls', () => {
  render(
    <CauldronChoiceModal
      choices={CHOICES}
      isOpen
      language="jp"
      onChoose={jest.fn()}
    />
  );

  expect(screen.getAllByRole('button', { name: '選ぶ' })).toHaveLength(3);
  expect(screen.getByText(CHOICES[0].japaneseName)).toHaveClass('language-jp');
  screen.getAllByRole('button', { name: '選ぶ' }).forEach((button) => {
    expect(button).toHaveClass('language-jp');
  });
});

test('cannot be dismissed without choosing a potion', () => {
  render(
    <CauldronChoiceModal
      choices={CHOICES}
      isOpen
      language="en"
      onChoose={jest.fn()}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Cauldron choices' });

  expect(within(modal).queryByRole('button', {
    name: /cancel|close/i,
  })).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId('modal-overlay'));
  fireEvent.keyDown(modal, { key: 'Escape' });
  expect(screen.getByRole('dialog', {
    name: 'Cauldron choices',
  })).toBeInTheDocument();
});

test('uses a wrapping horizontal list and vertically stacked options', () => {
  const stylesheet = readFileSync(
    `${__dirname}/CauldronChoiceModal.css`,
    'utf8'
  );

  expect(stylesheet).toMatch(
    /\.cauldron-choice-list\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*justify-content:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.cauldron-choice-card\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.cauldron-choice-title\s*{[^}]*margin-bottom:\s*60px;[^}]*text-align:\s*center;[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*bold;/s
  );
});
