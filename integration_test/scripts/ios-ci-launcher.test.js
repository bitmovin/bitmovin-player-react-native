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

test('allows cold migration within the overall budget without retrying boot', async (t) => {
  const f = fixture(t);
  f.config.timeoutMs = 600000;
  const run = f.dependencies.run;
  f.dependencies.run = (command, args, config) => {
    const result = run(command, args, config);
    if (args[1] === 'bootstatus') {
      // A cold boot taking six minutes must reach install on its first try.
      if (config.timeout < 360000) {
        return {
          status: 1,
          error: new Error('cold migration killed before completion'),
          stdout: 'Status=2, isTerminal=NO: Waiting on Data Migration',
        };
      }
      assert.equal(config.timeout, f.config.timeoutMs);
      return { status: 0, stdout: 'Status=4294967295, isTerminal=YES' };
    }
    return result;
  };
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /app exited/
  );
  assert.equal(
    f.calls.filter(({ args }) => args[1] === 'bootstatus').length,
    1
  );
  assert.equal(f.calls.filter(({ args }) => args[1] === 'boot').length, 1);
  assert.ok(f.calls.some(({ args }) => args[1] === 'install'));
});

test('retains migration output and timeout kill details before cleaning up a failed boot', async (t) => {
  const f = fixture(t);
  const run = f.dependencies.run;
  f.dependencies.run = (command, args, config) => {
    const result = run(command, args, config);
    if (args[1] !== 'bootstatus') return result;
    return {
      status: 1,
      error: Object.assign(
        new Error('Command failed: xcrun simctl bootstatus'),
        {
          code: null,
          signal: 'SIGKILL',
          killed: true,
        }
      ),
      stdout: 'Waiting on Data Migration: CoreLocationMigrator.migrator\n',
    };
  };
  await assert.rejects(
    implementation().runIosApp(f.config, f.dependencies),
    /bootstatus.*timeout .*ms.*SIGKILL/
  );
  const log = fs.readFileSync(
    path.join(f.config.artifactsDir, 'simulator-commands.log'),
    'utf8'
  );
  assert.match(log, /CoreLocationMigrator\.migrator/);
  const results = log
    .split('\n')
    .filter((line) => line.startsWith('Result: '))
    .map((line) => JSON.parse(line.slice('Result: '.length)));
  const boot = results.find((result) => result.signal === 'SIGKILL');
  assert.ok(boot);
  assert.equal(boot.timeoutMs, f.config.timeoutMs);
  assert.equal(boot.code, null);
  assert.equal(boot.killed, true);
  assert.equal(boot.cancelled, false);
  assert.equal(boot.status, 1);
  assert.equal(boot.error, 'Command failed: xcrun simctl bootstatus');
  assert.ok(Number.isFinite(Date.parse(boot.startedAt)));
  assert.ok(Number.isFinite(boot.elapsedMs) && boot.elapsedMs >= 0);
  assert.equal(
    f.calls.filter(({ args }) => args[1] === 'bootstatus').length,
    1
  );
  assert.ok(!f.calls.some(({ args }) => args[1] === 'install'));
  assert.ok(
    f.calls.some(({ args }) => args.join(' ') === 'simctl delete owned-udid')
  );
});

test(
  'the overall deadline interrupts the larger boot allowance and still cleans up',
  { timeout: 1000 },
  async (t) => {
    const f = fixture(t);
    f.config.timeoutMs = 30;
    const run = f.dependencies.run;
    f.dependencies.run = (command, args, config) => {
      const result = run(command, args, config);
      if (args[1] !== 'bootstatus') return result;
      return new Promise((resolve) => {
        config.signal.addEventListener(
          'abort',
          () => {
            resolve({ status: 1, error: new Error('bootstatus aborted') });
          },
          { once: true }
        );
      });
    };
    await assert.rejects(
      implementation().runIosApp(f.config, f.dependencies),
      /bootstatus/
    );
    const boot = f.calls.find(({ args }) => args[1] === 'bootstatus');
    assert.equal(boot.config.signal.aborted, true);
    assert.ok(!f.calls.some(({ args }) => args[1] === 'install'));
    const cleanup = f.calls.filter(({ args }) =>
      ['terminate', 'shutdown', 'delete'].includes(args[1])
    );
    assert.deepEqual(
      cleanup.map(({ args }) => args[1]),
      ['terminate', 'shutdown', 'delete']
    );
    assert.ok(
      cleanup.every(({ config }) => !config.signal && config.timeout === 10000)
    );
  }
);

for (const operation of ['boot', 'bootstatus', 'install']) {
  test(`${operation} failure fails the run and removes only its created simulator`, async (t) => {
    const f = fixture(t, { fail: operation });
    await assert.rejects(
      implementation().runIosApp(f.config, f.dependencies),
      new RegExp(operation)
    );
    assert.ok(!f.calls.some(({ args }) => args[1] === 'launch'));
    assert.equal(f.calls.filter(({ args }) => args[1] === operation).length, 1);
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
