#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const testTags = require('../test-tags.json');

const supportedPlatforms = new Set(['all', 'android', 'ios']);
const availableTestTags = new Map(
  Object.values(testTags).map(({ name, platforms }) => [name, platforms])
);

function appendTags(tags, value) {
  if (!value || value.startsWith('--')) {
    throw new Error('--tags requires a comma-separated value');
  }

  const parsedTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (parsedTags.length === 0) {
    throw new Error('--tags requires at least one tag');
  }

  for (const tag of parsedTags) {
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
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

function parseTestArguments(argumentsToParse) {
  const tags = [];
  const forwardedArguments = [];

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (argument === '--tags') {
      appendTags(tags, argumentsToParse[index + 1]);
      index += 1;
    } else if (argument.startsWith('--tags=')) {
      appendTags(tags, argument.slice('--tags='.length));
    } else {
      forwardedArguments.push(argument);
    }
  }

  return { tags, forwardedArguments };
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
      ...platforms.map((target) => ['yarn', [`stop-test:${target}`]]),
      ...platforms.map((target) => [
        'yarn',
        [`start-test:${target}`, ...forwardedArguments],
      ]),
    ],
  };
}

function createProcessEnvironment(baseEnvironment, testEnvironment) {
  const processEnvironment = { ...baseEnvironment, ...testEnvironment };

  if (!testEnvironment.EXPO_PUBLIC_CAVY_ONLY_TAGS) {
    delete processEnvironment.EXPO_PUBLIC_CAVY_ONLY_TAGS;
  }

  return processEnvironment;
}

function executeTestRun(
  platform,
  testArguments,
  executeCommand = spawnSync,
  baseEnvironment = process.env
) {
  const { commands, environment } = createTestRun(platform, testArguments);
  const childEnvironment = createProcessEnvironment(
    baseEnvironment,
    environment
  );

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
  createProcessEnvironment,
  createTestRun,
  executeTestRun,
  parseTestArguments,
};

if (require.main === module) {
  const [platform, ...testArguments] = process.argv.slice(2);

  try {
    process.exitCode = executeTestRun(platform, testArguments);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
