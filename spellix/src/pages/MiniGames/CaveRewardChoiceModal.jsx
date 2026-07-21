import Button from '../../components/common/Button/Button';
import Modal from '../../components/Modal';
import PotionIcon from '../../components/potions/PotionIcon';
import Token from '../../components/tokens/Token';
import { getPotionName } from '../../data/potions';
import { getTokenName } from '../../data/tokens';
import { getCaveMiniGameTranslations } from '../../i18n/translations';

function CaveRewardChoiceModal({
  language,
  onDiscard,
  onReplace,
  pendingReward,
  player,
}) {
  if (!pendingReward || !player) {
    return null;
  }

  const translations = getCaveMiniGameTranslations(language).rewardGrant;
  const isToken = pendingReward.type === 'token';
  const title = isToken ? translations.tokenBagFull : translations.potionSlotsFull;

  return (
    <Modal
      actions={
        <Button className={`language-${language}`} type="button" onClick={onDiscard}>
          {isToken ? translations.discardNewToken : translations.discardNewPotion}
        </Button>
      }
      ariaLabel={title}
      isOpen
      panelClassName={`language-${language}`}
    >
      <h2>{title}</h2>
      <p>{isToken ? translations.newToken : translations.newPotion}</p>
      {isToken ? (
        <Token
          ariaLabel={`New ${getTokenName(pendingReward.item.type, language)} token`}
          language={language}
          showName
          tokenType={pendingReward.item.type}
        />
      ) : (
        <PotionIcon language={language} potion={pendingReward.item} />
      )}
      <p>{isToken ? translations.chooseToken : translations.choosePotion}</p>
      <div
        aria-label={isToken ? translations.currentTokens : translations.currentPotions}
        className="cave-reward-replacement-options"
        role="group"
      >
        {isToken
          ? player.tokenBag.map((token) => {
              const tokenName = getTokenName(token.type, language);
              const replaceLabel = translations.replaceToken(tokenName);

              return (
                <div key={token.id}>
                  <Button
                    aria-label={replaceLabel}
                    className={`language-${language}`}
                    type="button"
                    onClick={() => onReplace(token.id)}
                  >
                    <Token
                      ariaLabel={`Existing ${tokenName} token`}
                      focusable={false}
                      language={language}
                      showName
                      tokenType={token.type}
                    />
                    <span>{replaceLabel}</span>
                  </Button>
                </div>
              );
            })
          : player.potions.map((potion, index) => {
              const potionName = getPotionName(potion, language);
              const replaceLabel = translations.replacePotion(potionName);

              return (
                <div key={`${potion.id}-${index}`}>
                  <Button
                    aria-label={replaceLabel}
                    className={`language-${language}`}
                    type="button"
                    onClick={() => onReplace(index)}
                  >
                    <PotionIcon focusable={false} language={language} potion={potion} />
                    <span>{replaceLabel}</span>
                  </Button>
                </div>
              );
            })}
      </div>
    </Modal>
  );
}

export default CaveRewardChoiceModal;
