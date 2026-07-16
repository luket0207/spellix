import { render, screen } from '@testing-library/react';
import { TOKEN_DEFINITIONS } from '../../data/tokens';
import Token from './Token';

describe('Token', () => {
  test('shows a centered count only when more than one token is represented', () => {
    const { rerender } = render(<Token ariaLabel="2 red tokens" count={2} tokenType="red" />);

    expect(screen.getByLabelText(/2 red tokens/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    rerender(<Token ariaLabel="single purple token" count={1} tokenType="purple" />);

    expect(screen.getByLabelText(/single purple token/i)).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  test('supports all current token colour variants', () => {
    const tokenTypes = [
      'red',
      'blue',
      'orange',
      'green',
      'light-blue',
      'light-green',
      'black',
      'white',
      'purple',
      'yellow',
      'grey',
    ];

    render(
      <div>
        {tokenTypes.map((tokenType) => (
          <Token key={tokenType} ariaLabel={`${tokenType} token`} tokenType={tokenType} />
        ))}
      </div>
    );

    tokenTypes.forEach((tokenType) => {
      const token = screen.getByLabelText(`${tokenType} token`);

      expect(token).toHaveClass('token-display--glow');
      expect(token).toHaveClass(`token-display--${tokenType}`);
      expect(token).toHaveAttribute('title', TOKEN_DEFINITIONS[tokenType].description);
      expect(token).toHaveAccessibleDescription(TOKEN_DEFINITIONS[tokenType].description);
      expect(token).toHaveAttribute('tabindex', '0');
    });

    expect(screen.getAllByRole('img')).toHaveLength(tokenTypes.length);
  });

  test('supports an optional faded state at half opacity', () => {
    const { rerender } = render(
      <Token ariaLabel="yellow token" faded tokenType="yellow" />
    );

    expect(screen.getByLabelText(/yellow token/i)).toHaveClass('token-display--faded');
    expect(screen.getByLabelText(/yellow token/i)).toHaveStyle({ opacity: '0.5' });

    rerender(<Token ariaLabel="yellow token" tokenType="yellow" />);
    expect(screen.getByLabelText(/yellow token/i)).not.toHaveClass('token-display--faded');
  });

  test('supports committed styling and parent-managed keyboard focus', () => {
    render(
      <Token
        ariaLabel="committed blue token"
        committed
        focusable={false}
        tokenType="blue"
      />
    );

    const token = screen.getByLabelText(/committed blue token/i);

    expect(token).toHaveClass('token-display--committed');
    expect(token).not.toHaveAttribute('tabindex');
  });

});
