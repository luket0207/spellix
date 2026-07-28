import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import BattlePotionList from './BattlePotionList';

describe('BattlePotionList', () => {
  const potions = [
    POTION_DEFINITIONS.find(({ id }) => id === 'copy-and-paste'),
    POTION_DEFINITIONS.find(({ id }) => id === 'first-aid'),
    POTION_DEFINITIONS.find(({ id }) => id === 'roll-choice'),
    POTION_DEFINITIONS.find(({ id }) => id === 'bridge-builder'),
  ];

  test('shows only Battle and Both potions and reports their inventory indexes', () => {
    const onUsePotion = jest.fn();
    const { container } = render(
      <BattlePotionList onUsePotion={onUsePotion} potions={potions} />
    );

    const section = screen.getByRole('region', { name: 'Battle potions' });
    expect(within(section).getByText('First Aid')).toBeInTheDocument();
    expect(within(section).getByText('Roll Choice')).toBeInTheDocument();
    expect(within(section).queryByText('Copy and Paste')).not.toBeInTheDocument();
    expect(within(section).queryByText('Bridge Builder')).not.toBeInTheDocument();
    expect(within(section).getAllByRole('button', { name: 'Use' })).toHaveLength(
      2
    );
    expect(container.querySelector('ul, li')).toBeNull();

    fireEvent.click(
      within(section).getAllByRole('button', { name: 'Use' })[1]
    );
    expect(onUsePotion).toHaveBeenCalledWith(potions[2], 2);
  });

  test('disables every Use button and falls back to English language classes', () => {
    render(
      <BattlePotionList
        disabled
        language="invalid"
        onUsePotion={jest.fn()}
        potions={potions}
      />
    );

    screen.getAllByRole('button', { name: 'Use' }).forEach((button) => {
      expect(button).toBeDisabled();
      expect(button).toHaveClass('language-en');
    });
  });

  test('disables only potions rejected by their current battle state', () => {
    const onUsePotion = jest.fn();
    const charger = POTION_DEFINITIONS.find(({ id }) => id === 'charger');
    const firstAid = POTION_DEFINITIONS.find(({ id }) => id === 'first-aid');

    render(
      <BattlePotionList
        isPotionDisabled={(potion) => potion.id === 'charger'}
        onUsePotion={onUsePotion}
        potions={[charger, firstAid]}
      />
    );

    const section = screen.getByRole('region', { name: 'Battle potions' });
    const chargerCard = within(section)
      .getByText('Charger')
      .closest('.battle-potion-card');
    const firstAidCard = within(section)
      .getByText('First Aid')
      .closest('.battle-potion-card');

    expect(within(chargerCard).getByRole('button', { name: 'Use' })).toBeDisabled();
    expect(within(firstAidCard).getByRole('button', { name: 'Use' })).toBeEnabled();

    fireEvent.click(
      within(chargerCard).getByRole('button', { name: 'Use' })
    );
    expect(onUsePotion).not.toHaveBeenCalled();
  });

  test('renders the supplied empty state when there are no Battle-compatible potions', () => {
    render(
      <BattlePotionList
        emptyText="No Battle potions"
        onUsePotion={jest.fn()}
        potions={[potions[0], potions[3]]}
      />
    );

    const section = screen.getByRole('region', { name: 'Battle potions' });

    expect(within(section).getByText('No Battle potions')).toHaveClass(
      'battle-potions-empty-text',
      'language-en'
    );
    expect(section.querySelector('ul, li')).toBeNull();
  });

  test('keeps Spellbound and Triple Dice out of the Battle potion section', () => {
    render(
      <BattlePotionList
        emptyText="No Battle potions"
        onUsePotion={jest.fn()}
        potions={[
          POTION_DEFINITIONS.find(({ id }) => id === 'spellbound'),
          POTION_DEFINITIONS.find(({ id }) => id === 'triple-dice'),
        ]}
      />
    );

    const section = screen.getByRole('region', { name: 'Battle potions' });

    expect(within(section).getByText('No Battle potions')).toBeInTheDocument();
    expect(within(section).queryByText('Spellbound')).not.toBeInTheDocument();
    expect(within(section).queryByText('Triple Dice')).not.toBeInTheDocument();
  });

  test('keeps cards aligned and avoids list markup', () => {
    const componentSource = readFileSync(
      `${__dirname}/BattlePotionList.jsx`,
      'utf8'
    );
    const stylesheet = readFileSync(`${__dirname}/PotionUsage.css`, 'utf8');

    expect(componentSource).not.toMatch(/<(?:ul|li)\b/);
    expect(stylesheet).toMatch(
      /\.battle-potion-section\s*{[^}]*display:\s*flex;[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-potion-card\s*{[^}]*grid-template-rows:[^;]+;/s
    );
    expect(stylesheet).toMatch(
      /\.battle-potion-icon-row,\s*\.battle-potion-button-row\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;/s
    );
  });
});
