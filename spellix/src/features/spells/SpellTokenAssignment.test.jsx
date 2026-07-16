import { fireEvent, render, screen, within } from '@testing-library/react';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import SpellTokenAssignment from './SpellTokenAssignment';

function createSpellSlots() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `slot-${index + 1}`,
    maxTokens: 5,
    tokens:
      index === 0
        ? [{ committed: true, id: 'blue-1', type: 'blue' }]
        : [],
  }));
}

describe('SpellTokenAssignment', () => {
  test('renders the reusable spell slots and token bag without reward-only controls', () => {
    const onTokenBagTokenClick = jest.fn();

    render(
      <SpellTokenAssignment
        onTokenBagTokenClick={onTokenBagTokenClick}
        onTokenDrop={jest.fn()}
        spellSlots={createSpellSlots()}
        tokenBag={[{ committed: false, id: 'red-1', type: 'red' }]}
        tokenSourceLabel="Token Bag"
      />
    );

    expect(screen.getByLabelText(/^spell slots$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Slot [1-6]: [0-1] of 5 tokens$/i)).toHaveLength(6);
    expect(screen.getByLabelText(/token bag drop zone/i)).toBeInTheDocument();
    const moveableTokenButton = screen.getByRole('button', { name: /moveable red token/i });
    const committedTokenButton = screen.getByRole('button', { name: /committed blue token/i });
    const moveableToken = within(moveableTokenButton).getByRole('img', {
      name: /red token/i,
    });
    const committedToken = within(committedTokenButton).getByRole('img', {
      name: /blue token/i,
    });

    expect(moveableTokenButton).toBeEnabled();
    expect(moveableTokenButton).toHaveAccessibleDescription(/Plus 10 Damage/);
    expect(committedTokenButton).toBeDisabled();
    expect(moveableToken).toHaveClass('token-display--glow', 'token-display--red');
    expect(moveableToken).toHaveAttribute('title', TOKEN_DEFINITIONS.red.description);
    expect(moveableToken).not.toHaveAttribute('tabindex');
    expect(committedToken).toHaveClass(
      'token-display--committed',
      'token-display--blue'
    );
    expect(screen.queryByText(/new reward token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discard/i)).not.toBeInTheDocument();

    fireEvent.click(moveableTokenButton);

    expect(onTokenBagTokenClick).not.toHaveBeenCalled();
  });

  test('renders the new token and trash drop area only in reward assignment mode', () => {
    render(
      <SpellTokenAssignment
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        tokenBag={[]}
        tokenSourceLabel="Token Bag"
      />
    );

    expect(screen.getByLabelText(/reward token assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/new reward token/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByLabelText(/discard token drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /trash can/i })).toBeInTheDocument();
  });

  test('shows a staged reward token inside its selected spell slot', () => {
    render(
      <SpellTokenAssignment
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        stagedRewardDestinationId="slot-3"
        tokenBag={[]}
        tokenSourceLabel="Token Bag"
      />
    );

    expect(
      within(screen.getByLabelText(/spell slot 3/i)).getByRole('button', {
        name: /new reward red token/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/placed in spell slot 3/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new reward red token/i })).toHaveLength(1);
  });

  test('shows a staged reward token inside the token bag', () => {
    render(
      <SpellTokenAssignment
        isRewardTokenStagedInBag
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        tokenBag={[{ committed: false, id: 'green-1', type: 'green' }]}
        tokenSourceLabel="Token Bag"
      />
    );

    expect(
      within(screen.getByLabelText(/token bag drop zone/i)).getByRole('button', {
        name: /new reward red token/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/placed in token bag/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new reward red token/i })).toHaveLength(1);
  });

  test('shows a staged reward token inside the discard drop zone', () => {
    render(
      <SpellTokenAssignment
        isRewardTokenStagedForDiscard
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        tokenBag={[]}
        tokenSourceLabel="Token Bag"
      />
    );

    expect(
      within(screen.getByLabelText(/discard token drop zone/i)).getByRole('button', {
        name: /new reward red token/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/placed in discard area/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /new reward red token/i })).toHaveLength(1);
  });

  test('previews one selected full-bag token replacement', () => {
    render(
      <SpellTokenAssignment
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        stagedRewardTokenBagReplacementId="green-1"
        tokenBag={[
          { committed: false, id: 'green-1', type: 'green' },
          { committed: false, id: 'blue-2', type: 'blue' },
        ]}
        tokenSourceLabel="Token Bag"
      />
    );

    const tokenBag = screen.getByLabelText(/token bag drop zone/i);

    expect(
      within(tokenBag).getByRole('button', { name: /new reward red token/i })
    ).toBeInTheDocument();
    expect(
      within(tokenBag).queryByRole('button', { name: /moveable green token/i })
    ).not.toBeInTheDocument();
    expect(
      within(tokenBag).getByRole('button', { name: /moveable blue token/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/replacing token in token bag/i)).toBeInTheDocument();
    expect(within(tokenBag).getAllByRole('button')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /new reward red token/i })).toHaveLength(1);
  });

  test('uses existing shared bag tokens for reward-only replacement selection', () => {
    const onTokenBagTokenClick = jest.fn();

    render(
      <SpellTokenAssignment
        mode="rewardAssignment"
        onTokenBagTokenClick={onTokenBagTokenClick}
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        tokenBag={[{ committed: false, id: 'green-1', type: 'green' }]}
        tokenSourceLabel="Token Bag"
      />
    );

    fireEvent.click(
      within(screen.getByLabelText(/token bag drop zone/i)).getByRole('button', {
        name: /moveable green token/i,
      })
    );
    fireEvent.click(screen.getByRole('button', { name: /new reward red token/i }));

    expect(onTokenBagTokenClick).toHaveBeenCalledTimes(1);
    expect(onTokenBagTokenClick).toHaveBeenCalledWith('green-1');
  });
});
