import { readFileSync } from 'fs';
import { render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import ActivePotionSection from './ActivePotionSection';

const activePotion = POTION_DEFINITIONS.find(
  ({ id }) => id === 'roll-choice'
);

describe('ActivePotionSection', () => {
  test('renders nothing without an active potion', () => {
    const { container } = render(
      <ActivePotionSection activePotion={null} title="Active Potion" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('centres one named potion with the translated title and no list markup', () => {
    const { container } = render(
      <ActivePotionSection
        activePotion={activePotion}
        language="jp"
        languageClassName="language-jp"
        title={'\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3'}
      />
    );

    const section = screen.getByRole('region', {
      name: '\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3',
    });
    expect(
      screen.getByRole('heading', {
        name: '\u767a\u52d5\u4e2d\u306e\u30dd\u30fc\u30b7\u30e7\u30f3',
      })
    ).toHaveClass('language-jp');
    expect(screen.getByRole('group', { name: /potion/i })).toHaveTextContent(
      activePotion.japaneseName
    );
    expect(section).toHaveClass('active-potion-section');
    expect(container.querySelector('ul, li')).toBeNull();
  });

  test('uses the required darker brown section and centred content styles', () => {
    const stylesheet = readFileSync(`${__dirname}/PotionList.css`, 'utf8');

    expect(stylesheet).toMatch(
      /\.active-potion-section\s*{[^}]*background:\s*#5a351f;/s
    );
    expect(stylesheet).toMatch(
      /\.active-potion-title\s*{[^}]*text-align:\s*center;/s
    );
    expect(stylesheet).toMatch(
      /\.active-potion-content\s*{[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*align-items:\s*center;/s
    );
  });

  test('uses yellow for all Active Potion text without changing its background', () => {
    const stylesheet = readFileSync(`${__dirname}/PotionList.css`, 'utf8');
    const sectionRule = stylesheet.match(
      /\.active-potion-section\s*\{([^}]*)\}/
    )?.[1];

    expect(sectionRule).toMatch(/background:\s*#5a351f/);
    expect(sectionRule).toMatch(/color:\s*#F5FA00/);
    expect(stylesheet).toMatch(
      /\.active-potion-section \.potion-icon-name,\s*\.active-potion-section \.potion-icon-tooltip\s*\{[^}]*color:\s*inherit;/s
    );
    expect(stylesheet).toMatch(
      /\.active-potion-section \.active-potion-chosen-roll\s*\{[^}]*color:\s*#F5FA00;/s
    );
  });

  test('overlays a Roll Choice value using the English font', () => {
    render(
      <ActivePotionSection
        activePotion={{ ...activePotion, chosenRoll: 4 }}
        title="Active Potion"
      />
    );

    const chosenRoll = screen.getByLabelText('Chosen roll 4');

    expect(chosenRoll).toHaveTextContent('4');
    expect(chosenRoll).toHaveClass('active-potion-chosen-roll', 'language-en');
    expect(chosenRoll.parentElement).toHaveClass('potion-icon-flask');
  });
});
