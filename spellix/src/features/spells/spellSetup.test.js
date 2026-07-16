import { createPlayers } from '../gameSetup/gameSetup';
import {
  createCommittedSpellData,
  hasDraftSpellChanges,
  isStartingSpellSetupComplete,
  moveSpellTokenInDraft,
  TOKEN_BAG_DROP_ZONE_ID,
} from './spellSetup';

describe('spellSetup helpers', () => {
  test('moves an uncommitted token from the bag into a spell slot', () => {
    const [player] = createPlayers(1);
    const tokenToMove = player.tokenBag[0];

    const result = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: tokenToMove.id,
    });

    expect(result.didMove).toBe(true);
    expect(result.tokenBag).toHaveLength(6);
    expect(result.spellSlots[0].tokens).toHaveLength(1);
    expect(result.spellSlots[0].tokens[0].id).toBe(tokenToMove.id);
  });

  test('preserves starting-token protection when spell placement is committed', () => {
    const [player] = createPlayers(1);
    const startingToken = player.tokenBag[0];
    const placedState = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: startingToken.id,
    });

    const committedState = createCommittedSpellData(placedState);

    expect(committedState.spellSlots[0].tokens[0]).toEqual(
      expect.objectContaining({
        committed: true,
        protected: true,
        source: 'starting',
      })
    );
  });

  test('prevents moving a token into a full spell slot', () => {
    const [player] = createPlayers(1);
    const fullSlot = {
      ...player.spellSlots[0],
      tokens: Array.from({ length: 5 }, (_, index) => ({
        id: `filled-token-${index + 1}`,
        type: 'red',
        committed: true,
      })),
    };

    const result = moveSpellTokenInDraft({
      destinationId: fullSlot.id,
      spellSlots: [fullSlot, ...player.spellSlots.slice(1)],
      tokenBag: player.tokenBag,
      tokenId: player.tokenBag[0].id,
    });

    expect(result.didMove).toBe(false);
    expect(result.tokenBag).toBe(player.tokenBag);
    expect(result.spellSlots[0].tokens).toHaveLength(5);
  });

  test('moves an uncommitted token back to the bag from a spell slot', () => {
    const [player] = createPlayers(1);
    const tokenToMove = player.tokenBag[0];
    const placedState = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: tokenToMove.id,
    });

    const returnedState = moveSpellTokenInDraft({
      destinationId: TOKEN_BAG_DROP_ZONE_ID,
      spellSlots: placedState.spellSlots,
      tokenBag: placedState.tokenBag,
      tokenId: tokenToMove.id,
    });

    expect(returnedState.didMove).toBe(true);
    expect(returnedState.tokenBag).toHaveLength(7);
    expect(returnedState.spellSlots[0].tokens).toHaveLength(0);
  });

  test('does not report draft changes when the spell state is unchanged', () => {
    const [player] = createPlayers(1);

    expect(
      hasDraftSpellChanges({
        draftSpellSlots: player.spellSlots,
        draftTokenBag: player.tokenBag,
        savedSpellSlots: player.spellSlots,
        savedTokenBag: player.tokenBag,
      })
    ).toBe(false);
  });

  test('reports draft changes after a token is moved into a spell slot', () => {
    const [player] = createPlayers(1);
    const movedState = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: player.tokenBag[0].id,
    });

    expect(
      hasDraftSpellChanges({
        draftSpellSlots: movedState.spellSlots,
        draftTokenBag: movedState.tokenBag,
        savedSpellSlots: player.spellSlots,
        savedTokenBag: player.tokenBag,
      })
    ).toBe(true);
  });

  test('does not report draft changes after a token returns to its original location', () => {
    const [player] = createPlayers(1);
    const tokenToMove = player.tokenBag[0];
    const movedState = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: tokenToMove.id,
    });
    const restoredState = moveSpellTokenInDraft({
      destinationId: TOKEN_BAG_DROP_ZONE_ID,
      spellSlots: movedState.spellSlots,
      tokenBag: movedState.tokenBag,
      tokenId: tokenToMove.id,
    });

    expect(
      hasDraftSpellChanges({
        draftSpellSlots: restoredState.spellSlots,
        draftTokenBag: restoredState.tokenBag,
        savedSpellSlots: player.spellSlots,
        savedTokenBag: player.tokenBag,
      })
    ).toBe(false);
  });

  test.each([0, 1, 6])(
    'does not complete starting setup with %i starting tokens placed',
    (placedTokenCount) => {
      const [player] = createPlayers(1);
      const spellSlots = player.spellSlots.map((slot) => ({
        ...slot,
        tokens: [],
      }));

      spellSlots[0].tokens = player.tokenBag.slice(0, placedTokenCount);

      expect(
        isStartingSpellSetupComplete({
          spellSlots,
          tokenBag: player.tokenBag.slice(placedTokenCount),
        })
      ).toBe(false);
    }
  );

  test('completes starting setup only while all seven starting tokens are placed', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));

    spellSlots[0].tokens = player.tokenBag.slice(0, 5);
    spellSlots[1].tokens = player.tokenBag.slice(5);

    expect(
      isStartingSpellSetupComplete({ spellSlots, tokenBag: [] })
    ).toBe(true);

    const movedBetweenSlots = spellSlots.map((slot) => ({
      ...slot,
      tokens: [...slot.tokens],
    }));
    movedBetweenSlots[0].tokens.pop();
    movedBetweenSlots[2].tokens.push(player.tokenBag[4]);

    expect(
      isStartingSpellSetupComplete({
        spellSlots: movedBetweenSlots,
        tokenBag: [],
      })
    ).toBe(true);

    movedBetweenSlots[2].tokens.pop();

    expect(
      isStartingSpellSetupComplete({
        spellSlots: movedBetweenSlots,
        tokenBag: [player.tokenBag[4]],
      })
    ).toBe(false);
  });
});
