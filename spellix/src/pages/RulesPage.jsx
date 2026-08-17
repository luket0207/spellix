import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MagicalNightSky from '../components/gameplay/MagicalNightSky/MagicalNightSky';
import RulesBody from '../features/rules/RulesBody';
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
        <RulesBody
          language={language}
          onBack={returnToStart}
          onLanguageChange={setLanguage}
        />
      </article>
    </main>
  );
}

export default RulesPage;
