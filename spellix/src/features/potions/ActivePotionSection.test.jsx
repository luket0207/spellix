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
});
