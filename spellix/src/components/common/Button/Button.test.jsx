import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import Button from './Button';

describe('Button', () => {
  test('defaults to the primary variant and forwards normal button props', () => {
    const handleClick = jest.fn();

    render(
      <Button aria-label="Primary action" className="existing-class" onClick={handleClick}>
        Continue
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Primary action' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass(
      'fantasy-button',
      'fantasy-button--primary',
      'existing-class'
    );

    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('supports secondary, disabled, and submit behavior', () => {
    const handleSubmit = jest.fn((event) => event.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <Button disabled variant="secondary">
          Disabled
        </Button>
        <Button type="submit" variant="secondary">
          Submit
        </Button>
      </form>
    );

    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Disabled' })).toHaveClass(
      'fantasy-button--secondary'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test('defines related primary and secondary styles with guarded hover and disabled states', () => {
    const stylesheet = readFileSync(`${__dirname}/Button.css`, 'utf8');

    expect(stylesheet).toMatch(/\.fantasy-button\s*{/);
    expect(stylesheet).toMatch(/\.fantasy-button--primary\s*{/);
    expect(stylesheet).toMatch(/\.fantasy-button--secondary\s*{/);
    expect(stylesheet).toMatch(/\.fantasy-button:not\(:disabled\):hover\s*{/);
    expect(stylesheet).toMatch(/\.fantasy-button:disabled\s*{/);
  });
});
