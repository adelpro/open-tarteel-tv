module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'header-max-length': [2, 'always', 200],
    'subject-case': [0, 'never'],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [0, 'never'],
    'body-max-line-length': [0, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'wip',
      ],
    ],
  },
};
