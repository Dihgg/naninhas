module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended'
  ],
  ignorePatterns: ['dist/**/*'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  overrides:  [
    {
      "files": ["**/*.spec.*"],
      "env": {
        "jest": true
      }
    }
  ]
};
