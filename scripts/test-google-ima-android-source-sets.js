const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');
const readRequired = (relativePath) => {
  assert.ok(
    fs.existsSync(path.join(root, relativePath)),
    `${relativePath} must exist`
  );
  return read(relativePath);
};

test('selects the Google IMA dependency and source set from the native property', () => {
  const gradle = read('android/build.gradle');

  assert.match(
    gradle,
    /findProperty\(["']BITMOVIN_ENABLE_GOOGLE_IMA["']\).*?["']false["']/s
  );
  assert.match(
    gradle,
    /googleImaEnabled\s*\?\s*["']src\/withGoogleIma\/java["']\s*:\s*["']src\/withoutGoogleIma\/java["']/
  );
  assert.match(
    gradle,
    /if\s*\(googleImaEnabled\)\s*\{[^}]*implementation\s+["']com\.google\.ads\.interactivemedia\.v3:interactivemedia:3\.38\.0["']/s
  );
});

test('keeps Google IMA types out of the common Android source set', () => {
  for (const relativePath of [
    'android/src/main/java/com/bitmovin/player/reactnative/PlayerModule.kt',
    'android/src/main/java/com/bitmovin/player/reactnative/converter/JsonConverter.kt',
  ]) {
    assert.doesNotMatch(
      read(relativePath),
      /com\.google\.ads\.interactivemedia|ImaSdkSettings|BeforeInitializationCallback/
    );
  }
});

test('keeps typed IMA conversion in the enabled source set only', () => {
  const enabledConfigurator = readRequired(
    'android/src/withGoogleIma/java/com/bitmovin/player/reactnative/ImaBeforeInitializationConfigurator.kt'
  );
  const enabledConverter = readRequired(
    'android/src/withGoogleIma/java/com/bitmovin/player/reactnative/converter/ImaSettingsConverter.kt'
  );
  const disabledConfigurator = readRequired(
    'android/src/withoutGoogleIma/java/com/bitmovin/player/reactnative/ImaBeforeInitializationConfigurator.kt'
  );

  assert.match(enabledConfigurator, /BeforeInitializationCallback/);
  assert.match(enabledConverter, /ImaSdkSettings/);
  assert.doesNotMatch(
    disabledConfigurator,
    /com\.google\.ads\.interactivemedia|ImaSdkSettings|BeforeInitializationCallback/
  );
});
