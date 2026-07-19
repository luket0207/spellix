import { useEffect, useState } from 'react';
import {
  BATTLE_ENVIRONMENTS,
  getBattleBackgroundSource,
} from '../features/battle/battleEnvironments';
import './BattleBackgroundSlideshow.css';

const BACKGROUND_INTERVAL_MS = 15000;

function BattleBackgroundSlideshow() {
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setBackgroundIndex(
        (currentIndex) => (currentIndex + 1) % BATTLE_ENVIRONMENTS.length
      );
    }, BACKGROUND_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return BATTLE_ENVIRONMENTS.map((environment, index) => (
    <span
      aria-hidden="true"
      className={`start-page-background${
        index === backgroundIndex ? ' start-page-background--visible' : ''
      }`}
      data-testid={`start-page-background-${environment}`}
      key={environment}
      style={{
        backgroundImage: `url(${getBattleBackgroundSource(environment)})`,
      }}
    />
  ));
}

export default BattleBackgroundSlideshow;
