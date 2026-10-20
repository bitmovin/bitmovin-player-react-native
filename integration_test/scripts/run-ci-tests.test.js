const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawnSync } = require('node:child_process');
const {
  createCiConfig,
  runCiTests: supervise,
  validateReport,
} = require('./run-ci-tests');

// Restricted workers can exercise real subprocess lifecycle without binding sockets.
// Default validation always uses real HTTP/TCP; this mode explicitly omits it.
const noNetwork = process.env.CAVY_TEST_NO_NETWORK === '1';
function runCiTests(config) {
  return supervise(
    config,
    noNetwork
      ? {
          assertPortFree: async () => {},
          probe: async (_port, metro) => {
            const events = path.join(config.artifactsDir, 'events');
            return (
              fs.existsSync(events) &&
              fs
                .readFileSync(events, 'utf8')
                .includes(metro ? 'metro:ready' : 'reporter:ready')
            );
          },
        }
      : {}
  );
}

const goodXml =
  '<testsuite tests="1" failures="0" errors="0"><testcase name="plays"/></testsuite>';

// Keep test listeners outside macOS's ephemeral client-port range. Readiness
// probes can otherwise claim a just-released listener port as their source port.
let nextTestPort = 20000 + (process.pid % 10000);
async function freePort() {
  if (noNetwork) return 30000 + Math.floor(Math.random() * 20000);
  const server = net.createServer();
  await new Promise((resolve) => server.listen(nextTestPort++, '::', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function fixture(t, mode = 'pass', platform = 'ios') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cavy-supervisor-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const script = path.join(root, 'child.js');
  fs.writeFileSync(
    script,
    `
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const [role, mode, metroPort, reporterPort, operation] = process.argv.slice(2);
const record = (s) => fs.appendFileSync('events', s + '\\n');
if (mode.startsWith('redaction')) {
  const license = process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY ?? require(${JSON.stringify(require.resolve('dotenv'))}).parse(fs.readFileSync('.env')).EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;
  console.log(license);
}
record(role + ':' + (operation || 'start') + ':' + process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS);
if (role === 'metro') {
  if (['metro-exit', 'redaction-startup-failure'].includes(mode)) process.exit(2);
  if (mode === 'descendant') {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'ignore'});
    fs.writeFileSync('descendant', String(child.pid));
  }
  let ready = false;
  setTimeout(() => { ready = true; if (mode !== 'metro-unready') record('metro:ready'); }, 150);
  if (process.env.CAVY_TEST_NO_NETWORK === '1') setInterval(() => {}, 1000);
  else http.createServer((req, res) => res.end(ready && mode !== 'metro-unready' ? 'packager-status:running' : 'starting')).listen(+metroPort, '127.0.0.1');
  if (mode === 'metro-late-exit') setTimeout(() => process.exit(2), 400);
} else if (role === 'cavy') {
  if (mode === 'reporter-exit') process.exit(0);
  if (mode === 'reporter-unready') setInterval(() => {}, 1000);
  else if (process.env.CAVY_TEST_NO_NETWORK === '1') record('reporter:ready');
  else net.createServer(s => s.end()).listen(+reporterPort, '127.0.0.1', () => record('reporter:ready'));
  setInterval(() => {
    if (!fs.existsSync('launched') || ['timeout', 'app-exit', 'metro-late-exit', 'android-check'].includes(mode)) return;
    if (mode === 'missing') process.exit(0);
    fs.writeFileSync('cavy_results.xml', mode === 'malformed' ? '<bad' : mode === 'zero' ? '<testsuite tests="0" failures="0" errors="0"/>' : mode === 'assertion' ? '<testsuite tests="1" failures="1" errors="0"><testcase><failure/></testcase></testsuite>' : ${JSON.stringify(goodXml)});
    fs.writeFileSync('cavy_results.md', 'results');
    process.exit(mode === 'nonzero' ? 42 : 0);
  }, 40);
} else {
  if (operation) fs.appendFileSync('operation-pids', process.pid + '\\n');
  if (operation === 'prepare' && mode === 'prepare-failure') process.exit(1);
  if (operation === 'check' && mode === 'android-check') process.exit(1);
  if (!operation || operation === 'launch') {
    fs.writeFileSync('launched', 'yes');
    if (mode === 'app-exit') process.exit(0);
    if (!operation) {
      process.on('SIGTERM', () => {
        if (mode !== 'cleanup-missing') fs.writeFileSync('ios-cleanup.json', JSON.stringify({success: mode !== 'cleanup-failure', errors: mode === 'cleanup-failure' ? ['delete failed'] : []}));
        process.exit(0);
      });
      setInterval(() => {}, 1000);
    }
  }
}
`
  );
  const metroPort = await freePort();
  const reporterPort = await freePort();
  const command = (role, ...args) => [
    process.execPath,
    [script, role, mode, String(metroPort), String(reporterPort), ...args],
  ];
  return {
    root,
    config: {
      platform,
      artifactsDir: root,
      projectDir: root,
      env: { ...process.env, EXPO_PUBLIC_CAVY_ONLY_TAGS: 'playback,loading' },
      metroPort,
      reporterPort,
      timeoutMs: 2500,
      startupTimeoutMs: 900,
      pollMs: 30,
      stopTimeoutMs: 100,
      cleanupTimeoutMs: 1000,
      metroCommand: command('metro'),
      cavyCommand: command('cavy'),
      launcherCommand: command('app'),
    },
  };
}

test('canonical arguments reuse tag validation and pinned CLI no-build spelling', () => {
  const config = createCiConfig(['android', '--tags', 'playback,loading'], {
    CAVY_ARTIFACTS_DIR: '/tmp/cavy-contract',
    NODE_OPTIONS: '--max-old-space-size=2048',
  });
  assert.equal(config.env.EXPO_PUBLIC_CAVY_ONLY_TAGS, 'playback,loading');
  assert.equal(config.env.EXPO_PUBLIC_CAVY_CI, '1');
  assert.match(
    config.env.NODE_OPTIONS,
    /--max-old-space-size=2048.*--dns-result-order=ipv4first/
  );
  assert.deepEqual(config.cavyCommand[1].slice(1), [
    'run-android',
    '--skipbuild',
    '--no-screenshots',
    '--xml',
    '--keep-alive-timeout',
    '600',
  ]);
  assert.throws(
    () => createCiConfig(['ios', '--tags', 'bogus'], {}),
    /Unknown test tag/
  );
  assert.throws(() => createCiConfig(['all'], {}), /android or ios/);
  assert.throws(() => createCiConfig(['ios', '--dev'], {}), /Unexpected/);
  assert.throws(
    () => createCiConfig(['ios'], { RCT_METRO_PORT: '8082' }),
    /port/i
  );
});

test('validates actual XML, positive testcase count and consistent zero failures', async () => {
  assert.equal(await validateReport(goodXml), 1);
  for (const xml of [
    '<bad',
    '<testsuite tests="1"><testcase/></testsuite>',
    '<testsuite tests="0" failures="0" errors="0"/>',
    goodXml.replace('tests="1"', 'tests="2"'),
    goodXml.replace('/></testsuite>', '><failure/></testcase></testsuite>'),
    goodXml.replace('/></testsuite>', '><skipped/></testcase></testsuite>'),
  ]) {
    await assert.rejects(validateReport(xml));
  }
});

test('accepts actual pinned Cavy formatter output, whose tests attribute is absent', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cavy-xml-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const formatter = require.resolve('cavy-cli/src/junitFormatter');
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `require(${JSON.stringify(formatter)})({time: 1, timestamp: new Date(), testCases: [{describeLabel: 'playback', description: 'plays', passed: true, time: 1}]})`,
    ],
    { cwd: root }
  );
  assert.equal(result.status, 0, result.stderr.toString());
  assert.equal(
    await validateReport(
      fs.readFileSync(path.join(root, 'cavy_results.xml'), 'utf8')
    ),
    1
  );
});

