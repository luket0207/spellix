import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import {
  GameSetupProvider,
  useGameSetup,
} from '../gameSetup/GameSetupContext';
import { createInitialGameSetup, createPlayers } from '../gameSetup/gameSetup';
import {
  createSaveFileText,
  downloadSaveFile,
  parseSaveFileText,
} from './saveGame';

jest.mock('./saveGame', () => ({
  ...jest.requireActual('./saveGame'),
  downloadSaveFile: jest.fn(),
}));

jest.mock('../../pages/GameplayPage', () => ({
  isChooseEventModeEnabled,
}) => (
  <main aria-label="gameplay panel">
    {`Choose event mode: ${isChooseEventModeEnabled ? 'on' : 'off'}`}
  </main>
));

function createSavedGameState(language = 'en') {
  const players = createPlayers(2).map((player, index) => ({
    ...player,
    currentHealth: index === 0 ? 42 : 88,
    hasCommittedInitialSpells: true,
    language: index === 0 ? language : player.language,
    position:
      index === 0
        ? { featureId: 'elite-battle-top-left', type: 'feature', x: 2, y: 3 }
        : { x: 0, y: 29 },
  }));

  players[0].eliteProgress.eliteTowerWoods = true;
  players[0].potions = [{ id: 'saved-potion', type: 'healing' }];
  players[0].mergedColumns = [{ columns: [1, 2], id: 'saved-merge' }];

  return {
    ...createInitialGameSetup(),
    board: {
      features: [{ id: 'elite-battle-top-left' }],
      height: 31,
      squares: [{ environment: 'woods', x: 2, y: 3 }],
      width: 31,
    },
    currentTurnIndex: 1,
    debugMode: true,
    eliteBossEnemyAssignments: {
      bossBattle: 'hellcrown-reaper',
      eliteTowerGravel: 'amethyst-ogre',
      eliteTowerWoods: 'mossroot-elder',
    },
    playerCount: players.length,
    players,
    turnOrder: ['player-2', 'player-1'],
  };
}

function SavedStateProbe() {
  const { gameSetup } = useGameSetup();
  const player = gameSetup.players[0];

  return (
    <output aria-label="saved state probe">
      {JSON.stringify({
        board: gameSetup.board,
        currentTurnIndex: gameSetup.currentTurnIndex,
        debugMode: gameSetup.debugMode,
        eliteBossEnemyAssignments: gameSetup.eliteBossEnemyAssignments,
        player: {
          currentHealth: player.currentHealth,
          eliteProgress: player.eliteProgress,
          mergedColumns: player.mergedColumns,
          position: player.position,
          potions: player.potions,
        },
        turnOrder: gameSetup.turnOrder,
      })}
    </output>
  );
}

function renderApp(route = '/', initialGameSetup = null) {
  return render(
    <GameSetupProvider initialGameSetup={initialGameSetup}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[route]}
      >
        <App />
        <SavedStateProbe />
      </MemoryRouter>
    </GameSetupProvider>
  );
}

describe('save and load game flow', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('opens a txt file picker from the bilingual Load Game button', async () => {
    const inputClickSpy = jest
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {});

    renderApp();
    await userEvent.click(
      screen.getByRole('button', { name: 'Load Game - ゲームを読み込む' })
    );

    expect(inputClickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Load saved game file')).toHaveAttribute(
      'accept',
      '.txt,text/plain'
    );
  });

  test('shows localized Save Game only in gameplay settings and downloads context state', async () => {
    const gameState = createSavedGameState();
    const view = renderApp('/gameplay', gameState);

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save Game' }));

    expect(downloadSaveFile).toHaveBeenCalledTimes(1);
    expect(parseSaveFileText(downloadSaveFile.mock.calls[0][0])).toEqual(
      expect.objectContaining({ gameState })
    );

    view.unmount();
    renderApp('/', createSavedGameState());

    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Save Game|ゲームを保存/ })).toBeNull();
  });

  test('uses the Japanese Save Game label for a Japanese current player', async () => {
    renderApp('/gameplay', createSavedGameState('jp'));

    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('button', { name: 'ゲームを保存' })).toBeInTheDocument();
  });

  test('loads a valid txt save, restores all sampled state, and navigates to gameplay', async () => {
    const gameState = createSavedGameState();
    const fileText = createSaveFileText(gameState, {
      isChooseEventModeEnabled: true,
    });

    renderApp();
    fireEvent.change(screen.getByLabelText('Load saved game file'), {
      target: {
        files: [new File([fileText], 'spellix-save.txt', { type: 'text/plain' })],
      },
    });

    expect(await screen.findByLabelText('gameplay panel')).toHaveTextContent(
      'Choose event mode: on'
    );
    expect(screen.getByLabelText('saved state probe')).toHaveTextContent(
      JSON.stringify({
        board: gameState.board,
        currentTurnIndex: gameState.currentTurnIndex,
        debugMode: gameState.debugMode,
        eliteBossEnemyAssignments: gameState.eliteBossEnemyAssignments,
        player: {
          currentHealth: gameState.players[0].currentHealth,
          eliteProgress: gameState.players[0].eliteProgress,
          mergedColumns: gameState.players[0].mergedColumns,
          position: gameState.players[0].position,
          potions: gameState.players[0].potions,
        },
        turnOrder: gameState.turnOrder,
      })
    );
  });

  test('keeps the start page active and shows a bilingual modal for an invalid file', async () => {
    renderApp();
    fireEvent.change(screen.getByLabelText('Load saved game file'), {
      target: {
        files: [new File(['not a save'], 'invalid.txt', { type: 'text/plain' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Load game error' })).toBeInTheDocument();
    });
    expect(screen.getByText('This save file could not be loaded.')).toBeInTheDocument();
    expect(screen.getByText('このセーブファイルを読み込めませんでした。')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spellix' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: 'Load game error' })).toBeNull();
  });
});
