export const NOTHING_EVENT_ENVIRONMENTS = [
  {
    background: 'fields',
    id: 'field',
    label: 'Field',
    text: {
      en: 'You rest in an open field',
      jp: '\u5e83\u3005\u3068\u3057\u305f\u91ce\u539f\u3067\u4f11\u307f\u307e\u3059',
    },
  },
  {
    background: 'hills',
    id: 'hills',
    label: 'Hills',
    text: {
      en: 'You stop on a hilltop',
      jp: '\u4e18\u306e\u9802\u4e0a\u3067\u8db3\u3092\u6b62\u3081\u307e\u3059',
    },
  },
  {
    background: 'gravel',
    id: 'gravel',
    label: 'Gravel',
    text: {
      en: 'You sit on a boulder to rest',
      jp: '\u5927\u304d\u306a\u5ca9\u306b\u8170\u639b\u3051\u3066\u4f11\u307f\u307e\u3059',
    },
  },
  {
    background: 'mud',
    id: 'mud',
    label: 'Mud',
    text: {
      en: 'You take a moment to wash your boots',
      jp: '\u5c11\u3057\u7acb\u3061\u6b62\u307e\u3063\u3066\u30d6\u30fc\u30c4\u306e\u6ce5\u3092\u6d17\u3044\u843d\u3068\u3057\u307e\u3059',
    },
  },
  {
    background: 'stream',
    id: 'stream',
    label: 'Stream',
    text: {
      en: 'You sit by the stream for a while',
      jp: '\u5c0f\u5ddd\u306e\u305d\u3070\u306b\u5ea7\u3063\u3066\u3001\u3057\u3070\u3089\u304f\u4f11\u307f\u307e\u3059',
    },
  },
];

export const NOTHING_EVENT_CONTINUE_TEXT = {
  en: 'Continue',
  jp: '\u7d9a\u3051\u308b',
};

export const NOTHING_EVENT_TRIGGER_TEXT = {
  en: 'Trigger Nothing Event',
  jp: '\u4f55\u3082\u306a\u3044\u30a4\u30d9\u30f3\u30c8\u3092\u767a\u751f\u3055\u305b\u308b',
};

export function getNothingEventForEnvironment(environmentId) {
  return (
    NOTHING_EVENT_ENVIRONMENTS.find(({ id }) => id === environmentId) ?? null
  );
}
