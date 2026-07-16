import { render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import PotionList from './PotionList';

describe('PotionList', () => {
  test('shows a simple empty state when the player owns no potions', () => {
    render(<PotionList potions={[]} />);

    const potionSection = screen.getByRole('region', { name: /potions/i });

    expect(within(potionSection).getByText('No potions')).toBeInTheDocument();
    expect(within(potionSection).queryByRole('list')).not.toBeInTheDocument();
  });

  test('shows each potion name, rarity, and availability without use controls', () => {
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
    expect(within(potionSection).getByText('Rare | Both')).toBeInTheDocument();
    expect(within(potionSection).getByText('Ice Beam')).toBeInTheDocument();
    expect(within(potionSection).getByText('Common | Battle')).toBeInTheDocument();
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
    expect(within(potionSection).getByText('No potions')).not.toHaveClass('language-jp');
  });
});
