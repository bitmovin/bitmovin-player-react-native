module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
};
