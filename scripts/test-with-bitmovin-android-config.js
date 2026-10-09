const assert = require('node:assert/strict');
const { test } = require('node:test');
const withBitmovinAndroidConfig =
  require('../plugin/build/withBitmovinAndroidConfig').default;

const runMod = async (modName, modResults) => {
  const config = withBitmovinAndroidConfig(
    { name: 'test-app', slug: 'test-app' },
    {}
  );
  const mod = config.mods?.android?.[modName];
  assert.equal(typeof mod, 'function');

  const result = await mod({
    ...config,
    modResults,
    modRequest: {
      projectRoot: process.cwd(),
      platform: 'android',
      modName,
      introspect: true,
    },
  });
  return result.modResults;
};

const applyToProjectBuildGradle = async (contents) =>
  (await runMod('projectBuildGradle', { language: 'groovy', contents }))
    .contents;

const applyToGradleProperties = async (entries) => {
  const properties = await runMod(
    'gradleProperties',
    Object.entries(entries).map(([key, value]) => ({
      type: 'property',
      key,
      value,
    }))
  );
  return Object.fromEntries(
    properties
      .filter((item) => item.type === 'property')
      .map((item) => [item.key, item.value])
  );
};

const projectBuildGradle = (kotlinClasspath) => `buildscript {
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    ${kotlinClasspath}
  }
}
`;

test('pins the versionless Kotlin Gradle plugin', async () => {
  const contents = await applyToProjectBuildGradle(
    projectBuildGradle("classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')")
  );
  assert.match(
    contents,
    /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin:2\.2\.21'\)/
  );
});

test('raises a lower pinned Kotlin Gradle plugin version', async () => {
  const contents = await applyToProjectBuildGradle(
    projectBuildGradle(
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.20")'
    )
  );
  assert.match(contents, /kotlin-gradle-plugin:2\.2\.21/);
  assert.doesNotMatch(contents, /2\.1\.20/);
});

test('keeps a higher or non-literal Kotlin Gradle plugin version', async () => {
  for (const classpath of [
    "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.20')",
    'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")',
  ]) {
    const original = projectBuildGradle(classpath);
    assert.equal(await applyToProjectBuildGradle(original), original);
  }
});

test('leaves build.gradle untouched without a Kotlin classpath entry', async () => {
  const original = projectBuildGradle('');
  assert.equal(await applyToProjectBuildGradle(original), original);
});

test('raises missing or lower Kotlin and compile SDK versions', async () => {
  assert.deepEqual(pick(await applyToGradleProperties({})), {
    kotlinVersion: '2.2.21',
    compileSdkVersion: '37',
  });
  assert.deepEqual(
    pick(
      await applyToGradleProperties({
        'android.kotlinVersion': '2.1.20',
        'android.compileSdkVersion': '36',
      })
    ),
    { kotlinVersion: '2.2.21', compileSdkVersion: '37' }
  );
});

test('keeps higher Kotlin and compile SDK versions', async () => {
  assert.deepEqual(
    pick(
      await applyToGradleProperties({
        'android.kotlinVersion': '2.3.20',
        'android.compileSdkVersion': '38',
      })
    ),
    { kotlinVersion: '2.3.20', compileSdkVersion: '38' }
  );
});

function pick(properties) {
  return {
    kotlinVersion: properties['android.kotlinVersion'],
    compileSdkVersion: properties['android.compileSdkVersion'],
  };
}
