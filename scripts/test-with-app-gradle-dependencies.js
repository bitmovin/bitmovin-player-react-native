const assert = require('node:assert/strict');

const withAppGradleDependencies =
  require('../plugin/build/withAppGradleDependencies').default;

const coreLibraryDesugaringDependency =
  "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'";

const baseGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

const countOccurrences = (contents, needle) =>
  contents.split(needle).length - 1;

const applyPlugin = async (contents, props = {}) => {
  const config = withAppGradleDependencies(
    { name: 'test-app', slug: 'test-app' },
    props
  );
  const appBuildGradleMod = config.mods?.android?.appBuildGradle;
  assert.equal(typeof appBuildGradleMod, 'function');

  const result = await appBuildGradleMod({
    ...config,
    modResults: {
      language: 'groovy',
      contents,
    },
    modRequest: {
      projectRoot: process.cwd(),
      platform: 'android',
      modName: 'appBuildGradle',
      introspect: true,
    },
  });

  return result.modResults.contents;
};

const tests = [];

const test = (name, run) => {
  tests.push({ name, run });
};

test('adds core library desugaring when no feature dependencies are requested', async () => {
  const result = await applyPlugin(baseGradle);

  assert.match(result, /setCoreLibraryDesugaringEnabled\(true\)/);
  assert.ok(result.includes(coreLibraryDesugaringDependency));
});

test('enables desugaring inside an existing compileOptions block', async () => {
  const gradleWithCompileOptions = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

  const result = await applyPlugin(gradleWithCompileOptions, {
    dependencies: ['com.example:feature:1.0'],
  });

  assert.equal(countOccurrences(result, 'compileOptions {'), 1);
  assert.match(
    result,
    /compileOptions \{\n        setCoreLibraryDesugaringEnabled\(true\)\n        sourceCompatibility/
  );
});

test('does not duplicate existing core library desugaring settings', async () => {
  const gradleWithDesugaring = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        setCoreLibraryDesugaringEnabled(true)
        sourceCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
    ${coreLibraryDesugaringDependency}
}
`;

  const result = await applyPlugin(gradleWithDesugaring, {
    dependencies: ['com.example:feature:1.0'],
  });

  assert.equal(
    countOccurrences(result, 'setCoreLibraryDesugaringEnabled(true)'),
    1
  );
  assert.equal(countOccurrences(result, coreLibraryDesugaringDependency), 1);
  assert.match(result, /implementation 'com.example:feature:1\.0'/);
});

const run = async () => {
  const failures = [];

  for (const { name, run } of tests) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push({ name, error });
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

run();
