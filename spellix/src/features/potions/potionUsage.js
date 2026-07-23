const CONTEXT_AVAILABILITY = {
  battle: ['Battle', 'Both'],
  board: ['Board', 'Both'],
  mini: ['Mini'],
};

export function canUsePotionInContext(potion, context) {
  return CONTEXT_AVAILABILITY[context]?.includes(potion?.availability) ?? false;
}
