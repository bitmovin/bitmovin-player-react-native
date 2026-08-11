const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  ARBITRARY_FOREIGN_PID,
  FAKE_FOREIGN_PROJECT_PATH,
  FAKE_IOS_SIMULATOR_UDID,
  INTEGRATION_TEST_DIR,
  PACKAGER_PORT,
  assertPackagerNotStarted,
  createOwnedPackagerEnvironment,
  createStubEnvironment,
  readCalls,
  runScript,
  startDetachedTrapProcess,
  waitForFile,
} = require('./script-test-harness');

test('start-test-ios fails when port 8081 is occupied by a non-integration process', (t) => {
  const { env } = createStubEnvironment(t, {
    LSOF_PIDS: ARBITRARY_FOREIGN_PID,
    STUB_PROCESS_LIST: `${ARBITRARY_FOREIGN_PID} ttys001 0:00.10 node ${FAKE_FOREIGN_PROJECT_PATH}/node_modules/.bin/expo start --port ${PACKAGER_PORT}`,
  });

  const result = runScript('start-test-ios.sh', env);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /integration_test|8081/i);
});

test('start-test-ios rejects an Expo process whose path only contains this project path', (t) => {
  const containingProjectPath = `${INTEGRATION_TEST_DIR}-copy`;
  const { env } = createStubEnvironment(t, {
    LSOF_PIDS: ARBITRARY_FOREIGN_PID,
    LSOF_CWD: containingProjectPath,
    STUB_PROCESS_LIST: `${ARBITRARY_FOREIGN_PID} ?? 0:00.10 node ${containingProjectPath}/node_modules/expo/bin/cli start --port ${PACKAGER_PORT}`,
  });

  const result = runScript('start-test-ios.sh', env);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /different process/i);
});

test('start-test-ios reuses an owned Expo CLI process without starting another packager', (t) => {
  const { env, recordFile } = createOwnedPackagerEnvironment(t);

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /Using existing integration_test Expo packager/i
  );
  assertPackagerNotStarted(calls);
});

test('packager discovery checks only listening TCP sockets', (t) => {
  const { env, recordFile } = createOwnedPackagerEnvironment(t);

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.ok(calls.includes(`lsof:-nP -iTCP:${PACKAGER_PORT} -sTCP:LISTEN -t`));
});

test('start-test-ios starts Expo, runs cavy, and cleans up the owned packager on exit', (t) => {
  const { env, recordFile, expoMarkerFile } = createStubEnvironment(t, {
    STUB_EXPO_START_MODE: 'hold',
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /Integration test Expo packager is ready/i
  );
  assert.ok(
    calls.some((call) =>
      call.startsWith(`npx:${INTEGRATION_TEST_DIR}:expo start `)
    )
  );
  assert.ok(
    calls.some((call) =>
      call.includes(
        `yarn:cavy run-ios --no-screenshots --keep-alive-timeout=300 --no-packager --udid ${FAKE_IOS_SIMULATOR_UDID}`
      )
    )
  );
  assert.equal(waitForFile(expoMarkerFile), true);
});

test('stop-packager kills the harness-owned integration_test Expo server', (t) => {
  const ownedMarkerFile = path.join(
    os.tmpdir(),
    `owned-packager-${Date.now()}.txt`
  );
  const ownedPid = startDetachedTrapProcess(ownedMarkerFile);
  assert.ok(ownedPid);
  t.after(() => {
    spawnSync('kill', ['-9', ownedPid], { stdio: 'ignore' });
    fs.rmSync(ownedMarkerFile, { force: true });
  });

  const { env, tempDir } = createStubEnvironment(t, {
    LSOF_PIDS: ownedPid,
    LSOF_CWD: INTEGRATION_TEST_DIR,
  });
  env.TMPDIR = tempDir;
  env.STUB_PROCESS_LIST = `${ownedPid} ?? 0:00.10 node /usr/local/bin/expo start ${INTEGRATION_TEST_DIR} --port ${PACKAGER_PORT} --localhost`;

  const result = runScript('stop-packager.sh', env);

  assert.equal(result.status, 0);
  assert.equal(waitForFile(ownedMarkerFile), true);
});

test('stop-packager leaves a foreign process on 8081 alone', (t) => {
  const foreignMarkerFile = path.join(
    os.tmpdir(),
    `foreign-packager-${Date.now()}.txt`
  );
  const foreignPid = startDetachedTrapProcess(foreignMarkerFile);
  assert.ok(foreignPid);
  t.after(() => {
    spawnSync('kill', ['-9', foreignPid], { stdio: 'ignore' });
    fs.rmSync(foreignMarkerFile, { force: true });
  });

  const { env, tempDir } = createStubEnvironment(t, {
    LSOF_PIDS: foreignPid,
  });
  env.TMPDIR = tempDir;
  env.STUB_PROCESS_LIST = `${foreignPid} ?? 0:00.10 node ${FAKE_FOREIGN_PROJECT_PATH}/node_modules/.bin/expo start --port ${PACKAGER_PORT}`;

  const result = runScript('stop-packager.sh', env);

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(foreignMarkerFile), false);
});
