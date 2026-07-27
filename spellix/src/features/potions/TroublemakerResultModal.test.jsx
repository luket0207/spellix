import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createPlayers } from '../gameSetup/gameSetup';
import TroublemakerResultModal from './TroublemakerResultModal';

describe('TroublemakerResultModal', () => {
  test('shows the losing player, exact English message, lost token, and Continue action', () => {
    const onContinue = jest.fn();
    const player = createPlayers(2)[1];

    render(
      <TroublemakerResultModal
        isOpen
        language="en"
        onContinue={onContinue}
        player={player}
        removedTokens={[
          { columnNumber: 2, token: { id: 'black-1', type: 'black' } },
        ]}
      />
    );

    const modal = screen.getByRole('dialog', {
      name: 'Troublemaker token loss',
    });

    expect(
      within(modal).getByRole('img', { name: 'Player 2 piece' })
    ).toBeInTheDocument();
    expect(within(modal).getByText('You lost this token')).toHaveClass(
      'larger-text',
      'language-en'
    );
    expect(
      within(modal).getByRole('img', { name: 'Black lost token' })
    ).toBeInTheDocument();
    expect(within(modal).queryByRole('list')).not.toBeInTheDocument();
    expect(within(modal).queryByRole('listitem')).not.toBeInTheDocument();

    fireEvent.click(
      within(modal).getByRole('button', { name: 'Continue' })
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test('uses Japanese copy and safely explains when no token can be lost', () => {
    const player = createPlayers(2)[0];
    player.language = 'jp';

    const { rerender } = render(
      <TroublemakerResultModal
        isOpen
        language="jp"
        onContinue={() => {}}
        player={player}
        removedTokens={[
          { columnNumber: 1, token: { id: 'green-1', type: 'green' } },
        ]}
      />
    );

    expect(screen.getByText('このトークンを失いました。')).toHaveClass(
      'larger-text',
      'language-jp'
    );
    expect(
      screen.getByRole('button', { name: '続ける' })
    ).toHaveClass('language-jp');

    rerender(
      <TroublemakerResultModal
        isOpen
        language="jp"
        onContinue={() => {}}
        player={player}
        removedTokens={[]}
      />
    );

    expect(
      screen.getByText('失うことのできるトークンはありませんでした。')
    ).toHaveClass('troublemaker-result-empty', 'language-jp');
    expect(
      screen.queryByRole('img', { name: /lost token/i })
    ).not.toBeInTheDocument();
  });

  test('centres the player image and result content in the wooden modal', () => {
    const stylesheet = readFileSync(
      `${__dirname}/TroublemakerResultModal.css`,
      'utf8'
    );

    expect(stylesheet).toMatch(
      /\.troublemaker-result-content\s*{[^}]*align-items:\s*center;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s
    );
    expect(stylesheet).toMatch(
      /\.troublemaker-result-player-image\s*{[^}]*display:\s*block;[^}]*margin:\s*0 auto;/s
    );
    expect(stylesheet).toMatch(
      /\.troublemaker-result-message,[\s\S]*\.troublemaker-result-empty\s*{[^}]*color:\s*#F5FA00;[^}]*text-align:\s*center;/s
    );
  });
});
