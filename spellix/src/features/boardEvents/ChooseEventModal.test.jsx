import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ChooseEventModal from './ChooseEventModal';

test.each([
  [
    'field',
    [
      'Nothing',
      'Level 1 Battle',
      'Decision',
      'Hazard',
      'Loot Chest',
      'Roll Again',
    ],
  ],
  [
    'stream',
    [
      'Nothing',
      'Level 1 Battle',
      'River Mini Game',
      'Hazard',
      'Loot Chest',
    ],
  ],
  ['river', ['River Mini Game', 'Hazard', 'Loot Chest']],
  [
    'woods',
    [
      'Level 1 Battle',
      'Level 2 Battle',
      'Decision',
      'Hazard',
      'Loot Chest',
    ],
  ],
  [
    'mountains',
    [
      'Level 2 Battle',
      'Level 3 Battle',
      'Cave Mini Game',
      'Hazard',
      'Loot Chest',
    ],
  ],
])('shows only non-zero %s events', (environment, expectedLabels) => {
  render(
    <ChooseEventModal
      environment={environment}
      isOpen
      language="en"
    />
  );

  const dialog = screen.getByRole('dialog', { name: 'Choose Event' });
  const buttons = within(dialog).getAllByRole('button');

  expect(
    buttons.map((button) => button.textContent)
  ).toEqual(expectedLabels);
  expect(within(dialog).queryByRole('list')).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();
});

test('renders exact Japanese labels and delegates the selected event type', () => {
  const onChoose = jest.fn();

  render(
    <ChooseEventModal
      environment="field"
      isOpen
      language="jp"
      onChoose={onChoose}
    />
  );

  const dialog = screen.getByRole('dialog', {
    name: '\u30a4\u30d9\u30f3\u30c8\u3092\u9078\u629e',
  });
  const title = within(dialog).getByText(
    '\u30a4\u30d9\u30f3\u30c8\u3092\u9078\u629e'
  );
  const battleButton = within(dialog).getByRole('button', {
    name: '\u30ec\u30d9\u30eb1\u30d0\u30c8\u30eb',
  });

  expect(title).toHaveClass('choose-event-title', 'larger-text', 'language-jp');
  expect(battleButton).toHaveClass('choose-event-button', 'language-jp');

  fireEvent.click(battleButton);

  expect(onChoose).toHaveBeenCalledTimes(1);
  expect(onChoose).toHaveBeenCalledWith('level1Battle');
});

test('hides excluded battle events while keeping non-battle choices', () => {
  render(
    <ChooseEventModal
      environment="woods"
      excludedEventTypes={[
        'level1Battle',
        'level2Battle',
        'level3Battle',
      ]}
      isOpen
      language="en"
    />
  );

  const dialog = screen.getByRole('dialog', { name: 'Choose Event' });

  expect(within(dialog).queryByRole('button', { name: /battle/i })).not.toBeInTheDocument();
  expect(
    within(dialog).getAllByRole('button').map((button) => button.textContent)
  ).toEqual(['Decision', 'Hazard', 'Loot Chest']);
});

test.each([
  ['mountains', 'level2Battle', '\u30ec\u30d9\u30eb2\u30d0\u30c8\u30eb'],
  ['forest', 'level3Battle', '\u30ec\u30d9\u30eb3\u30d0\u30c8\u30eb'],
  ['river', 'riverMiniGame', '\u5ddd\u306e\u30df\u30cb\u30b2\u30fc\u30e0'],
  ['hills', 'caveMiniGame', '\u6d1e\u7a9f\u306e\u30df\u30cb\u30b2\u30fc\u30e0'],
])(
  'renders and delegates the remaining Japanese %s event label',
  (environment, eventType, eventLabel) => {
    const onChoose = jest.fn();

    render(
      <ChooseEventModal
        environment={environment}
        isOpen
        language="jp"
        onChoose={onChoose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: eventLabel }));

    expect(onChoose).toHaveBeenCalledWith(eventType);
  }
);

test('uses the required two-column button grid and English fallback', () => {
  render(
    <ChooseEventModal
      environment="river"
      isOpen
      language="unsupported"
    />
  );

  expect(screen.getByText('Choose Event')).toHaveClass(
    'larger-text',
    'language-en'
  );

  const stylesheet = readFileSync(`${__dirname}/ChooseEventModal.css`, 'utf8');

  expect(stylesheet).toMatch(
    /\.choose-event-button-grid\s*{[^}]*display:\s*grid;[^}]*gap:\s*16px;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*width:\s*100%;/s
  );
});
