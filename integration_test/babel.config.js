const path = require('path');
const pak = require('../package.json');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Strip TypeScript declarations before Expo's Flow/class-field transforms.
    overrides: [
      {
        test: (fileName) => Boolean(fileName?.endsWith('.ts')),
        plugins: [
          ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        ],
      },
      {
        test: (fileName) => Boolean(fileName?.endsWith('.tsx')),
        plugins: [
          [
            '@babel/plugin-transform-typescript',
            { allowDeclareFields: true, isTSX: true },
          ],
        ],
      },
    ],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json'],
          alias: {
            [pak.name]: path.join(__dirname, '../src/'),
          },
        },
      ],
    ],
  };
};
