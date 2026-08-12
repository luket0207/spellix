import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createPlayers } from '../features/gameSetup/gameSetup';
import { GameSetupProvider } from '../features/gameSetup/GameSetupContext';
import StoryPage from './StoryPage';

const assignments = {
  bossBattle: 'hellcrown-reaper',
  eliteTowerGravel: 'amethyst-ogre',
  eliteTowerWoods: 'mossroot-elder',
};

function createStorySetup(languages) {
  const players = createPlayers(languages.length).map((player, index) => ({
    ...player,
    gender: index === 1 ? 'girl' : 'boy',
    language: languages[index],
  }));

  return {
    board: {
      featureImages: [
        { id: 'elite-top-left', imageName: 'elite-tower-woods.png' },
        { id: 'elite-bottom-right', imageName: 'elite-tower-gravel.png' },
      ],
    },
    currentTurnIndex: 0,
    eliteBossEnemyAssignments: assignments,
    playerCount: players.length,
    players,
    turnOrder: players.map(({ id }) => id),
  };
}

function renderStoryPage(languages) {
  return render(
    <GameSetupProvider initialGameSetup={createStorySetup(languages)}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={['/story']}
      >
        <Routes>
          <Route path="/story" element={<StoryPage />} />
          <Route path="/gameplay" element={<p>Gameplay destination</p>} />
        </Routes>
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('StoryPage', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows only English for English players with actual players and enemies', () => {
    jest.useFakeTimers();
    renderStoryPage(['en', 'en', 'en']);

    expect(screen.getByTestId('magical-night-sky')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Game story' })).toBeInTheDocument();
    expect(screen.getByText(/Red Wizard, Blue Witch and Green Wizard/)).toBeInTheDocument();
    expect(screen.getByText(/Mossroot Elder in the north west tower/)).toBeInTheDocument();
    expect(screen.getByText(/Amethyst Ogre in the south east/)).toBeInTheDocument();
    expect(screen.getByText(/ultimate boss, Hellcrown Reaper/)).toBeInTheDocument();
    expect(screen.queryByText(/スペリックス王国/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  test('shows only Japanese for Japanese players with localized names', () => {
    jest.useFakeTimers();
    renderStoryPage(['jp', 'jp']);

    expect(screen.getByText(/赤の魔法使い、青の魔女は、スペリックス王国/)).toBeInTheDocument();
    expect(screen.getByText(/北西の塔にいる苔根の古老/)).toBeInTheDocument();
    expect(screen.getByText(/南東の塔にいる紫晶のオーガ/)).toBeInTheDocument();
    expect(screen.getByText(/究極のボス、地獄冠の死神/)).toBeInTheDocument();
    expect(screen.queryByText(/taking on a quest/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '続ける' })).toBeInTheDocument();
  });

  test('shows both languages with the required separation for mixed players', () => {
    jest.useFakeTimers();
    renderStoryPage(['en', 'jp']);

    expect(screen.getByText(/Red Wizard and Blue Witch are taking on a quest/)).toHaveClass(
      'story-text',
      'language-en'
    );
    expect(screen.getByText(/赤の魔法使い、青の魔女は、スペリックス王国/)).toHaveClass(
      'story-text',
      'language-jp'
    );
    expect(screen.getByRole('button', { name: 'Continue - 続ける' })).toBeInTheDocument();
  });

  test('continues to Gameplay', () => {
    jest.useFakeTimers();
    renderStoryPage(['en']);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Gameplay destination')).toBeInTheDocument();
  });
});
