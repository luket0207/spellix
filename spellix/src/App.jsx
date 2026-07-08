import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Modal from './components/Modal';
import { useGameSetup } from './features/gameSetup/GameSetupContext';
import './App.css';
import GameplayPage from './pages/GameplayPage';
import GameSetupPage from './pages/GameSetupPage';
import StartPage from './pages/StartPage';

function App() {
  const navigate = useNavigate();
  const { resetGame } = useGameSetup();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleEndGame = () => {
    resetGame();
    setIsSettingsOpen(false);
    navigate('/');
  };

  return (
    <>
      <button
        aria-label="Open settings"
        className="app-settings-button"
        type="button"
        onClick={() => setIsSettingsOpen(true)}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>

      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/setup" element={<GameSetupPage />} />
        <Route path="/gameplay" element={<GameplayPage />} />
      </Routes>

      <Modal
        actions={
          <>
            <button type="button" onClick={handleEndGame}>
              End Game
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(false)}>
              Close
            </button>
          </>
        }
        ariaLabel="Settings"
        isOpen={isSettingsOpen}
      >
        <p>Settings</p>
      </Modal>
    </>
  );
}

export default App;
