#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { availableTestTags: testTags } = require('../tests');

const supportedPlatforms = new Set(['all', 'android', 'ios']);
const availableTestTags = new Map(
  testTags.map(({ name, platforms }) => [name, platforms])
);

function parseTestArguments(argumentsToParse) {
  const tagsIndex = argumentsToParse.indexOf('--tags');
  if (tagsIndex === -1) {
    const [firstArgument] = argumentsToParse;
    if (argumentsToParse.length === 1 && availableTestTags.has(firstArgument)) {
      throw new Error(
        `Unexpected argument: ${firstArgument}\nDid you mean --tags ${firstArgument}?`
      );
    }

    return { tags: [], forwardedArguments: argumentsToParse };
  }

  const value = argumentsToParse[tagsIndex + 1];
  if (!value || value.startsWith('--')) {
    throw new Error('--tags requires a comma-separated value');
  }

  const tags = [...new Set(value.split(',').map((tag) => tag.trim()))].filter(
    Boolean
  );
  if (tags.length === 0) {
    throw new Error('--tags requires at least one tag');
  }

  return {
    tags,
    forwardedArguments: argumentsToParse.filter(
      (_, index) => index !== tagsIndex && index !== tagsIndex + 1
    ),
  };
}

function validateTags(tags, platform) {
  if (tags.length === 0) {
    return;
  }

  for (const tag of tags) {
    const tagPlatforms = availableTestTags.get(tag);
    if (!tagPlatforms) {
      throw new Error(`Unknown test tag: ${tag}`);
    }
    if (platform !== 'all' && !tagPlatforms.includes(platform)) {
      throw new Error(`Test tag ${tag} is not available on ${platform}`);
    }
  }

  if (platform === 'all') {
    for (const target of ['android', 'ios']) {
      const hasMatchingTag = tags.some((tag) =>
        availableTestTags.get(tag).includes(target)
      );
      if (!hasMatchingTag) {
        throw new Error(`No selected test tags are available on ${target}`);
      }
    }
  }
}

function createTestRun(platform, testArguments) {
  if (!supportedPlatforms.has(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const { tags, forwardedArguments } = parseTestArguments(testArguments);
  validateTags(tags, platform);
  const environment =
    tags.length > 0 ? { EXPO_PUBLIC_CAVY_ONLY_TAGS: tags.join(',') } : {};
  const platforms = platform === 'all' ? ['android', 'ios'] : [platform];

  return {
    environment,
    commands: [
      ...platforms.map((target) => [
        'yarn',
        [`stop-test:${target}`, ...forwardedArguments],
      ]),
      ...platforms.map((target) => [
        'yarn',
        [`start-test:${target}`, ...forwardedArguments],
      ]),
    ],
  };
}

function executeTestRun(
  platform,
  testArguments,
  executeCommand = spawnSync,
  baseEnvironment = process.env
) {
  const { commands, environment } = createTestRun(platform, testArguments);
  const childEnvironment = { ...baseEnvironment, ...environment };
  if (!environment.EXPO_PUBLIC_CAVY_ONLY_TAGS) {
    delete childEnvironment.EXPO_PUBLIC_CAVY_ONLY_TAGS;
  }

  for (const [command, commandArguments] of commands) {
    const result = executeCommand(command, commandArguments, {
      env: childEnvironment,
      stdio: 'inherit',
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }

  return 0;
}

module.exports = {
  createTestRun,
  executeTestRun,
  parseTestArguments,
};

if (require.main === module) {
  const [platform, ...testArguments] = process.argv.slice(2);

  try {
    if (platform === 'list-tags') {
      const sortedTestTags = [...testTags].sort((left, right) =>
        left.name.localeCompare(right.name)
      );
      const tagNameWidth = Math.max(
        ...sortedTestTags.map(({ name }) => name.length)
      );
      for (const { name, platforms } of sortedTestTags) {
        console.log(`${name.padEnd(tagNameWidth)}  ${platforms.join(', ')}`);
      }
    } else {
      process.exitCode = executeTestRun(platform, testArguments);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
