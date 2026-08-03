import {
  getAdjacentEffectiveSpellColumnGroups,
  getEffectiveSpellColumnGroups,
  getEffectiveSpellColumnIndex,
} from '../spells/nonBattleSpellEffects';

const RED_DAMAGE_PER_TOKEN = 10;
const BLUE_GUARD_PER_TOKEN = 5;
const ORANGE_COUNTER_DAMAGE_PER_TOKEN = 5;
const GREEN_REDUCTION_PER_TOKEN = 5;
const OUTLINED_RED_DAMAGE_PER_TOKEN = 20;
const OUTLINED_BLUE_GUARD_PER_TOKEN = 10;
const OUTLINED_ORANGE_COUNTER_DAMAGE_PER_TOKEN = 10;
const OUTLINED_GREEN_REDUCTION_PER_TOKEN = 10;
const PURPLE_BUFF_PER_TOKEN = 5;
const YELLOW_CHARGE_BUFF = 10;

function getBattleSlotTokens(actor, diceResult) {
  const effectiveColumnIndex = getEffectiveSpellColumnIndex(
    actor?.mergedColumns,
    diceResult
  );
  const slot = actor?.spellSlots?.[effectiveColumnIndex];

  if (!slot) {
    return [];
  }

  return slot.tokens ?? [];
}

function countTokens(tokens, type) {
  return tokens.filter((token) => token.type === type).length;
}

export function createAdjacentPurpleBuffs(diceResult, amount, actor = {}) {
  const buffs = [0, 0, 0, 0, 0, 0];

  if (amount <= 0) {
    return buffs;
  }

  const spellSlots = actor.spellSlots ?? buffs.map(() => ({}));
  const groups = getEffectiveSpellColumnGroups(spellSlots, actor.mergedColumns);
  const rolledGroupIndex = groups.findIndex(({ columns }) =>
    columns.includes(diceResult)
  );

  getAdjacentEffectiveSpellColumnGroups(groups, rolledGroupIndex).forEach(
    ({ slotIndex }) => {
      buffs[slotIndex] = amount;
    }
  );

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
  const actorOutlinedBlue = countTokens(actorTokens, 'blue-yellow-outline');
  const actorOutlinedRed = countTokens(actorTokens, 'red-yellow-outline');
  const opponentOutlinedGreen = countTokens(
    opponentTokens,
    'green-yellow-outline'
  );
  const opponentOutlinedOrange = countTokens(
    opponentTokens,
    'orange-yellow-outline'
  );
  const yellowBuff = yellowCharged ? YELLOW_CHARGE_BUFF : 0;
  const redBuff =
    tokenCounts.actorRed + actorOutlinedRed > 0 ? purpleBuff + yellowBuff : 0;
  const blueBuff =
    tokenCounts.actorBlue + actorOutlinedBlue > 0 ? purpleBuff + yellowBuff : 0;
  const purpleBuffGranted = tokenCounts.actorPurple * PURPLE_BUFF_PER_TOKEN;
  const chargeApplied = chargeAvailable && tokenCounts.actorYellow > 0;
  const rawRedDamage =
    tokenCounts.actorRed * RED_DAMAGE_PER_TOKEN +
    actorOutlinedRed * OUTLINED_RED_DAMAGE_PER_TOKEN +
    redBuff;
  const availableGreenReduction =
    tokenCounts.opponentGreen * GREEN_REDUCTION_PER_TOKEN +
    opponentOutlinedGreen * OUTLINED_GREEN_REDUCTION_PER_TOKEN;
  const greenReduction = Math.min(rawRedDamage, availableGreenReduction);
  const damageAfterGreen = rawRedDamage - greenReduction;
  const guardReduction = Math.min(damageAfterGreen, opponent.guard ?? 0);
  const outgoingDamage = damageAfterGreen - guardReduction;
  const guardGranted =
    tokenCounts.actorBlue * BLUE_GUARD_PER_TOKEN +
    actorOutlinedBlue * OUTLINED_BLUE_GUARD_PER_TOKEN +
    blueBuff;
  const availableCounterDamage =
    tokenCounts.opponentOrange * ORANGE_COUNTER_DAMAGE_PER_TOKEN +
    opponentOutlinedOrange * OUTLINED_ORANGE_COUNTER_DAMAGE_PER_TOKEN;
  const freezeApplied = freezeAvailable && tokenCounts.actorLightBlue > 0;
  const effects = [];

  if (guardGranted > 0) {
    effects.push({ amount: guardGranted, source: 'currentActor', target: 'currentActor', type: 'blueGuard' });
  }

  if (rawRedDamage > 0) {
    effects.push({
      amount: outgoingDamage,
      ...(guardReduction > 0 ? { guardReduction } : {}),
      source: 'currentActor',
      target: 'opponent',
      type: 'redDamage',
    });
  }

  if (greenReduction > 0) {
    effects.push({ amount: greenReduction, source: 'opponent', target: 'opponent', type: 'greenReduction' });
  }

  const attemptedToAffectOpponent =
    freezeApplied ||
    effects.some(
      ({ source, target }) =>
        source === 'currentActor' && target === 'opponent'
    );
  const counterDamage = attemptedToAffectOpponent ? availableCounterDamage : 0;
  const guardAfterGrant = (currentActor.guard ?? 0) + guardGranted;
  const counterGuardReduction = Math.min(counterDamage, guardAfterGrant);
  const counterHealthDamage = counterDamage - counterGuardReduction;

  if (counterDamage > 0) {
    effects.push({
      amount: counterHealthDamage,
      guardReduction: counterGuardReduction,
      source: 'opponent',
      target: 'currentActor',
      type: 'orangeCounter',
    });
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
      tokenCounts.actorRed + actorOutlinedRed === 0 &&
      tokenCounts.actorBlue + actorOutlinedBlue === 0 &&
      !freezeApplied &&
      purpleBuffGranted === 0 &&
      !chargeApplied,
    nextCurrentActor: {
      currentHealth: Math.max(
        0,
        currentActor.currentHealth - counterHealthDamage
      ),
      guard: guardAfterGrant - counterGuardReduction,
    },
    nextOpponent: {
      currentHealth: Math.max(0, opponent.currentHealth - outgoingDamage),
      guard: Math.max(0, (opponent.guard ?? 0) - guardReduction),
    },
    purpleBuffGranted,
    tokenCounts,
  };
}
