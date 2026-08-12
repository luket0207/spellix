import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button/Button';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import { RULES_CONTENT } from '../features/rules/rulesContent';
import './RulesPage.css';

function RulesPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const content = RULES_CONTENT[language];
  const languageClassName = `language-${language}`;
  const returnToStart = () => navigate('/');

  return (
    <main className="rules-page magical-night-sky-page">
      <MagicalNightSky />
      <article aria-label={content.title} className={`rules-modal ${languageClassName}`}>
        <div className="rules-controls">
          <Button type="button" onClick={returnToStart}>
            {content.backLabel}
          </Button>
          <div aria-label="Rules language" role="group">
            <Button
              aria-pressed={language === 'en'}
              type="button"
              variant="secondary"
              onClick={() => setLanguage('en')}
            >
              English
            </Button>
            <Button
              aria-pressed={language === 'jp'}
              type="button"
              variant="secondary"
              onClick={() => setLanguage('jp')}
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

        <Button type="button" onClick={returnToStart}>
          {content.backLabel}
        </Button>
      </article>
    </main>
  );
}

export default RulesPage;
