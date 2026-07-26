import { createDebugToken } from '../debug/tokenBagAdmin';

export function createCopyPasteDuplicate(player, sourceToken) {
  if (!player || !sourceToken) {
    return null;
  }

  return createDebugToken(player, sourceToken.type);
}