test('rejects extra XML roots and malformed trailing content', async () => {
  for (const suffix of ['<other/>', 'junk', '<!-- unfinished']) {
    await assert.rejects(validateReport(goodXml + suffix));
  }
});

test('releases its lock and signal handlers even when a process cannot be cleaned up', async (t) => {
  const { root, config } = await fixture(t);
  const signalListeners = process.listenerCount('SIGTERM');
  const kill = process.kill;
  let rejected = false;
  process.kill = function (pid, signal) {
    if (pid < 0 && !rejected) {
      rejected = true;
      // Terminate it first so this injected permission failure leaves no child.
      kill.call(process, pid, signal);
      throw Object.assign(new Error('injected kill failure'), {
        code: 'EPERM',
      });
    }
    return kill.call(process, pid, signal);
  };
  try {
    await assert.rejects(runCiTests(config), /injected kill failure/);
    assert.equal(process.listenerCount('SIGTERM'), signalListeners);
    assert.ok(!fs.existsSync(path.join(root, '.supervisor-lock')));
  } finally {
    process.kill = kill;
  }
});

test('exits nonzero when process-group termination leaves live children', async (t) => {
  const { root, config } = await fixture(t, 'timeout');
  const pidsPath = path.join(root, 'unkillable-pids');
  let result;
  try {
    result = spawnSync(
      process.execPath,
      [
        '-e',
        `
const fs = require('node:fs');
const { runCiTests } = require(${JSON.stringify(require.resolve('./run-ci-tests'))});
process.kill = (pid) => {
  fs.appendFileSync(${JSON.stringify(pidsPath)}, String(-pid) + '\\n');
  throw Object.assign(new Error('injected kill failure'), { code: 'EPERM' });
};
runCiTests(${JSON.stringify(config)}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
`,
      ],
      { timeout: 7000, encoding: 'utf8' }
    );
  } finally {
    if (fs.existsSync(pidsPath)) {
      const pids = new Set(
        fs.readFileSync(pidsPath, 'utf8').trim().split('\n').map(Number)
      );
      let liveChildren = 0;
      for (const pid of pids) {
        try {
          process.kill(-pid, 'SIGKILL');
          liveChildren++;
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      }
      assert.ok(
        liveChildren > 0,
        'termination failure must leave a live child'
      );
    }
  }
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /whole run timed out/);
  assert.match(
    fs.readFileSync(path.join(root, 'supervisor.log'), 'utf8'),
    /injected kill failure/
  );
  assert.ok(!fs.existsSync(path.join(root, '.supervisor-lock')));
});

