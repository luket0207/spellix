import Button from '../../components/common/Button/Button';
import { RULES_CONTENT } from './rulesContent';

function RulesBody({
  backLabels = null,
  language,
  onBack,
  onLanguageChange,
}) {
  const content = RULES_CONTENT[language];
  const backLabel = backLabels?.[language] ?? content.backLabel;

  return (
    <div className={`rules-content language-${language}`}>
      <div className="rules-controls">
        <Button type="button" onClick={onBack}>
          {backLabel}
        </Button>
        <div aria-label="Rules language" role="group">
          <Button
            aria-pressed={language === 'en'}
            type="button"
            variant="secondary"
            onClick={() => onLanguageChange('en')}
          >
            English
          </Button>
          <Button
            aria-pressed={language === 'jp'}
            type="button"
            variant="secondary"
            onClick={() => onLanguageChange('jp')}
          >
            日本語
          </Button>
        </div>
      </div>

      <h1>{content.title}</h1>
      {content.introduction.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      <Button type="button" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
}

export default RulesBody;
