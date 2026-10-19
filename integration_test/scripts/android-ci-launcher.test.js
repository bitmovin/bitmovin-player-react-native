const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const launcherPath = path.join(__dirname, 'android-ci-launcher.js');

function fixture(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'android-ci-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const apk = path.join(directory, 'host.apk');
  fs.writeFileSync(apk, 'fixture');
  const calls = [];
  const env = {
    ANDROID_SERIAL: 'emulator-5554',
    CAVY_ANDROID_APK: apk,
    CAVY_ARTIFACTS_DIR: path.join(directory, 'artifacts'),
    RCT_METRO_PORT: '8081',
    ...overrides,
  };
  const outputs = {
    'get-state': 'device\n',
    'shell getprop sys.boot_completed': '1\n',
    'reverse --list': '',
    'shell pidof com.bitmovin.player.reactnative.integrationtests': '1234\n',
    'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity':
      'Status: ok\nActivity: com.bitmovin.player.reactnative.integrationtests/.MainActivity\n',
  };
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    assert.equal(command, 'adb');
    assert.deepEqual(args.slice(0, 2), ['-s', env.ANDROID_SERIAL]);
    assert.ok(options.timeout > 0 && options.timeout <= 120000);
    const output = outputs[args.slice(2).join(' ')];
    if (output instanceof Error) throw output;
    return Buffer.from(output || '');
  };
  assert.ok(fs.existsSync(launcherPath), 'Android CI launcher must exist');
  const { createAndroidLauncher } = require('./android-ci-launcher');
  return { launcher: createAndroidLauncher(env, execute), env, calls, outputs };
}

test('requires an explicit emulator instead of accidentally selecting a device', (t) => {
  for (const serial of ['', 'physical-device']) {
    assert.throws(() => fixture(t, { ANDROID_SERIAL: serial }), /emulator/i);
  }
});

test('rejects a missing prebuilt APK without running adb or a build', (t) => {
  const { launcher, calls } = fixture(t, {
    CAVY_ANDROID_APK: '/missing/host.apk',
  });
  assert.throws(() => launcher.prepare(), /APK/);
  assert.equal(calls.length, 0);
});

test('rejects an emulator that is offline or has not booted', (t) => {
  for (const [command, output] of [
    ['get-state', 'offline'],
    ['shell getprop sys.boot_completed', '0'],
  ]) {
    const { launcher, calls, outputs } = fixture(t);
    outputs[command] = output;
    assert.throws(() => launcher.prepare(), /ready|boot/i);
    assert.ok(!calls.some(({ args }) => args.includes('install')));
  }
});

test('propagates installation failures', (t) => {
  const { launcher, env, outputs } = fixture(t);
  outputs[`install -r ${env.CAVY_ANDROID_APK}`] = new Error('INSTALL_FAILED');
  assert.throws(() => launcher.prepare(), /INSTALL_FAILED/);
});

test('installs the existing APK and sets up Metro and Cavy reverse ports', (t) => {
  const { launcher, env, calls } = fixture(t, { RCT_METRO_PORT: '9090' });
  launcher.prepare();
  assert.ok(
    calls.some(
      ({ args }) =>
        args.slice(2).join(' ') === `install -r ${env.CAVY_ANDROID_APK}`
    )
  );
  for (const port of ['9090', '8082']) {
    assert.ok(
      calls.some(
        ({ args }) =>
          args.slice(2).join(' ') ===
          `reverse --no-rebind tcp:${port} tcp:${port}`
      )
    );
  }
  assert.ok(calls.every(({ command }) => command === 'adb'));
});

test('refuses a conflicting reverse mapping without replacing it', (t) => {
  const { launcher, outputs, calls } = fixture(t);
  outputs['reverse --list'] = 'host-serial tcp:8081 tcp:9000\n';
  assert.throws(() => launcher.prepare(), /8081.*in use/);
  assert.ok(!calls.some(({ args }) => args.includes('--no-rebind')));
});

test('cleans up only mappings it created, including partial setup failures', (t) => {
  const { launcher, outputs, calls } = fixture(t);
  outputs['reverse --no-rebind tcp:8082 tcp:8082'] = new Error(
    'reverse failed'
  );
  assert.throws(() => launcher.prepare(), /reverse failed/);
  launcher.cleanup();
  const removals = calls.filter(({ args }) => args.includes('--remove'));
  assert.deepEqual(
    removals.map(({ args }) => args.slice(2)),
    [['reverse', '--remove', 'tcp:8081']]
  );
  assert.ok(!calls.some(({ args }) => args.includes('force-stop')));
});

test('preserves pre-existing reverse mappings and does not kill the emulator', (t) => {
  const { launcher, outputs, calls } = fixture(t);
  outputs['reverse --list'] =
    'host-serial tcp:8081 tcp:8081\nhost-serial tcp:8082 tcp:8082\n';
  launcher.prepare();
  launcher.cleanup();
  assert.ok(!calls.some(({ args }) => args.includes('--remove')));
  assert.ok(!calls.some(({ args }) => args.includes('kill')));
});

test('detects am start errors even when adb exits zero', (t) => {
  const { launcher, outputs } = fixture(t);
  launcher.prepare();
  outputs[
    'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity'
  ] = 'Error type 3\nError: Activity class does not exist.\n';
  assert.throws(() => launcher.launch(), /start|Activity/i);
});

test('detects an app crash or missing application process', (t) => {
  const { launcher, outputs } = fixture(t);
  launcher.prepare();
  launcher.launch();
  outputs['shell pidof com.bitmovin.player.reactnative.integrationtests'] = '';
  assert.throws(() => launcher.check(), /process|crash/i);
});

test('launch and cleanup work across separate adapter invocations', (t) => {
  const { launcher, env, calls } = fixture(t);
  launcher.prepare();
  launcher.launch();
  const { createAndroidLauncher } = require('./android-ci-launcher');
  createAndroidLauncher(env, (command, args, options) => {
    calls.push({ command, args, options });
    return Buffer.from('');
  }).cleanup();
  assert.ok(
    calls.some(
      ({ args }) =>
        args.slice(2).join(' ') ===
        'shell am force-stop com.bitmovin.player.reactnative.integrationtests'
    )
  );
  assert.equal(calls.filter(({ args }) => args.includes('--remove')).length, 2);
});

test('captures diagnostics even if one adb diagnostic fails', (t) => {
  const { launcher, env, outputs } = fixture(t);
  outputs['logcat -d -v threadtime'] = 'Android crash detail\n';
  outputs['shell dumpsys activity activities'] = new Error(
    'device disconnected'
  );
  launcher.diagnostics();
  assert.match(
    fs.readFileSync(path.join(env.CAVY_ARTIFACTS_DIR, 'logcat.txt'), 'utf8'),
    /crash detail/
  );
  assert.match(
    fs.readFileSync(path.join(env.CAVY_ARTIFACTS_DIR, 'activity.txt'), 'utf8'),
    /disconnected/
  );
  assert.ok(fs.existsSync(path.join(env.CAVY_ARTIFACTS_DIR, 'screenshot.png')));
});
