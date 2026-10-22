const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

const loadConfig = (project, googleIma) => {
  const configPath = path.join(root, project, 'app.config.ts');
  const source = fs.readFileSync(configPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: configPath,
  }).outputText;
  const previous = {
    BITMOVIN_ENABLE_GOOGLE_IMA: process.env.BITMOVIN_ENABLE_GOOGLE_IMA,
    BITMOVIN_PLAYER_LICENSE_KEY: process.env.BITMOVIN_PLAYER_LICENSE_KEY,
    EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY:
      process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY,
  };
  process.env.BITMOVIN_PLAYER_LICENSE_KEY = 'test-license';
  process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY = 'test-license';
  if (googleIma === undefined) {
    delete process.env.BITMOVIN_ENABLE_GOOGLE_IMA;
  } else {
    process.env.BITMOVIN_ENABLE_GOOGLE_IMA = String(googleIma);
  }

  try {
    const loadedModule = { exports: {} };
    const configDirectory = path.dirname(configPath);
    const fakeFs = {
      ...fs,
      existsSync: (candidate) =>
        candidate === path.join(configDirectory, '.env') ||
        fs.existsSync(candidate),
    };
    const localRequire = (request) => {
      if (request === 'dotenv') return { config: () => ({ parsed: {} }) };
      if (request === 'fs') return fakeFs;
      return require(request);
    };
    const evaluate = new Function(
      'require',
      'module',
      'exports',
      '__dirname',
      '__filename',
      output
    );
    evaluate(
      localRequire,
      loadedModule,
      loadedModule.exports,
      configDirectory,
      configPath
    );
    return loadedModule.exports.default;
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const googleImaFeature = (config) => {
  const plugin = config.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === '../app.plugin.js'
  );
  return plugin[1].features.googleIMA;
};

for (const project of ['example', 'integration_test']) {
  test(`${project} opts into Google IMA by default`, () => {
    assert.equal(googleImaFeature(loadConfig(project)), true);
  });

  test(`${project} can disable Google IMA for build fixtures`, () => {
    assert.equal(googleImaFeature(loadConfig(project, false)), false);
  });

  test(`${project} can explicitly enable Google IMA`, () => {
    assert.equal(googleImaFeature(loadConfig(project, true)), true);
  });
}
