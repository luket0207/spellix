import { useNavigate } from 'react-router-dom';
import BattleBackgroundSlideshow from '../components/BattleBackgroundSlideshow';
import Button from '../components/common/Button/Button';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  MAX_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  PLAYER_COLOURS,
  PLAYER_LANGUAGES,
} from '../features/gameSetup/gameSetup';
import { PLAYER_GENDERS } from '../features/gameSetup/pieceImages';
import './GameSetupPage.css';

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

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYER_COUNT - MIN_PLAYER_COUNT + 1 },
  (_, index) => MIN_PLAYER_COUNT + index
);

function GameSetupPage() {
  const navigate = useNavigate();
  const {
    gameSetup,
    setDebugMode,
    setPlayerCount,
    setPlayerColour,
    setPlayerGender,
    setPlayerLanguage,
  } = useGameSetup();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/story');
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
    <main className="game-setup-page">
      <BattleBackgroundSlideshow />

      <form className="game-setup-panel" onSubmit={handleSubmit}>
        <h1 className="game-setup-title">Game Setup - ゲームの準備</h1>

        <div
          aria-labelledby="player-count-label"
          className="game-setup-count-controls"
          role="group"
        >
          <span id="player-count-label">Number of Players - プレイヤー人数</span>
          <div className="game-setup-count-buttons">
            {PLAYER_COUNTS.map((count) => {
              const isSelected = gameSetup.playerCount === count;

              return (
                <Button
                  aria-pressed={isSelected}
                  className={`game-setup-count-button${isSelected ? ' is-active' : ''}`}
                  key={count}
                  type="button"
                  variant="secondary"
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="game-setup-player-grid">
          {gameSetup.players.map((player, index) => (
            <fieldset className="game-setup-player-pod" key={player.id}>
              <legend>{`Player ${index + 1} - プレイヤー${index + 1}`}</legend>
              <div className="game-setup-input-row">
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

              <div className="game-setup-input-row">
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

              <div className="game-setup-input-row">
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
        </div>

        <Button className="game-setup-submit" type="submit" variant="secondary">
          Start Game - ゲーム開始
        </Button>
        <label>
          <input
            checked={gameSetup.debugMode}
            type="checkbox"
            onChange={(event) => setDebugMode(event.target.checked)}
          />
          Debug Mode - デバッグモード
        </label>
      </form>
    </main>
  );
}

export default GameSetupPage;
