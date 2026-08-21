import { faCirclePlus, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import BattleBackgroundSlideshow from '../components/BattleBackgroundSlideshow';
import Button from '../components/common/Button/Button';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  MAX_PLAYER_COUNT,
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

function GameSetupPage() {
  const navigate = useNavigate();
  const {
    gameSetup,
    removePlayer,
    setDebugMode,
    setPlayerCount,
    setPlayerColour,
    setPlayerGender,
    setPlayerLanguage,
  } = useGameSetup();
  const hasUniquePlayerColours =
    new Set(gameSetup.players.map((player) => player.colour)).size ===
    gameSetup.players.length;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!hasUniquePlayerColours) {
      return;
    }

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

        <div className="game-setup-player-grid">
          {Array.from({ length: MAX_PLAYER_COUNT }, (_, index) => {
            const player = gameSetup.players[index];

            if (player) {
              const playerNumber = index + 1;
              const titleId = `${player.id}-title`;

              return (
                <div
                  aria-labelledby={titleId}
                  className="game-setup-player-pod"
                  key={player.id}
                  role="group"
                >
                  <h2 className="game-setup-player-pod-title" id={titleId}>
                    {`Player ${playerNumber} - プレイヤー${playerNumber}`}
                  </h2>
                  {playerNumber > 2 ? (
                    <button
                      aria-label={`Remove Player ${playerNumber}`}
                      className="game-setup-remove-player-button"
                      type="button"
                      onClick={() => removePlayer(player.id)}
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                  ) : null}
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
                </div>
              );
            }

            if (index === gameSetup.players.length) {
              return (
                <button
                  aria-label="Add Player"
                  className="game-setup-add-player-pod"
                  key="add-player"
                  type="button"
                  onClick={() => setPlayerCount(gameSetup.playerCount + 1)}
                >
                  <FontAwesomeIcon className="add-player-icon" icon={faCirclePlus} />
                  <span className="add-player-text">Add Player - プレイヤーを追加</span>
                </button>
              );
            }

            return (
              <div
                aria-hidden="true"
                className="game-setup-empty-player-slot"
                key={`empty-player-slot-${index + 1}`}
              />
            );
          })}
        </div>

        <Button
          className="game-setup-submit"
          disabled={!hasUniquePlayerColours}
          type="submit"
          variant="secondary"
        >
          Start Game - ゲーム開始
        </Button>
        <label className="game-setup-debug-mode">
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
