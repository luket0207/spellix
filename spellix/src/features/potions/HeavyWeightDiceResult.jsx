import {
  getGameplayLanguage,
  getGameplayTranslations,
} from '../../i18n/translations';
import './HeavyWeightDiceResult.css';

function HeavyWeightDiceResult({ language = 'en', roll }) {
  const activeLanguage = getGameplayLanguage(language);
  const resultText =
    getGameplayTranslations(activeLanguage).heavyWeightDiceResult(roll);
  const message = resultText.slice(`${roll} - `.length);

  return (
    <div className="heavy-weight-dice-result">
      <p className="heavy-weight-dice-result-number">{roll}</p>
      <p
        className={`heavy-weight-dice-result-message language-${activeLanguage}`}
      >
        {message}
      </p>
    </div>
  );
}

export default HeavyWeightDiceResult;
