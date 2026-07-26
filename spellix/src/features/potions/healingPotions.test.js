import { readFileSync } from 'fs';
import {
  applyHealingPotionEffect,
  getPotionHealAmount,
  isHealingPotion,
} from './potionUsage';

describe('healing potion behaviour', () => {
  test.each([
    { expected: 35, maxHealth: 115, percentage: 0.3 },
    { expected: 65, maxHealth: 110, percentage: 0.6 },
    { expected: 50, maxHealth: 100, percentage: 0.5 },
  ])(
    'rounds $percentage of $maxHealth to $expected',
    ({ expected, maxHealth, percentage }) => {
      expect(getPotionHealAmount(maxHealth, percentage)).toBe(expected);
    }
  );

  test.each([
    { expectedHealth: 75, id: 'small-heal', maxHealth: 115, startingHealth: 40 },
    { expectedHealth: 90, id: 'heal', maxHealth: 110, startingHealth: 25 },
    { expectedHealth: 80, id: 'first-aid', maxHealth: 110, startingHealth: 25 },
    { expectedHealth: 100, id: 'heal', maxHealth: 100, startingHealth: 80 },
  ])(
    'applies $id healing and clamps the player at max health',
    ({ expectedHealth, id, maxHealth, startingHealth }) => {
      expect(
        applyHealingPotionEffect(
          { currentHealth: startingHealth, maxHealth },
          { id }
        )
      ).toEqual({ currentHealth: expectedHealth, maxHealth });
    }
  );

  test('recognizes only the three healing potion ids', () => {
    expect(isHealingPotion({ id: 'small-heal' })).toBe(true);
    expect(isHealingPotion({ id: 'heal' })).toBe(true);
    expect(isHealingPotion({ id: 'first-aid' })).toBe(true);
    expect(isHealingPotion({ id: 'roll-choice' })).toBe(false);
  });

  test('grows, shakes three times, and fades over 1.5 seconds', () => {
    const stylesheet = readFileSync(
      `${__dirname}/HealingPotionAnimation.css`,
      'utf8'
    );

    expect(stylesheet).toMatch(
      /\.healing-potion-animation\s*{[^}]*animation:\s*healingPotionBottle 1\.5s/s
    );
    expect(stylesheet).toMatch(
      /0%\s*{[^}]*width:\s*0;[^}]*scale\(0\)/s
    );
    expect(stylesheet).toMatch(/30%\s*{[^}]*width:\s*100%;/s);
    expect(stylesheet).toMatch(/45%\s*{[^}]*translate\(-53%, -50%\)/s);
    expect(stylesheet).toMatch(/60%\s*{[^}]*translate\(-47%, -50%\)/s);
    expect(stylesheet).toMatch(/75%\s*{[^}]*translate\(-52%, -50%\)/s);
    expect(stylesheet).toMatch(
      /100%\s*{[^}]*width:\s*100%;[^}]*opacity:\s*0;/s
    );
  });
});
