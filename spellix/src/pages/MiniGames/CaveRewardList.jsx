import { getPotionName } from '../../data/potions';
import { getTokenName } from '../../data/tokens';

function CaveRewardList({
  caveRewards,
  className,
  language,
  showEmpty = false,
  testId,
  translations,
}) {
  const tokenName = getTokenName(caveRewards.token?.type, language);
  const potionName = getPotionName(caveRewards.potion, language);
  const rewardLabels = [
    caveRewards.token
      ? `${translations.summary.token}${tokenName ? `: ${tokenName}` : ''}`
      : null,
    caveRewards.potion
      ? `${translations.summary.potion}${potionName ? `: ${potionName}` : ''}`
      : null,
    caveRewards.hasRollAgainPotion ? translations.summary.rollAgain : null,
    caveRewards.hasLootChest ? translations.summary.loot : null,
  ].filter(Boolean);

  if (rewardLabels.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <div className={`${className} language-${language}`} data-testid={testId}>
      <p className="cave-reward-list-title">{translations.summary.title}</p>
      <div className="cave-reward-list-items">
        {rewardLabels.length > 0 ? (
          rewardLabels.map((rewardLabel) => <div key={rewardLabel}>{rewardLabel}</div>)
        ) : (
          <div>{translations.summary.none}</div>
        )}
      </div>
    </div>
  );
}

export default CaveRewardList;
