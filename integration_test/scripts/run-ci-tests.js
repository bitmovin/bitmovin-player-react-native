#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { createTestRun, parseTestArguments } = require('./run-selected-tests');

function positiveInteger(value, fallback, label) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return number;
}

function createCiConfig(args, environment = process.env) {
  const [platform, ...selection] = args;
  if (!['android', 'ios'].includes(platform)) {
    throw new Error('Usage: run-ci-tests.js <android or ios> [--tags tag,...]');
  }
  const { forwardedArguments } = parseTestArguments(selection);
  if (forwardedArguments.length) {
    throw new Error(`Unexpected arguments: ${forwardedArguments.join(' ')}`);
  }
  const { environment: tags } = createTestRun(platform, selection);
  const metroPort = positiveInteger(
    environment.RCT_METRO_PORT,
    8081,
    'Metro port'
  );
  if (metroPort > 65535 || metroPort === 8082) {
    throw new Error('Metro port must be at most 65535 and different from 8082');
  }
  const artifactsDir = path.resolve(
    environment.CAVY_ARTIFACTS_DIR || 'cavy-artifacts'
  );
  const projectDir = path.resolve(__dirname, '..');
  const env = {
    ...environment,
    CI: '1',
    EXPO_PUBLIC_CAVY_CI: '1',
    CAVY_ARTIFACTS_DIR: artifactsDir,
    RCT_METRO_PORT: String(metroPort),
    // Empty explicitly overrides inherited selectors, including Expo dotenv files.
    EXPO_PUBLIC_CAVY_ONLY_TAGS: tags.EXPO_PUBLIC_CAVY_ONLY_TAGS || '',
    NODE_OPTIONS:
      `${environment.NODE_OPTIONS || ''} --dns-result-order=ipv4first`.trim(),
  };
  const timeoutMs = positiveInteger(
    environment.CAVY_TIMEOUT_MS,
    600000,
    'CAVY_TIMEOUT_MS'
  );
  return {
    platform,
    artifactsDir,
    projectDir,
    env,
    metroPort,
    reporterPort: 8082,
    timeoutMs,
    startupTimeoutMs: 120000,
    pollMs: 200,
    // iOS owns simulator teardown and needs time to finish it after SIGTERM.
    stopTimeoutMs: 35000,
    cleanupTimeoutMs: 100000,
    metroCommand: [
      process.execPath,
      [
        require.resolve('expo/bin/cli'),
        'start',
        '--port',
        String(metroPort),
        '--localhost',
      ],
    ],
    // a288754 spells this --skipbuild. --skip-build is silently ignored by it.
    cavyCommand: [
      process.execPath,
      [
        require.resolve('cavy-cli/cavy.js'),
        `run-${platform}`,
        '--skipbuild',
        '--no-screenshots',
        '--xml',
        '--keep-alive-timeout',
        String(Math.ceil(timeoutMs / 1000)),
      ],
    ],
    launcherCommand: [
      process.execPath,
      [path.join(__dirname, `${platform}-ci-launcher.js`)],
    ],
  };
}

