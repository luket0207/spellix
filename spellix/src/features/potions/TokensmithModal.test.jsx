import { fireEvent, render, screen, within } from '@testing-library/react';
import TokensmithModal from './TokensmithModal';

function createSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens: [],
  }));
}

test('shows localized non-consuming messages for a full bag and no assigned tokens', () => {
  const onClose = jest.fn();
  const fullBag = Array.from({ length: 5 }, (_, index) => ({
    committed: false,
    id: `bag-${index + 1}`,
    type: 'red',
  }));
  const spellSlots = createSpellSlots();
  spellSlots[0].tokens = [
    { committed: true, id: 'red-1', type: 'red' },
  ];

  const { rerender } = render(
    <TokensmithModal
      isOpen
      language="en"
      onClose={onClose}
      spellSlots={spellSlots}
      tokenBag={fullBag}
    />
  );

  const fullModal = screen.getByRole('dialog', { name: 'Tokensmith' });
  expect(
    within(fullModal).getByText(
      'This potion can only be used when you have at least 1 free slot in your token bag.'
    )
  ).toHaveClass('larger-text', 'language-en');
  fireEvent.click(within(fullModal).getByRole('button', { name: 'OK' }));
  expect(onClose).toHaveBeenCalledTimes(1);

  rerender(
    <TokensmithModal
      isOpen
      language="jp"
      onClose={onClose}
      spellSlots={spellSlots}
      tokenBag={fullBag}
    />
  );

  expect(
    screen.getByText(
      '\u3053\u306e\u30dd\u30fc\u30b7\u30e7\u30f3\u306f\u3001\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u7a7a\u304d\u30b9\u30ed\u30c3\u30c8\u304c1\u3064\u4ee5\u4e0a\u3042\u308b\u5834\u5408\u306b\u306e\u307f\u4f7f\u7528\u3067\u304d\u307e\u3059\u3002'
    )
  ).toHaveClass('larger-text', 'language-jp');

  rerender(
    <TokensmithModal
      isOpen
      language="jp"
      onClose={onClose}
      spellSlots={createSpellSlots()}
      tokenBag={[]}
    />
  );

  expect(
    screen.getByText(
      '\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u305b\u308b\u914d\u7f6e\u6e08\u307f\u30c8\u30fc\u30af\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002'
    )
  ).toHaveClass('larger-text', 'language-jp');
});

test('shows only filled committed columns with every token instance clickable', () => {
  const spellSlots = createSpellSlots();
  spellSlots[0].tokens = [
    { committed: true, id: 'red-1', type: 'red' },
    { committed: true, id: 'red-2', type: 'red' },
  ];
  spellSlots[2].tokens = [
    { committed: true, id: 'light-green-1', type: 'light-green' },
  ];

  const { container } = render(
    <TokensmithModal
      isOpen
      language="en"
      onConfirm={jest.fn()}
      spellSlots={spellSlots}
      tokenBag={[]}
    />
  );

  const modal = screen.getByRole('dialog', { name: 'Tokensmith' });
  expect(
    within(modal).getByText('Click a token to move it back to your token bag')
  ).toHaveClass('larger-text', 'language-en');
  expect(
    container.querySelectorAll('.committed-spell-slot-item')
  ).toHaveLength(2);
  expect(
    within(modal).getAllByRole('button', { name: /select .* token .* in slot/i })
  ).toHaveLength(3);
  expect(within(modal).getByText('1')).toBeInTheDocument();
  expect(within(modal).getByText('3')).toBeInTheDocument();
  expect(within(modal).queryByText('2')).not.toBeInTheDocument();
});

