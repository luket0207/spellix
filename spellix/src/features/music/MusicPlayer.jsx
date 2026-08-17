import { faVolume, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { createShuffledTrackQueue } from './musicQueue';
import { MUSIC_TRACKS } from './musicTracks';

const DEFAULT_MUSIC_VOLUME = 0.35;
const MUSIC_LABELS = {
  en: {
    disable: 'Turn music off',
    enable: 'Turn music on',
  },
  jp: {
    disable: '\u97f3\u697d\u3092\u30aa\u30d5\u306b\u3059\u308b',
    enable: '\u97f3\u697d\u3092\u30aa\u30f3\u306b\u3059\u308b',
  },
};

function MusicPlayer({ language = 'en', randomFn = Math.random, tracks = MUSIC_TRACKS }) {
  const audioRef = useRef(null);
  const failedTracksRef = useRef(new Set());
  const initialQueueRef = useRef(null);
  const queueRef = useRef([]);

  if (initialQueueRef.current === null) {
    initialQueueRef.current = createShuffledTrackQueue(tracks, { randomFn });
    queueRef.current = initialQueueRef.current.slice(1);
  }

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(
    initialQueueRef.current[0] ?? ''
  );
  const [isMusicEnabled, setIsMusicEnabled] = useState(
    initialQueueRef.current.length > 0
  );
  const normalizedLanguage = language === 'jp' ? 'jp' : 'en';
  const labels = MUSIC_LABELS[normalizedLanguage];

  const advanceTrack = (failedTrack = '') => {
    if (failedTrack) {
      failedTracksRef.current.add(failedTrack);
    }

    const availableTracks = tracks.filter(
      (track) => !failedTracksRef.current.has(track)
    );

    if (availableTracks.length === 0) {
      queueRef.current = [];
      setAutoplayBlocked(false);
      setCurrentTrack('');
      setIsMusicEnabled(false);
      return;
    }

    let queue = queueRef.current.filter((track) =>
      availableTracks.includes(track)
    );

    if (queue.length === 0) {
      queue = createShuffledTrackQueue(availableTracks, {
        previousTrack: currentTrack,
        randomFn,
      });
    }

    const [nextTrack, ...remainingTracks] = queue;

    queueRef.current = remainingTracks;
    setCurrentTrack(nextTrack);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = DEFAULT_MUSIC_VOLUME;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack || !isMusicEnabled) {
      return undefined;
    }

    let isActive = true;

    try {
      const playResult = audio.play();

      if (playResult && typeof playResult.then === 'function') {
        playResult
          .then(() => {
            if (isActive) {
              setAutoplayBlocked(false);
            }
          })
          .catch(() => {
            if (isActive) {
              setAutoplayBlocked(true);
            }
          });
      } else {
        setAutoplayBlocked(false);
      }
    } catch (_error) {
      setAutoplayBlocked(true);
    }

    return () => {
      isActive = false;
    };
  }, [currentTrack, isMusicEnabled]);

  useEffect(() => {
    if (!autoplayBlocked || !isMusicEnabled || !currentTrack) {
      return undefined;
    }

    const retryPlayback = () => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      try {
        const playResult = audio.play();

        if (playResult && typeof playResult.then === 'function') {
          playResult.then(() => setAutoplayBlocked(false)).catch(() => {});
        } else {
          setAutoplayBlocked(false);
        }
      } catch (_error) {
        // A later user interaction can retry playback again.
      }
    };

    document.addEventListener('click', retryPlayback);
    document.addEventListener('keydown', retryPlayback);
    document.addEventListener('touchstart', retryPlayback);

    return () => {
      document.removeEventListener('click', retryPlayback);
      document.removeEventListener('keydown', retryPlayback);
      document.removeEventListener('touchstart', retryPlayback);
    };
  }, [autoplayBlocked, currentTrack, isMusicEnabled]);

  const handleToggle = (event) => {
    event.stopPropagation();

    if (!currentTrack) {
      return;
    }

    if (isMusicEnabled) {
      audioRef.current?.pause();
      setAutoplayBlocked(false);
      setIsMusicEnabled(false);
      return;
    }

    setIsMusicEnabled(true);
  };

  const handleTrackError = () => {
    console.warn('Background music track failed to load.', currentTrack);
    advanceTrack(currentTrack);
  };

  const isUnavailable = !currentTrack;
  const ariaLabel = isUnavailable
    ? 'Music unavailable'
    : isMusicEnabled
      ? labels.disable
      : labels.enable;

  return (
    <>
      <audio
        aria-label="Background music"
        onEnded={() => advanceTrack()}
        onError={handleTrackError}
        preload="auto"
        ref={audioRef}
        src={currentTrack || undefined}
      />
      <button
        aria-label={ariaLabel}
        className="floating-icon-button music-toggle-button"
        disabled={isUnavailable}
        type="button"
        onClick={handleToggle}
      >
        <FontAwesomeIcon
          icon={isMusicEnabled && !isUnavailable ? faVolume : faVolumeXmark}
        />
      </button>
    </>
  );
}

export default MusicPlayer;
