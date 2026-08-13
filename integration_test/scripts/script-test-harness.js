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
const FAKE_IOS_SIMULATOR_UDID = 'FAKE-IOS-SIMULATOR-UDID';
const FAKE_IOS_DEVICE_TYPE =
  'com.example.CoreSimulator.SimDeviceType.Stub-iPhone';
const ARBITRARY_FOREIGN_PID = '11111';
const ARBITRARY_OWNED_PID = '22222';
const WAIT_TIMEOUT_MS = 1000;
const WAIT_POLL_INTERVAL_MS = 10;
const WAIT_ARRAY = new Int32Array(new SharedArrayBuffer(4));
const FAKE_FOREIGN_PROJECT_PATH = '/tmp/fake-other-project';
const FAKE_OWNED_PROJECT_PATH = '/tmp/fake-integration-test-project';
const FAKE_ANDROID_EMULATOR_ID = 'emulator-5554';
const FAKE_ANDROID_AVD_NAME = 'Stub_AVD';

function iosDevice({ name, udid, state }) {
  return { state, deviceTypeIdentifier: FAKE_IOS_DEVICE_TYPE, name, udid };
}

function iosDevicesJson(devices) {
  return JSON.stringify({ devices: { runtime: devices } });
}

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
  const adbDevicesStateFile = path.join(tempDir, 'adb-devices.state');
  const expoPidFile = path.join(tempDir, 'expo.pid');
  const expoCwdFile = path.join(tempDir, 'expo.cwd');
  const expoMarkerFile = path.join(tempDir, 'expo.terminated');
  const forwardedArgumentsFile = path.join(tempDir, 'arguments');
  const defaultEnv = {
    ...process.env,
    RCT_METRO_PORT: '',
    PATH: `${binDir}:${process.env.PATH}`,
    STUB_RECORD_FILE: recordFile,
    STUB_ADB_DEVICES_STATE_FILE: adbDevicesStateFile,
    STUB_EXPO_PID_FILE: expoPidFile,
    STUB_EXPO_CWD_FILE: expoCwdFile,
    STUB_EXPO_MARKER_FILE: expoMarkerFile,
    STUB_FORWARDED_ARGUMENTS_FILE: forwardedArgumentsFile,
    STUB_EXPECTED_PACKAGER_PORT: PACKAGER_PORT,
    LSOF_PIDS: '',
    LSOF_CWD: '',
    STUB_EXPO_START_MODE: '',
    STUB_PROCESS_LIST: '',
    STUB_ADB_DEVICES: '',
    STUB_ADB_DEVICES_FIRST: '',
    STUB_ADB_DEVICES_NEXT: '',
    STUB_EMULATOR_LIST_AVDS: '',
    STUB_IOS_DEVICES_JSON: iosDevicesJson([
      iosDevice({
        name: FAKE_IOS_SIMULATOR_NAME,
        udid: FAKE_IOS_SIMULATOR_UDID,
        state: 'Shutdown',
      }),
    ]),
    ...env,
  };

  writeFakeCommand(
    binDir,
    'lsof',
    `#!/bin/sh
echo "lsof:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "-nP" ] && [ "$2" = "-iTCP:$STUB_EXPECTED_PACKAGER_PORT" ] && [ "$3" = "-sTCP:LISTEN" ] && [ "$4" = "-t" ]; then
  if [ -f "$STUB_EXPO_PID_FILE" ]; then
    cat "$STUB_EXPO_PID_FILE"
    exit 0
  fi
  if [ -n "$LSOF_PIDS" ]; then
    printf "%s\\n" "$LSOF_PIDS"
    exit 0
  fi
  exit 1
fi
# Match the exact "what is this process cwd?" lsof call used by packager-utils.sh.
if [ "$1" = "-a" ] && [ "$2" = "-p" ] && [ "$4" = "-d" ] && [ "$5" = "cwd" ] && [ "$6" = "-Fn" ]; then
  if [ -f "$STUB_EXPO_CWD_FILE" ]; then
    printf "n%s\\n" "$(cat "$STUB_EXPO_CWD_FILE")"
    exit 0
  fi
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
if [ -f "$STUB_EXPO_PID_FILE" ]; then
  pid="$(cat "$STUB_EXPO_PID_FILE")"
  cwd="$(cat "$STUB_EXPO_CWD_FILE" 2>/dev/null)"
  printf "%s\\n" "node $cwd/node_modules/expo/bin/cli start --port $STUB_EXPECTED_PACKAGER_PORT --localhost"
  exit 0
fi
printf "%s\\n" "$STUB_PROCESS_LIST"
`
  );

  writeFakeCommand(
    binDir,
    'sleep',
    `#!/bin/sh
exec /bin/sleep 0.01
`
  );

  writeFakeCommand(
    binDir,
    'npx',
    `#!/bin/sh
echo "npx:$PWD:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "expo" ] && [ "$2" = "start" ]; then
  if [ "$STUB_EXPO_START_MODE" = "hold" ]; then
    echo "$$" > "$STUB_EXPO_PID_FILE"
    echo "$PWD" > "$STUB_EXPO_CWD_FILE"
    trap 'echo "terminated" > "$STUB_EXPO_MARKER_FILE"; rm -f "$STUB_EXPO_PID_FILE" "$STUB_EXPO_CWD_FILE"; exit 0' TERM INT
    while true; do
      sleep 1
    done
  fi
  exit 0
fi
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'yarn',
    `#!/bin/sh
echo "yarn:$*" >> "$STUB_RECORD_FILE"
if [ -n "$STUB_FORWARDED_ARGUMENTS_FILE" ]; then
  printf "%s\\n" "$@" > "$STUB_FORWARDED_ARGUMENTS_FILE"
fi
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'xcrun',
    `#!/bin/sh
echo "xcrun:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "simctl" ] && [ "$2" = "list" ]; then
  printf "%s\\n" "$STUB_IOS_DEVICES_JSON"
  exit 0
fi
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'adb',
    `#!/bin/sh
echo "adb:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "devices" ]; then
  if [ -n "$STUB_ADB_DEVICES_FIRST" ]; then
    if [ ! -f "$STUB_ADB_DEVICES_STATE_FILE" ]; then
      touch "$STUB_ADB_DEVICES_STATE_FILE"
      printf "%b" "$STUB_ADB_DEVICES_FIRST"
      exit 0
    fi
    next_output="$STUB_ADB_DEVICES_NEXT"
    if [ -z "$next_output" ]; then
      next_output="$STUB_ADB_DEVICES"
    fi
    printf "%b" "$next_output"
    exit 0
  fi
  printf "%b" "$STUB_ADB_DEVICES"
  exit 0
fi
exit 0
`
  );

  writeFakeCommand(
    binDir,
    'emulator',
    `#!/bin/sh
echo "emulator:$*" >> "$STUB_RECORD_FILE"
if [ "$1" = "-list-avds" ]; then
  printf "%s\\n" "$STUB_EMULATOR_LIST_AVDS"
  exit 0
fi
exit 0
`
  );

  return {
    tempDir,
    recordFile,
    expoMarkerFile,
    forwardedArgumentsFile,
    env: defaultEnv,
  };
}

function createOwnedPackagerEnvironment(t, env = {}) {
  return createStubEnvironment(t, {
    LSOF_PIDS: ARBITRARY_OWNED_PID,
    LSOF_CWD: INTEGRATION_TEST_DIR,
    STUB_PROCESS_LIST: `${ARBITRARY_OWNED_PID} ?? 0:00.10 node ${FAKE_OWNED_PROJECT_PATH}/node_modules/expo/bin/cli start --port ${PACKAGER_PORT} --localhost`,
    ...env,
  });
}

function runScript(scriptName, env, args = []) {
  return spawnSync(`./scripts/${scriptName}`, args, {
    cwd: INTEGRATION_TEST_DIR,
    env,
    encoding: 'utf8',
  });
}

function readCalls(recordFile) {
  if (!fs.existsSync(recordFile)) {
    return [];
  }

  return fs.readFileSync(recordFile, 'utf8').split('\n').filter(Boolean);
}

function readForwardedArguments(forwardedArgumentsFile) {
  return fs.readFileSync(forwardedArgumentsFile, 'utf8').trim().split('\n');
}

function startDetachedTrapProcess(markerFile) {
  const readyFile = `${markerFile}.ready`;
  const child = spawn(
    process.execPath,
    [
      '-e',
      "const fs=require('fs'); process.on('SIGTERM',()=>{fs.writeFileSync(process.env.MARKER_FILE,'terminated'); process.exit(0);}); fs.writeFileSync(process.env.READY_FILE,'ready'); setInterval(()=>{}, 1000);",
    ],
    {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        MARKER_FILE: markerFile,
        READY_FILE: readyFile,
      },
    }
  );
  child.unref();

  if (!waitForFile(readyFile, 5000)) {
    spawnSync('kill', ['-9', String(child.pid)], { stdio: 'ignore' });
    throw new Error('Timed out waiting for the disposable process to start');
  }
  fs.rmSync(readyFile, { force: true });

  return String(child.pid);
}

function waitForFile(filePath, timeoutMs = WAIT_TIMEOUT_MS) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return true;
    }
    Atomics.wait(WAIT_ARRAY, 0, 0, WAIT_POLL_INTERVAL_MS);
  }

  return false;
}

function assertPackagerNotStarted(calls) {
  assert.ok(
    !calls.some(
      (call) => call.startsWith('npx:') && call.includes(':expo start ')
    )
  );
}

module.exports = {
  ARBITRARY_FOREIGN_PID,
  ARBITRARY_OWNED_PID,
  FAKE_ANDROID_AVD_NAME,
  FAKE_ANDROID_EMULATOR_ID,
  FAKE_FOREIGN_PROJECT_PATH,
  FAKE_IOS_SIMULATOR_NAME,
  FAKE_IOS_SIMULATOR_UDID,
  FAKE_OWNED_PROJECT_PATH,
  INTEGRATION_TEST_DIR,
  PACKAGER_PORT,
  assertPackagerNotStarted,
  createOwnedPackagerEnvironment,
  createStubEnvironment,
  iosDevice,
  iosDevicesJson,
  readCalls,
  readForwardedArguments,
  runScript,
  startDetachedTrapProcess,
  waitForFile,
};
