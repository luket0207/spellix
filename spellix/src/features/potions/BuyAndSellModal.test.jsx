import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import BuyAndSellModal from './BuyAndSellModal';

const TOKENS = [
  { id: 'bag-red', type: 'red' },
  { id: 'bag-blue', type: 'blue' },
  { id: 'bag-green', type: 'green' },
  { id: 'bag-purple', type: 'purple' },
];

test('shows the localized non-consuming error when fewer than three tokens exist', () => {
  const onClose = jest.fn();

  render(
    <BuyAndSellModal
      isOpen
      language="en"
      onClose={onClose}
      tokenBag={TOKENS.slice(0, 2)}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Buy and Sell' });

  expect(
    within(modal).getByText(
      'You do not have enough tokens in your token bag to cast this potion'
    )
  ).toHaveClass('larger-text', 'language-en');
  fireEvent.click(within(modal).getByRole('button', { name: 'OK' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('selects exactly three bag tokens and supports non-consuming Cancel', () => {
  const onClose = jest.fn();
  const onDiscard = jest.fn();

  render(
    <BuyAndSellModal
      isOpen
      language="en"
      onClose={onClose}
      onDiscard={onDiscard}
      tokenBag={TOKENS}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Buy and Sell' });
  const discardButton = within(modal).getByRole('button', {
    name: 'Discard',
  });
  const tokenButtons = within(modal).getAllByRole('button', {
    name: /select .* bag token/i,
  });

  expect(
    within(modal).getByText(
      'Discard 3 tokens from your token bag to receive a new token'
    )
  ).toHaveClass('larger-text', 'language-en');
  expect(discardButton).toBeDisabled();

  fireEvent.click(tokenButtons[0]);
  expect(discardButton).toBeDisabled();
  fireEvent.click(tokenButtons[1]);
  expect(discardButton).toBeDisabled();
  fireEvent.click(tokenButtons[2]);

  expect(discardButton).toBeEnabled();
  expect(tokenButtons[0]).toHaveAttribute('aria-pressed', 'true');
  expect(tokenButtons[3]).toBeDisabled();

  fireEvent.click(within(modal).getByRole('button', { name: 'Cancel' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onDiscard).not.toHaveBeenCalled();
  expect(within(modal).queryByRole('list')).not.toBeInTheDocument();
  expect(within(modal).queryByRole('listitem')).not.toBeInTheDocument();
});

test('discards the selected ids and shows two token choices with buttons underneath', () => {
  const onChoose = jest.fn();
  const onDiscard = jest.fn();
  const { rerender } = render(
    <BuyAndSellModal
      isOpen
      language="en"
      onDiscard={onDiscard}
      tokenBag={TOKENS}
    />
  );

  screen
    .getAllByRole('button', { name: /select .* bag token/i })
    .slice(0, 3)
    .forEach((button) => fireEvent.click(button));
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

  expect(onDiscard).toHaveBeenCalledWith(
    ['bag-red', 'bag-blue', 'bag-green'],
    expect.arrayContaining([expect.any(String), expect.any(String)])
  );
  expect(new Set(onDiscard.mock.calls[0][1]).size).toBe(2);

  rerender(
    <BuyAndSellModal
      isOpen
      language="en"
      onChoose={onChoose}
      tokenBag={[TOKENS[3]]}
      transaction={{
        rewardTokenTypes: ['white', 'yellow'],
        status: 'choosing',
      }}
    />
  );

  const rewardOptions = screen.getAllByRole('group', {
    name: /reward token option/i,
  });

  expect(rewardOptions).toHaveLength(2);
  rewardOptions.forEach((option) => {
    expect(within(option).getByRole('img')).toBeInTheDocument();
    expect(within(option).getByRole('button', { name: 'Choose' }))
      .toBeInTheDocument();
  });
  fireEvent.click(
    within(rewardOptions[1]).getByRole('button', { name: 'Choose' })
  );
  expect(onChoose).toHaveBeenCalledWith('yellow');
});

test.each([
  ['en', 'Choose a token to add to your token bag', 'language-en'],
  [
    'jp',
    'トークンバッグに追加するトークンを選んでください。',
    'language-jp',
  ],
  ['invalid', 'Choose a token to add to your token bag', 'language-en'],
])(
  'shows the localized reward instruction above the choices for %s',
  (language, expectedText, expectedLanguageClass) => {
    const onChoose = jest.fn();

    render(
      <BuyAndSellModal
        isOpen
        language={language}
        onChoose={onChoose}
        transaction={{
          rewardTokenTypes: ['white', 'yellow'],
          status: 'choosing',
        }}
      />
    );

    const modal = screen.getByRole('dialog', { name: 'Buy and Sell' });
    const instruction = within(modal).getByText(expectedText);
    const rewardGrid = modal.querySelector('.buy-and-sell-reward-grid');

    expect(instruction).toHaveClass(
      'buy-and-sell-reward-instruction',
      expectedLanguageClass
    );
    expect(
      instruction.compareDocumentPosition(rewardGrid) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(within(modal).getAllByRole('group', {
      name: /reward token option/i,
    })).toHaveLength(2);
    expect(within(modal).queryByRole('list')).not.toBeInTheDocument();
    expect(within(modal).queryByRole('listitem')).not.toBeInTheDocument();

    fireEvent.click(
      within(modal).getAllByRole('button', { name: /choose|選ぶ/i })[0]
    );
    expect(onChoose).toHaveBeenCalledWith('white');
  }
);

test('shows localized success in the same modal and completes with OK', () => {
  const onComplete = jest.fn();

  render(
    <BuyAndSellModal
      isOpen
      language="jp"
      onComplete={onComplete}
      tokenBag={[]}
      transaction={{
        rewardTokenTypes: ['red', 'white'],
        selectedRewardType: 'white',
        status: 'success',
      }}
    />
  );

  expect(
    screen.getByText('トークンがトークンバッグに追加されました。')
  ).toHaveClass('larger-text', 'language-jp');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('uses div-based wrapping options and a visible selected state', () => {
  const stylesheet = readFileSync(`${__dirname}/BuyAndSellModal.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.buy-and-sell-token-grid\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/s
  );
  expect(stylesheet).toMatch(
    /\.buy-and-sell-token-select\.is-selected\s*{[^}]*outline:/s
  );
  expect(stylesheet).toMatch(
    /\.buy-and-sell-reward-option\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s
  );
  expect(stylesheet).toMatch(
    /\.buy-and-sell-reward-instruction\s*{[^}]*margin-bottom:\s*60px;[^}]*text-align:\s*center;[^}]*color:\s*#F5FA00;/s
  );
});