test('does not signal completed Android operation PIDs during final cleanup', async (t) => {
  const { root, config } = await fixture(t, 'pass', 'android');
  const kill = process.kill;
  process.kill = function (pid, signal) {
    const record = path.join(root, 'operation-pids');
    const completed = fs.existsSync(record)
      ? fs.readFileSync(record, 'utf8').trim().split('\n').map(Number)
      : [];
    assert.ok(
      !completed.includes(-pid),
      'completed operation PID must not be reused for signaling'
    );
    return kill.call(process, pid, signal);
  };
  try {
    await runCiTests(config);
  } finally {
    process.kill = kill;
  }
});

test('handles missing executables and removes the run lock', async (t) => {
  const { root, config } = await fixture(t);
  config.metroCommand = [path.join(root, 'missing-program'), []];
  await assert.rejects(runCiTests(config), /Metro.*startup failed/);
  assert.ok(!fs.existsSync(path.join(root, '.supervisor-lock')));
});

test('SIGTERM cancels the run and cleans up', async (t) => {
  const { root, config } = await fixture(t, 'timeout');
  const timer = setTimeout(() => process.emit('SIGTERM'), 500);
  try {
    await assert.rejects(runCiTests(config), /interrupted/);
  } finally {
    clearTimeout(timer);
  }
  assert.ok(!fs.existsSync(path.join(root, '.supervisor-lock')));
});

for (const platform of ['ios', 'android']) {
  test(`${platform}: waits for actual readiness, validates report and preserves artifacts`, async (t) => {
    const { root, config } = await fixture(t, 'pass', platform);
    assert.equal(await runCiTests(config), 1);
    const events = fs.readFileSync(path.join(root, 'events'), 'utf8');
    const launch = events.indexOf(
      platform === 'ios' ? 'app:start' : 'app:launch'
    );
    assert.ok(launch > events.indexOf('metro:ready'));
    assert.ok(launch > events.indexOf('reporter:ready'));
    assert.ok(fs.existsSync(path.join(root, 'cavy_results.xml')));
    assert.ok(fs.existsSync(path.join(root, 'metro.log')));
    if (platform === 'android') {
      assert.match(events, /app:diagnostics/);
      assert.match(events, /app:cleanup/);
    }
  });
}

