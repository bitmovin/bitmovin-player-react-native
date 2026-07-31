const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

function writeExecutable(directory, name, contents) {
  const file = path.join(directory, name);
  writeFileSync(file, `#!/bin/sh\n${contents}`);
  chmodSync(file, 0o755);
}

function captureForwardedArguments(scriptName, forwardedArguments) {
  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), 'integration-test-launcher-')
  );
  const binDirectory = path.join(temporaryDirectory, 'bin');
  const captureFile = path.join(temporaryDirectory, 'arguments');
  mkdirSync(binDirectory);

  writeExecutable(
    binDirectory,
    'yarn',
    'printf \'%s\\n\' "$@" > "$CAPTURE_FILE"\n'
  );
  writeExecutable(binDirectory, 'xcrun', "printf '{}\\n'\n");
  writeExecutable(binDirectory, 'jq', "printf 'iPhone Test\\n'\n");
  writeExecutable(
    binDirectory,
    'adb',
    "printf 'List of devices attached\\nemulator-5554\\tdevice\\n'\n"
  );

  try {
    const result = spawnSync(
      'bash',
      [path.join(__dirname, scriptName), ...forwardedArguments],
      {
        cwd: temporaryDirectory,
        encoding: 'utf8',
        env: {
          ...process.env,
          CAPTURE_FILE: captureFile,
          PATH: `${binDirectory}:${process.env.PATH}`,
        },
      }
    );

    assert.equal(result.status, 0, result.stderr);
    return readFileSync(captureFile, 'utf8').trim().split('\n');
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

for (const scriptName of ['start-test-android.sh', 'start-test-ios.sh']) {
  test(`${scriptName} preserves forwarded argument boundaries`, () => {
    const forwardedArguments = ['--file', 'specs/with spaces.js'];
    const capturedArguments = captureForwardedArguments(
      scriptName,
      forwardedArguments
    );

    assert.deepEqual(
      capturedArguments.slice(-forwardedArguments.length),
      forwardedArguments
    );
  });
}
