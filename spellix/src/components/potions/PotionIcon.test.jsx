import { render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import PotionIcon from './PotionIcon';

describe('PotionIcon', () => {
  test('renders every potion with its flask, name, colour, and description', () => {
    render(
      <div>
        {POTION_DEFINITIONS.map((potion) => (
          <PotionIcon key={potion.id} potion={potion} />
        ))}
      </div>
    );

    POTION_DEFINITIONS.forEach((potion) => {
      const potionIcon = screen.getByRole('group', {
        name: `${potion.name} potion`,
      });

      expect(potionIcon).toHaveClass(
        'potion-icon',
        'potion-icon--glow',
        `potion-icon--${potion.colour}`
      );
      expect(potionIcon).toHaveAccessibleDescription(potion.description);
      expect(potionIcon).toHaveAttribute('tabindex', '0');
      expect(within(potionIcon).getByText(potion.name)).toBeInTheDocument();
      expect(within(potionIcon).getByRole('img', { hidden: true })).toHaveAttribute(
        'data-icon',
        'flask'
      );
      expect(within(potionIcon).getByRole('tooltip')).toHaveTextContent(
        potion.description
      );
    });
  });

  test('supports parent-managed focus for selectable potion displays', () => {
    render(<PotionIcon focusable={false} potion={POTION_DEFINITIONS[0]} />);

    expect(screen.getByRole('group', { name: /roll choice potion/i })).not.toHaveAttribute(
      'tabindex'
    );
  });
});
