import { readFileSync } from 'fs';
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
  test('hides token names and tooltips from the original and overlay while dragging', () => {
    const componentSource = readFileSync(
      `${__dirname}/SpellTokenAssignment.jsx`,
      'utf8'
    );

    expect(componentSource).toMatch(/showName={showName && !isDragging}/);
    expect(componentSource).toMatch(/showTooltip={!isDragging}/);
    expect(componentSource).toMatch(
      /<DragOverlay>[\s\S]*?<Token[\s\S]*?showTooltip={false}/
    );
  });

  test('uses div-based spell columns and an unclipped drag overlay', () => {
    render(
      <SpellTokenAssignment
        onTokenDrop={jest.fn()}
        spellSlots={createSpellSlots()}
        tokenBag={[]}
      />
    );

    const componentSource = readFileSync(
      `${__dirname}/SpellTokenAssignment.jsx`,
      'utf8'
    );
    const spellSlotArea = screen.getByLabelText('Spell slots');

    expect(spellSlotArea).toBeInstanceOf(HTMLDivElement);
    expect(screen.queryByRole('list', { name: 'Spell slots' })).not.toBeInTheDocument();
    expect(within(spellSlotArea).queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByLabelText('Assignment column 1')).toBeInstanceOf(HTMLDivElement);
    expect(componentSource).toMatch(/<DragOverlay>/);
  });

  test('disables drag auto-scrolling and wrapper scroll bars for spell columns', () => {
    const componentSource = readFileSync(
      `${__dirname}/SpellTokenAssignment.jsx`,
      'utf8'
    );
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');
    const spellSlotScrollRule = stylesheet.match(
      /\.spell-slot-scroll\s*{([^}]*)}/s
    )?.[1];

    expect(componentSource).toMatch(/<DndContext[^>]*autoScroll={false}/s);
    expect(spellSlotScrollRule).toMatch(/overflow:\s*visible;/);
    expect(spellSlotScrollRule).not.toMatch(
      /overflow(?:-x|-y)?:\s*(?:auto|scroll);/
    );
  });

  test('keeps spell columns fixed and prevents vertical scroll bars with ten tokens', () => {
    const spellSlots = createSpellSlots();

    spellSlots[0] = {
      ...spellSlots[0],
      maxTokens: 10,
      tokens: Array.from({ length: 10 }, (_, index) => ({
        committed: false,
        id: `red-${index + 1}`,
        type: 'red',
      })),
    };

    render(
      <SpellTokenAssignment
        onTokenDrop={jest.fn()}
        spellSlots={spellSlots}
        tokenBag={[]}
      />
    );

    const firstSpellSlot = screen.getByLabelText('Spell slot 1');
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');

    expect(within(firstSpellSlot).getAllByRole('button')).toHaveLength(10);
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(stylesheet).toMatch(/\.spell-slot-scroll\s*{[^}]*overflow:\s*visible;/s);
    expect(stylesheet).toMatch(
      /\.spell-slot-item \.spell-drop-zone\s*{[^}]*height:\s*60px;[^}]*min-height:\s*60px;/s
    );
  });

  test('shows Grey-adjusted capacity for physically adjacent columns', () => {
    const spellSlots = createSpellSlots();
    spellSlots[1].tokens = [
      { committed: true, id: 'grey-1', type: 'grey' },
      { committed: true, id: 'grey-2', type: 'grey' },
    ];

    render(
      <SpellTokenAssignment
        onTokenDrop={jest.fn()}
        spellSlots={spellSlots}
        tokenBag={[]}
      />
    );

    expect(within(screen.getByLabelText('Assignment column 1')).getByText('1 / 7')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Assignment column 2')).getByText('2 / 5')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Assignment column 3')).getByText('0 / 7')).toBeInTheDocument();
  });

  test('does not display adjacent capacity from an uncommitted Grey token', () => {
    const spellSlots = createSpellSlots();
    spellSlots[1].tokens = [
      { committed: true, id: 'grey-committed', type: 'grey' },
      { committed: false, id: 'grey-draft', type: 'grey' },
    ];

    render(
      <SpellTokenAssignment
        onTokenDrop={jest.fn()}
        spellSlots={spellSlots}
        tokenBag={[]}
      />
    );

    expect(within(screen.getByLabelText('Assignment column 1')).getByText('1 / 6')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Assignment column 3')).getByText('0 / 6')).toBeInTheDocument();
  });

  test('renders a merged pair as one canonical assignment drop zone spanning both columns', () => {
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');
    const { container } = render(
      <SpellTokenAssignment
        mergedColumns={[{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }]}
        onTokenDrop={jest.fn()}
        spellSlots={createSpellSlots()}
        tokenBag={[]}
      />
    );

    const mergedColumn = screen.getByLabelText('Assignment column 1+2');

    expect(mergedColumn).toHaveClass('spell-slot-item--merged');
    expect(mergedColumn).toHaveAttribute('data-column-span', '2');
    expect(within(mergedColumn).getByRole('heading', { name: '1+2' })).toBeInTheDocument();
    expect(within(mergedColumn).getByLabelText('Spell slot 1+2')).toBeInTheDocument();
    expect(screen.queryByLabelText('Assignment column 2')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.spell-slot-item')).toHaveLength(5);
    expect(stylesheet).toMatch(
      /\.spell-slot-item--merged\s*{[^}]*width:\s*292px;[^}]*flex-basis:\s*292px;/s
    );
  });

  test('shows effective committed Grey capacity once on a merged assignment column', () => {
    const spellSlots = createSpellSlots();
    spellSlots[2].tokens = [
      { committed: true, id: 'grey-3', type: 'grey' },
      { committed: false, id: 'grey-draft-3', type: 'grey' },
    ];

    render(
      <SpellTokenAssignment
        mergedColumns={[{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }]}
        onTokenDrop={jest.fn()}
        spellSlots={spellSlots}
        tokenBag={[]}
      />
    );

    expect(
      within(screen.getByLabelText('Assignment column 1+2')).getByText('1 / 6')
    ).toBeInTheDocument();
  });

  test('defines the polished spell slot and token bag visual states', () => {
    const componentSource = readFileSync(
      `${__dirname}/SpellTokenAssignment.jsx`,
      'utf8'
    );
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');

    expect(componentSource).toMatch(
      /className={`spell-drop-zone\${isOver \? ' spell-drop-zone--active' : ''}`}/
    );
    expect(stylesheet).toMatch(
      /\.spell-slot-item\s*>\s*h4\s*{[^}]*font-size:\s*42px;[^}]*text-align:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.spell-drop-zone\s*{[^}]*border:\s*2px solid #2a160d;[^}]*background:\s*#3a2013;[^}]*border-radius:\s*8px;/s
    );
    expect(stylesheet).toMatch(
      /\.spell-drop-zone--active\s*{[^}]*border-color:\s*#6b3f22;[^}]*background:\s*#7a4a2a;/s
    );
    expect(stylesheet).toMatch(
      /\.spell-token-source\s+\.spell-drop-zone\s*{[^}]*color:\s*#F5FA00;/s
    );
    expect(stylesheet).toMatch(
      /\.spell-token-assignment\s+\.token-display-name\s*{[^}]*color:\s*#F5FA00;/s
    );
  });

  test('shows localized names in the token bag while keeping spell slots compact', () => {
    render(
      <SpellTokenAssignment
        language="jp"
        onTokenDrop={jest.fn()}
        spellSlots={createSpellSlots()}
        tokenBag={[{ committed: false, id: 'red-1', type: 'red' }]}
      />
    );

    const tokenBag = screen.getByLabelText(/token bag drop zone/i);
    const firstSpellSlot = screen.getByLabelText(/spell slot 1/i);

    expect(within(tokenBag).getByText('ダメージ')).toBeInTheDocument();
    expect(within(tokenBag).getByRole('img', { name: /red token/i })).toHaveAttribute(
      'title',
      'ダメージ+10'
    );
    expect(within(firstSpellSlot).queryByText('ガード')).not.toBeInTheDocument();
    expect(within(firstSpellSlot).getByRole('img', { name: /blue token/i })).toHaveAttribute(
      'title',
      'ガード+5'
    );
  });

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

    expect(screen.getByLabelText(/spell token assignment/i)).toHaveClass(
      'spell-token-assignment'
    );
    expect(screen.getByLabelText(/^spell slots$/i)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(6);
    expect(screen.getAllByText(/^[0-1] \/ 5$/i)).toHaveLength(6);
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
    expect(moveableToken).toHaveAttribute('title', TOKEN_DEFINITIONS.red.description.en);
    expect(moveableToken).not.toHaveAttribute('tabindex');
    expect(committedToken).toHaveClass(
      'token-display--committed',
      'token-display--blue'
    );
    expect(within(screen.getByLabelText(/token bag drop zone/i)).getByText('Damage')).toBeInTheDocument();
    expect(within(screen.getByLabelText(/spell slot 1/i)).queryByText('Guard')).not.toBeInTheDocument();
    expect(screen.queryByText(/new reward token/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/discard/i)).not.toBeInTheDocument();

    fireEvent.click(moveableTokenButton);

    expect(onTokenBagTokenClick).not.toHaveBeenCalled();
  });

  test('renders the glowing reward token box, instruction, and Trash area only in reward mode', () => {
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
    const rewardTokenBox = screen.getByLabelText(/reward token box/i);

    expect(screen.queryByText(/^new reward token$/i)).not.toBeInTheDocument();
    expect(rewardTokenBox).toHaveClass('new-reward-token-box', 'needs-placement');
    expect(rewardTokenBox).not.toHaveClass('is-empty');
    expect(
      screen.getByText(
        'Place the token into your spells, token bag or discard it to continue'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reward red token/i })).toBeEnabled();
    expect(screen.getByText('Damage')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trash', level: 2 })).toBeInTheDocument();
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
    expect(within(screen.getByLabelText(/spell slot 3/i)).queryByText('Damage')).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/reward token box/i)).getByText(
        /placed in spell slot 3/i
      )
    ).toHaveClass('reward-token-status');
    expect(screen.getAllByRole('button', { name: /new reward red token/i })).toHaveLength(1);
    expect(screen.getByLabelText(/reward token box/i)).toHaveClass('is-empty');
    expect(screen.getByLabelText(/reward token box/i)).not.toHaveClass('needs-placement');
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
    expect(
      within(screen.getByLabelText(/reward token box/i)).getByText(/placed in token bag/i)
    ).toHaveClass('reward-token-status');
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
    expect(
      within(screen.getByLabelText(/reward token box/i)).getByText(
        /placed in discard area/i
      )
    ).toHaveClass('reward-token-status');
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
    expect(
      within(screen.getByLabelText(/reward token box/i)).getByText(/placed in token bag/i)
    ).toHaveClass('reward-token-status');
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

  test('puts each slot number above its drop zone and its token count in a paragraph below', () => {
    const spellSlots = createSpellSlots();

    spellSlots[0].tokens = [];

    render(
      <SpellTokenAssignment
        onTokenDrop={jest.fn()}
        spellSlots={spellSlots}
        tokenBag={[]}
      />
    );

    const firstSlot = screen.getByLabelText('Assignment column 1');

    expect(within(firstSlot).getByRole('heading', { name: '1', level: 4 })).toBeInTheDocument();
    expect(within(firstSlot).getByLabelText('Spell slot 1')).toBeInTheDocument();
    expect(within(firstSlot).getByText('0 / 5', { selector: 'p' })).toBeInTheDocument();
    expect(firstSlot).toHaveTextContent(/^1Drop tokens here0 \/ 5$/);
    expect(within(firstSlot).queryByText(/Slot 1:/)).not.toBeInTheDocument();
  });

  test('uses Japanese labels and statuses in reward assignment mode', () => {
    render(
      <SpellTokenAssignment
        isRewardTokenStagedForDiscard
        language="jp"
        mode="rewardAssignment"
        onTokenDrop={jest.fn()}
        rewardToken={{ committed: false, id: 'reward-token', type: 'red' }}
        spellSlots={createSpellSlots()}
        tokenBag={[]}
      />
    );

    const assignment = screen.getByLabelText(/reward token assignment/i);

    expect(assignment).toHaveClass('language-jp');
    expect(within(assignment).getAllByText('ここにトークンをドロップ')).toHaveLength(5);
    expect(within(assignment).getByText('トークンバッグ')).toBeInTheDocument();
    expect(within(assignment).getByText('使用可能なトークンがありません')).toBeInTheDocument();
    expect(within(assignment).queryByText('新しい報酬トークン')).not.toBeInTheDocument();
    expect(
      within(assignment).getByText(
        '続けるには、トークンを自分のスペルかトークンバッグに配置するか、破棄してください。'
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(/reward token box/i)).getByText('破棄エリアに配置')
    ).toHaveClass('reward-token-status');
    expect(within(assignment).getByRole('heading', { name: 'ゴミ箱' })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/discard token drop zone/i)).getByText('ダメージ')).toBeInTheDocument();
    expect(screen.getByLabelText('red token')).toHaveAttribute('title', 'ダメージ+10');
    expect(within(screen.getByLabelText(/spell slot 1/i)).queryByText('ガード')).not.toBeInTheDocument();
  });

  test('keeps empty-box transparency separate from readable centred status text', () => {
    const stylesheet = readFileSync(`${__dirname}/spells.css`, 'utf8');
    const emptyBoxRule = stylesheet.match(
      /\.new-reward-token-box\.is-empty\s*{([^}]*)}/s
    )?.[1];

    expect(emptyBoxRule).toMatch(/background:\s*rgba\(58, 32, 19, 0\.45\);/);
    expect(emptyBoxRule).toMatch(/border-color:\s*rgba\(245, 250, 0, 0\.45\);/);
    expect(emptyBoxRule).not.toMatch(/(?:^|\s)opacity:/);
    expect(stylesheet).toMatch(
      /\.reward-token-status\s*{[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*700;[^}]*text-align:\s*center;/s
    );
  });
});
