import { useNavigate } from 'react-router-dom';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  MAX_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  PLAYER_COLOURS,
} from '../features/gameSetup/gameSetup';

function GameSetupPage() {
  const navigate = useNavigate();
  const { gameSetup, setPlayerCount, setPlayerColour } = useGameSetup();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/gameplay');
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
            <label htmlFor={player.id}>{`Player ${index + 1} colour`}</label>
            <select
              id={player.id}
              value={player.colour}
              onChange={(event) => setPlayerColour(player.id, event.target.value)}
            >
              {PLAYER_COLOURS.map((colour) => (
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
