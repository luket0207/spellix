import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import PotionList from './PotionList';

describe('PotionList', () => {
  test('keeps the styled area visible with zero capacity when the player owns no potions', () => {
    render(<PotionList potions={[]} />);

    const potionSection = screen.getByRole('region', { name: /potions/i });

    expect(potionSection).toHaveClass('potions-area');
    expect(within(potionSection).getByRole('heading', { name: 'Potions' })).toBeInTheDocument();
    expect(within(potionSection).getByText('0/3')).toHaveClass('potions-capacity');
    expect(within(potionSection).queryByRole('group')).not.toBeInTheDocument();
    expect(within(potionSection).queryByRole('list')).not.toBeInTheDocument();
  });

  test.each([1, 2, 3])('shows %i/3 for the current potion count', (potionCount) => {
    render(<PotionList potions={POTION_DEFINITIONS.slice(0, potionCount)} />);

    expect(screen.getByText(`${potionCount}/3`)).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /potion/i })).toHaveLength(potionCount);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('updates capacity and slots when potions are gained or removed', () => {
    const { rerender } = render(<PotionList potions={[]} />);

    rerender(<PotionList potions={POTION_DEFINITIONS.slice(0, 3)} />);

    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /potion/i })).toHaveLength(3);

    rerender(<PotionList potions={POTION_DEFINITIONS.slice(0, 1)} />);

    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /potion/i })).toHaveLength(1);
  });

  test('shows each potion icon and name without rarity or availability metadata', () => {
    render(
      <PotionList
        potions={[
          POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
          POTION_DEFINITIONS.find(({ id }) => id === 'ice-beam'),
        ]}
      />
    );

    const potionSection = screen.getByRole('region', { name: /potions/i });

    expect(within(potionSection).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(potionSection).getByText('Ice Beam')).toBeInTheDocument();
    expect(within(potionSection).queryByText(/common|rare|battle|board|both/i)).not.toBeInTheDocument();
    expect(
      within(potionSection).getByRole('group', { name: /roll choice potion/i })
    ).toHaveClass('potion-icon--blue');
    expect(
      within(potionSection).getByRole('group', { name: /ice beam potion/i })
    ).toHaveClass('potion-icon--light-blue');
    expect(within(potionSection).queryByRole('button')).not.toBeInTheDocument();
  });

  test('passes the active language to every shared potion icon', () => {
    render(
      <PotionList
        language="jp"
        potions={[
          POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
          POTION_DEFINITIONS.find(({ id }) => id === 'ice-beam'),
        ]}
      />
    );

    expect(screen.getByRole('group', { name: '出目選択 potion' })).toHaveAccessibleDescription(
      '次に振るサイコロの出目を選ぶ。'
    );
    expect(screen.getByRole('group', { name: 'アイスビーム potion' })).toHaveAccessibleDescription(
      '対戦相手を凍結させる。'
    );
  });

  test('supports a translated gameplay title and language font class', () => {
    render(<PotionList languageClassName="language-jp" potions={[]} title="ポーション" />);

    const potionSection = screen.getByRole('region', { name: 'ポーション' });

    expect(within(potionSection).getByRole('heading', { name: 'ポーション' })).toHaveClass(
      'language-jp'
    );
    expect(within(potionSection).getByText('0/3')).toBeInTheDocument();
  });

  test('shows aligned Use controls only for Board and Both potions', () => {
    const onUsePotion = jest.fn();
    const potions = [
      POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
      POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
      POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
      POTION_DEFINITIONS.find(({ id }) => id === 'bridge-builder'),
    ];

    const { container } = render(
      <PotionList
        context="board"
        onUsePotion={onUsePotion}
        potions={potions}
        useText="Use"
      />
    );

    const slots = container.querySelectorAll('.potion-slot');

    expect(slots).toHaveLength(4);
    expect(container.querySelectorAll('.potion-use-button-space')).toHaveLength(4);
    expect(within(slots[0]).getByRole('button', { name: 'Use' })).toBeInTheDocument();
    expect(within(slots[1]).queryByRole('button')).not.toBeInTheDocument();
    expect(within(slots[2]).getByRole('button', { name: 'Use' })).toBeInTheDocument();
    expect(within(slots[3]).queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('ul, li')).toBeNull();

    fireEvent.click(within(slots[2]).getByRole('button', { name: 'Use' }));
    expect(onUsePotion).toHaveBeenCalledWith(potions[2], 2);
  });

  test('keeps every eligible Use button visible but disabled when usage is locked', () => {
    render(
      <PotionList
        context="board"
        disabled
        onUsePotion={jest.fn()}
        potions={[
          POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
          POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
        ]}
      />
    );

    screen.getAllByRole('button', { name: 'Use' }).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  test('mirrors the committed spell display styling without scrollbars', () => {
    const componentSource = readFileSync(`${__dirname}/PotionList.jsx`, 'utf8');
    const stylesheet = readFileSync(`${__dirname}/PotionList.css`, 'utf8');
    const committedSpellStylesheet = readFileSync(
      `${__dirname}/../../components/spells/committedSpellSlotList.css`,
      'utf8'
    );

    expect(componentSource).toMatch(/<div className="potions-list">/);
    expect(componentSource).toMatch(/<div className="potion-slot"/);
    expect(componentSource).not.toMatch(/<(?:ul|li)\b/);
    expect(componentSource).not.toMatch(/<p\b/);
    expect(committedSpellStylesheet).toMatch(
      /\.committed-spell-slot-display\s*{[^}]*border:\s*2px solid #4a3520;/s
    );
    expect(stylesheet).toMatch(/\.potions-area\s*{[^}]*gap:\s*8px;/s);
    expect(stylesheet).toMatch(/\.potions-area\s*{[^}]*border:\s*2px solid #4a3520;/s);
    expect(stylesheet).toMatch(/\.potions-area\s*{[^}]*border-radius:\s*10px;/s);
    expect(stylesheet).toMatch(
      /\.potions-area\s*{[^}]*linear-gradient\(180deg, rgba\(255, 247, 223, 0\.95\), rgba\(230, 212, 170, 0\.95\)\)/s
    );
    expect(stylesheet).toMatch(
      /\.potions-area\s*{[^}]*inset 0 0 0 1px rgba\(171, 132, 68, 0\.5\),[^}]*0 3px 8px rgba\(0, 0, 0, 0\.18\);/s
    );
    expect(stylesheet).toMatch(/\.potions-area\s*{[^}]*color:\s*#2d1f12;/s);
    expect(stylesheet).toMatch(
      /\.potions-area-header h2\s*{[^}]*font-weight:\s*700;[^}]*letter-spacing:\s*0\.04em;/s
    );
    expect(stylesheet).toMatch(
      /\.potions-list\s*{[^}]*display:\s*flex;[^}]*align-items:\s*stretch;/s
    );
    expect(stylesheet).toMatch(
      /\.potion-slot\s*{[^}]*width:\s*86px;[^}]*min-width:\s*86px;[^}]*flex:\s*0 0 86px;/s
    );
    expect(stylesheet).toMatch(/\.potion-slot\s*{[^}]*border:\s*1px solid #715231;/s);
    expect(stylesheet).toMatch(/\.potion-slot\s*{[^}]*border-radius:\s*8px;/s);
    expect(stylesheet).toMatch(
      /\.potion-slot\s*{[^}]*linear-gradient\(180deg, rgba\(92, 63, 35, 0\.1\), rgba\(255, 255, 255, 0\.12\)\),[^}]*rgba\(255, 248, 229, 0\.7\);/s
    );
    expect(stylesheet).toMatch(
      /\.potion-use-button-space\s*{[^}]*min-height:[^;]+;[^}]*display:\s*flex;/s
    );
    expect(stylesheet).not.toMatch(/\.potion-slot p\s*{/);
    expect(stylesheet).not.toMatch(/overflow(?:-x|-y)?:\s*(?:auto|scroll);/);
  });
});
