import {
  createPlayerList,
  createStoryText,
  getStoryEnemyIds,
} from './storyContent';

const players = [
  { colour: 'blue', gender: 'boy' },
  { colour: 'red', gender: 'boy' },
  { colour: 'yellow', gender: 'girl' },
];

describe('story content', () => {
  test('formats correct English grammar for one, two, and three players', () => {
    expect(createPlayerList(players.slice(0, 1), 'en')).toBe('Blue Wizard');
    expect(createPlayerList(players.slice(0, 2), 'en')).toBe('Blue Wizard and Red Wizard');
    expect(createPlayerList(players, 'en')).toBe(
      'Blue Wizard, Red Wizard and Yellow Witch'
    );
  });

  test('formats a natural Japanese player list', () => {
    expect(createPlayerList(players, 'jp')).toBe('青の魔法使い、赤の魔法使い、黄色の魔女');
  });

  test('resolves enemy assignments from the actual north-west and south-east towers', () => {
    const assignments = {
      bossBattle: 'boss-enemy',
      eliteTowerGravel: 'gravel-enemy',
      eliteTowerWoods: 'woods-enemy',
    };
    const board = {
      featureImages: [
        { id: 'elite-top-left', imageName: 'elite-tower-woods.png' },
        { id: 'elite-bottom-right', imageName: 'elite-tower-gravel.png' },
      ],
    };

    expect(getStoryEnemyIds(board, assignments)).toEqual({
      bossEnemyId: 'boss-enemy',
      northWestEliteEnemyId: 'woods-enemy',
      southEastEliteEnemyId: 'gravel-enemy',
    });
  });

  test('interpolates the exact English and Japanese story templates', () => {
    const assignments = {
      bossBattle: 'hellcrown-reaper',
      eliteTowerGravel: 'amethyst-ogre',
      eliteTowerWoods: 'mossroot-elder',
    };
    const board = {
      featureImages: [
        { id: 'elite-top-left', imageName: 'elite-tower-woods.png' },
        { id: 'elite-bottom-right', imageName: 'elite-tower-gravel.png' },
      ],
    };

    expect(
      createStoryText({ assignments, board, language: 'en', players })
    ).toBe(
      'The Blue Wizard, Red Wizard and Yellow Witch are taking on a quest to save the kingdom of Spellix. They must defeat Mossroot Elder in the north west tower and the Amethyst Ogre in the south east to become powerful enough to take on the ultimate boss, Hellcrown Reaper in the north east castle.'
    );
    expect(
      createStoryText({ assignments, board, language: 'jp', players })
    ).toBe(
      '青の魔法使い、赤の魔法使い、黄色の魔女は、スペリックス王国を救うための冒険に挑みます。北西の塔にいる苔根の古老と、南東の塔にいる紫晶のオーガを倒し、北東の城にいる究極のボス、地獄冠の死神に挑めるほどの力を手に入れなければなりません。'
    );
  });
});
