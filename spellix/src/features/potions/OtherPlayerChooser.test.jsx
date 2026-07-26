import { fireEvent, render, screen, within } from '@testing-library/react';
import { createPlayers } from '../gameSetup/gameSetup';
import OtherPlayerChooser from './OtherPlayerChooser';

describe('OtherPlayerChooser', () => {
  test('shows only other players with their images and Choose controls', () => {
    const players = createPlayers(3);
    const onChoosePlayer = jest.fn();

    render(
      <OtherPlayerChooser
        currentPlayerId="player-1"
        isOpen
        language="en"
        onChoosePlayer={onChoosePlayer}
        players={players}
      />
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Choose a player to target',
    });
    const prompt = within(dialog).getByText('Choose a player to target');
    const playerTwo = within(dialog).getByRole('group', {
      name: 'Player 2 option',
    });
    const playerThree = within(dialog).getByRole('group', {
      name: 'Player 3 option',
    });

    expect(prompt).toHaveClass('larger-text', 'language-en');
    expect(within(dialog).queryByRole('group', {
      name: 'Player 1 option',
    })).not.toBeInTheDocument();
    expect(within(playerTwo).getByRole('img', {
      name: 'Player 2 piece',
    })).toHaveAttribute('src', expect.stringContaining('m-blue.png'));
    expect(within(playerThree).getByRole('img', {
      name: 'Player 3 piece',
    })).toHaveAttribute('src', expect.stringContaining('m-green.png'));
    expect(within(dialog).getAllByRole('button', { name: 'Choose' })).toHaveLength(2);
    expect(dialog.querySelector('ul, li')).toBeNull();

    fireEvent.click(within(playerThree).getByRole('button', { name: 'Choose' }));

    expect(onChoosePlayer).toHaveBeenCalledWith(players[2]);
  });

  test('uses the exact Japanese prompt, action, and language class', () => {
    render(
      <OtherPlayerChooser
        currentPlayerId="player-1"
        isOpen
        language="jp"
        onChoosePlayer={jest.fn()}
        players={createPlayers(2)}
      />
    );

    const prompt = screen.getByText(
      '\u5bfe\u8c61\u306b\u3059\u308b\u30d7\u30ec\u30a4\u30e4\u30fc\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002'
    );

    expect(prompt).toHaveClass('larger-text', 'language-jp');
    expect(screen.getByRole('button', {
      name: '\u9078\u3076',
    })).toHaveClass('language-jp');
  });
});
