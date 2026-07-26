import { readFileSync } from 'fs';
import { render, screen } from '@testing-library/react';
import HeavyWeightDiceResult from './HeavyWeightDiceResult';

test.each([
  [
    'en',
    'Dice roll is halved because you are weighed down.',
    'language-en',
  ],
  [
    'jp',
    '\u91cd\u3057\u3092\u304b\u3051\u3089\u308c\u3066\u3044\u308b\u305f\u3081\u3001\u30b5\u30a4\u30b3\u30ed\u306e\u51fa\u76ee\u304c\u534a\u5206\u306b\u306a\u308a\u307e\u3059\u3002',
    'language-jp',
  ],
])(
  'keeps the Heavy Weight number separate from the localized %s explanation',
  (language, message, languageClassName) => {
    const { container } = render(
      <div className="dice-roll-result">
        <HeavyWeightDiceResult language={language} roll={3} />
      </div>
    );

    const resultNumber = screen.getByText('3');
    const messageElement = container.querySelector(
      '.heavy-weight-dice-result-message'
    );

    expect(resultNumber).toHaveClass('heavy-weight-dice-result-number');
    expect(resultNumber.tagName).toBe('P');
    expect(messageElement).toHaveClass(
      'heavy-weight-dice-result-message',
      languageClassName
    );
    expect(messageElement.tagName).toBe('P');
    expect(messageElement).toHaveTextContent(message);
    expect(messageElement).not.toHaveTextContent('-');
    expect(container.querySelector('.dice-roll-result')).toHaveTextContent(
      `3${message}`
    );
    expect(container.querySelector('.heavy-weight-dice-result')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.heavy-weight-dice-result > p')
    ).toHaveLength(2);
  }
);

test('centres both paragraphs while preserving their required font sizes', () => {
  const stylesheet = readFileSync(
    `${__dirname}/HeavyWeightDiceResult.css`,
    'utf8'
  );

  expect(stylesheet).toMatch(
    /\.heavy-weight-dice-result\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;[^}]*text-align:\s*center;/s
  );
  expect(stylesheet).toMatch(
    /\.heavy-weight-dice-result-number,\s*\.heavy-weight-dice-result-message\s*{[^}]*text-align:\s*center;[^}]*width:\s*100%;/s
  );
  expect(stylesheet).toMatch(
    /\.heavy-weight-dice-result-number\s*{[^}]*font-size:\s*inherit;/s
  );
  expect(stylesheet).toMatch(
    /\.heavy-weight-dice-result-message\s*{[^}]*font-size:\s*16px;/s
  );
});
