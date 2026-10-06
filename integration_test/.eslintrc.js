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
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
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
    'prettier/prettier': 'error',
  },
};
