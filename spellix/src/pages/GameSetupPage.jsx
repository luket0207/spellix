import { useNavigate } from 'react-router-dom';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  MAX_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  PLAYER_COLOURS,
} from '../features/gameSetup/gameSetup';
import { PLAYER_GENDERS } from '../features/gameSetup/pieceImages';

function GameSetupPage() {
  const navigate = useNavigate();
  const { gameSetup, setPlayerCount, setPlayerColour, setPlayerGender } = useGameSetup();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/gameplay');
  };

  const getAvailableColours = (currentPlayerId, currentColour) => {
    const takenColours = new Set(
      gameSetup.players
        .filter((player) => player.id !== currentPlayerId)
        .map((player) => player.colour)
    );

    return PLAYER_COLOURS.filter((colour) => colour === currentColour || !takenColours.has(colour));
  };

  return (
    <main>
      <h1>Game setup</h1>
      <p>Set up the game before play starts.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="player-count">Number of players</label>
          <select
            id="player-count"
            value={gameSetup.playerCount}
            onChange={(event) => setPlayerCount(event.target.value)}
          >
            {Array.from(
              { length: MAX_PLAYER_COUNT - MIN_PLAYER_COUNT + 1 },
              (_, index) => MIN_PLAYER_COUNT + index
            ).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        {gameSetup.players.map((player, index) => (
          <div key={player.id}>
            <label htmlFor={`${player.id}-gender`}>{`Player ${index + 1} gender`}</label>
            <select
              id={`${player.id}-gender`}
              value={player.gender}
              onChange={(event) => setPlayerGender(player.id, event.target.value)}
            >
              {PLAYER_GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>

            <label htmlFor={player.id}>{`Player ${index + 1} colour`}</label>
            <select
              id={player.id}
              value={player.colour}
              onChange={(event) => setPlayerColour(player.id, event.target.value)}
            >
              {getAvailableColours(player.id, player.colour).map((colour) => (
                <option key={colour} value={colour}>
                  {colour}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button type="submit">Start game</button>
      </form>
    </main>
  );
}

export default GameSetupPage;
