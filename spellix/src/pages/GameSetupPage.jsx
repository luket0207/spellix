import { useNavigate } from 'react-router-dom';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  MAX_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  PLAYER_COLOURS,
  PLAYER_LANGUAGES,
} from '../features/gameSetup/gameSetup';
import { PLAYER_GENDERS } from '../features/gameSetup/pieceImages';

const LANGUAGE_LABELS = {
  en: 'English',
  jp: '日本語',
};

const GENDER_LABELS = {
  boy: 'Boy - 男の子',
  girl: 'Girl - 女の子',
};

const COLOUR_LABELS = {
  red: 'Red - 赤',
  blue: 'Blue - 青',
  green: 'Green - 緑',
  yellow: 'Yellow - 黄色',
  purple: 'Purple - 紫',
  orange: 'Orange - オレンジ',
};

function GameSetupPage() {
  const navigate = useNavigate();
  const {
    gameSetup,
    setPlayerCount,
    setPlayerColour,
    setPlayerGender,
    setPlayerLanguage,
  } = useGameSetup();

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
      <h1>Game Setup - ゲームの準備</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="player-count">Number of Players - プレイヤー人数</label>
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
          <fieldset key={player.id}>
            <legend>{`Player ${index + 1} - プレイヤー${index + 1}`}</legend>
            <div>
              <label htmlFor={`${player.id}-language`}>Language - 言語</label>
              <select
                id={`${player.id}-language`}
                value={player.language}
                onChange={(event) => setPlayerLanguage(player.id, event.target.value)}
              >
                {PLAYER_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${player.id}-gender`}>Gender - 性別</label>
              <select
                id={`${player.id}-gender`}
                value={player.gender}
                onChange={(event) => setPlayerGender(player.id, event.target.value)}
              >
                {PLAYER_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {GENDER_LABELS[gender]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${player.id}-colour`}>Colour - 色</label>
              <select
                id={`${player.id}-colour`}
                value={player.colour}
                onChange={(event) => setPlayerColour(player.id, event.target.value)}
              >
                {getAvailableColours(player.id, player.colour).map((colour) => (
                  <option key={colour} value={colour}>
                    {COLOUR_LABELS[colour]}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        ))}

        <button type="submit">Start Game - ゲーム開始</button>
      </form>
    </main>
  );
}

export default GameSetupPage;
