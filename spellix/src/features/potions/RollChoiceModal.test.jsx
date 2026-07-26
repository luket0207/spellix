import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RollChoiceModal from './RollChoiceModal';

describe('RollChoiceModal', () => {
  test('shows the English question and all six choices without list markup', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <RollChoiceModal isOpen language="en" onSelect={onSelect} />
    );
    const modal = screen.getByRole('dialog', { name: 'Roll Choice' });
    const question = within(modal).getByText(
      'What do you want the next roll of the dice to be?'
    );
    const buttons = within(modal).getAllByRole('button');

    expect(question).toHaveClass('larger-text', 'language-en');
    expect(buttons).toHaveLength(6);
    buttons.forEach((button, index) => {
      expect(button).toHaveTextContent(String(index + 1));
      fireEvent.click(button);
    });
    expect(onSelect.mock.calls).toEqual(
      [1, 2, 3, 4, 5, 6].map((value) => [value])
    );
    expect(container.querySelector('ul, li')).toBeNull();
  });

  test('shows the Japanese question with the Japanese font class', () => {
    render(<RollChoiceModal isOpen language="jp" onSelect={() => {}} />);

    expect(
      screen.getByText(
        '\u6b21\u306e\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u3092\u3044\u304f\u3064\u306b\u3057\u307e\u3059\u304b\uff1f'
      )
    ).toHaveClass('larger-text', 'language-jp');
  });

  test('centres equal choice buttons in two rows of three', () => {
    const stylesheet = readFileSync(`${__dirname}/RollChoiceModal.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.roll-choice-buttons\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\);/s
    );
    expect(stylesheet).toMatch(
      /\.roll-choice-buttons\s*{[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.roll-choice-buttons button\s*{[^}]*width:\s*100%;/s
    );
  });
});
