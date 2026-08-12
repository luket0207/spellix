import {
  getEnemyDisplayName,
  getPlayerColourDisplayName,
} from '../../i18n/translations';
import { getEnemyById } from '../battle/enemies';
import {
  BOSS_BATTLE,
  getEliteBossEncounterType,
} from '../gameBoard/eliteBossEncounters';

function getPlayerDescriptor(player, language) {
  const colour = getPlayerColourDisplayName(language, player.colour);

  if (language === 'jp') {
    return `${colour}の${player.gender === 'girl' ? '魔女' : '魔法使い'}`;
  }

  return `${colour} ${player.gender === 'girl' ? 'Witch' : 'Wizard'}`;
}

export function createPlayerList(players, language) {
  const descriptors = players.map((player) => getPlayerDescriptor(player, language));

  if (language === 'jp' || descriptors.length < 2) {
    return descriptors.join('、');
  }

  if (descriptors.length === 2) {
    return descriptors.join(' and ');
  }

  return `${descriptors.slice(0, -1).join(', ')} and ${descriptors[descriptors.length - 1]}`;
}

export function getStoryEnemyIds(board, assignments) {
  const northWestEncounter = getEliteBossEncounterType(
    board,
    'elite-battle-top-left'
  );
  const southEastEncounter = getEliteBossEncounterType(
    board,
    'elite-battle-bottom-right'
  );

  return {
    bossEnemyId: assignments?.[BOSS_BATTLE] ?? null,
    northWestEliteEnemyId: assignments?.[northWestEncounter] ?? null,
    southEastEliteEnemyId: assignments?.[southEastEncounter] ?? null,
  };
}

export function createStoryText({ assignments, board, language, players }) {
  const enemyIds = getStoryEnemyIds(board, assignments);
  const playerList = createPlayerList(players, language);
  const northWestEliteEnemyName = getEnemyDisplayName(
    language,
    getEnemyById(enemyIds.northWestEliteEnemyId)
  );
  const southEastEliteEnemyName = getEnemyDisplayName(
    language,
    getEnemyById(enemyIds.southEastEliteEnemyId)
  );
  const bossName = getEnemyDisplayName(language, getEnemyById(enemyIds.bossEnemyId));

  return language === 'jp'
    ? `${playerList}は、スペリックス王国を救うための冒険に挑みます。北西の塔にいる${northWestEliteEnemyName}と、南東の塔にいる${southEastEliteEnemyName}を倒し、北東の城にいる究極のボス、${bossName}に挑めるほどの力を手に入れなければなりません。`
    : `The ${playerList} are taking on a quest to save the kingdom of Spellix. They must defeat ${northWestEliteEnemyName} in the north west tower and the ${southEastEliteEnemyName} in the south east to become powerful enough to take on the ultimate boss, ${bossName} in the north east castle.`;
}

export function getStoryLanguages(players) {
  const languages = new Set(
    players.map(({ language }) => (language === 'jp' ? 'jp' : 'en'))
  );

  return languages.size > 1 ? ['en', 'jp'] : [...languages];
}
