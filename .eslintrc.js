module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    'prettier/prettier': 'error',
    // Rule introduced with the Expo SDK 57 update (via eslint-config-expo 57 -> eslint-plugin-react-hooks 7).
    'react-hooks/refs': 'off',
    'no-restricted-properties': [
      'error',
      {
        object: 'console',
        property: 'log',
        message: 'Use the project logger `DebugConfig.log` instead.',
      },
    ],
  },
};
