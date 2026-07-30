import { fireEvent, render, screen } from '@testing-library/react';
import { POTION_DEFINITIONS } from '../../data/potions';
import {
  FIELD_VILLAGE,
  FOREST_VILLAGE,
} from '../villages/villageVisits';
import {
  GameSetupProvider,
  useGameSetup,
} from './GameSetupContext';
import { createInitialGameSetup } from './gameSetup';

function VillageProbe() {
  const {
    completeVillageReward,
    claimLootChestReward,
    discardSelectedRewardToken,
    finishVillageVisit,
    gameSetup,
    healVillagePlayer,
    pendingNextTurnModal,
    resolveSelectedPotionReward,
    startVillageReward,
    startVillageVisit,
  } = useGameSetup();
  const visit = gameSetup.villageVisit;
  const player = gameSetup.players[0];

  return (
    <div>
      <p>{`Visit: ${visit?.villageId ?? 'none'}`}</p>
      <p>{`Phase: ${visit?.phase ?? 'none'}`}</p>
      <p>{`Reward: ${visit?.rewardType ?? 'none'}`}</p>
      <p>{`Enemy: ${visit?.defeatedEnemyId ?? 'none'}`}</p>
      <p>{`Field claims: ${player.villageProgress.fieldVillage.claimedEliteCounts.join(',')}`}</p>
      <p>{`Forest claims: ${player.villageProgress.forestVillage.claimedEliteCounts.join(',')}`}</p>
      <p>{`Health: ${player.currentHealth}`}</p>
      <p>{`Died: ${player.diedLastTurn}`}</p>
      <p>{`Battle source: ${gameSetup.activeBattle?.source ?? 'none'}`}</p>
      <p>{`Reward destination: ${gameSetup.activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <p>{`Mini game: ${gameSetup.miniGameResult?.type ?? 'none'}`}</p>
      <p>{`Current turn: ${gameSetup.turnOrder[gameSetup.currentTurnIndex]}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal}`}</p>
      <button
        type="button"
        onClick={() => startVillageVisit('player-1', FIELD_VILLAGE, () => 0)}
      >
        Visit Field
      </button>
      <button
        type="button"
        onClick={() => startVillageVisit('player-1', FOREST_VILLAGE, () => 0)}
      >
        Visit Forest
      </button>
      <button type="button" onClick={startVillageReward}>
        Start Reward
      </button>
      <button type="button" onClick={completeVillageReward}>
        Complete Reward
      </button>
      <button
        type="button"
        onClick={() =>
          claimLootChestReward({
            category: 'Nothing',
            id: 'village-nothing',
            itemType: 'nothing',
          })
        }
      >
        Claim Nothing
      </button>
      <button
        type="button"
        onClick={() =>
          claimLootChestReward({
            category: 'Common Token',
            id: 'village-token',
            item: { label: 'Red', rarity: 'Common', type: 'red' },
            itemType: 'token',
          })
        }
      >
        Claim Token
      </button>
      <button type="button" onClick={discardSelectedRewardToken}>
        Discard Token
      </button>
      <button
        type="button"
        onClick={() => resolveSelectedPotionReward(0)}
      >
        Replace Potion
      </button>
      <button type="button" onClick={healVillagePlayer}>
        Heal
      </button>
      <button type="button" onClick={finishVillageVisit}>
        Finish
      </button>
    </div>
  );
}

function renderProbe(setup = createInitialGameSetup()) {
  render(
    <GameSetupProvider initialGameSetup={setup}>
      <VillageProbe />
    </GameSetupProvider>
  );
}

test('claims each village zero-elite tier independently and only once', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Field claims: 0')).toBeInTheDocument();
  expect(screen.getByText('Forest claims:')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Phase: heal')).toBeInTheDocument();
  expect(screen.getByText('Reward: none')).toBeInTheDocument();
  expect(screen.getByText('Field claims: 0')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Forest' }));

  expect(screen.getByText('Visit: forestVillage')).toBeInTheDocument();
  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Forest claims: 0')).toBeInTheDocument();
});

test('creates the current elite tier without backfilling earlier tiers', () => {
  const setup = createInitialGameSetup();

  setup.eliteBossEnemyAssignments.eliteTowerGravel = 'crowned-lichlord';
  setup.players[0].eliteProgress.eliteTowerGravel = true;
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Reward: potion')).toBeInTheDocument();
  expect(screen.getByText('Enemy: crowned-lichlord')).toBeInTheDocument();
  expect(screen.getByText('Field claims: 1')).toBeInTheDocument();
});

test('resolves a village potion before healing and advancing the turn', () => {
  const setup = createInitialGameSetup();

  setup.players[0].currentHealth = 0;
  setup.players[0].diedLastTurn = true;
  setup.players[0].eliteProgress.eliteTowerGravel = true;
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));

  expect(screen.getByText('Phase: rewardFlow')).toBeInTheDocument();
  expect(screen.getByText('Battle source: village')).toBeInTheDocument();
  expect(screen.getByText('Reward destination: potionSlot')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Heal' }));

  expect(screen.getByText('Phase: healed')).toBeInTheDocument();
  expect(screen.getByText('Health: 100')).toBeInTheDocument();
  expect(screen.getByText('Died: false')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

  expect(screen.getByText('Visit: none')).toBeInTheDocument();
  expect(screen.getByText('Current turn: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
});

test('returns direct and assigned Loot Chest rewards to village healing', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));

  expect(screen.getByText('Mini game: villageLootChest')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Claim Nothing' }));

  expect(screen.getByText('Phase: heal')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Forest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Token' }));

  expect(screen.getByText('Phase: rewardFlow')).toBeInTheDocument();
  expect(screen.getByText('Battle source: lootChest')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Token' }));

  expect(screen.getByText('Reward destination: discarded')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: heal')).toBeInTheDocument();
  expect(screen.getByText('Battle source: none')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
});

test('requires full potion replacement resolution before village healing', () => {
  const setup = createInitialGameSetup();

  setup.eliteBossEnemyAssignments.eliteTowerGravel = 'crowned-lichlord';
  setup.players[0].eliteProgress.eliteTowerGravel = true;
  setup.players[0].potions = POTION_DEFINITIONS.slice(0, 3);
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: rewardFlow')).toBeInTheDocument();
  expect(screen.getByText('Reward destination: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Replace Potion' }));

  expect(
    screen.getByText('Reward destination: potionSlotReplacement')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: heal')).toBeInTheDocument();
});
