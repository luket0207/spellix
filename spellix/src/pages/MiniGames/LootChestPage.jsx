import { useEffect, useState } from 'react';
import { faToolbox, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import MagicalNightSky from '../../components/gameplay/MagicalNightSky/MagicalNightSky';
import PotionIcon from '../../components/potions/PotionIcon';
import Token from '../../components/tokens/Token';
import { getPotionName } from '../../data/potions';
import { getTokenName } from '../../data/tokens';
import { useGameSetup } from '../../features/gameSetup/GameSetupContext';
import {
  generateLootChestRewards,
  shuffleLootChestRewards,
} from '../../features/miniGames/lootChest';
import {
  getGameplayLanguage,
  getLootChestTranslations,
} from '../../i18n/translations';
import './LootChestPage.css';

const REWARD_REVEAL_DURATION = 2500;
const REWARD_ENTRY_DURATION = 1000;
const CHEST_SHUFFLE_DURATION = 1400;
const PHASE_CLASS_NAMES = {
  processingReward: 'processing-reward',
  readyToChoose: 'ready-to-choose',
  rewardRevealed: 'reward-revealed',
  rewardsEnteringChests: 'rewards-entering',
  showingRewards: 'showing-rewards',
  shufflingChests: 'shuffling',
};

function LootRewardIcon({ language, reward, testId }) {
  if (reward.itemType === 'token') {
    return (
      <div data-testid={testId}>
        <Token
          ariaLabel={`${getTokenName(reward.item.type, language)} token reward`}
          focusable={false}
          language={language}
          showName={false}
          showTooltip={false}
          tokenType={reward.item.type}
        />
      </div>
    );
  }

  if (reward.itemType === 'potion') {
    return (
      <div data-testid={testId}>
        <PotionIcon
          focusable={false}
          language={language}
          potion={reward.item}
          showName={false}
        />
      </div>
    );
  }

  return (
    <div data-testid={testId}>
      <FontAwesomeIcon
        aria-label="Nothing reward"
        className="loot-nothing-icon"
        icon={faXmark}
        role="img"
      />
    </div>
  );
}

function getRewardDisplayName(reward, language, translations) {
  if (reward.itemType === 'token') {
    const tokenName = getTokenName(reward.item.type, language);

    return language === 'jp' ? `${tokenName}\u30c8\u30fc\u30af\u30f3` : `${tokenName} token`;
  }

  if (reward.itemType === 'potion') {
    const potionName = getPotionName(reward.item, language);

    return language === 'jp' ? `${potionName}\u30dd\u30fc\u30b7\u30e7\u30f3` : `${potionName} potion`;
  }

  return translations.nothing;
}

function LootChestPage({ randomFn = Math.random }) {
  const navigate = useNavigate();
  const {
    claimLootChestReward,
    currentPlayer,
    returnFromMiniGame,
  } = useGameSetup();
  const [generatedRewards] = useState(() =>
    generateLootChestRewards(randomFn)
  );
  const [finalChestRewards, setFinalChestRewards] = useState(null);
  const [phase, setPhase] = useState('showingRewards');
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const language = getGameplayLanguage(currentPlayer?.language);
  const translations = getLootChestTranslations(language);
  const chestRewards = finalChestRewards ?? generatedRewards;
  const selectedReward = finalChestRewards?.find(
    ({ id }) => id === selectedRewardId
  );

  useEffect(() => {
    const entryTimer = setTimeout(
      () => setPhase('rewardsEnteringChests'),
      REWARD_REVEAL_DURATION
    );
    const shuffleTimer = setTimeout(
      () => setPhase('shufflingChests'),
      REWARD_REVEAL_DURATION + REWARD_ENTRY_DURATION
    );
    const readyTimer = setTimeout(() => {
      setFinalChestRewards(shuffleLootChestRewards(generatedRewards, randomFn));
      setPhase('readyToChoose');
    }, REWARD_REVEAL_DURATION + REWARD_ENTRY_DURATION + CHEST_SHUFFLE_DURATION);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(shuffleTimer);
      clearTimeout(readyTimer);
    };
  }, [generatedRewards, randomFn]);

  const handleChoose = (rewardId) => {
    if (phase !== 'readyToChoose') {
      return;
    }

    setSelectedRewardId(rewardId);
    setPhase('rewardRevealed');
  };

  const handleContinue = () => {
    if (phase !== 'rewardRevealed' || !selectedReward) {
      return;
    }

    setPhase('processingReward');
    const destination = claimLootChestReward(selectedReward);

    if (destination === '/gameplay') {
      returnFromMiniGame();
    }

    navigate(destination, { replace: true });
  };

  const showPreviewRewards = ['showingRewards', 'rewardsEnteringChests'].includes(phase);
  const showChooseButtons = ['readyToChoose', 'rewardRevealed'].includes(phase);

  return (
    <main className="loot-chest-page">
      <MagicalNightSky />
      <svg aria-hidden="true" className="loot-chest-gradient-definition">
        <defs>
          <linearGradient id="loot-chest-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff36b" />
            <stop offset="1" stopColor="#e87918" />
          </linearGradient>
        </defs>
      </svg>
      <section
        aria-label="Loot chest choices"
        className={`loot-chest-panel loot-chest-page--${PHASE_CLASS_NAMES[phase]}`}
      >
        <h1 className={`loot-chest-title language-${language}`}>{translations.title}</h1>
        <div className="loot-chest-row">
          {chestRewards.map((reward, index) => {
            const isSelected = selectedRewardId === reward.id;

            return (
              <div
                aria-label={`Loot chest choice ${index + 1}`}
                className="loot-chest-choice"
                key={`loot-chest-position-${index + 1}`}
              >
                {showPreviewRewards ? (
                  <div className="loot-reward-preview">
                    <LootRewardIcon
                      language={language}
                      reward={reward}
                      testId="loot-reward-preview"
                    />
                  </div>
                ) : null}
                <div
                  className="loot-chest-visual-slot"
                  data-testid="loot-chest-visual-slot"
                >
                  <FontAwesomeIcon
                    aria-label={`Loot chest ${index + 1}`}
                    className={`loot-chest-icon${isSelected ? ' is-opening' : ''}`}
                    icon={faToolbox}
                    role="img"
                  />
                  {isSelected ? (
                    <div className="loot-reward-reveal">
                      <LootRewardIcon
                        language={language}
                        reward={reward}
                        testId="loot-reward-reveal"
                      />
                    </div>
                  ) : null}
                </div>
                {showChooseButtons ? (
                  <Button
                    className={`loot-chest-choose language-${language}`}
                    disabled={phase !== 'readyToChoose'}
                    type="button"
                    onClick={() => handleChoose(reward.id)}
                  >
                    {translations.choose}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="loot-chest-result" data-testid="loot-chest-result-area">
          {selectedReward ? (
            <>
              <p className={`language-${language}`}>
                {translations.result(
                  getRewardDisplayName(selectedReward, language, translations),
                  selectedReward.itemType !== 'nothing'
                )}
              </p>
              <Button
                className={`language-${language}`}
                disabled={phase !== 'rewardRevealed'}
                type="button"
                onClick={handleContinue}
              >
                {translations.continue}
              </Button>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default LootChestPage;
