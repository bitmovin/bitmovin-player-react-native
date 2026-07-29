#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const supportedPlatforms = new Set(['all', 'android', 'ios']);

function appendTags(tags, value) {
  if (!value || value.startsWith('--')) {
    throw new Error('--tags requires a comma-separated value');
  }

  for (const tag of value.split(',')) {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      tags.push(trimmedTag);
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

function run(platform, testArguments) {
  const { commands, environment } = createTestRun(platform, testArguments);
  const childEnvironment = createProcessEnvironment(process.env, environment);

  for (const [command, commandArguments] of commands) {
    const result = spawnSync(command, commandArguments, {
      env: childEnvironment,
      stdio: 'inherit',
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

module.exports = {
  createProcessEnvironment,
  createTestRun,
  parseTestArguments,
  run,
};

if (require.main === module) {
  const [platform, ...testArguments] = process.argv.slice(2);

  try {
    run(platform, testArguments);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
