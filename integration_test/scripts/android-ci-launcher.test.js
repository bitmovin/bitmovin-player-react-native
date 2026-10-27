const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const launcherPath = path.join(__dirname, 'android-ci-launcher.js');

test('full Android suites use an IMA-enabled host alongside the no-IMA build', () => {
  const workflow = require('yaml').parse(
    fs.readFileSync(
      path.join(__dirname, '../../.github/workflows/ci-android.yml'),
      'utf8'
    )
  );
  const build = workflow.jobs['test-build-android-integration-tests'];
  const runtime = workflow.jobs['android-system-tests'];
  assert.ok(build, 'The no-IMA host must retain its own build job');
  assert.ok(runtime, 'Full-suite execution must have its own job');
  assert.equal(build.env.BITMOVIN_ENABLE_GOOGLE_IMA, 'false');
  assert.equal(runtime.env.BITMOVIN_ENABLE_GOOGLE_IMA, 'true');
});

function fixture(t, overrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'android-ci-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const apk = path.join(directory, 'host.apk');
  fs.writeFileSync(apk, 'fixture');
  const calls = [];
  const requests = [];
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
  const response = {
    ok: true,
    status: 200,
    arrayBuffer: async () => new ArrayBuffer(1),
  };
  const request = async (url, options) => {
    requests.push({ url, options });
    return response;
  };
  return {
    launcher: createAndroidLauncher(env, execute, request),
    env,
    calls,
    outputs,
    requests,
    response,
  };
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

test('warms the Expo Android entry on the selected Metro port before launching', async (t) => {
  const { launcher, calls, requests, response } = fixture(t, {
    RCT_METRO_PORT: '9090',
  });
  launcher.prepare();
  let finishBundle;
  response.arrayBuffer = () =>
    new Promise((resolve) => {
      finishBundle = resolve;
    });
  const launch = launcher.launch();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url);
  assert.equal(url.origin, 'http://127.0.0.1:9090');
  assert.equal(url.pathname, '/.expo/.virtual-metro-entry.bundle');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    platform: 'android',
    dev: 'true',
    lazy: 'true',
    minify: 'false',
    app: 'com.bitmovin.player.reactnative.integrationtests',
    modulesOnly: 'false',
    runModule: 'true',
    excludeSource: 'true',
    sourcePaths: 'url-server',
  });
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  assert.ok(!calls.some(({ args }) => args.includes('start')));
  assert.equal(
    typeof finishBundle,
    'function',
    'wait for the complete bundle body'
  );
  finishBundle(new ArrayBuffer(1));
  await launch;
  assert.equal(calls.filter(({ args }) => args.includes('start')).length, 1);
});

test('does not launch when Metro rejects or interrupts the Android bundle', async (t) => {
  for (const failure of ['http', 'body']) {
    const { launcher, calls, requests, response } = fixture(t);
    launcher.prepare();
    if (failure === 'http') {
      response.ok = false;
      response.status = 500;
    } else {
      response.arrayBuffer = async () => {
        throw new Error('connection closed');
      };
    }
    await assert.rejects(launcher.launch(), /Metro.*(500|connection closed)/);
    assert.equal(requests.length, 1, 'do not retry a failed bundle');
    assert.ok(!calls.some(({ args }) => args.includes('start')));
    launcher.cleanup();
    assert.ok(!calls.some(({ args }) => args.includes('force-stop')));
  }
});

test('detects am start errors even when adb exits zero', async (t) => {
  const { launcher, outputs } = fixture(t);
  launcher.prepare();
  outputs[
    'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity'
  ] = 'Error type 3\nError: Activity class does not exist.\n';
  await assert.rejects(launcher.launch(), /start|Activity/i);
});

test('defers a live app display timeout to bounded Cavy readiness without relaunching', async (t) => {
  const { launcher, outputs, calls, env } = fixture(t);
  launcher.prepare();
  outputs[
    'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity'
  ] = 'Status: timeout\nLaunchState: UNKNOWN (-1)\nWaitTime: 11272\nComplete\n';
  await launcher.launch();
  assert.equal(calls.filter(({ args }) => args.includes('start')).length, 1);
  assert.ok(calls.some(({ args }) => args.includes('pidof')));
  assert.match(
    fs.readFileSync(path.join(env.CAVY_ARTIFACTS_DIR, 'launch.txt'), 'utf8'),
    /Status: timeout/
  );
});

test('fails display timeouts when the app process is absent', async (t) => {
  const { launcher, outputs } = fixture(t);
  launcher.prepare();
  outputs[
    'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity'
  ] = 'Status: timeout\nWaitTime: 13317\nComplete\n';
  outputs['shell pidof com.bitmovin.player.reactnative.integrationtests'] = '';
  await assert.rejects(launcher.launch(), /process|crash/i);
});

test('fails unknown launch statuses and adb command timeouts', async (t) => {
  for (const result of [
    'Status: failed\n',
    'Starting: Intent without a status\n',
    new Error('adb command timed out'),
  ]) {
    const { launcher, outputs } = fixture(t);
    launcher.prepare();
    outputs[
      'shell am start -W -n com.bitmovin.player.reactnative.integrationtests/.MainActivity'
    ] = result;
    await assert.rejects(launcher.launch(), /failed|timed out/);
  }
});

test('detects an app crash or missing application process', async (t) => {
  const { launcher, outputs } = fixture(t);
  launcher.prepare();
  await launcher.launch();
  outputs['shell pidof com.bitmovin.player.reactnative.integrationtests'] = '';
  assert.throws(() => launcher.check(), /process|crash/i);
});

test('launch and cleanup work across separate adapter invocations', async (t) => {
  const { launcher, env, calls } = fixture(t);
  launcher.prepare();
  await launcher.launch();
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
