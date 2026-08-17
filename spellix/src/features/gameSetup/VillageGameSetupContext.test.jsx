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
    chooseVillageAction,
    completeTurnRespawn,
    completeVillageReward,
    claimLootChestReward,
    discardSelectedRewardToken,
    finishVillageWandsmith,
    finishVillageVisit,
    gameSetup,
    healVillagePlayer,
    pendingNextTurnModal,
    resetVillageActionLock,
    resolveSelectedPotionReward,
    setPlayerPosition,
    startVillageReward,
    startBattle,
    startVillageVisit,
  } = useGameSetup();
  const visit = gameSetup.villageVisit;
  const player = gameSetup.players[0];
  const secondPlayer = gameSetup.players[1];

  return (
    <div>
      <p>{`Visit: ${visit?.villageId ?? 'none'}`}</p>
      <p>{`Phase: ${visit?.phase ?? 'none'}`}</p>
      <p>{`Reward: ${visit?.rewardType ?? 'none'}`}</p>
      <p>{`Enemy: ${visit?.defeatedEnemyId ?? 'none'}`}</p>
      <p>{`P1 village claims: ${Object.entries(player.villageProgress).filter(([, claimed]) => claimed).map(([key]) => key).join(',') || 'none'}`}</p>
      <p>{`P2 village claims: ${Object.entries(secondPlayer.villageProgress).filter(([, claimed]) => claimed).map(([key]) => key).join(',') || 'none'}`}</p>
      <p>{`P1 village lock: ${player.villageActionState.currentVillageLockId ?? 'none'}`}</p>
      <p>{`P1 village actions: ${Object.entries(player.villageActionState.usedActionsForCurrentVillage).filter(([, used]) => used).map(([action]) => action).join(',') || 'none'}`}</p>
      <p>{`P2 village lock: ${secondPlayer.villageActionState.currentVillageLockId ?? 'none'}`}</p>
      <p>{`P2 village actions: ${Object.entries(secondPlayer.villageActionState.usedActionsForCurrentVillage).filter(([, used]) => used).map(([action]) => action).join(',') || 'none'}`}</p>
      <p>{`Reward rarity: ${visit?.rewardItem?.rarity ?? 'none'}`}</p>
      <p>{`Pending rewards: ${visit?.pendingRewards?.length ?? 0}`}</p>
      <p>{`Health: ${player.currentHealth}`}</p>
      <p>{`Active: ${player.activePotion?.id ?? 'none'}`}</p>
      <p>{`Died: ${player.diedLastTurn}`}</p>
      <p>{`Battle source: ${gameSetup.activeBattle?.source ?? 'none'}`}</p>
      <p>{`Reward destination: ${gameSetup.activeBattle?.rewardResolution?.destination ?? 'none'}`}</p>
      <p>{`Mini game: ${gameSetup.miniGameResult?.type ?? 'none'}`}</p>
      <p>{`Current turn: ${gameSetup.turnOrder[gameSetup.currentTurnIndex]}`}</p>
      <p>{`Next turn modal: ${pendingNextTurnModal}`}</p>
      <button
        type="button"
        onClick={() =>
          startVillageVisit(
            'player-1',
            FIELD_VILLAGE,
            () => 0,
            'board-feature-field-a'
          )
        }
      >
        Visit Field
      </button>
      <button
        type="button"
        onClick={() =>
          startVillageVisit(
            'player-1',
            FIELD_VILLAGE,
            () => 0,
            'board-feature-field-b'
          )
        }
      >
        Visit Other Field
      </button>
      <button
        type="button"
        onClick={() =>
          startVillageVisit(
            'player-1',
            FOREST_VILLAGE,
            () => 0,
            'board-feature-forest-a'
          )
        }
      >
        Visit Forest
      </button>
      <button
        type="button"
        onClick={() =>
          startVillageVisit(
            'player-2',
            FIELD_VILLAGE,
            () => 0,
            'board-feature-field-a'
          )
        }
      >
        Player 2 Visit Field
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
      <button type="button" onClick={() => chooseVillageAction('rest')}>
        Choose Rest
      </button>
      <button
        type="button"
        onClick={() => chooseVillageAction('wandsmith')}
      >
        Choose Wandsmith
      </button>
      <button type="button" onClick={() => chooseVillageAction('leave')}>
        Choose Leave
      </button>
      <button
        type="button"
        onClick={() => resetVillageActionLock('player-1')}
      >
        Visit Other Feature
      </button>
      <button
        type="button"
        onClick={() =>
          startBattle(
            'player-1',
            4,
            'crowned-lichlord',
            'fields',
            { encounterType: 'eliteTowerGravel' }
          )
        }
      >
        Visit Elite Tower
      </button>
      <button type="button" onClick={completeTurnRespawn}>
        Complete Respawn
      </button>
      <button
        type="button"
        onClick={() =>
          setPlayerPosition(
            'player-1',
            { x: 0, y: 0 },
            { currentHealth: player.maxHealth, diedLastTurn: false }
          )
        }
      >
        Complete Battle Respawn
      </button>
      <button type="button" onClick={finishVillageVisit}>
        Finish
      </button>
      <button type="button" onClick={finishVillageWandsmith}>
        Finish Wandsmith
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

test('claims village-type Loot Chests once and independently per player', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village claims: fieldVillageLootClaimed')
  ).toBeInTheDocument();
  expect(screen.getByText('P2 village claims: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(screen.getByText('Reward: none')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village claims: fieldVillageLootClaimed')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Forest' }));

  expect(screen.getByText('Visit: forestVillage')).toBeInTheDocument();
  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(
    screen.getByText(
      'P1 village claims: fieldVillageLootClaimed,forestVillageLootClaimed'
    )
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', { name: 'Player 2 Visit Field' })
  );

  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(
    screen.getByText('P2 village claims: fieldVillageLootClaimed')
  ).toBeInTheDocument();
});

