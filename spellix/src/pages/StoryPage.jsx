import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import { useGameSetup } from '../features/gameSetup/GameSetupContext';
import {
  createStoryText,
  getStoryLanguages,
} from '../features/story/storyContent';
import './StoryPage.css';

function StoryPage() {
  const navigate = useNavigate();
  const {
    gameSetup,
    initializeBoard,
    initializeTurnOrder,
  } = useGameSetup();
  const storyLanguages = getStoryLanguages(gameSetup.players);

  useEffect(() => {
    if (!gameSetup.board && gameSetup.players.length > 0) {
      initializeBoard();
    }
  }, [gameSetup.board, gameSetup.players.length, initializeBoard]);

  useEffect(() => {
    if (
      gameSetup.players.length > 0 &&
      gameSetup.turnOrder.length !== gameSetup.players.length
    ) {
      initializeTurnOrder();
    }
  }, [gameSetup.players.length, gameSetup.turnOrder.length, initializeTurnOrder]);

  const continueLabel =
    storyLanguages.length > 1
      ? 'Continue - 続ける'
      : storyLanguages[0] === 'jp'
        ? '続ける'
        : 'Continue';

  return (
    <main className="story-page magical-night-sky-page">
      <MagicalNightSky />
      <section
        aria-label="Game story"
        aria-modal="true"
        className="story-modal"
        role="dialog"
      >
        {gameSetup.board
          ? storyLanguages.map((language) => (
              <p className={`story-text language-${language}`} key={language}>
                {createStoryText({
                  assignments: gameSetup.eliteBossEnemyAssignments,
                  board: gameSetup.board,
                  language,
                  players: gameSetup.players,
                })}
              </p>
            ))
          : null}
        <Button type="button" onClick={() => navigate('/gameplay')}>
          {continueLabel}
        </Button>
      </section>
    </main>
  );
}

export default StoryPage;
