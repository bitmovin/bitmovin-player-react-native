const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

function writeExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, { mode: 0o755 });
}

function createStubEnvironment(t, env = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-test-scripts-'));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const binDir = path.join(tempDir, 'bin');
  fs.mkdirSync(binDir);

  const recordFile = path.join(tempDir, 'calls.log');
  const defaultEnv = {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    STUB_RECORD_FILE: recordFile,
    LSOF_PIDS: '',
    STUB_NPX_MODE: '',
    STUB_PROCESS_LIST: '',
    STUB_SLEEP_EXIT: '0',
    ...env,
  };

  writeExecutable(
    path.join(binDir, 'lsof'),
    `#!/bin/sh
if [ "$1" = "-ti:8081" ]; then
  if [ -n "$LSOF_PIDS" ]; then
    printf "%s\\n" "$LSOF_PIDS"
    exit 0
  fi
  exit 1
fi
exit 1
`
  );

  writeExecutable(
    path.join(binDir, 'ps'),
    `#!/bin/sh
printf "%s\\n" "$STUB_PROCESS_LIST"
`
  );

  writeExecutable(
    path.join(binDir, 'sleep'),
    `#!/bin/sh
exit "$STUB_SLEEP_EXIT"
`
  );

  writeExecutable(
    path.join(binDir, 'npx'),
    `#!/bin/sh
echo "npx:$*" >> "$STUB_RECORD_FILE"
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

  writeExecutable(
    path.join(binDir, 'yarn'),
    `#!/bin/sh
echo "yarn:$*" >> "$STUB_RECORD_FILE"
exit 0
`
  );

  writeExecutable(
    path.join(binDir, 'xcrun'),
    `#!/bin/sh
printf "%s\\n" '{"devices":{"runtime":[{"state":"Shutdown","deviceTypeIdentifier":"com.apple.CoreSimulator.SimDeviceType.iPhone-16","name":"iPhone 16"}]}}'
`
  );

  writeExecutable(
    path.join(binDir, 'jq'),
    `#!/bin/sh
printf "%s\\n" 'iPhone 16'
`
  );

  return { tempDir, recordFile, env: defaultEnv };
}

function runIosScript(env) {
  return spawnSync('./scripts/start-test-ios.sh', {
    cwd: path.resolve(__dirname, '..'),
    env,
    encoding: 'utf8',
  });
}

function runStopPackagerScript(env) {
  return spawnSync('./scripts/stop-packager.sh', {
    cwd: path.resolve(__dirname, '..'),
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

function waitForFile(filePath, timeoutMs = 1000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return true;
    }
  }

  return false;
}

function startDetachedSleep() {
  const child = spawn('sleep', ['120'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return String(child.pid);
}

test('start-test-ios fails when port 8081 is occupied by a non-integration process', (t) => {
  const { env } = createStubEnvironment(t, {
    LSOF_PIDS: '12345',
    STUB_PROCESS_LIST: '12345 ttys001 0:00.10 node /tmp/another-project/node_modules/.bin/expo start --port 8081',
  });

  const result = runIosScript(env);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /integration_test|8081/i);
});

test('start-test-ios starts Expo instead of react-native when it owns the packager lifecycle', (t) => {
  const { env, recordFile } = createStubEnvironment(t, {
    STUB_SLEEP_EXIT: '1',
  });

  const result = runIosScript(env);
  const calls = readCalls(recordFile);

  assert.notEqual(result.status, 0);
  assert.ok(calls.some((call) => call.startsWith('npx:expo start ')));
  assert.ok(!calls.some((call) => call.startsWith('npx:react-native start --port 8081')));
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
  env.STUB_PROCESS_LIST = `${ownedPid} ?? 0:00.10 node /usr/local/bin/expo start ${path.resolve(__dirname, '..')} --port 8081 --localhost`;
  fs.writeFileSync(path.join(tempDir, 'bitmovin-integration-test-packager.pid'), `${ownedPid}`);

  const result = runStopPackagerScript(env);

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
  env.STUB_PROCESS_LIST = `${foreignPid} ?? 0:00.10 node /tmp/another-project/node_modules/.bin/expo start --port 8081`;

  const result = runStopPackagerScript(env);

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(foreignMarkerFile), false);
});
