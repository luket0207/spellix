import { createPlayers } from '../gameSetup/gameSetup';
import {
  createCommittedSpellData,
  createRearrangeableSpellData,
  hasDraftSpellChanges,
  isStartingSpellSetupComplete,
  moveSpellTokenInDraft,
  TOKEN_BAG_DROP_ZONE_ID,
} from './spellSetup';
import { TOKEN_BAG_MAX_CAPACITY } from '../debug/tokenBagAdmin';

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
    expect(result.tokenBag).toHaveLength(4);
    expect(result.spellSlots[0].tokens).toHaveLength(1);
    expect(result.spellSlots[0].tokens[0].id).toBe(tokenToMove.id);
  });

  test('assigns an outlined token as one token of spell capacity', () => {
    const [player] = createPlayers(1);
    const outlinedToken = {
      committed: false,
      id: 'player-1-red-yellow-outline-1',
      type: 'red-yellow-outline',
    };

    const result = moveSpellTokenInDraft({
      destinationId: player.spellSlots[0].id,
      spellSlots: player.spellSlots,
      tokenBag: [outlinedToken],
      tokenId: outlinedToken.id,
    });

    expect(result.didMove).toBe(true);
    expect(result.tokenBag).toEqual([]);
    expect(result.spellSlots[0].tokens).toEqual([outlinedToken]);
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

  test('allows Grey-adjusted capacity and blocks the next token beyond it', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({ ...slot, tokens: [] }));
    spellSlots[0].tokens = Array.from({ length: 5 }, (_, index) => ({
      committed: true,
      id: `filled-token-${index + 1}`,
      type: 'red',
    }));
    spellSlots[1].tokens = [{ committed: true, id: 'grey-1', type: 'grey' }];
    const [firstToken, secondToken, ...remainingBag] = player.tokenBag;

    const allowed = moveSpellTokenInDraft({
      destinationId: spellSlots[0].id,
      spellSlots,
      tokenBag: [firstToken, secondToken, ...remainingBag],
      tokenId: firstToken.id,
    });
    const blocked = moveSpellTokenInDraft({
      destinationId: spellSlots[0].id,
      spellSlots: allowed.spellSlots,
      tokenBag: allowed.tokenBag,
      tokenId: secondToken.id,
    });

    expect(allowed.didMove).toBe(true);
    expect(allowed.spellSlots[0].tokens).toHaveLength(6);
    expect(blocked.didMove).toBe(false);
  });

  test('does not activate adjacent capacity from an uncommitted Grey token', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({ ...slot, tokens: [] }));
    spellSlots[0].tokens = Array.from({ length: 5 }, (_, index) => ({
      committed: true,
      id: `filled-token-${index + 1}`,
      type: 'red',
    }));
    spellSlots[1].tokens = [{ committed: false, id: 'grey-draft', type: 'grey' }];
    const [tokenToMove, ...remainingBag] = player.tokenBag;

    const blocked = moveSpellTokenInDraft({
      destinationId: spellSlots[0].id,
      spellSlots,
      tokenBag: [tokenToMove, ...remainingBag],
      tokenId: tokenToMove.id,
    });

    expect(blocked.didMove).toBe(false);
    expect(blocked.spellSlots[0].tokens).toHaveLength(5);
  });

  test('rejects direct assignment into the removed side of a merged column', () => {
    const [player] = createPlayers(1);
    const tokenToMove = player.tokenBag[0];
    const result = moveSpellTokenInDraft({
      destinationId: player.spellSlots[1].id,
      mergedColumns: [{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }],
      spellSlots: player.spellSlots,
      tokenBag: player.tokenBag,
      tokenId: tokenToMove.id,
    });

    expect(result.didMove).toBe(false);
    expect(result.spellSlots).toBe(player.spellSlots);
    expect(result.tokenBag).toBe(player.tokenBag);
  });

  test('uses effective Grey capacity when moving into a merged column', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({ ...slot, tokens: [] }));
    spellSlots[0].tokens = Array.from({ length: 5 }, (_, index) => ({
      committed: true,
      id: `red-${index + 1}`,
      type: 'red',
    }));
    spellSlots[2].tokens = [{ committed: true, id: 'grey-3', type: 'grey' }];
    const tokenToMove = player.tokenBag[0];
    const result = moveSpellTokenInDraft({
      destinationId: spellSlots[0].id,
      mergedColumns: [{ activeColumn: 1, columns: [1, 2], removedColumn: 2 }],
      spellSlots,
      tokenBag: player.tokenBag,
      tokenId: tokenToMove.id,
    });

    expect(result.didMove).toBe(true);
    expect(result.spellSlots[0].tokens).toHaveLength(6);
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
    expect(returnedState.tokenBag).toHaveLength(5);
    expect(returnedState.spellSlots[0].tokens).toHaveLength(0);
  });

  test('moves committed tokens only when Redo mode allows it and recommits them on save', () => {
    const [player] = createPlayers(1);
    const committedToken = {
      ...player.tokenBag[0],
      committed: true,
    };
    const spellSlots = player.spellSlots.map((slot, index) => ({
      ...slot,
      tokens: index === 0 ? [committedToken] : [],
    }));
    const normalMove = moveSpellTokenInDraft({
      destinationId: spellSlots[1].id,
      spellSlots,
      tokenBag: player.tokenBag.slice(1),
      tokenId: committedToken.id,
    });

    expect(normalMove.didMove).toBe(false);

    const redoMove = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: spellSlots[1].id,
      spellSlots,
      tokenBag: player.tokenBag.slice(1),
      tokenId: committedToken.id,
    });

    expect(redoMove.didMove).toBe(true);
    expect(redoMove.spellSlots[0].tokens).toEqual([]);
    expect(redoMove.spellSlots[1].tokens).toEqual([
      expect.objectContaining({
        committed: true,
        id: committedToken.id,
      }),
    ]);

    const returnedToBag = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: TOKEN_BAG_DROP_ZONE_ID,
      spellSlots,
      tokenBag: player.tokenBag.slice(1),
      tokenId: committedToken.id,
    });

    expect(returnedToBag.didMove).toBe(true);
    expect(returnedToBag.tokenBag).toContainEqual(
      expect.objectContaining({
        committed: false,
        id: committedToken.id,
      })
    );

    const movedBackToSlots = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: spellSlots[2].id,
      spellSlots: returnedToBag.spellSlots,
      tokenBag: returnedToBag.tokenBag,
      tokenId: committedToken.id,
    });
    const movedWithinColumn = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: spellSlots[0].id,
      spellSlots,
      tokenBag: player.tokenBag.slice(1),
      tokenId: committedToken.id,
    });

    expect(movedBackToSlots.didMove).toBe(true);
    expect(movedBackToSlots.spellSlots[2].tokens[0].id).toBe(committedToken.id);
    expect(movedWithinColumn.didMove).toBe(true);
    expect(movedWithinColumn.spellSlots[0].tokens[0]).toEqual(
      expect.objectContaining({
        committed: true,
        id: committedToken.id,
      })
    );

    const committedState = createCommittedSpellData(redoMove);

    expect(committedState.spellSlots[1].tokens[0].committed).toBe(true);
  });

  test('creates a temporary uncommitted Wandsmith draft without changing saved spells', () => {
    const [player] = createPlayers(1);
    const committedToken = {
      ...player.tokenBag[0],
      committed: true,
    };
    const spellSlots = player.spellSlots.map((slot, index) => ({
      ...slot,
      tokens: index === 0 ? [committedToken] : [],
    }));

    const draft = createRearrangeableSpellData({
      spellSlots,
      tokenBag: player.tokenBag.slice(1),
    });

    expect(draft.spellSlots[0].tokens[0].committed).toBe(false);
    expect(spellSlots[0].tokens[0].committed).toBe(true);
    expect(draft.spellSlots).not.toBe(spellSlots);
    expect(draft.tokenBag).not.toBe(player.tokenBag);
  });

  test('keeps Wandsmith tokens uncommitted through repeated draft moves', () => {
    const [player] = createPlayers(1);
    const committedToken = {
      ...player.tokenBag[0],
      committed: true,
    };
    const savedSpellSlots = player.spellSlots.map((slot, index) => ({
      ...slot,
      tokens: index === 0 ? [committedToken] : [],
    }));
    const draft = createRearrangeableSpellData({
      spellSlots: savedSpellSlots,
      tokenBag: player.tokenBag.slice(1),
    });
    const movedToAnotherSlot = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: draft.spellSlots[1].id,
      keepMovedTokensUncommitted: true,
      spellSlots: draft.spellSlots,
      tokenBag: draft.tokenBag,
      tokenId: committedToken.id,
    });
    const movedWithinSlot = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: draft.spellSlots[1].id,
      keepMovedTokensUncommitted: true,
      spellSlots: movedToAnotherSlot.spellSlots,
      tokenBag: movedToAnotherSlot.tokenBag,
      tokenId: committedToken.id,
    });
    const movedToBag = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: TOKEN_BAG_DROP_ZONE_ID,
      keepMovedTokensUncommitted: true,
      spellSlots: movedWithinSlot.spellSlots,
      tokenBag: movedWithinSlot.tokenBag,
      tokenId: committedToken.id,
    });
    const movedBackToSlots = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: draft.spellSlots[2].id,
      keepMovedTokensUncommitted: true,
      spellSlots: movedToBag.spellSlots,
      tokenBag: movedToBag.tokenBag,
      tokenId: committedToken.id,
    });

    expect(movedToAnotherSlot.spellSlots[1].tokens[0].committed).toBe(false);
    expect(movedWithinSlot.spellSlots[1].tokens[0].committed).toBe(false);
    expect(
      movedToBag.tokenBag.find(({ id }) => id === committedToken.id)?.committed
    ).toBe(false);
    expect(movedBackToSlots.spellSlots[2].tokens[0].committed).toBe(false);
    expect(savedSpellSlots[0].tokens[0].committed).toBe(true);
  });

  test('does not move a spell token into a full token bag during rearrangement', () => {
    const [player] = createPlayers(1);
    const committedToken = {
      committed: true,
      id: 'committed-red',
      type: 'red',
    };
    const spellSlots = player.spellSlots.map((slot, index) => ({
      ...slot,
      tokens: index === 0 ? [committedToken] : [],
    }));
    const fullTokenBag = player.tokenBag.slice(0, TOKEN_BAG_MAX_CAPACITY);

    const result = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: TOKEN_BAG_DROP_ZONE_ID,
      enforceTokenBagCapacity: true,
      spellSlots,
      tokenBag: fullTokenBag,
      tokenId: committedToken.id,
    });

    expect(result.didMove).toBe(false);
    expect(result.spellSlots[0].tokens).toHaveLength(1);
    expect(result.tokenBag).toHaveLength(TOKEN_BAG_MAX_CAPACITY);
  });

  test('keeps moved Redo tokens active for Grey capacity while assigned', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));
    spellSlots[0].tokens = Array.from({ length: 5 }, (_, index) => ({
      committed: true,
      id: `filled-red-${index + 1}`,
      type: 'red',
    }));
    spellSlots[1].tokens = [{
      committed: true,
      id: 'redo-grey',
      type: 'grey',
    }];
    const movedGrey = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: spellSlots[1].id,
      spellSlots,
      tokenBag: player.tokenBag,
      tokenId: 'redo-grey',
    });
    const addedWithGreyCapacity = moveSpellTokenInDraft({
      allowCommittedTokenMovement: true,
      destinationId: spellSlots[0].id,
      spellSlots: movedGrey.spellSlots,
      tokenBag: movedGrey.tokenBag,
      tokenId: player.tokenBag[0].id,
    });

    expect(movedGrey.spellSlots[1].tokens[0].committed).toBe(true);
    expect(addedWithGreyCapacity.didMove).toBe(true);
    expect(addedWithGreyCapacity.spellSlots[0].tokens).toHaveLength(6);
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

  test.each([0, 1, 4])(
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

  test('completes starting setup only while all five starting tokens are placed', () => {
    const [player] = createPlayers(1);
    const spellSlots = player.spellSlots.map((slot) => ({
      ...slot,
      tokens: [],
    }));

    spellSlots[0].tokens = [...player.tokenBag];

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
