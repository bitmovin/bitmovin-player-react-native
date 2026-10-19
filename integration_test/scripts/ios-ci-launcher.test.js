const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const test = require('node:test');

// Native calls are injected: these tests never build, boot, or contact a simulator.
function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-ci-launcher-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const appPath = path.join(directory, 'IntegrationTest.app');
  fs.mkdirSync(appPath);
  fs.writeFileSync(path.join(appPath, 'Info.plist'), 'fixture');
  const calls = [];
  const children = [];
  const signals = new EventEmitter();
  const run = (command, args, config) => {
    calls.push({ command, args, config });
    if (options.cancelDuring === args[1]) {
      signals.emit('SIGTERM');
      assert.equal(config.signal.aborted, true);
      return { status: null, error: new Error('cancelled native startup') };
    }
    if (options.fail === args[1]) {
      return { status: 1, stderr: 'native command failed' };
    }
    if (args[1] === 'list') {
      return {
        status: 0,
        stdout: JSON.stringify({
          runtimes: options.runtimes ?? [
            {
              identifier: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5',
              isAvailable: true,
            },
          ],
        }),
      };
    }
    return { status: 0, stdout: args[1] === 'create' ? 'owned-udid\n' : '' };
  };
  const spawn = (command, args) => {
    calls.push({ command, args });
    const child = new EventEmitter();
    child.exitCode = null;
    child.signalCode = null;
    child.kill = (signal) => {
      child.signalCode = signal;
      child.emit('close', null, signal);
    };
    children.push(child);
    if (args[1] === 'launch') {
      setImmediate(() => {
        if (options.launchError)
          child.emit('error', new Error('launch failed'));
        else if (options.hold) signals.emit('SIGTERM');
        else if (!options.hang) {
          child.exitCode = options.exitCode ?? 0;
          child.emit('close', child.exitCode, null);
        }
      });
    }
    return child;
  };
  return {
    calls,
    children,
    directory,
    config: {
      appPath,
      artifactsDir: path.join(directory, 'artifacts'),
      runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-26-5',
      deviceType: 'com.apple.CoreSimulator.SimDeviceType.iPhone-17',
      timeoutMs: options.hang ? 30 : 1000,
      home: directory,
    },
    dependencies: { run, spawn, signals },
  };
}

function implementation() {
  const filename = path.join(__dirname, 'ios-ci-launcher.js');
  assert.ok(fs.existsSync(filename), 'iOS CI launcher must exist');
  return require(filename);
}

test('rejects a missing host build before making any native calls', async (t) => {
  const f = fixture(t);
  f.config.appPath += '-missing';
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /app/i
  );
  assert.equal(f.calls.length, 0);
});

test('fails when the explicitly selected runtime is unavailable', async (t) => {
  const f = fixture(t, { runtimes: [] });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /runtime/i
  );
  assert.ok(!f.calls.some(({ args }) => args[1] === 'create'));
});

for (const operation of ['boot', 'bootstatus', 'install']) {
  test(`${operation} failure fails the run and removes only its created simulator`, async (t) => {
    const f = fixture(t, { fail: operation });
    await assert.rejects(
      implementation().runIosApp(f.config, f.dependencies),
      new RegExp(operation)
    );
    assert.ok(!f.calls.some(({ args }) => args[1] === 'launch'));
    assert.ok(
      f.calls.some(({ args }) => args.join(' ') === 'simctl delete owned-udid')
    );
    assert.ok(f.calls.every(({ config }) => !config || config.timeout > 0));
  });
}

for (const exitCode of [0, 1, 42]) {
  test(`app exit ${exitCode} cannot be mistaken for a passing Cavy report`, async (t) => {
    const f = fixture(t, { exitCode });
    await assert.rejects(
      implementation().runIosApp(f.config, f.dependencies),
      /exited/i
    );
    const install = f.calls.find(({ args }) => args[1] === 'install');
    assert.deepEqual(install.args, [
      'simctl',
      'install',
      'owned-udid',
      f.config.appPath,
    ]);
    assert.ok(f.calls.every(({ command }) => command === 'xcrun'));
    assert.ok(
      f.children.every(
        (child) => child.exitCode !== null || child.signalCode !== null
      )
    );
    assert.ok(
      fs.existsSync(path.join(f.config.artifactsDir, 'simulator-commands.log'))
    );
  });
}

