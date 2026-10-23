const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const babel = require('@babel/core');

for (const ci of [false, true]) {
  test(`entry registers ${ci ? 'Cavy tests' : 'the interactive app'}`, () => {
    const loaded = [];
    const registered = [];
    const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
    const { code } = babel.transformSync(source, {
      babelrc: false,
      configFile: false,
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    });
    vm.runInNewContext(code, {
      process: { env: { EXPO_PUBLIC_CAVY_CI: ci ? '1' : '' } },
      require: (name) => {
        loaded.push(name);
        if (name === 'expo')
          return { registerRootComponent: (app) => registered.push(app) };
        if (name === './src/App')
          return { __esModule: true, default: 'interactive' };
        if (name === './index.test') return {};
        throw new Error(`Unexpected entry dependency: ${name}`);
      },
    });
    assert.equal(loaded.includes('./index.test'), ci);
    assert.deepEqual(registered, ci ? [] : ['interactive']);
  });
}