test('keeps the exact selection through No and confirms it through Yes', () => {
  const onConfirm = jest.fn();
  const spellSlots = createSpellSlots();
  const selectedToken = {
    committed: true,
    id: 'blue-2',
    type: 'blue',
  };
  spellSlots[1].tokens = [
    { committed: true, id: 'blue-1', type: 'blue' },
    selectedToken,
  ];

  render(
    <TokensmithModal
      isOpen
      language="en"
      onConfirm={onConfirm}
      spellSlots={spellSlots}
      tokenBag={[]}
    />
  );

  const selectButton = screen.getByRole('button', {
    name: /select blue token blue-2 in slot 2/i,
  });
  fireEvent.click(selectButton);

  let confirmation = screen.getByRole('dialog', {
    name: 'Tokensmith confirmation',
  });
  expect(
    within(confirmation).getByText(
      'Are you sure you want to move this token back to your token bag?'
    )
  ).toHaveClass('larger-text', 'language-en');
  expect(
    within(confirmation).getByRole('img', { name: 'selected blue token' })
  ).toBeInTheDocument();

  fireEvent.click(
    within(confirmation).getByRole('button', { name: 'No' })
  );
  expect(
    screen.getByRole('dialog', { name: 'Tokensmith' })
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', {
      name: /select blue token blue-2 in slot 2/i,
    })
  );
  confirmation = screen.getByRole('dialog', {
    name: 'Tokensmith confirmation',
  });
  fireEvent.click(
    within(confirmation).getByRole('button', { name: 'Yes' })
  );

  expect(onConfirm).toHaveBeenCalledWith(selectedToken.id);
});

test('uses the exact Japanese instruction, confirmation, and actions', () => {
  const spellSlots = createSpellSlots();
  spellSlots[0].tokens = [
    { committed: true, id: 'red-1', type: 'red' },
  ];

  render(
    <TokensmithModal
      isOpen
      language="jp"
      onConfirm={jest.fn()}
      spellSlots={spellSlots}
      tokenBag={[]}
    />
  );

  expect(
    screen.getByText(
      '\u30c8\u30fc\u30af\u30f3\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u3001\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
    )
  ).toHaveClass('larger-text', 'language-jp');

  fireEvent.click(
    screen.getByRole('button', {
      name: /select red token red-1 in slot 1/i,
    })
  );

  const confirmation = screen.getByRole('dialog', {
    name: 'Tokensmith confirmation',
  });
  expect(
    within(confirmation).getByText(
      '\u3053\u306e\u30c8\u30fc\u30af\u30f3\u3092\u30c8\u30fc\u30af\u30f3\u30d0\u30c3\u30b0\u306b\u623b\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f'
    )
  ).toHaveClass('larger-text', 'language-jp');
  expect(
    within(confirmation).getByRole('button', { name: '\u306f\u3044' })
  ).toHaveClass('language-jp');
  expect(
    within(confirmation).getByRole('button', { name: '\u3044\u3044\u3048' })
  ).toHaveClass('language-jp');
});

test('shows a clear modal instead of moving Grey when capacity would become invalid', () => {
  const onConfirm = jest.fn();
  const spellSlots = createSpellSlots();
  spellSlots[0].tokens = Array.from({ length: 6 }, (_, index) => ({
    committed: true,
    id: `red-${index + 1}`,
    type: 'red',
  }));
  spellSlots[1].tokens = [
    { committed: true, id: 'grey-1', type: 'grey' },
  ];

  render(
    <TokensmithModal
      isOpen
      language="en"
      onConfirm={onConfirm}
      spellSlots={spellSlots}
      tokenBag={[]}
    />
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: /select grey token grey-1 in slot 2/i,
    })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

  const errorModal = screen.getByRole('dialog', {
    name: 'Tokensmith invalid spell state',
  });
  expect(
    within(errorModal).getByText(
      'This token cannot be moved because another spell column would exceed its capacity.'
    )
  ).toHaveClass('larger-text');
  expect(onConfirm).not.toHaveBeenCalled();

  fireEvent.click(within(errorModal).getByRole('button', { name: 'OK' }));
  expect(
    screen.getByRole('dialog', { name: 'Tokensmith' })
  ).toBeInTheDocument();
});
