const prettierConfig = require('./prettier.config');
module.exports = {
  root: true,
  extends: ['@react-native-community', 'prettier'],
  rules: {
    'prettier/prettier': ['error', prettierConfig],
  },
};
