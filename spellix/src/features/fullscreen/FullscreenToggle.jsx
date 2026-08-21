import {
  faDownLeftAndUpRightToCenter,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';

const FULLSCREEN_LABELS = {
  en: {
    enter: 'Enter fullscreen',
    exit: 'Exit fullscreen',
  },
  jp: {
    enter: '\u5168\u753b\u9762\u8868\u793a\u306b\u3059\u308b',
    exit: '\u5168\u753b\u9762\u8868\u793a\u3092\u7d42\u4e86\u3059\u308b',
  },
};

function getFullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function FullscreenToggle({ language = 'en' }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const normalizedLanguage = language === 'jp' ? 'jp' : 'en';
  const labels = FULLSCREEN_LABELS[normalizedLanguage];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggle = async (event) => {
    event.stopPropagation();

    try {
      if (getFullscreenElement()) {
        const exitFullscreen =
          document.exitFullscreen ?? document.webkitExitFullscreen;

        if (typeof exitFullscreen === 'function') {
          await exitFullscreen.call(document);
        }
      } else {
        const fullscreenTarget = document.documentElement;
        const requestFullscreen =
          fullscreenTarget.requestFullscreen ??
          fullscreenTarget.webkitRequestFullscreen;

        if (typeof requestFullscreen === 'function') {
          await requestFullscreen.call(fullscreenTarget);
        }
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed.', error);
    }
  };

  return (
    <button
      aria-label={isFullscreen ? labels.exit : labels.enter}
      className="floating-icon-button fullscreen-toggle-button"
      type="button"
      onClick={handleToggle}
    >
      <FontAwesomeIcon
        icon={
          isFullscreen
            ? faDownLeftAndUpRightToCenter
            : faUpRightAndDownLeftFromCenter
        }
      />
    </button>
  );
}

export default FullscreenToggle;
