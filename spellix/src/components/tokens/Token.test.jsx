import { render, screen } from '@testing-library/react';
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

    const { container } = render(
      <div>
        {tokenTypes.map((tokenType) => (
          <Token key={tokenType} ariaLabel={`${tokenType} token`} tokenType={tokenType} />
        ))}
      </div>
    );

    tokenTypes.forEach((tokenType) => {
      expect(screen.getByLabelText(`${tokenType} token`)).toHaveClass(`token-display--${tokenType}`);
    });

    expect(container.querySelectorAll('.token-display')).toHaveLength(tokenTypes.length);
  });
});
