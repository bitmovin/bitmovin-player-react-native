const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  createProcessEnvironment,
  createTestRun,
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
