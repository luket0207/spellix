import { render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
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
      expect(token).toHaveAttribute(
        'title',
        `${TOKEN_DEFINITIONS[tokenType].name.en}\n${TOKEN_DEFINITIONS[tokenType].description.en}`
      );
      expect(token).toHaveAccessibleDescription(TOKEN_DEFINITIONS[tokenType].description.en);
      expect(token).toHaveAttribute('tabindex', '0');
    });

    expect(screen.getAllByRole('img')).toHaveLength(tokenTypes.length);
  });

  test.each([
    ['red-yellow-outline', 'red', 'Plus 20 Damage'],
    ['blue-yellow-outline', 'blue', 'Plus 10 Guard'],
    [
      'orange-yellow-outline',
      'orange',
      'Plus 10 counter damage if attacked via this number',
    ],
    ['green-yellow-outline', 'green', 'Deflect 10 damage if attacked via this number'],
    ['light-green-yellow-outline', 'light-green', 'Plus 10 HP'],
  ])(
    'renders %s with the common %s fill and yellow outline',
    (tokenType, baseColour, description) => {
      render(<Token ariaLabel={`${tokenType} token`} tokenType={tokenType} />);

      const token = screen.getByLabelText(`${tokenType} token`);

      expect(token).toHaveClass(
        `token-display--${baseColour}`,
        'token-display--yellow-outline'
      );
      expect(token).toHaveAttribute(
        'title',
        `${TOKEN_DEFINITIONS[tokenType].name.en}\n${description}`
      );
      expect(token).toHaveAccessibleDescription(description);
    }
  );

  test('defines one smooth glow animation with matching loop endpoints', () => {
    const stylesheet = readFileSync(join(__dirname, 'token.css'), 'utf8');

    expect(stylesheet).toMatch(
      /\.token-display--glow::before\s*{[^}]*animation:\s*token-display-glow 1\.6s ease-in-out infinite;[^}]*will-change:\s*opacity, transform;/s
    );
    expect(stylesheet).toMatch(
      /@keyframes token-display-glow\s*{\s*0%,\s*100%\s*{[^}]*opacity:\s*0\.15;[^}]*transform:\s*scale\(0\.95\);/s
    );
  });

  test('keeps the yellow outline stable without resizing the token', () => {
    const stylesheet = readFileSync(join(__dirname, 'token.css'), 'utf8');
    const outlinedTokenRule = stylesheet.match(
      /\.token-display--yellow-outline\s*{([^}]*)}/s
    )?.[1];

    expect(outlinedTokenRule).toBeDefined();
    expect(outlinedTokenRule).toMatch(/border:\s*2px solid #f5fa00;/);
    expect(outlinedTokenRule).toMatch(/box-sizing:\s*border-box;/);
    expect(outlinedTokenRule).not.toMatch(/(?:height|width):/);

    expect(stylesheet).toMatch(
      /\.token-display--yellow-outline\s*{[^}]*border:\s*2px solid #f5fa00;/s
    );
  });

  test('shows outlined token names with the selected language font class', () => {
    const { rerender } = render(
      <Token
        ariaLabel="outlined token"
        language="en"
        showName
        tokenType="red-yellow-outline"
      />
    );

    expect(screen.getByText('Shiny Damage')).toHaveClass('language-en');

    rerender(
      <Token
        ariaLabel="outlined token"
        language="jp"
        showName
        tokenType="red-yellow-outline"
      />
    );

    expect(screen.getByText('\u8f1d\u304f\u30c0\u30e1\u30fc\u30b8')).toHaveClass(
      'language-jp'
    );
    expect(screen.getByLabelText('outlined token')).toHaveAttribute(
      'title',
      '\u8f1d\u304f\u30c0\u30e1\u30fc\u30b8\n\u30c0\u30e1\u30fc\u30b8\uff0b20'
    );
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

  test('conditionally shows a localized name and tooltip with an English fallback', () => {
    const { rerender } = render(
      <Token ariaLabel="red token" language="jp" showName tokenType="red" />
    );

    expect(screen.getByText('\u30c0\u30e1\u30fc\u30b8')).toHaveClass(
      'token-display-name',
      'language-jp'
    );
    expect(screen.getByLabelText('red token')).toHaveAttribute(
      'title',
      '\u30c0\u30e1\u30fc\u30b8\n\u30c0\u30e1\u30fc\u30b8\uff0b10'
    );
    expect(screen.getByLabelText('red token')).toHaveAccessibleDescription(
      '\u30c0\u30e1\u30fc\u30b8\uff0b10'
    );

    rerender(<Token ariaLabel="red token" language="invalid" tokenType="red" />);

    expect(screen.queryByText('\u30c0\u30e1\u30fc\u30b8')).not.toBeInTheDocument();
    expect(screen.queryByText('Damage')).not.toBeInTheDocument();
    expect(screen.getByLabelText('red token')).toHaveAttribute(
      'title',
      'Damage\nPlus 10 Damage'
    );
  });

  test('can suppress its tooltip without removing an allowed resting name', () => {
    render(
      <Token
        ariaLabel="red token"
        showName
        showTooltip={false}
        tokenType="red"
      />
    );

    const token = screen.getByLabelText('red token');

    expect(screen.getByText('Damage')).toBeInTheDocument();
    expect(token).not.toHaveAttribute('title');
    expect(token).not.toHaveAttribute('aria-describedby');
    expect(token).not.toHaveAttribute('tabindex');
  });

});
