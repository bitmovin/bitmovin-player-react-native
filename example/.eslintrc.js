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
  env: {
    node: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: [__dirname + '/tsconfig.json'],
      },
    },
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    'prettier/prettier': 'error',
  },
};