test('a launch startup error fails and cleans up the log stream and simulator', async (t) => {
  const f = fixture(t, { launchError: true });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /launch failed/
  );
  assert.ok(f.children.every((child) => child.signalCode !== null));
  assert.ok(
    f.calls.some(({ args }) => args.join(' ') === 'simctl delete owned-udid')
  );
});

test('bounds a hung app and preserves native diagnostics', async (t) => {
  const f = fixture(t, { hang: true });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /timed out/i
  );
  assert.ok(fs.existsSync(path.join(f.config.artifactsDir, 'app-console.log')));
  assert.ok(fs.existsSync(path.join(f.config.artifactsDir, 'simulator.log')));
  assert.ok(f.children.every((child) => child.signalCode !== null));
});

test('coordinator cancellation terminates the app and removes its simulator', async (t) => {
  const f = fixture(t, { hold: true });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /SIGTERM/
  );
  assert.ok(
    f.calls.some(
      ({ args }) =>
        args.join(' ') ===
        'simctl terminate owned-udid com.bitmovin.player.reactnative.integrationtests'
    )
  );
  assert.ok(
    f.calls.some(({ args }) => args.join(' ') === 'simctl shutdown owned-udid')
  );
  assert.ok(
    f.calls.some(({ args }) => args.join(' ') === 'simctl delete owned-udid')
  );
  assert.equal(f.dependencies.signals.listenerCount('SIGTERM'), 0);
});

test('copies native crash reports before deleting the simulator', async (t) => {
  const f = fixture(t);
  const crashDir = path.join(
    f.directory,
    'Library',
    'Logs',
    'DiagnosticReports'
  );
  fs.mkdirSync(crashDir, { recursive: true });
  fs.writeFileSync(
    path.join(crashDir, 'IntegrationTest-fixture.ips'),
    'crash evidence'
  );
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /exited/i
  );
  assert.equal(
    fs.readFileSync(
      path.join(
        f.config.artifactsDir,
        'crashes',
        'host',
        'IntegrationTest-fixture.ips'
      ),
      'utf8'
    ),
    'crash evidence'
  );
});

test('cancellation interrupts native startup and still disposes the owned simulator', async (t) => {
  const f = fixture(t, { cancelDuring: 'bootstatus' });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /cancelled native startup/
  );
  assert.ok(!f.calls.some(({ args }) => args[1] === 'install'));
  assert.ok(
    f.calls.some(({ args }) => args.join(' ') === 'simctl delete owned-udid')
  );
});

for (const operation of ['shutdown', 'delete']) {
  test(`records ${operation} failure without hiding the app failure`, async (t) => {
    const f = fixture(t, { fail: operation });
    await assert.rejects(
      implementation().runIosApp(f.config, f.dependencies),
      /app exited/
    );
    const cleanup = JSON.parse(
      fs.readFileSync(
        path.join(f.config.artifactsDir, 'ios-cleanup.json'),
        'utf8'
      )
    );
    assert.equal(cleanup.success, false);
    assert.match(cleanup.errors.join(' '), new RegExp(operation));
    assert.ok(f.calls.some(({ args }) => args[1] === 'delete'));
  });
}

test('records successful disposal after coordinator cancellation', async (t) => {
  const f = fixture(t, { hold: true });
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /SIGTERM/
  );
  const cleanup = JSON.parse(
    fs.readFileSync(
      path.join(f.config.artifactsDir, 'ios-cleanup.json'),
      'utf8'
    )
  );
  assert.deepEqual(cleanup, { success: true, errors: [] });
});
