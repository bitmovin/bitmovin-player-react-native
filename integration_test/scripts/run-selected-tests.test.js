const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  createProcessEnvironment,
  createTestRun,
  executeTestRun,
  parseTestArguments,
} = require('./run-selected-tests');

describe('parseTestArguments', () => {
  it('parses comma-separated tags and preserves Cavy arguments', () => {
    assert.deepEqual(
      parseTestArguments([
        '--tags',
        'caption,cue-geometry',
        '--boot-timeout',
        '120',
      ]),
      {
        tags: ['caption', 'cue-geometry'],
        forwardedArguments: ['--boot-timeout', '120'],
      }
    );
  });

  it('combines repeated tags and removes empty or duplicate values', () => {
    assert.deepEqual(
      parseTestArguments([
        '--tags=caption, cue-geometry',
        '--tags',
        'caption,,playback',
      ]),
      {
        tags: ['caption', 'cue-geometry', 'playback'],
        forwardedArguments: [],
      }
    );
  });

  it('rejects --tags without a value', () => {
    assert.throws(
      () => parseTestArguments(['--tags']),
      /--tags requires a comma-separated value/
    );
  });

  it('rejects a tag selection containing only empty values', () => {
    assert.throws(
      () => parseTestArguments(['--tags', ' , ']),
      /--tags requires at least one tag/
    );
  });
});

describe('createTestRun', () => {
  it('creates the existing stop and start commands with the tag environment', () => {
    assert.deepEqual(
      createTestRun('android', ['--tags', 'caption', '--no-build']),
      {
        environment: {
          EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
        },
        commands: [
          ['yarn', ['stop-test:android']],
          ['yarn', ['start-test:android', '--no-build']],
        ],
      }
    );
  });

  it('does not set a filter when tags are omitted', () => {
    assert.deepEqual(createTestRun('ios', []), {
      environment: {},
      commands: [
        ['yarn', ['stop-test:ios']],
        ['yarn', ['start-test:ios']],
      ],
    });
  });

  it('creates the existing combined Android and iOS command sequence', () => {
    assert.deepEqual(createTestRun('all', ['--tags', 'caption']), {
      environment: {
        EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
      },
      commands: [
        ['yarn', ['stop-test:android']],
        ['yarn', ['stop-test:ios']],
        ['yarn', ['start-test:android']],
        ['yarn', ['start-test:ios']],
      ],
    });
  });

  it('rejects unsupported platforms', () => {
    assert.throws(() => createTestRun('windows', []), /Unsupported platform/);
  });

  it('rejects unknown tags', () => {
    assert.throws(
      () => createTestRun('android', ['--tags', 'captino']),
      /Unknown test tag: captino/
    );
  });

  it('rejects tags that do not apply to the selected platform', () => {
    assert.throws(
      () => createTestRun('android', ['--tags', 'cue-metadata']),
      /Test tag cue-metadata is not available on android/
    );
  });

  it('requires a matching tag for both platforms in a combined run', () => {
    assert.throws(
      () => createTestRun('all', ['--tags', 'cue-geometry']),
      /No selected test tags are available on ios/
    );
  });
});

describe('createProcessEnvironment', () => {
  it('clears a stale tag filter when the current run has no tags', () => {
    assert.deepEqual(
      createProcessEnvironment(
        {
          EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
          PATH: '/bin',
        },
        {}
      ),
      { PATH: '/bin' }
    );
  });
});

describe('executeTestRun', () => {
  it('passes the selected tags to every command', () => {
    const calls = [];
    const executeCommand = (command, commandArguments, options) => {
      calls.push({ command, commandArguments, options });
      return { status: 0 };
    };

    assert.equal(
      executeTestRun('android', ['--tags', 'caption'], executeCommand, {
        PATH: '/bin',
      }),
      0
    );
    assert.deepEqual(calls, [
      {
        command: 'yarn',
        commandArguments: ['stop-test:android'],
        options: {
          env: {
            EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
            PATH: '/bin',
          },
          stdio: 'inherit',
        },
      },
      {
        command: 'yarn',
        commandArguments: ['start-test:android'],
        options: {
          env: {
            EXPO_PUBLIC_CAVY_ONLY_TAGS: 'caption',
            PATH: '/bin',
          },
          stdio: 'inherit',
        },
      },
    ]);
  });

  it('stops after the first failed command and preserves its status', () => {
    let callCount = 0;
    const executeCommand = () => {
      callCount += 1;
      return { status: callCount === 3 ? 42 : 0 };
    };

    assert.equal(
      executeTestRun('all', ['--tags', 'caption'], executeCommand, process.env),
      42
    );
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

  it('returns a failure when a command exits without a status', () => {
    assert.equal(
      executeTestRun('ios', [], () => ({ status: null }), process.env),
      1
    );
  });
});
