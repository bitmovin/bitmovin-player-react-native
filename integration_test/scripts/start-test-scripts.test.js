const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const INTEGRATION_TEST_DIR = path.resolve(__dirname, '..');
const TEMP_DIR_PREFIX = 'integration-test-scripts-';
const RECORD_FILE_NAME = 'calls.log';
const PACKAGER_PORT = '8081';
const FAKE_IOS_SIMULATOR_NAME = 'Stub iPhone Simulator';
const FAKE_IOS_DEVICE_TYPE = 'com.example.CoreSimulator.SimDeviceType.Stub-iPhone';
const ARBITRARY_FOREIGN_PID = '11111';
const ARBITRARY_OWNED_PID = '22222';
const WAIT_TIMEOUT_MS = 1000;
const FAKE_FOREIGN_PROJECT_PATH = '/tmp/fake-other-project';
const FAKE_OWNED_PROJECT_PATH = '/tmp/fake-integration-test-project';

function writeFakeCommand(binDir, commandName, script) {
  // These files live in the test temp dir and shadow PATH only for the spawned script process.
  fs.writeFileSync(path.join(binDir, commandName), script, { mode: 0o755 });
}

function createStubEnvironment(t, env = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const binDir = path.join(tempDir, 'bin');
  fs.mkdirSync(binDir);

  const recordFile = path.join(tempDir, RECORD_FILE_NAME);
  const defaultEnv = {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    STUB_RECORD_FILE: recordFile,
    LSOF_PIDS: '',
    LSOF_CWD: '',
    STUB_NPX_MODE: '',
    STUB_PROCESS_LIST: '',
    STUB_SLEEP_EXIT: '0',
    ...env,
  };

  writeFakeCommand(
    binDir,
    'lsof',
    `#!/bin/sh
if [ "$1" = "-ti:${PACKAGER_PORT}" ]; then
  if [ -n "$LSOF_PIDS" ]; then
    printf "%s\\n" "$LSOF_PIDS"
    exit 0
  fi
  exit 1
fi
# Match the exact "what is this process cwd?" lsof call used by packager-utils.sh.
if [ "$1" = "-a" ] && [ "$2" = "-p" ] && [ "$4" = "-d" ] && [ "$5" = "cwd" ] && [ "$6" = "-Fn" ]; then
  if [ -n "$LSOF_CWD" ]; then
    printf "n%s\\n" "$LSOF_CWD"
    exit 0
  fi
  exit 1
fi
exit 1
`
  );

  writeFakeCommand(
    binDir,
    'ps',
    `#!/bin/sh
printf "%s\\n" "$STUB_PROCESS_LIST"
`
  );

  writeFakeCommand(
    binDir,
    'sleep',
    `#!/bin/sh
exit "$STUB_SLEEP_EXIT"
`
  );

  writeFakeCommand(
    binDir,
    'npx',
    `#!/bin/sh
echo "npx:$PWD:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "expo" ] && [ "$2" = "start" ]; then
  exit 0
fi
if [ "$1" = "react-native" ] && [ "$2" = "start" ]; then
  exit 0
fi
if [ -n "$STUB_NPX_MODE" ]; then
  exit "$STUB_NPX_MODE"
fi
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'yarn',
    `#!/bin/sh
echo "yarn:$*" >> "$STUB_RECORD_FILE"
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'xcrun',
    `#!/bin/sh
printf "%s\\n" '{"devices":{"runtime":[{"state":"Shutdown","deviceTypeIdentifier":"${FAKE_IOS_DEVICE_TYPE}","name":"${FAKE_IOS_SIMULATOR_NAME}"}]}}'
`
  );

  writeFakeCommand(
    binDir,
    'jq',
    `#!/bin/sh
printf "%s\\n" '${FAKE_IOS_SIMULATOR_NAME}'
`
  );

  return { tempDir, recordFile, env: defaultEnv };
}

function runScript(scriptName, env) {
  return spawnSync(`./scripts/${scriptName}`, {
    cwd: INTEGRATION_TEST_DIR,
    env,
    encoding: 'utf8',
  });
}

function readCalls(recordFile) {
  if (!fs.existsSync(recordFile)) {
    return [];
  }

  return fs
    .readFileSync(recordFile, 'utf8')
    .split('\n')
    .filter(Boolean);
}

