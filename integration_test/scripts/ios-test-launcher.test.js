const assert = require('node:assert/strict');
const test = require('node:test');

const {
  FAKE_IOS_SIMULATOR_UDID,
  createOwnedPackagerEnvironment,
  createStubEnvironment,
  iosDevice,
  iosDevicesJson,
  readCalls,
  readForwardedArguments,
  runScript,
} = require('./script-test-harness');

test('start-test-ios prefers an already booted simulator', (t) => {
  const bootedUdid = `${FAKE_IOS_SIMULATOR_UDID}-BOOTED`;
  const { env, recordFile } = createOwnedPackagerEnvironment(t, {
    STUB_IOS_DEVICES_JSON: iosDevicesJson([
      iosDevice({
        name: 'Shutdown iPhone',
        udid: `${FAKE_IOS_SIMULATOR_UDID}-SHUTDOWN`,
        state: 'Shutdown',
      }),
      iosDevice({
        name: 'Booted iPhone',
        udid: bootedUdid,
        state: 'Booted',
      }),
    ]),
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    calls.some(
      (call) =>
        call.includes(`yarn:cavy run-ios`) &&
        call.includes(`--udid ${bootedUdid}`)
    )
  );
  assert.ok(!calls.some((call) => call.startsWith('xcrun:simctl boot ')));
});

test('start-test-ios boots and waits for a shutdown simulator', (t) => {
  const shutdownUdid = `${FAKE_IOS_SIMULATOR_UDID}-SHUTDOWN`;
  const { env, recordFile } = createOwnedPackagerEnvironment(t, {
    STUB_IOS_DEVICES_JSON: iosDevicesJson([
      iosDevice({
        name: 'Shutdown iPhone',
        udid: shutdownUdid,
        state: 'Shutdown',
      }),
    ]),
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);
  const bootIndex = calls.indexOf(`xcrun:simctl boot ${shutdownUdid}`);
  const bootStatusIndex = calls.indexOf(
    `xcrun:simctl bootstatus ${shutdownUdid} -b`
  );
  const cavyIndex = calls.findIndex((call) =>
    call.includes(`yarn:cavy run-ios`)
  );

  assert.equal(result.status, 0, result.stderr);
  assert.ok(bootIndex >= 0);
  assert.ok(bootStatusIndex > bootIndex);
  assert.ok(cavyIndex > bootStatusIndex);
  assert.match(calls[cavyIndex], new RegExp(`--udid ${shutdownUdid}`));
});

test('start-test-ios starts its packager after the simulator is ready', (t) => {
  const { env, recordFile } = createStubEnvironment(t, {
    STUB_EXPO_START_MODE: 'hold',
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);
  const bootStatusIndex = calls.indexOf(
    `xcrun:simctl bootstatus ${FAKE_IOS_SIMULATOR_UDID} -b`
  );
  const packagerStartIndex = calls.findIndex(
    (call) => call.startsWith('npx:') && call.includes(':expo start ')
  );

  assert.equal(result.status, 0, result.stderr);
  assert.ok(bootStatusIndex >= 0);
  assert.ok(packagerStartIndex > bootStatusIndex);
});

test('start-test-ios.sh preserves forwarded argument boundaries', (t) => {
  const { env, forwardedArgumentsFile } = createOwnedPackagerEnvironment(t);
  const forwardedArguments = ['--file', 'specs/with spaces.js'];

  const result = runScript('start-test-ios.sh', env, forwardedArguments);
  const capturedArguments = readForwardedArguments(forwardedArgumentsFile);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    capturedArguments.slice(-forwardedArguments.length),
    forwardedArguments
  );
});

test('start-test-ios uses a forwarded --port for its managed packager', (t) => {
  const customPort = '9090';
  const { env, recordFile, forwardedArgumentsFile } =
    createOwnedPackagerEnvironment(t, {
      STUB_EXPECTED_PACKAGER_PORT: customPort,
    });
  const forwardedArguments = ['--port', customPort];

  const result = runScript('start-test-ios.sh', env, forwardedArguments);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0, result.stderr);
  const capturedArguments = readForwardedArguments(forwardedArgumentsFile);
  assert.ok(calls.includes(`lsof:-nP -iTCP:${customPort} -sTCP:LISTEN -t`));
  assert.deepEqual(
    capturedArguments.slice(-forwardedArguments.length),
    forwardedArguments
  );
});

test('start-test-ios lets --port= override RCT_METRO_PORT', (t) => {
  const environmentPort = '9090';
  const argumentPort = '9091';
  const { env, recordFile, forwardedArgumentsFile } =
    createOwnedPackagerEnvironment(t, {
      RCT_METRO_PORT: environmentPort,
      STUB_EXPECTED_PACKAGER_PORT: argumentPort,
    });
  const forwardedArguments = [`--port=${argumentPort}`];

  const result = runScript('start-test-ios.sh', env, forwardedArguments);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0, result.stderr);
  const capturedArguments = readForwardedArguments(forwardedArgumentsFile);
  assert.ok(calls.includes(`lsof:-nP -iTCP:${argumentPort} -sTCP:LISTEN -t`));
  assert.deepEqual(
    capturedArguments.slice(-forwardedArguments.length),
    forwardedArguments
  );
});
