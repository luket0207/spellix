import { readFileSync } from 'fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import { getCaveMiniGameTranslations } from '../../i18n/translations';
import CaveRewardChoiceModal from './CaveRewardChoiceModal';

const onDiscard = jest.fn();
const onReplace = jest.fn();
const componentSource = readFileSync(`${__dirname}/CaveRewardChoiceModal.jsx`, 'utf8');
const stylesheet = readFileSync(`${__dirname}/CaveMiniGame.css`, 'utf8');

beforeEach(() => {
  onDiscard.mockClear();
  onReplace.mockClear();
});

test('shows an English full-token choice with the new and existing token icons', () => {
  const translations = getCaveMiniGameTranslations('en');
  const player = {
    tokenBag: [
      { id: 'bag-blue', type: 'blue' },
      { id: 'bag-red', type: 'red' },
    ],
  };

  render(
    <CaveRewardChoiceModal
      language="en"
      onDiscard={onDiscard}
      onReplace={onReplace}
      pendingReward={{ item: { id: 'new-red', type: 'red' }, type: 'token' }}
      player={player}
    />
  );

  const dialog = screen.getByRole('dialog', {
    name: translations.rewardGrant.tokenBagFull,
  });
  expect(dialog).toHaveClass('language-en');
  expect(dialog).not.toHaveClass('larger-text');
  expect(within(dialog).getByRole('img', { name: /new damage token/i })).toBeInTheDocument();
  expect(within(dialog).getAllByRole('img', { name: /existing .* token/i })).toHaveLength(2);
  const tokenOptions = within(dialog).getByRole('group', {
    name: translations.rewardGrant.currentTokens,
  });
  expect(tokenOptions.tagName).toBe('DIV');
  expect(tokenOptions).toHaveClass('cave-reward-replacement-options');
  expect(within(tokenOptions).queryByRole('list')).not.toBeInTheDocument();
  expect(within(tokenOptions).queryAllByRole('listitem')).toHaveLength(0);
  expect(componentSource).not.toMatch(/<(?:ul|li)\b/);
  expect(stylesheet).toMatch(
    /\.cave-reward-replacement-options\s*\{[^}]*display:\s*(?:grid|flex);/s
  );

  fireEvent.click(
    within(dialog).getByRole('button', { name: translations.rewardGrant.replaceToken('Guard') })
  );
  expect(onReplace).toHaveBeenCalledWith('bag-blue');

  fireEvent.click(
    within(dialog).getByRole('button', { name: translations.rewardGrant.discardNewToken })
  );
  expect(onDiscard).toHaveBeenCalledTimes(1);
});

test('shows a Japanese full-potion choice with localized PotionIcon content', () => {
  const translations = getCaveMiniGameTranslations('jp');
  const currentPotion = POTION_DEFINITIONS[0];
  const newPotion = POTION_DEFINITIONS[1];

  render(
    <CaveRewardChoiceModal
      language="jp"
      onDiscard={onDiscard}
      onReplace={onReplace}
      pendingReward={{ item: newPotion, type: 'potion' }}
      player={{ potions: [currentPotion] }}
    />
  );

  const dialog = screen.getByRole('dialog', {
    name: translations.rewardGrant.potionSlotsFull,
  });
  expect(dialog).toHaveClass('language-jp');
  expect(dialog).not.toHaveClass('larger-text');
  expect(within(dialog).getByRole('group', { name: `${newPotion.japaneseName} potion` })).toBeInTheDocument();
  const potionOptions = within(dialog).getByRole('group', {
    name: translations.rewardGrant.currentPotions,
  });
  expect(potionOptions.tagName).toBe('DIV');
  expect(potionOptions).toHaveClass('cave-reward-replacement-options');
  expect(within(potionOptions).queryByRole('list')).not.toBeInTheDocument();
  expect(within(potionOptions).queryAllByRole('listitem')).toHaveLength(0);

  fireEvent.click(
    within(dialog).getByRole('button', {
      name: translations.rewardGrant.replacePotion(currentPotion.japaneseName),
    })
  );
  expect(onReplace).toHaveBeenCalledWith(0);

  fireEvent.click(
    within(dialog).getByRole('button', { name: translations.rewardGrant.discardNewPotion })
  );
  expect(onDiscard).toHaveBeenCalledTimes(1);
});
