const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { describe, it } = require('node:test');

const { availableTestTags } = require('../tests');
const {
  createTestRun,
  executeTestRun,
  parseTestArguments,
} = require('./run-selected-tests');

function commandsFor(platforms, forwardedArguments = []) {
  return [
    ...platforms.map((platform) => ['yarn', [`stop-test:${platform}`]]),
    ...platforms.map((platform) => [
      'yarn',
      [`start-test:${platform}`, ...forwardedArguments],
    ]),
  ];
}

function assertRun(
  platform,
  testArguments,
  tags,
  platforms,
  forwardedArguments = []
) {
  assert.deepEqual(createTestRun(platform, testArguments), {
    environment:
      tags.length > 0 ? { EXPO_PUBLIC_CAVY_ONLY_TAGS: tags.join(',') } : {},
    commands: commandsFor(platforms, forwardedArguments),
  });
}

function executeAndRecord(platform, testArguments, environment) {
  const calls = [];
  const status = executeTestRun(
    platform,
    testArguments,
    (command, commandArguments, options) => {
      calls.push({ command, commandArguments, options });
      return { status: 0 };
    },
    environment
  );

  return { calls, status };
}

describe('list-tags', () => {
  it('prints aligned selectors alphabetically with their platforms', () => {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, 'run-selected-tests.js'), 'list-tags'],
      { encoding: 'utf8' }
    );
    const sortedTestTags = [...availableTestTags].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    const tagNameWidth = Math.max(
      ...sortedTestTags.map(({ name }) => name.length)
    );
    const expectedOutput = sortedTestTags
      .map(
        ({ name, platforms }) =>
          `${name.padEnd(tagNameWidth)}  ${platforms.join(', ')}`
      )
      .join('\n');

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), expectedOutput);
  });
});

describe('parseTestArguments', () => {
  it('suggests --tags for a bare test selector', () => {
    assert.throws(() => parseTestArguments(['audio-track']), {
      message:
        'Unexpected argument: audio-track\nDid you mean --tags audio-track?',
    });
  });

  it('rejects an unknown positional argument', () => {
    assert.throws(() => parseTestArguments(['audio-trak']), {
      message: 'Unexpected argument: audio-trak',
    });
  });

  it('preserves positional values belonging to Cavy options', () => {
    assert.deepEqual(parseTestArguments(['--file', 'audio-track']), {
      tags: [],
      forwardedArguments: ['--file', 'audio-track'],
    });
  });

  it('parses comma-separated tags and preserves Cavy arguments', () => {
    assert.deepEqual(
      parseTestArguments([
        '--tags',
        'caption,cue-geometry',
        '--boot-timeout',
        '3',
      ]),
      {
        tags: ['caption', 'cue-geometry'],
        forwardedArguments: ['--boot-timeout', '3'],
      }
    );
  });

  it('rejects --tags without a value', () => {
    assert.throws(
      () => parseTestArguments(['--tags']),
      /--tags requires a comma-separated value/
    );
  });

  it('rejects a selection containing only empty values', () => {
    assert.throws(
      () => parseTestArguments(['--tags', ' , ']),
      /--tags requires at least one tag/
    );
  });
});

describe('createTestRun', () => {
  it('creates a filtered Android run', () => {
    assertRun(
      'android',
      ['--tags', 'caption', '--no-build'],
      ['caption'],
      ['android'],
      ['--no-build']
    );
  });

  it('selects multiple suites as a union', () => {
    assertRun(
      'ios',
      ['--tags', 'playback,unloading'],
      ['playback', 'unloading'],
      ['ios']
    );
  });

  it('preserves the unfiltered combined run', () => {
    assertRun('all', [], [], ['android', 'ios']);
  });

  for (const [name, platform, args, error] of [
    ['rejects unsupported platforms', 'windows', [], /Unsupported platform/],
    [
      'rejects unknown tags',
      'android',
      ['--tags', 'captino'],
      /Unknown test tag/,
    ],
    [
      'rejects tags unavailable on the platform',
      'android',
      ['--tags', 'cue-metadata'],
      /not available on android/,
    ],
    [
      'requires tags for both platforms',
      'all',
      ['--tags', 'cue-metadata'],
      /available on android/,
    ],
  ]) {
    it(name, () => assert.throws(() => createTestRun(platform, args), error));
  }
});

describe('executeTestRun', () => {
  it('passes selected tags to every command', () => {
    const { calls, status } = executeAndRecord(
      'android',
      ['--tags', 'caption'],
      { PATH: '/bin' }
    );

    assert.equal(status, 0);
    assert.equal(calls.length, 2);
    assert.ok(
      calls.every(
        ({ options }) =>
          options.stdio === 'inherit' &&
          options.env.PATH === '/bin' &&
          options.env.EXPO_PUBLIC_CAVY_ONLY_TAGS === 'caption'
      )
    );
  });

  it('clears a stale tag filter from unfiltered runs', () => {
    const { calls } = executeAndRecord('ios', [], {
      EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
      PATH: '/bin',
    });

    assert.deepEqual(
      calls.map(({ options }) => options.env),
      [{ PATH: '/bin' }, { PATH: '/bin' }]
    );
  });

  it('stops after the first failure and preserves its status', () => {
    let callCount = 0;
    const status = executeTestRun(
      'all',
      ['--tags', 'caption'],
      () => ({ status: ++callCount === 3 ? 42 : 0 }),
      process.env
    );

    assert.equal(status, 42);
    assert.equal(callCount, 3);
  });

  it('throws command execution errors', () => {
    const executionError = new Error('spawn failed');

    assert.throws(
      () =>
        executeTestRun(
          'ios',
          [],
          () => ({ error: executionError, status: null }),
          process.env
        ),
      executionError
    );
  });

  it('fails when a command exits without a status', () => {
    assert.equal(
      executeTestRun('ios', [], () => ({ status: null }), process.env),
      1
    );
  });
});
