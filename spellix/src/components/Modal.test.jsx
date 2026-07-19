import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import Modal from './Modal';

describe('Modal variants', () => {
  test('renders normal modals with the default fantasy variant and existing props', () => {
    render(
      <Modal
        actions={<button type="button">Confirm</button>}
        ariaLabel="Normal modal"
        isOpen
        panelClassName="custom-panel"
      >
        <p>Normal content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: 'Normal modal' });

    expect(dialog).toHaveClass('modal-panel', 'modal-panel--default', 'custom-panel');
    expect(
      within(screen.getByTestId('modal-body')).getByText('Normal content')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('modal-actions')).getByRole('button', {
        name: 'Confirm',
      })
    ).toBeInTheDocument();
  });

  test('groups multiple normal modal actions in the shared action row', () => {
    const handlers = [jest.fn(), jest.fn(), jest.fn()];

    render(
      <Modal
        actions={
          <>
            <button type="button" onClick={handlers[0]}>One</button>
            <button type="button" onClick={handlers[1]}>Two</button>
            <button type="button" onClick={handlers[2]}>Three</button>
          </>
        }
        ariaLabel="Multiple actions"
        isOpen
      />
    );

    const buttons = within(screen.getByTestId('modal-actions')).getAllByRole('button');

    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => fireEvent.click(button));
    handlers.forEach((handler) => expect(handler).toHaveBeenCalledTimes(1));
  });

  test('keeps the dice modal on its isolated legacy variant', () => {
    render(
      <Modal
        actions={<button type="button">Dice action</button>}
        ariaLabel="Dice result"
        isOpen
        variant="dice"
      >
        <p>Dice content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog', { name: 'Dice result' })).toHaveClass(
      'modal-panel--dice'
    );
    expect(screen.getByRole('dialog', { name: 'Dice result' })).not.toHaveClass(
      'modal-panel--default'
    );
    expect(screen.queryByTestId('modal-actions')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dice action' })).toBeInTheDocument();
  });

  test('defines the fantasy default and unchanged dice CSS contracts', () => {
    const stylesheet = readFileSync(`${__dirname}/Modal.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.modal-panel--default\s*{[^}]*background-image:\s*url\('\.\.\/images\/misc\/modalBackground\.png'\);[^}]*background-position:\s*center;[^}]*background-repeat:\s*no-repeat;[^}]*background-size:\s*100% 100%;[^}]*border:\s*0;[^}]*color:\s*#F5FA00;[^}]*font-weight:\s*700;[^}]*padding:\s*50px;[^}]*min-height:\s*min\(400px,\s*calc\(100vh - 32px\)\);[^}]*min-width:\s*min\(600px,\s*calc\(100vw - 32px\)\);/s
    );
    expect(stylesheet).toMatch(
      /\.modal-panel--dice\s*{[^}]*background:\s*#ffffffAA;[^}]*border-radius:\s*20px;[^}]*padding:\s*50px;[^}]*width:\s*min\(220px,\s*calc\(100vw - 32px\)\);[^}]*height:\s*min\(220px,\s*calc\(100vw - 32px\)\);[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.modal-actions\s*{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*gap:\s*16px;[^}]*flex-wrap:\s*wrap;/s
    );
    expect(stylesheet).toMatch(
      /\.modal-panel--default\s*{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s
    );
    expect(stylesheet).toMatch(/\.modal-body\s*{[^}]*flex:\s*1;/s);
    expect(stylesheet).toMatch(/\.modal-actions\s*{[^}]*margin-top:\s*auto;/s);
  });

  test('marks only the gameplay dice result modal with the dice variant', () => {
    const gameplaySource = readFileSync(
      `${__dirname}/../pages/GameplayPage.jsx`,
      'utf8'
    );

    expect(gameplaySource.match(/<Modal[\s>]/g)).toHaveLength(5);
    expect(gameplaySource.match(/variant="dice"/g)).toHaveLength(1);
    expect(gameplaySource).toMatch(
      /<Modal\s+ariaLabel="Dice result"\s+isOpen={showDiceModal}\s+variant="dice"\s*>/s
    );
  });

  test('uses larger text only for current text-only modal paragraphs', () => {
    const gameplaySource = readFileSync(
      `${__dirname}/../pages/GameplayPage.jsx`,
      'utf8'
    );
    const appSource = readFileSync(`${__dirname}/../App.jsx`, 'utf8');
    const battleSource = readFileSync(
      `${__dirname}/../pages/BattlePage.jsx`,
      'utf8'
    );
    const debugSource = readFileSync(
      `${__dirname}/../features/debug/DebugModal.jsx`,
      'utf8'
    );
    const spellsSource = readFileSync(
      `${__dirname}/../features/spells/SpellsModal.jsx`,
      'utf8'
    );
    const appStylesheet = readFileSync(`${__dirname}/../App.css`, 'utf8');

    expect(gameplaySource.match(/larger-text/g)).toHaveLength(3);
    expect(gameplaySource).toMatch(
      /<p className=\{`larger-text \$\{languageClassName\}`\}>\{spellAssignmentTranslations\.cancelConfirmation\}<\/p>/
    );
    expect(gameplaySource).toMatch(
      /<p className=\{`larger-text \$\{languageClassName\}`\}>\{spellAssignmentTranslations\.saveConfirmation\}<\/p>/
    );
    expect(gameplaySource).toMatch(
      /<p className={`larger-text \${languageClassName}`}>\s*{miniGameReturnNotice\?\.type/s
    );
    [appSource, battleSource, debugSource, spellsSource].forEach((source) => {
      expect(source).not.toContain('larger-text');
    });
    expect(appStylesheet).toMatch(
      /\.larger-text\s*{[^}]*font-size:\s*2em;/s
    );
  });
});