async function validateReport(xml) {
  // Reuse the parser shipped with the pinned CLI, including strict XML parsing.
  const cliRequire = createRequire(require.resolve('cavy-cli/cavy.js'));
  if (/<!DOCTYPE/i.test(xml))
    throw new Error('Invalid Cavy XML report: DOCTYPE');
  let parsed;
  try {
    // xml2js stops at the first closing root and can ignore broken trailing XML.
    // Validate the entire document with its own SAX dependency first.
    const xmlRequire = createRequire(cliRequire.resolve('xml2js'));
    const sax = xmlRequire('sax');
    const parser = sax.parser(true);
    let depth = 0;
    let roots = 0;
    parser.onopentag = () => {
      if (depth++ === 0) roots++;
    };
    parser.onclosetag = () => {
      depth--;
    };
    parser.write(xml);
    if (parser.state !== sax.STATE.TEXT) throw new Error('Incomplete XML');
    parser.close();
    if (roots !== 1) throw new Error('Expected exactly one XML root');
    parsed = await cliRequire('xml2js').parseStringPromise(xml, {
      strict: true,
    });
  } catch (error) {
    throw new Error(`Malformed Cavy XML report: ${error.message}`);
  }
  const suite = parsed?.testsuite;
  const counts = suite?.$;
  const cases = suite?.testcase || [];
  if (
    !counts ||
    !['failures', 'errors'].every((key) => /^\d+$/.test(counts[key])) ||
    (counts.tests !== undefined && !/^\d+$/.test(counts.tests))
  ) {
    throw new Error('Invalid Cavy report counts');
  }
  // a288754 reads fullResults.length, which Cavy 4.0.2 does not send.
  // Count real testcase elements; validate the aggregate whenever supplied.
  const count = cases.length;
  if (
    count === 0 ||
    (counts.tests !== undefined && Number(counts.tests) !== count)
  ) {
    throw new Error(
      'Cavy report must contain a positive, matching testcase count'
    );
  }
  if (
    Number(counts.failures) ||
    Number(counts.errors) ||
    Number(counts.skipped || 0) ||
    cases.some((item) => item.failure || item.error || item.skipped)
  ) {
    throw new Error('Cavy report contains failed or skipped tests');
  }
  return count;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function boundedWait(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function assertPortFree(port) {
  // macOS may permit a wildcard bind while a loopback listener owns the port.
  for (const host of ['127.0.0.1', '::1']) {
    const occupied = await new Promise((resolve) => {
      const socket = net.connect({ port, host });
      const done = (value) => {
        socket.destroy();
        resolve(value);
      };
      socket.once('connect', () => done(true));
      socket.once('error', () => done(false));
      socket.setTimeout(500, () => done(false));
    });
    if (occupied) throw new Error(`Port ${port} is in use`);
  }
  // Check wildcard IPv4 and IPv6, not just the interface used by our probes.
  for (const host of ['0.0.0.0', '::']) {
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.once('error', (error) => {
        if (
          host === '::' &&
          ['EAFNOSUPPORT', 'EADDRNOTAVAIL'].includes(error.code)
        )
          resolve();
        else
          reject(
            new Error(`Port ${port} is in use or unavailable: ${error.message}`)
          );
      });
      server.listen({ port, host, ipv6Only: host === '::' }, () =>
        server.close(resolve)
      );
    });
  }
}

function probe(port, metro) {
  return new Promise((resolve) => {
    if (!metro) {
      const socket = net.connect({ port, host: '127.0.0.1' });
      const done = (ready) => {
        socket.destroy();
        resolve(ready);
      };
      socket.setTimeout(500, () => done(false));
      socket.once('error', () => done(false));
      socket.once('connect', () => done(true));
      return;
    }
    const request = http.get(
      { host: '127.0.0.1', port, path: '/status' },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
          if (body.length > 1024) request.destroy();
        });
        response.on('end', () =>
          resolve(
            response.statusCode === 200 &&
              body.trim() === 'packager-status:running'
          )
        );
        response.on('error', () => resolve(false));
      }
    );
    request.setTimeout(500, () => request.destroy());
    request.once('error', () => resolve(false));
  });
}

