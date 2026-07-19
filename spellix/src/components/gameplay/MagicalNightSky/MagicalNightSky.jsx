import { useEffect, useRef, useState } from 'react';
import './MagicalNightSky.css';

const STAR_COUNT = 96;
const SPELL_EFFECT_TYPES = ['orb', 'comet', 'swirl'];
const SPELL_COLOURS = ['#62c6ff', '#b388ff', '#62e6a7', '#ffe66d', '#ff7ac8', '#ff9f5a'];
const SPELL_EFFECT_MIN_DURATION_MS = 2400;
const SPELL_EFFECT_MAX_DURATION_MS = 4200;
const SPELL_EFFECT_MIN_SPAWN_MS = 500;
const SPELL_EFFECT_MAX_SPAWN_MS = 1500;
const MAX_ACTIVE_SPELL_EFFECTS = 8;
let skySeedCounter = 0;

function createDecorativeRandomFn() {
  skySeedCounter += 1;
  let state = (Date.now() + skySeedCounter * 2654435761) >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getRandomValue(minimum, maximum, randomFn) {
  return minimum + randomFn() * (maximum - minimum);
}

function createStars(randomFn) {
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const duration = getRandomValue(2.4, 5.8, randomFn);

    return {
      id: `star-${index + 1}`,
      style: {
        '--sky-left': `${getRandomValue(0, 100, randomFn).toFixed(2)}%`,
        '--sky-top': `${getRandomValue(0, 100, randomFn).toFixed(2)}%`,
        '--sky-size': `${getRandomValue(1, 3.4, randomFn).toFixed(2)}px`,
        '--sky-opacity': getRandomValue(0.35, 0.85, randomFn).toFixed(2),
        '--sky-duration': `${duration.toFixed(2)}s`,
        '--sky-delay': `${(-getRandomValue(0, duration, randomFn)).toFixed(2)}s`,
      },
    };
  });
}

function createSpellEffect(randomFn, id, effectType) {
  const durationMs = Math.round(
    getRandomValue(SPELL_EFFECT_MIN_DURATION_MS, SPELL_EFFECT_MAX_DURATION_MS, randomFn)
  );
  const colourIndex = Math.floor(randomFn() * SPELL_COLOURS.length);

  return {
    durationMs,
    id: `spell-${id}`,
    type: effectType,
    style: {
      '--sky-left': `${getRandomValue(2, 98, randomFn).toFixed(2)}%`,
      '--sky-top': `${getRandomValue(2, 98, randomFn).toFixed(2)}%`,
      '--sky-size': `${getRandomValue(14, 32, randomFn).toFixed(2)}px`,
      '--sky-duration': `${(durationMs / 1000).toFixed(2)}s`,
      '--sky-delay': '0s',
      '--sky-colour': SPELL_COLOURS[colourIndex],
      '--sky-travel-x': `${getRandomValue(-140, 140, randomFn).toFixed(2)}px`,
      '--sky-travel-y': `${getRandomValue(-100, 100, randomFn).toFixed(2)}px`,
      '--sky-rotation': `${getRandomValue(-45, 45, randomFn).toFixed(2)}deg`,
    },
  };
}

function MagicalNightSky({ randomFn }) {
  const decorativeRandomRef = useRef(null);
  const effectIdRef = useRef(SPELL_EFFECT_TYPES.length);
  const [stars] = useState(() => {
    const decorativeRandomFn = randomFn ?? createDecorativeRandomFn();
    decorativeRandomRef.current = decorativeRandomFn;

    return createStars(decorativeRandomFn);
  });
  const [spellEffects, setSpellEffects] = useState(() =>
    SPELL_EFFECT_TYPES.map((effectType, index) =>
      createSpellEffect(decorativeRandomRef.current, index + 1, effectType)
    )
  );
  const initialSpellEffectsRef = useRef(spellEffects);

  useEffect(() => {
    const removalTimers = new Set();
    let spawnTimer = null;
    let isUnmounted = false;

    const removeAfterAnimation = (effect) => {
      const removalTimer = setTimeout(() => {
        removalTimers.delete(removalTimer);

        if (!isUnmounted) {
          setSpellEffects((currentEffects) =>
            currentEffects.filter(({ id }) => id !== effect.id)
          );
        }
      }, effect.durationMs);

      removalTimers.add(removalTimer);
    };

    const scheduleNextEffect = () => {
      const random = decorativeRandomRef.current;
      const spawnDelay = getRandomValue(
        SPELL_EFFECT_MIN_SPAWN_MS,
        SPELL_EFFECT_MAX_SPAWN_MS,
        random
      );

      spawnTimer = setTimeout(() => {
        const effectType =
          SPELL_EFFECT_TYPES[Math.floor(random() * SPELL_EFFECT_TYPES.length)];
        effectIdRef.current += 1;
        const effect = createSpellEffect(random, effectIdRef.current, effectType);

        setSpellEffects((currentEffects) =>
          [...currentEffects, effect].slice(-MAX_ACTIVE_SPELL_EFFECTS)
        );
        removeAfterAnimation(effect);
        scheduleNextEffect();
      }, spawnDelay);
    };

    initialSpellEffectsRef.current.forEach(removeAfterAnimation);
    scheduleNextEffect();

    return () => {
      isUnmounted = true;
      clearTimeout(spawnTimer);
      removalTimers.forEach((timer) => clearTimeout(timer));
      removalTimers.clear();
    };
  }, []);

  return (
    <div aria-hidden="true" className="magical-night-sky" data-testid="magical-night-sky">
      {stars.map((star) => (
        <span
          key={star.id}
          className="magical-night-sky-star"
          data-testid="magical-night-sky-star"
          style={star.style}
        />
      ))}
      {spellEffects.map((effect) => (
        <span
          key={effect.id}
          className={`magical-night-sky-spell magical-night-sky-spell--${effect.type}`}
          data-effect-type={effect.type}
          data-testid="magical-night-sky-spell"
          style={effect.style}
        />
      ))}
    </div>
  );
}

export default MagicalNightSky;
