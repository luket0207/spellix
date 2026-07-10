import { render, screen } from '@testing-library/react';
import HealthBar from './HealthBar';

describe('HealthBar', () => {
  test('renders the current and max health with a clamped percentage for variable max health', () => {
    const { container } = render(<HealthBar currentHealth={75} maxHealth={150} />);

    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('75 / 150')).toBeInTheDocument();
    expect(container.querySelector('.health-bar-fill')).toHaveStyle({ width: '50%' });
    expect(container.querySelector('.health-bar-fill')).toHaveClass('health-bar-fill--green');
  });

  test('uses the orange threshold at 20 percent health', () => {
    const { container } = render(<HealthBar currentHealth={20} maxHealth={100} />);

    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '20');
    expect(container.querySelector('.health-bar-fill')).toHaveStyle({ width: '20%' });
    expect(container.querySelector('.health-bar-fill')).toHaveClass('health-bar-fill--orange');
  });

  test('clamps health below zero and uses the red threshold at 10 percent or below', () => {
    const { container, rerender } = render(<HealthBar currentHealth={10} maxHealth={100} />);

    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '10');
    expect(container.querySelector('.health-bar-fill')).toHaveStyle({ width: '10%' });
    expect(container.querySelector('.health-bar-fill')).toHaveClass('health-bar-fill--red');

    rerender(<HealthBar currentHealth={-25} maxHealth={100} />);

    expect(screen.getByRole('meter', { name: /health bar/i })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    expect(container.querySelector('.health-bar-fill')).toHaveStyle({ width: '0%' });
  });
});
