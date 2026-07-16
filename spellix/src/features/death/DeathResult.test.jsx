import { render, screen } from '@testing-library/react';
import DeathResult from './DeathResult';

describe('DeathResult', () => {
  test('lists duplicate removed tokens separately with user-facing columns', () => {
    render(
      <DeathResult
        removedTokens={[
          { columnNumber: 2, token: { id: 'green-1', type: 'green' } },
          { columnNumber: 2, token: { id: 'green-2', type: 'green' } },
          { columnNumber: 5, token: { id: 'light-blue-1', type: 'light-blue' } },
        ]}
      />
    );

    expect(screen.getAllByText('A Green token was removed from column 2.')).toHaveLength(2);
    expect(screen.getByText('A Light Blue token was removed from column 5.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /removed tokens/i })).toBeInTheDocument();
  });

  test('explains when no removable tokens were available', () => {
    render(<DeathResult removedTokens={[]} />);

    expect(
      screen.getByText('No tokens were removed because only starting tokens remained.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /removed tokens/i })).not.toBeInTheDocument();
  });
});