for (const [mode, expected] of [
  ['metro-exit', /Metro.*exit/i],
  ['reporter-exit', /Cavy.*exit/i],
  ['metro-unready', /Metro.*ready/i],
  ['reporter-unready', /Cavy.*ready/i],
  ['metro-late-exit', /Metro.*exit/i],
  ['app-exit', /app.*exit/i],
  ['timeout', /timed out/i],
  ['nonzero', /Cavy.*42/i],
  ['missing', /report/i],
  ['malformed', /XML|report/i],
  ['zero', /test/i],
  ['assertion', /fail/i],
]) {
  test(`fails closed: ${mode}`, async (t) => {
    const { config } = await fixture(t, mode);
    await assert.rejects(runCiTests(config), expected);
    // Both ports must be released after failure.
    for (const port of noNetwork
      ? []
      : [config.metroPort, config.reporterPort]) {
      const server = net.createServer();
      await new Promise((resolve, reject) =>
        server.once('error', reject).listen(port, '127.0.0.1', resolve)
      );
      await new Promise((resolve) => server.close(resolve));
    }
  });
}

for (const mode of ['prepare-failure', 'android-check']) {
  test(`Android lifecycle failure: ${mode}`, async (t) => {
    const { root, config } = await fixture(t, mode, 'android');
    await assert.rejects(runCiTests(config), /app.*(prepare|check)/i);
    assert.match(
      fs.readFileSync(path.join(root, 'events'), 'utf8'),
      /app:cleanup/
    );
  });
}

test(
  'rejects occupied ports without killing their owner',
  { skip: noNetwork && 'requires socket permission' },
  async (t) => {
    const { config } = await fixture(t);
    const server = net.createServer();
    await new Promise((resolve) =>
      server.listen(config.reporterPort, '127.0.0.1', resolve)
    );
    t.after(() => new Promise((resolve) => server.close(resolve)));
    await assert.rejects(runCiTests(config), /port.*in use/i);
    assert.ok(server.listening);
  }
);

test('rejects stale reports without overwriting them', async (t) => {
  const { root, config } = await fixture(t);
  fs.writeFileSync(path.join(root, 'cavy_results.xml'), goodXml);
  await assert.rejects(runCiTests(config), /stale|already exists/i);
  assert.equal(
    fs.readFileSync(path.join(root, 'cavy_results.xml'), 'utf8'),
    goodXml
  );
});

test(
  'cleans descendants in owned process groups',
  {
    skip: noNetwork && 'requires permission to signal orphaned process groups',
  },
  async (t) => {
    const { root, config } = await fixture(t, 'descendant');
    await runCiTests(config);
    const pid = Number(fs.readFileSync(path.join(root, 'descendant'), 'utf8'));
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  }
);

for (const mode of ['cleanup-failure', 'cleanup-missing']) {
  test(`rejects an iOS ${mode} even after a passing report`, async (t) => {
    const f = await fixture(t, mode);
    await assert.rejects(runCiTests(f.config), /cleanup/i);
  });
}

test('removes a synthetic license marker from retained process logs', async (t) => {
  const f = await fixture(t, 'redaction', 'android');
  fs.writeFileSync(
    path.join(f.root, '.env'),
    'EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY=dotenv-fallback-license\n'
  );
  f.config.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY =
    'test-license-redaction-sentinel';
  await runCiTests(f.config);
  for (const name of ['metro.log', 'cavy.log', 'app.log']) {
    const log = fs.readFileSync(path.join(f.root, name), 'utf8');
    assert.ok(!log.includes('test-license-redaction-sentinel'));
    assert.ok(log.includes('[REDACTED]'));
  }
});

for (const mode of ['redaction', 'redaction-startup-failure']) {
  test(`redacts a dotenv-only license: ${mode}`, async (t) => {
    const f = await fixture(t, mode, 'android');
    delete f.config.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;
    fs.writeFileSync(
      path.join(f.root, '.env'),
      'export EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY="test-license-redaction-sentinel"\n'
    );
    if (mode === 'redaction-startup-failure') {
      await assert.rejects(runCiTests(f.config), /Metro.*exited early/);
    } else {
      assert.equal(await runCiTests(f.config), 1);
    }
    const log = fs.readFileSync(path.join(f.root, 'metro.log'), 'utf8');
    assert.ok(!log.includes('test-license-redaction-sentinel'));
    assert.ok(log.includes('[REDACTED]'));
  });
}

test('aligns the pinned reporter watchdog with a custom whole-run deadline', () => {
  const config = createCiConfig(['ios', '--tags', 'playback'], {
    CAVY_TIMEOUT_MS: '123001',
  });
  assert.deepEqual(config.cavyCommand[1].slice(-2), [
    '--keep-alive-timeout',
    '124',
  ]);
});