test('resolves all newly eligible rewards in stable order before healing', () => {
  const setup = createInitialGameSetup();

  setup.players[0].eliteProgress.eliteTowerGravel = true;
  setup.players[0].eliteProgress.eliteTowerWoods = true;
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Reward: lootChest')).toBeInTheDocument();
  expect(screen.getByText('Pending rewards: 2')).toBeInTheDocument();
  expect(
    screen.getByText(
      'P1 village claims: fieldVillageLootClaimed,firstEliteVillageRewardClaimed,secondEliteVillageRewardClaimed'
    )
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Nothing' }));

  expect(screen.getByText('Phase: reward')).toBeInTheDocument();
  expect(screen.getByText('Reward: token')).toBeInTheDocument();
  expect(screen.getByText('Reward rarity: Common')).toBeInTheDocument();
  expect(screen.getByText('Pending rewards: 1')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Discard Token' }));
  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: reward')).toBeInTheDocument();
  expect(screen.getByText('Reward rarity: Rare')).toBeInTheDocument();
  expect(screen.getByText('Pending rewards: 0')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Discard Token' }));
  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(screen.getByText('Reward: none')).toBeInTheDocument();
});

test('resolves a first-Elite common token before choosing Rest and advancing the turn', () => {
  const setup = createInitialGameSetup();

  setup.players[0].currentHealth = 0;
  setup.players[0].diedLastTurn = true;
  setup.players[0].eliteProgress.eliteTowerGravel = true;
  setup.players[0].villageProgress.fieldVillageLootClaimed = true;
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));

  expect(screen.getByText('Phase: rewardFlow')).toBeInTheDocument();
  expect(screen.getByText('Battle source: village')).toBeInTheDocument();
  expect(screen.getByText('Reward rarity: Common')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Token' }));
  expect(screen.getByText('Reward destination: discarded')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Rest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Heal' }));

  expect(screen.getByText('Phase: healed')).toBeInTheDocument();
  expect(screen.getByText('Health: 100')).toBeInTheDocument();
  expect(screen.getByText('Died: false')).toBeInTheDocument();
  expect(
    screen.getByText(
      'P1 village claims: fieldVillageLootClaimed,firstEliteVillageRewardClaimed'
    )
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

  expect(screen.getByText('Visit: none')).toBeInTheDocument();
  expect(screen.getByText('Current turn: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
});

test('returns direct and assigned Loot Chest rewards to the village choice', () => {
  renderProbe();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));

  expect(screen.getByText('Mini game: villageLootChest')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Claim Nothing' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Forest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start Reward' }));
  fireEvent.click(screen.getByRole('button', { name: 'Claim Token' }));

  expect(screen.getByText('Phase: rewardFlow')).toBeInTheDocument();
  expect(screen.getByText('Battle source: lootChest')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Discard Token' }));

  expect(screen.getByText('Reward destination: discarded')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Complete Reward' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(screen.getByText('Battle source: none')).toBeInTheDocument();
  expect(screen.getByText('Mini game: none')).toBeInTheDocument();
});

test('keeps Metal Detector through a village visit and clears it when that turn ends', () => {
  const setup = createInitialGameSetup();

  setup.players[0].activePotion = POTION_DEFINITIONS.find(
    ({ id }) => id === 'metal-detector'
  );
  setup.players[0].villageProgress.fieldVillageLootClaimed = true;
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(screen.getByText('Active: metal-detector')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Choose Rest' }));
  fireEvent.click(screen.getByRole('button', { name: 'Heal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Finish' }));

  expect(screen.getByText('Current turn: player-2')).toBeInTheDocument();
  expect(screen.getByText('Active: none')).toBeInTheDocument();
});

test('locks Rest and Wandsmith only for the same player at the same village', () => {
  const setup = createInitialGameSetup();

  setup.players[0].villageProgress.fieldVillageLootClaimed = true;
  setup.players[1].villageProgress.fieldVillageLootClaimed = true;
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));

  expect(screen.getByText('Phase: choice')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village lock: board-feature-field-a')
  ).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();
  expect(screen.getByText('P2 village lock: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Choose Wandsmith' }));

  expect(screen.getByText('Phase: wandsmith')).toBeInTheDocument();
  expect(screen.getByText('Current turn: player-1')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: false')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village actions: wandsmith')
  ).toBeInTheDocument();
  expect(screen.getByText('P2 village actions: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Finish Wandsmith' }));

  expect(screen.getByText('Visit: none')).toBeInTheDocument();
  expect(screen.getByText('Current turn: player-2')).toBeInTheDocument();
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Rest' }));

  expect(screen.getByText('Phase: heal')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village actions: rest,wandsmith')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Heal' }));
  fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Leave' }));

  expect(screen.getByText('Phase: left')).toBeInTheDocument();
  expect(
    screen.getByText('P1 village actions: rest,wandsmith')
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
  expect(screen.getByText('Next turn modal: true')).toBeInTheDocument();
});