async function runCiTests(config, dependencies = {}) {
  const checkPort = dependencies.assertPortFree || assertPortFree;
  const checkReady = dependencies.probe || probe;
  const { artifactsDir, projectDir, platform } = config;
  const env = { ...config.env };
  // app.config.ts loads this file in Metro, which cannot update our environment.
  // Resolve the same license before spawning so startup diagnostics are redacted.
  const envPath = path.join(projectDir, '.env');
  if (fs.existsSync(envPath)) {
    const dotenv = require('dotenv').parse(fs.readFileSync(envPath));
    env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY ??=
      dotenv.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;
  }
  fs.mkdirSync(artifactsDir, { recursive: true });
  const reportPath = path.join(artifactsDir, 'cavy_results.xml');
  for (const file of [
    'cavy_results.xml',
    'cavy_results.md',
    'index.test.js',
    'ios-cleanup.json',
  ]) {
    if (fs.existsSync(path.join(artifactsDir, file)))
      throw new Error(`Stale artifact already exists: ${file}`);
  }
  const lock = path.join(artifactsDir, '.supervisor-lock');
  fs.mkdirSync(lock);
  const children = [];
  let shuttingDown = false;
  let launched = false;
  let androidPrepared = false;
  let failure;
  let rejectFailure;
  const failed = new Promise((_, reject) => {
    rejectFailure = reject;
  });
  // Startup can fail between waits. Keep the shared rejection handled.
  failed.catch(() => {});
  const fail = (error) => {
    if (!failure && !shuttingDown) {
      failure = error;
      rejectFailure(error);
    }
  };
  const wait = (promise) => Promise.race([promise, failed]);
  const terminate = () => fail(new Error('Cavy supervisor interrupted'));
  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);
  const deadline = setTimeout(
    () => fail(new Error('Cavy whole run timed out')),
    config.timeoutMs
  );

  function start(label, command, cwd, watch = false) {
    const fd = fs.openSync(
      path.join(artifactsDir, `${label.toLowerCase()}.log`),
      'a'
    );
    let child;
    try {
      child = spawn(command[0], command[1], {
        cwd,
        env,
        detached: true,
        stdio: ['ignore', fd, fd],
      });
    } finally {
      fs.closeSync(fd);
    }
    const entry = { child, label, closed: false };
    children.push(entry);
    entry.done = new Promise((resolve) => {
      child.once('error', (error) => {
        fail(new Error(`${label} startup failed: ${error.message}`));
        resolve({ code: null });
      });
      child.once('close', (code, signal) => {
        entry.closed = true;
        entry.result = { code, signal };
        if (watch && !(label === 'Cavy' && launched && code === 0)) {
          fail(
            new Error(`${label} exited early (code ${code}, signal ${signal})`)
          );
        }
        resolve(entry.result);
      });
    });
    return entry;
  }

  async function operation(name, cleanup = false) {
    const [command, args] = config.launcherCommand;
    const entry = start('App', [command, [...args, name]], projectDir);
    let timer;
    try {
      const result = await (cleanup
        ? Promise.race([
            entry.done,
            new Promise((_, reject) => {
              timer = setTimeout(
                () => reject(new Error(`App ${name} timed out`)),
                config.cleanupTimeoutMs
              );
            }),
          ])
        : wait(entry.done));
      if (result.code !== 0)
        throw new Error(`App ${name} exited with code ${result.code}`);
    } finally {
      clearTimeout(timer);
      // These adapter commands finish their synchronous device operations before
      // exiting. Forget their PIDs immediately; a long run may outlive PID reuse.
      if (entry.closed) children.splice(children.indexOf(entry), 1);
    }
  }

  async function ready(label, port, metro) {
    const until = Date.now() + config.startupTimeoutMs;
    while (!(await wait(checkReady(port, metro)))) {
      if (Date.now() >= until) throw new Error(`${label} did not become ready`);
      await wait(delay(config.pollMs));
    }
    if (failure) throw failure;
  }

  function signalGroup(entry, signal) {
    if (!entry.child.pid) return;
    try {
      process.kill(-entry.child.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }

  async function stop(entry, graceful = false) {
    try {
      if (graceful && !entry.closed) {
        entry.child.kill('SIGTERM');
        await boundedWait(entry.done, config.stopTimeoutMs);
      }
      // Even an exited group leader can leave live descendants.
      signalGroup(entry, 'SIGTERM');
      // Give descendants time to exit even if the group leader has already closed.
      await delay(100);
      signalGroup(entry, 'SIGKILL');
      await boundedWait(entry.done, 1000);
    } finally {
      // A failed signal must not keep the supervisor alive past its deadline.
      entry.child.unref();
    }
  }

  async function stopAll(app) {
    const results = await Promise.allSettled(
      children.map((entry) => stop(entry, entry === app))
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        failure ||= result.reason;
        fs.appendFileSync(
          path.join(artifactsDir, 'supervisor.log'),
          `Cleanup failed: ${result.reason.message}\n`
        );
      }
    }
  }

  let count;
  let app;
  try {
    await wait(checkPort(config.metroPort));
    await wait(checkPort(config.reporterPort));
    if (platform === 'android') {
      androidPrepared = true;
      await operation('prepare');
    }
    start('Metro', config.metroCommand, projectDir, true);
    const cavy = start('Cavy', config.cavyCommand, artifactsDir, true);
    await wait(
      Promise.all([
        ready('Metro', config.metroPort, true),
        ready('Cavy', config.reporterPort, false),
      ])
    );
    launched = true;
    if (platform === 'android') await operation('launch');
    else app = start('App', config.launcherCommand, projectDir, true);
    while (!cavy.closed) {
      if (platform === 'android') await operation('check');
      await wait(Promise.race([cavy.done, delay(config.pollMs)]));
    }
    if (failure) throw failure;
    if (cavy.result.code !== 0)
      throw new Error(`Cavy exited with code ${cavy.result.code}`);
    if (!fs.existsSync(reportPath))
      throw new Error('Cavy XML report is missing');
    count = await wait(validateReport(fs.readFileSync(reportPath, 'utf8')));
    if (platform === 'android') await operation('check');
    if (failure) throw failure;
  } catch (error) {
    failure = error;
  } finally {
    shuttingDown = true;
    clearTimeout(deadline);
    // Stop active operations before invoking adapter cleanup.
    await stopAll(app);
    if (app) {
      try {
        const cleanup = JSON.parse(
          fs.readFileSync(path.join(artifactsDir, 'ios-cleanup.json'), 'utf8')
        );
        if (cleanup.success !== true)
          throw new Error(
            `iOS cleanup failed: ${(cleanup.errors || []).join('; ')}`
          );
      } catch (error) {
        failure ||= new Error(
          `iOS cleanup could not be verified: ${error.message}`
        );
      }
    }
    if (androidPrepared) {
      for (const name of ['diagnostics', 'cleanup']) {
        try {
          await operation(name, true);
        } catch (error) {
          failure ||= error;
        }
      }
      await stopAll();
    }
    // Artifact uploads are not covered by GitHub's console-secret masking.
    const license = env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;
    if (license) {
      const redact = (directory) => {
        for (const entry of fs.readdirSync(directory, {
          withFileTypes: true,
        })) {
          const filename = path.join(directory, entry.name);
          if (entry.isDirectory()) redact(filename);
          else if (
            entry.isFile() &&
            /\.(log|txt|xml|md|json|ips|crash)$/.test(entry.name)
          ) {
            const original = fs.readFileSync(filename, 'utf8');
            const safe = original.split(license).join('[REDACTED]');
            if (safe !== original) fs.writeFileSync(filename, safe);
          }
        }
      };
      try {
        redact(artifactsDir);
      } catch (error) {
        failure ||= error;
      }
    }
    process.removeListener('SIGINT', terminate);
    process.removeListener('SIGTERM', terminate);
    fs.rmdirSync(lock);
  }
  if (failure) throw failure;
  return count;
}

module.exports = { createCiConfig, runCiTests, validateReport };

if (require.main === module) {
  Promise.resolve()
    .then(() => runCiTests(createCiConfig(process.argv.slice(2))))
    .then((count) => console.log(`Cavy passed: ${count} tests`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
