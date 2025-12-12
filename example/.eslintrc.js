module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
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
