import PotionIcon from '../../components/potions/PotionIcon';
import { POTION_DEFINITIONS } from '../../data/potions';

// DEBUG ONLY: Potion grant controls.
function DebugPotionGrantControls({
  onDiscardPendingPotion,
  onGivePotion,
  onPendingPotionReplacementChange,
  onReplacePendingPotion,
  onSelectedPotionIdChange,
  onSelectedPotionPlayerIdChange,
  pendingPotionGrant = null,
  players = [],
  selectedPotionId = '',
  selectedPotionPlayerId = '',
  selectedReplacementPotionIndex = '',
}) {
  const pendingPlayer = players.find(({ id }) => id === pendingPotionGrant?.playerId) ?? null;
  const isSelectionDisabled = players.length === 0 || Boolean(pendingPotionGrant);

  return (
    <div>
      <p>Potion grant</p>
      <label htmlFor="debug-potion-player">Potion target player</label>
      <select
        id="debug-potion-player"
        value={selectedPotionPlayerId}
        disabled={isSelectionDisabled}
        onChange={(event) => onSelectedPotionPlayerIdChange(event.target.value)}
      >
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {`${player.colour} player`}
          </option>
        ))}
      </select>

      <label htmlFor="debug-potion-type">Potion type</label>
      <select
        id="debug-potion-type"
        value={selectedPotionId}
        disabled={isSelectionDisabled}
        onChange={(event) => onSelectedPotionIdChange(event.target.value)}
      >
        {POTION_DEFINITIONS.map((potion) => (
          <option key={potion.id} value={potion.id}>
            {potion.name}
          </option>
        ))}
      </select>

      <button type="button" disabled={isSelectionDisabled} onClick={onGivePotion}>
        Give Potion
      </button>

      {pendingPotionGrant && pendingPlayer ? (
        <div>
          <p>{`New potion: ${pendingPotionGrant.potion.name}`}</p>
          <PotionIcon potion={pendingPotionGrant.potion} />
          <p>{`Target player: ${pendingPlayer.colour}`}</p>
          <div role="radiogroup" aria-label="Current potions to discard">
            {pendingPlayer.potions.map((potion, index) => (
              <label key={`${potion.id}-${index}`}>
                <input
                  aria-label={`Discard ${potion.name}`}
                  checked={selectedReplacementPotionIndex === String(index)}
                  name="debug-potion-replacement"
                  type="radio"
                  value={index}
                  onChange={(event) => onPendingPotionReplacementChange(event.target.value)}
                />
                <PotionIcon focusable={false} potion={potion} />
              </label>
            ))}
          </div>
          <button type="button" onClick={onDiscardPendingPotion}>
            Discard New Potion
          </button>
          <button
            type="button"
            disabled={selectedReplacementPotionIndex === ''}
            onClick={onReplacePendingPotion}
          >
            Replace Selected Potion
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default DebugPotionGrantControls;
