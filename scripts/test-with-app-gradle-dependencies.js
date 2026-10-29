const assert = require('node:assert/strict');

const withAppGradleDependencies =
  require('../plugin/build/withAppGradleDependencies').default;
const withBitmovinAndroidConfig =
  require('../plugin/build/withBitmovinAndroidConfig').default;

const desugaringDependency =
  "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'";
const featureDependency = 'com.example:feature:1.0';

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

const gradle = ({
  android = "    namespace 'com.example'",
  dependencies = '',
}) => `plugins {
    id 'com.android.application'
}

android {
${android}
}

dependencies {
    implementation 'com.facebook.react:react-android'
${dependencies}
}
`;

const tests = [];

const test = (name, run) => {
  tests.push({ name, run });
};

const applyGradleProperties = async (features) => {
  const config = withBitmovinAndroidConfig(
    { name: 'test-app', slug: 'test-app' },
    { features }
  );
  const gradlePropertiesMod = config.mods?.android?.gradleProperties;
  assert.equal(typeof gradlePropertiesMod, 'function');

  const result = await gradlePropertiesMod({
    ...config,
    modResults: [],
    modRequest: {
      projectRoot: process.cwd(),
      platform: 'android',
      modName: 'gradleProperties',
      introspect: true,
    },
  });

  return result.modResults;
};

const applyAppBuildGradle = async (features) => {
  const config = withBitmovinAndroidConfig(
    { name: 'test-app', slug: 'test-app' },
    { features }
  );
  const appBuildGradleMod = config.mods?.android?.appBuildGradle;
  assert.equal(typeof appBuildGradleMod, 'function');

  const result = await appBuildGradleMod({
    ...config,
    modResults: { language: 'groovy', contents: gradle({}) },
    modRequest: {
      projectRoot: process.cwd(),
      platform: 'android',
      modName: 'appBuildGradle',
      introspect: true,
    },
  });

  return result.modResults.contents;
};

const propertyValue = (properties, key) =>
  properties.find((item) => item.type === 'property' && item.key === key)
    ?.value;

test('disables Google IMA in Gradle properties when omitted', async () => {
  const properties = await applyGradleProperties({});
  assert.equal(
    propertyValue(properties, 'BITMOVIN_ENABLE_GOOGLE_IMA'),
    'false'
  );
});

test('disables Google IMA in Gradle properties when explicitly false', async () => {
  const properties = await applyGradleProperties({ googleIMA: false });
  assert.equal(
    propertyValue(properties, 'BITMOVIN_ENABLE_GOOGLE_IMA'),
    'false'
  );
});

test('enables Google IMA in Gradle properties when true', async () => {
  const properties = await applyGradleProperties({ googleIMA: true });
  assert.equal(propertyValue(properties, 'BITMOVIN_ENABLE_GOOGLE_IMA'), 'true');
});

test('skips desugaring in app/build.gradle when Google IMA is disabled', async () => {
  const result = await applyAppBuildGradle({ googleIMA: false });
  assert.ok(!result.includes('desugar_jdk_libs'));
});

test('adds desugaring to app/build.gradle when Google IMA is enabled', async () => {
  const result = await applyAppBuildGradle({ googleIMA: true });
  assert.match(result, /setCoreLibraryDesugaringEnabled\(true\)/);
  assert.ok(result.includes(desugaringDependency));
});

test('does not add desugaring unless requested', async () => {
  const result = await applyPlugin(gradle({}));

  assert.doesNotMatch(result, /CoreLibraryDesugaring/i);
  assert.ok(!result.includes('desugar_jdk_libs'));
  assert.doesNotMatch(result, /compileOptions/);
});

test('does not touch existing desugaring setup when not requested', async () => {
  const contents = gradle({
    android: `    namespace 'com.example'
    compileOptions {
        setCoreLibraryDesugaringEnabled(true)
    }`,
    dependencies: `    ${desugaringDependency}`,
  });

  assert.equal(await applyPlugin(contents), contents);
});

test('adds desugaring when requested without feature dependencies', async () => {
  const result = await applyPlugin(gradle({}), {
    coreLibraryDesugaring: true,
  });

  assert.match(result, /setCoreLibraryDesugaringEnabled\(true\)/);
  assert.ok(result.includes(desugaringDependency));
});

test('inserts desugaring inside existing compileOptions with surrounding whitespace', async () => {
  const result = await applyPlugin(
    gradle({
      android: `    namespace 'com.example'

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
    }`,
    }),
    { coreLibraryDesugaring: true }
  );

  assert.equal(countOccurrences(result, 'compileOptions {'), 1);
  assert.match(
    result,
    /compileOptions \{\n        setCoreLibraryDesugaringEnabled\(true\)\n        sourceCompatibility/
  );
  assert.doesNotMatch(
    result,
    /namespace 'com\.example'\n\n        setCoreLibraryDesugaringEnabled/
  );
});

test('does not duplicate existing desugaring dependency', async () => {
  const result = await applyPlugin(
    gradle({
      android: `    namespace 'com.example'
    compileOptions {
        setCoreLibraryDesugaringEnabled(true)
    }`,
      dependencies:
        "    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.0.4'",
    }),
    { coreLibraryDesugaring: true }
  );

  assert.equal(
    countOccurrences(
      result,
      "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs"
    ),
    1
  );
  assert.doesNotMatch(result, /desugar_jdk_libs:2\.1\.5/);
});

test('ignores comments and constraints when checking feature dependencies', async () => {
  const result = await applyPlugin(
    gradle({
      dependencies: `    // ${featureDependency} is added by the plugin
    constraints {
        implementation('${featureDependency}') {
            because 'pins the version when another dependency requests it'
        }
    }`,
    }),
    { dependencies: [featureDependency] }
  );

  assert.match(result, /implementation 'com\.example:feature:1\.0'/);
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

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