test('resets used actions after another village or another feature', () => {
  const setup = createInitialGameSetup();

  setup.players[0].villageProgress.fieldVillageLootClaimed = true;
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Field' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Wandsmith' }));
  fireEvent.click(screen.getByRole('button', { name: 'Visit Other Field' }));

  expect(
    screen.getByText('P1 village lock: board-feature-field-b')
  ).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Choose Wandsmith' }));
  fireEvent.click(screen.getByRole('button', { name: 'Visit Other Feature' }));

  expect(screen.getByText('P1 village lock: none')).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Visit Other Field' }));
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();
});

test('resets the affected player lock after an Elite Tower', () => {
  const setup = createInitialGameSetup();

  setup.players[0].villageActionState = {
    currentVillageLockId: 'board-feature-field-a',
    usedActionsForCurrentVillage: {
      rest: true,
      wandsmith: true,
    },
  };
  setup.turnOrder = ['player-1', 'player-2'];
  renderProbe(setup);

  fireEvent.click(screen.getByRole('button', { name: 'Visit Elite Tower' }));

  expect(screen.getByText('P1 village lock: none')).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();
});

test('resets the affected player lock when respawn completes', () => {
  const respawnSetup = createInitialGameSetup();

  respawnSetup.players[0].currentHealth = 0;
  respawnSetup.players[0].diedLastTurn = true;
  respawnSetup.players[0].villageActionState = {
    currentVillageLockId: 'board-feature-field-a',
    usedActionsForCurrentVillage: {
      rest: true,
      wandsmith: true,
    },
  };
  respawnSetup.pendingTurnRespawn = {
    playerId: 'player-1',
    removedTokens: [],
  };
  respawnSetup.turnOrder = ['player-1', 'player-2'];

  renderProbe(respawnSetup);
  fireEvent.click(screen.getByRole('button', { name: 'Complete Respawn' }));

  expect(screen.getByText('P1 village lock: none')).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();
});

test('resets the affected player lock when battle respawn completes', () => {
  const setup = createInitialGameSetup();

  setup.players[0].currentHealth = 0;
  setup.players[0].diedLastTurn = true;
  setup.players[0].villageActionState = {
    currentVillageLockId: 'board-feature-field-a',
    usedActionsForCurrentVillage: {
      rest: true,
      wandsmith: true,
    },
  };
  renderProbe(setup);

  fireEvent.click(
    screen.getByRole('button', { name: 'Complete Battle Respawn' })
  );

  expect(screen.getByText('Health: 100')).toBeInTheDocument();
  expect(screen.getByText('Died: false')).toBeInTheDocument();
  expect(screen.getByText('P1 village lock: none')).toBeInTheDocument();
  expect(screen.getByText('P1 village actions: none')).toBeInTheDocument();
});
