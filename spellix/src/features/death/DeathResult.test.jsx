import { readFileSync } from 'fs';
import { render, screen } from '@testing-library/react';
import DeathResult from './DeathResult';

describe('DeathResult', () => {
  test('shows duplicate removed tokens as separate div rows with icon-first copy', () => {
    render(
      <DeathResult
        removedTokens={[
          { columnNumber: 2, token: { id: 'green-1', type: 'green' } },
          { columnNumber: 2, token: { id: 'green-2', type: 'green' } },
          { columnNumber: 5, token: { id: 'light-blue-1', type: 'light-blue' } },
        ]}
      />
    );

    expect(screen.getAllByText('A Deflect token was removed from column 2.')).toHaveLength(2);
    expect(screen.getByText('A Freeze token was removed from column 5.')).toBeInTheDocument();
    const removedTokens = screen.getByLabelText('Removed tokens');

    expect(removedTokens.tagName).toBe('DIV');
    expect(screen.getAllByTestId('death-result-token-row')).toHaveLength(3);
    expect(screen.getAllByRole('img', { name: /removed token/i })).toHaveLength(3);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(removedTokens.querySelector('.token-display-name')).not.toBeInTheDocument();
  });

  test('explains when no removable tokens were available', () => {
    render(<DeathResult removedTokens={[]} />);

    expect(
      screen.getByText('No tokens were removed because only starting tokens remained.')
    ).toHaveClass('death-result-empty', 'language-en');
    expect(screen.queryByRole('list', { name: /removed tokens/i })).not.toBeInTheDocument();
  });

  test('supports Japanese mini game death results', () => {
    render(
      <DeathResult
        language="jp"
        removedTokens={[
          { columnNumber: 3, token: { id: 'black-1', type: 'black' } },
        ]}
      />
    );

    expect(screen.getByText('身代わりトークンが列3から取り除かれました。')).toHaveClass(
      'death-result-token-text',
      'language-jp'
    );
    expect(screen.getByLabelText('取り除かれたトークン').tagName).toBe('DIV');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('uses aligned flex rows and current yellow modal text styling', () => {
    const stylesheet = readFileSync(`${__dirname}/DeathResult.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.death-result-token-list\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*gap:\s*12px;/s
    );
    expect(stylesheet).toMatch(
      /\.death-result-token-row\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*gap:\s*12px;/s
    );
    expect(stylesheet).toMatch(
      /\.death-result-token-text,[\s\S]*\.death-result-empty\s*{[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*700;/s
    );
  });
});
