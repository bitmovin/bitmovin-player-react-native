#!/usr/bin/env node

// Native adapter for the shared CI runner. It deliberately never builds the app
// or decides whether tests passed: only a validated Cavy report can do that.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');

function runCommand(command, args, options) {
  return new Promise((resolve) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      resolve({ status: error ? 1 : 0, error, stdout, stderr });
    });
  });
}

const BUNDLE_ID = 'com.bitmovin.player.reactnative.integrationtests';

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 2000);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

function collectCrashes(home, udid, artifactsDir) {
  const sources = {
    host: path.join(home, 'Library/Logs/DiagnosticReports'),
    simulator: path.join(
      home,
      'Library/Developer/CoreSimulator/Devices',
      udid,
      'data/Library/Logs/CrashReporter'
    ),
  };
  for (const [source, directory] of Object.entries(sources)) {
    if (!fs.existsSync(directory)) continue;
    const destination = path.join(artifactsDir, 'crashes', source);
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        /^IntegrationTest.*\.(ips|crash)$/.test(entry.name)
      ) {
        fs.copyFileSync(
          path.join(directory, entry.name),
          path.join(destination, entry.name)
        );
      }
    }
  }
}

async function runIosApp(config, dependencies = {}) {
  const {
    run = runCommand,
    spawn: spawnChild = spawn,
    signals = process,
  } = dependencies;
  const {
    appPath,
    artifactsDir,
    runtime,
    deviceType,
    timeoutMs = Number(process.env.CAVY_TIMEOUT_MS || 600000),
    home = os.homedir(),
  } = config;
  if (!appPath || !fs.existsSync(path.join(appPath, 'Info.plist'))) {
    throw new Error('A prebuilt iOS simulator app with Info.plist is required');
  }
  if (
    !artifactsDir ||
    !runtime ||
    !deviceType ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new Error(
      'Artifacts directory, simulator runtime/device type and positive timeout are required'
    );
  }
  fs.mkdirSync(artifactsDir, { recursive: true });
  const commandLog = path.join(artifactsDir, 'simulator-commands.log');
  const controller = new AbortController();
  let rejectRun;
  let cancellation;
  const cleanupErrors = [];
  const cancel = (reason) => {
    cancellation = new Error(reason);
    controller.abort();
    if (rejectRun) rejectRun(cancellation);
  };
  const onTerminate = () => cancel('iOS launcher stopped by SIGTERM');
  const onInterrupt = () => cancel('iOS launcher stopped by SIGINT');
  const command = async (args, timeout = 30000, required = true) => {
    const startedAt = Date.now();
    const result = await run('xcrun', ['simctl', ...args], {
      encoding: 'utf8',
      timeout,
      killSignal: 'SIGKILL',
      maxBuffer: 4 * 1024 * 1024,
      ...(required ? { signal: controller.signal } : {}),
    });
    const diagnostics = {
      startedAt: new Date(startedAt).toISOString(),
      elapsedMs: Date.now() - startedAt,
      timeoutMs: timeout,
      status: result.status,
      code: result.error ? (result.error.code ?? null) : result.status,
      signal: result.error?.signal ?? null,
      killed: result.error?.killed ?? false,
      cancelled: required && controller.signal.aborted,
      error: result.error?.message ?? null,
    };
    fs.appendFileSync(
      commandLog,
      `$ xcrun simctl ${args.join(' ')}\n${result.stdout || ''}${result.stderr || ''}\nResult: ${JSON.stringify(diagnostics)}\n`
    );
    if (required && (result.error || result.status !== 0)) {
      throw new Error(
        `simctl ${args[0]} failed after ${diagnostics.elapsedMs}ms (timeout ${timeout}ms, code ${diagnostics.code}, signal ${diagnostics.signal}, killed ${diagnostics.killed}): ${result.error?.message || result.stderr || result.status}`
      );
    }
    if (
      !required &&
      ['shutdown', 'delete'].includes(args[0]) &&
      (result.error || result.status !== 0)
    ) {
      cleanupErrors.push(
        `simctl ${args[0]} failed: ${result.error?.message || result.stderr || result.status}`
      );
    }
    return result.stdout || '';
  };
  let udid;
  let app;
  let logs;
  let appFd;
  let logFd;
  let timer;
  signals.on('SIGTERM', onTerminate);
  signals.on('SIGINT', onInterrupt);
  timer = setTimeout(
    () => cancel('iOS app timed out waiting for Cavy completion'),
    timeoutMs
  );
  try {
    const inventory = JSON.parse(await command(['list', 'runtimes', '--json']));
    if (
      !inventory.runtimes.some(
        (item) => item.identifier === runtime && item.isAvailable
      )
    ) {
      throw new Error(`Required simulator runtime is unavailable: ${runtime}`);
    }
    // A private device prevents cleanup from shutting down a user's simulator.
    udid = (
      await command(['create', `Cavy-${process.pid}`, deviceType, runtime])
    ).trim();
    if (!udid || /\s/.test(udid))
      throw new Error('simctl create returned no valid simulator identifier');
    fs.writeFileSync(
      path.join(artifactsDir, 'simulator.json'),
      JSON.stringify({ udid, runtime, deviceType, appPath }, null, 2)
    );
    await command(['boot', udid]);
    // Allow cold migration, but expanding the suite must not expand boot time.
    // The overall signal can still abort boot sooner.
    await command(['bootstatus', udid, '-b'], Math.min(timeoutMs, 600000));
    await command(['install', udid, appPath], 120000);
    appFd = fs.openSync(path.join(artifactsDir, 'app-console.log'), 'w');
    logFd = fs.openSync(path.join(artifactsDir, 'simulator.log'), 'w');

    await new Promise((resolve, reject) => {
      rejectRun = reject;
      if (cancellation) {
        reject(cancellation);
        return;
      }
      logs = spawnChild(
        'xcrun',
        [
          'simctl',
          'spawn',
          udid,
          'log',
          'stream',
          '--style',
          'compact',
          '--level',
          'debug',
          '--predicate',
          'process == "IntegrationTest"',
        ],
        { stdio: ['ignore', logFd, logFd] }
      );
      logs.once('error', reject);
      // --console stays attached to this exact app; an early exit is always a
      // failure, including exit 0. The shared runner stops us after its report.
      app = spawnChild(
        'xcrun',
        ['simctl', 'launch', '--console', udid, BUNDLE_ID],
        { stdio: ['ignore', appFd, appFd] }
      );
      app.once('error', reject);
      app.once('close', (code, signal) =>
        reject(
          new Error(
            `iOS app exited before runner cleanup (code ${code}, signal ${signal})`
          )
        )
      );
    });
  } finally {
    clearTimeout(timer);
    signals.removeListener('SIGTERM', onTerminate);
    signals.removeListener('SIGINT', onInterrupt);
    // Preserve failures from boot/install/launch even if diagnostics are absent.
    if (udid) await command(['terminate', udid, BUNDLE_ID], 10000, false);
    await Promise.all([stopChild(app), stopChild(logs)]);
    if (appFd !== undefined) fs.closeSync(appFd);
    if (logFd !== undefined) fs.closeSync(logFd);
    if (udid) {
      try {
        collectCrashes(home, udid, artifactsDir);
      } catch (error) {
        fs.appendFileSync(
          commandLog,
          `Crash collection failed: ${error.message}\n`
        );
      }
      await command(['shutdown', udid], 10000, false);
      await command(['delete', udid], 10000, false);
    }
    fs.writeFileSync(
      path.join(artifactsDir, 'ios-cleanup.json'),
      JSON.stringify({
        success: cleanupErrors.length === 0,
        errors: cleanupErrors,
      })
    );
  }
}

module.exports = { runIosApp };

if (require.main === module) {
  runIosApp({
    appPath: process.env.IOS_SMOKE_APP_PATH,
    artifactsDir: process.env.CAVY_ARTIFACTS_DIR,
    runtime: process.env.IOS_SMOKE_RUNTIME,
    deviceType: process.env.IOS_SMOKE_DEVICE_TYPE,
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
