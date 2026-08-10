const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  FAKE_ANDROID_AVD_NAME,
  FAKE_ANDROID_EMULATOR_ID,
  INTEGRATION_TEST_DIR,
  assertPackagerNotStarted,
  createOwnedPackagerEnvironment,
  createStubEnvironment,
  readCalls,
  readForwardedArguments,
  runScript,
  waitForFile,
} = require('./script-test-harness');

test('start-test-android reuses an owned Expo CLI process and forwards --no-packager', (t) => {
  const { env, recordFile } = createOwnedPackagerEnvironment(t, {
    STUB_ADB_DEVICES: `List of devices attached\n${FAKE_ANDROID_EMULATOR_ID}\tdevice\n`,
  });

  const result = runScript('start-test-android.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /Using existing integration_test Expo packager/i
  );
  assert.ok(
    calls.some((call) =>
      call.includes(
        `yarn:cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId ${FAKE_ANDROID_EMULATOR_ID}`
      )
    )
  );
  assertPackagerNotStarted(calls);
});

test('run-test-android reuses an owned Expo CLI process and runs cavy on an existing emulator', (t) => {
  const { env, recordFile } = createOwnedPackagerEnvironment(t, {
    STUB_ADB_DEVICES: `List of devices attached\n${FAKE_ANDROID_EMULATOR_ID}\tdevice\n`,
  });

  const result = runScript('run-test-android.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /Using existing integration_test Expo packager/i
  );
  assert.ok(
    calls.some((call) =>
      call.includes(
        `yarn:cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId ${FAKE_ANDROID_EMULATOR_ID}`
      )
    )
  );
  assertPackagerNotStarted(calls);
});

test('ensure-android-emulator starts an emulator when none is running', (t) => {
  const { env, recordFile, expoMarkerFile } = createStubEnvironment(t, {
    STUB_EXPO_START_MODE: 'hold',
    STUB_ADB_DEVICES_FIRST: 'List of devices attached\n',
    STUB_ADB_DEVICES_NEXT: `List of devices attached\n${FAKE_ANDROID_EMULATOR_ID}\tdevice\n`,
    STUB_EMULATOR_LIST_AVDS: FAKE_ANDROID_AVD_NAME,
  });

  const result = runScript('ensure-android-emulator.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    new RegExp(FAKE_ANDROID_EMULATOR_ID)
  );
  assert.ok(calls.some((call) => call.includes('emulator:-list-avds')));
  assert.ok(
    calls.some((call) =>
      call.includes(`emulator:-avd ${FAKE_ANDROID_AVD_NAME}`)
    )
  );
  assert.ok(calls.some((call) => call.includes('adb:wait-for-device shell')));
  assertPackagerNotStarted(calls);
  assert.equal(fs.existsSync(expoMarkerFile), false);
});

test('start-test-android reports why emulator setup failed', (t) => {
  const { env } = createStubEnvironment(t, {
    STUB_ADB_DEVICES: 'List of devices attached\n',
    STUB_EMULATOR_LIST_AVDS: '',
  });

  const result = runScript('start-test-android.sh', env);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /No AVDs available/i);
});

test('start-test-android composes emulator boot and android test run for local workflows', (t) => {
  const { env, recordFile, expoMarkerFile } = createStubEnvironment(t, {
    STUB_EXPO_START_MODE: 'hold',
    STUB_ADB_DEVICES_FIRST: 'List of devices attached\n',
    STUB_ADB_DEVICES_NEXT: `List of devices attached\n${FAKE_ANDROID_EMULATOR_ID}\tdevice\n`,
    STUB_EMULATOR_LIST_AVDS: FAKE_ANDROID_AVD_NAME,
  });

  const result = runScript('start-test-android.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.ok(
    calls.some((call) =>
      call.startsWith(`npx:${INTEGRATION_TEST_DIR}:expo start `)
    )
  );
  assert.ok(calls.some((call) => call.includes('emulator:-list-avds')));
  assert.ok(
    calls.some((call) =>
      call.includes(`emulator:-avd ${FAKE_ANDROID_AVD_NAME}`)
    )
  );
  assert.ok(calls.some((call) => call.includes('adb:wait-for-device shell')));
  assert.ok(
    calls.some((call) =>
      call.includes(
        `yarn:cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId ${FAKE_ANDROID_EMULATOR_ID}`
      )
    )
  );
  assert.equal(waitForFile(expoMarkerFile), true);
});

test('start-test-android.sh preserves forwarded argument boundaries', (t) => {
  const { env, forwardedArgumentsFile } = createOwnedPackagerEnvironment(t, {
    STUB_ADB_DEVICES: `List of devices attached\n${FAKE_ANDROID_EMULATOR_ID}\tdevice\n`,
  });
  const forwardedArguments = ['--file', 'specs/with spaces.js'];

  const result = runScript('start-test-android.sh', env, forwardedArguments);
  const capturedArguments = readForwardedArguments(forwardedArgumentsFile);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    capturedArguments.slice(-forwardedArguments.length),
    forwardedArguments
  );
});
