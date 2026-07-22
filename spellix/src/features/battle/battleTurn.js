import { getEffectiveSpellColumnIndex } from '../spells/nonBattleSpellEffects';

const RED_DAMAGE_PER_TOKEN = 10;
const BLUE_GUARD_PER_TOKEN = 5;
const ORANGE_COUNTER_DAMAGE_PER_TOKEN = 5;
const GREEN_REDUCTION_PER_TOKEN = 5;
const PURPLE_BUFF_PER_TOKEN = 5;
const YELLOW_CHARGE_BUFF = 10;

function getBattleSlotTokens(actor, diceResult) {
  const effectiveColumnIndex = getEffectiveSpellColumnIndex(
    actor?.mergedColumns,
    diceResult
  );
  const slot = actor?.spellSlots?.[effectiveColumnIndex];

  if (!slot || slot.displayLabel === 'J' || slot.joinedWith !== undefined) {
    return [];
  }

  return slot.tokens ?? [];
}

function countTokens(tokens, type) {
  return tokens.filter((token) => token.type === type).length;
}

export function createAdjacentPurpleBuffs(diceResult, amount) {
  const buffs = [0, 0, 0, 0, 0, 0];
  const rolledColumnIndex = diceResult - 1;

  if (amount <= 0) {
    return buffs;
  }

  if (rolledColumnIndex > 0) {
    buffs[rolledColumnIndex - 1] = amount;
  }

  if (rolledColumnIndex < buffs.length - 1) {
    buffs[rolledColumnIndex + 1] = amount;
  }

  return buffs;
}

export function calculateBattleTurn({
  chargeAvailable = false,
  currentActor,
  diceResult,
  freezeAvailable = false,
  opponent,
  purpleBuff = 0,
  yellowCharged = false,
}) {
  const actorTokens = getBattleSlotTokens(currentActor, diceResult);
  const opponentTokens = getBattleSlotTokens(opponent, diceResult);
  const tokenCounts = {
    actorBlue: countTokens(actorTokens, 'blue'),
    actorLightBlue: countTokens(actorTokens, 'light-blue'),
    actorPurple: countTokens(actorTokens, 'purple'),
    actorRed: countTokens(actorTokens, 'red'),
    actorYellow: countTokens(actorTokens, 'yellow'),
    opponentGreen: countTokens(opponentTokens, 'green'),
    opponentOrange: countTokens(opponentTokens, 'orange'),
  };
  const yellowBuff = yellowCharged ? YELLOW_CHARGE_BUFF : 0;
  const redBuff = tokenCounts.actorRed > 0 ? purpleBuff + yellowBuff : 0;
  const blueBuff = tokenCounts.actorBlue > 0 ? purpleBuff + yellowBuff : 0;
  const purpleBuffGranted = tokenCounts.actorPurple * PURPLE_BUFF_PER_TOKEN;
  const chargeApplied = chargeAvailable && tokenCounts.actorYellow > 0;
  const rawRedDamage = tokenCounts.actorRed * RED_DAMAGE_PER_TOKEN + redBuff;
  const availableGreenReduction = tokenCounts.opponentGreen * GREEN_REDUCTION_PER_TOKEN;
  const greenReduction = Math.min(rawRedDamage, availableGreenReduction);
  const damageAfterGreen = rawRedDamage - greenReduction;
  const guardReduction = Math.min(damageAfterGreen, opponent.guard ?? 0);
  const outgoingDamage = damageAfterGreen - guardReduction;
  const guardGranted = tokenCounts.actorBlue * BLUE_GUARD_PER_TOKEN + blueBuff;
  const counterDamage = tokenCounts.opponentOrange * ORANGE_COUNTER_DAMAGE_PER_TOKEN;
  const freezeApplied = freezeAvailable && tokenCounts.actorLightBlue > 0;
  const effects = [];

  if (rawRedDamage > 0) {
    effects.push({ amount: outgoingDamage, source: 'currentActor', target: 'opponent', type: 'redDamage' });
  }

  if (greenReduction > 0) {
    effects.push({ amount: greenReduction, source: 'opponent', target: 'opponent', type: 'greenReduction' });
  }

  if (guardGranted > 0) {
    effects.push({ amount: guardGranted, source: 'currentActor', target: 'currentActor', type: 'blueGuard' });
  }

  if (counterDamage > 0) {
    effects.push({ amount: counterDamage, source: 'opponent', target: 'currentActor', type: 'orangeCounter' });
  }

  return {
    chargeApplied,
    damage: {
      counter: counterDamage,
      greenReduction,
      guardReduction,
      outgoing: outgoingDamage,
      rawRed: rawRedDamage,
    },
    diceResult,
    effects,
    freezeApplied,
    isMiss:
      tokenCounts.actorRed === 0 &&
      tokenCounts.actorBlue === 0 &&
      !freezeApplied &&
      purpleBuffGranted === 0 &&
      !chargeApplied,
    nextCurrentActor: {
      currentHealth: Math.max(0, currentActor.currentHealth - counterDamage),
      guard: (currentActor.guard ?? 0) + guardGranted,
    },
    nextOpponent: {
      currentHealth: Math.max(0, opponent.currentHealth - outgoingDamage),
      guard: 0,
    },
    purpleBuffGranted,
    tokenCounts,
  };
}
