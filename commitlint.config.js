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
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only
        'style', // Code style (formatting, semicolons)
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Adding/updating tests
        'chore', // Maintenance/dependencies
        'revert', // Revert previous commit
        'ci', // CI/CD changes
        'wip', // Work in progress
      ],
    ],
  },
};