function startDetachedTrapProcess(markerFile) {
  const child = spawn(
    'node',
    [
      '-e',
      "const fs=require('fs'); process.on('SIGTERM',()=>{fs.writeFileSync(process.env.MARKER_FILE,'terminated'); process.exit(0);}); setInterval(()=>{}, 1000);",
    ],
    {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        MARKER_FILE: markerFile,
      },
    }
  );
  child.unref();
  return String(child.pid);
}

function waitForFile(filePath, timeoutMs = WAIT_TIMEOUT_MS) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return true;
    }
  }

  return false;
}

function assertPackagerNotStarted(calls) {
  assert.ok(
    !calls.some((call) => call.startsWith('npx:') && call.includes(':expo start '))
  );
}

test('start-test-ios fails when port 8081 is occupied by a non-integration process', (t) => {
  const { env } = createStubEnvironment(t, {
    LSOF_PIDS: ARBITRARY_FOREIGN_PID,
    // Fake ps output for an Expo process that belongs to some other checkout.
    STUB_PROCESS_LIST: `${ARBITRARY_FOREIGN_PID} ttys001 0:00.10 node ${FAKE_FOREIGN_PROJECT_PATH}/node_modules/.bin/expo start --port ${PACKAGER_PORT}`,
  });

  const result = runScript('start-test-ios.sh', env);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /integration_test|8081/i);
});

test('start-test-ios starts Expo instead of react-native when it owns the packager lifecycle', (t) => {
  const { env, recordFile } = createStubEnvironment(t, {
    STUB_SLEEP_EXIT: '1',
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.notEqual(result.status, 0);
  assert.ok(
    calls.some((call) => call.startsWith(`npx:${INTEGRATION_TEST_DIR}:expo start `))
  );
  assert.ok(
    !calls.some((call) => call.includes(`:react-native start --port ${PACKAGER_PORT}`))
  );
});

test('start-test-ios reuses an owned Expo CLI process without starting another packager', (t) => {
  const { env, recordFile } = createStubEnvironment(t, {
    LSOF_PIDS: ARBITRARY_OWNED_PID,
    LSOF_CWD: INTEGRATION_TEST_DIR,
    // Fake ps output for the already-running integration_test Expo CLI process we should reuse.
    STUB_PROCESS_LIST:
      `${ARBITRARY_OWNED_PID} ?? 0:00.10 node ${FAKE_OWNED_PROJECT_PATH}/node_modules/expo/bin/cli start --port ${PACKAGER_PORT} --localhost`,
  });

  const result = runScript('start-test-ios.sh', env);
  const calls = readCalls(recordFile);

  assert.equal(result.status, 0);
  assert.match(result.stdout + result.stderr, /Using existing integration_test Expo packager/i);
  assertPackagerNotStarted(calls);
});

test('stop-packager kills the harness-owned integration_test Expo server', (t) => {
  const ownedMarkerFile = path.join(os.tmpdir(), `owned-packager-${Date.now()}.txt`);
  const ownedPid = startDetachedTrapProcess(ownedMarkerFile);
  assert.ok(ownedPid);
  t.after(() => {
    spawnSync('kill', ['-9', ownedPid], { stdio: 'ignore' });
    fs.rmSync(ownedMarkerFile, { force: true });
  });

  const { env, tempDir } = createStubEnvironment(t);
  env.TMPDIR = tempDir;
  // Fake ps output for the harness-owned Expo server referenced by the pid file.
  env.STUB_PROCESS_LIST = `${ownedPid} ?? 0:00.10 node /usr/local/bin/expo start ${INTEGRATION_TEST_DIR} --port ${PACKAGER_PORT} --localhost`;
  fs.writeFileSync(path.join(tempDir, 'bitmovin-integration-test-packager.pid'), `${ownedPid}`);

  const result = runScript('stop-packager.sh', env);

  assert.equal(result.status, 0);
  assert.equal(waitForFile(ownedMarkerFile), true);
});

test('stop-packager leaves a foreign process on 8081 alone', (t) => {
  const foreignMarkerFile = path.join(os.tmpdir(), `foreign-packager-${Date.now()}.txt`);
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
  // Fake ps output for a foreign Expo process that happens to own the Metro port.
  env.STUB_PROCESS_LIST = `${foreignPid} ?? 0:00.10 node ${FAKE_FOREIGN_PROJECT_PATH}/node_modules/.bin/expo start --port ${PACKAGER_PORT}`;

  const result = runScript('stop-packager.sh', env);

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(foreignMarkerFile), false);
});
