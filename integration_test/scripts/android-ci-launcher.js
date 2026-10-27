#!/usr/bin/env node

// Platform hooks for run-ci-tests.js. The shared runner owns Metro, Cavy,
// report validation and the overall deadline; this adapter never builds.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const APP_ID = 'com.bitmovin.player.reactnative.integrationtests';
const ACTIVITY = `${APP_ID}/.MainActivity`;

function createAndroidLauncher(
  env = process.env,
  execute = execFileSync,
  request = fetch
) {
  const serial = env.ANDROID_SERIAL;
  if (!/^emulator-\d+$/.test(serial || '')) {
    throw new Error('ANDROID_SERIAL must identify an explicit emulator');
  }
  if (!env.CAVY_ARTIFACTS_DIR) {
    throw new Error('CAVY_ARTIFACTS_DIR is required');
  }
  const artifactDirectory = path.resolve(env.CAVY_ARTIFACTS_DIR);
  const stateFile = path.join(artifactDirectory, 'android-launcher-state.json');
  const metroPort = env.RCT_METRO_PORT || '8081';
  if (
    !/^\d+$/.test(metroPort) ||
    +metroPort < 1 ||
    +metroPort > 65535 ||
    +metroPort === 8082
  ) {
    throw new Error(
      'RCT_METRO_PORT must be a valid port other than Cavy port 8082'
    );
  }

  function adb(args, timeout = 30000) {
    return execute('adb', ['-s', serial, ...args], {
      timeout,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  function readState() {
    if (!fs.existsSync(stateFile)) return null;
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (state.serial !== serial) {
      throw new Error('Android launcher state belongs to another emulator');
    }
    return state;
  }

  function saveState(state) {
    fs.mkdirSync(artifactDirectory, { recursive: true });
    fs.writeFileSync(stateFile, `${JSON.stringify(state)}\n`);
  }

  function prepare() {
    const apk = env.CAVY_ANDROID_APK;
    if (!apk || !fs.existsSync(apk) || !fs.statSync(apk).isFile()) {
      throw new Error(
        'CAVY_ANDROID_APK must point to an existing prebuilt APK'
      );
    }
    if (readState()) {
      throw new Error(
        'Android launcher already prepared; cleanup before reuse'
      );
    }
    if (adb(['get-state']).toString().trim() !== 'device') {
      throw new Error(`Emulator ${serial} is not ready`);
    }
    if (
      adb(['shell', 'getprop', 'sys.boot_completed']).toString().trim() !== '1'
    ) {
      throw new Error(`Emulator ${serial} has not finished booting`);
    }
    const mappings = adb(['reverse', '--list'])
      .toString()
      .trim()
      .split('\n')
      .map((line) => line.trim().split(/\s+/));
    const ports = [metroPort, '8082'].map((port) => `tcp:${port}`);
    for (const port of ports) {
      const existing = mappings.find((fields) => fields[1] === port);
      if (existing && existing[2] !== port) {
        throw new Error(`Reverse port ${port} is already in use`);
      }
    }
    const state = { serial, reversePorts: [], launched: false };
    saveState(state);
    adb(['install', '-r', path.resolve(apk)], 120000);
    for (const port of ports) {
      if (!mappings.some((fields) => fields[1] === port)) {
        adb(['reverse', '--no-rebind', port, port]);
        state.reversePorts.push(port);
        saveState(state);
      }
    }
  }

  function check() {
    let pid;
    try {
      pid = adb(['shell', 'pidof', APP_ID]).toString().trim();
    } catch (error) {
      throw new Error(
        `Android application process unavailable; app may have crashed: ${error.message}`
      );
    }
    if (!pid)
      throw new Error(
        'Android application process is absent; app may have crashed'
      );
  }

  async function launch() {
    const state = readState();
    if (!state) throw new Error('Prepare the Android launcher before launch');
    // Finish the cold Metro transform before starting the application.
    // Match React Native's debug bundle request; Expo resolves the virtual entry
    // from package.json, including the Hermes transform options.
    const bundleUrl = new URL(
      `http://127.0.0.1:${metroPort}/.expo/.virtual-metro-entry.bundle`
    );
    bundleUrl.search = new URLSearchParams({
      platform: 'android',
      dev: 'true',
      lazy: 'true',
      minify: 'false',
      app: APP_ID,
      modulesOnly: 'false',
      runModule: 'true',
      excludeSource: 'true',
      sourcePaths: 'url-server',
    }).toString();
    try {
      const response = await request(bundleUrl.toString(), {
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Headers can arrive while Metro is still serializing the bundle.
      await response.arrayBuffer();
    } catch (error) {
      throw new Error(`Android Metro bundle warmup failed: ${error.message}`);
    }
    // Record ownership before launching, so a partial startup is still cleaned up.
    state.launched = true;
    saveState(state);
    const output = adb(
      ['shell', 'am', 'start', '-W', '-n', ACTIVITY],
      60000
    ).toString();
    fs.writeFileSync(path.join(artifactDirectory, 'launch.txt'), output);
    if (
      /^Error:/im.test(output) ||
      !/^Status:\s*(?:ok|timeout)\s*$/im.test(output)
    ) {
      throw new Error(`Android application failed to start: ${output.trim()}`);
    }
    if (/^Status:\s*timeout\s*$/im.test(output)) {
      console.error(
        'Android display wait expired; checking the app process and awaiting bounded Cavy results'
      );
    }
    // Android's display wait can expire just before a live app renders.
    // Keep the process check; the supervisor still requires a passing Cavy
    // report within its whole-run deadline, so a hung app cannot pass.
    check();
  }

  function diagnostics() {
    fs.mkdirSync(artifactDirectory, { recursive: true });
    for (const [file, args] of [
      ['logcat.txt', ['logcat', '-d', '-v', 'threadtime']],
      ['activity.txt', ['shell', 'dumpsys', 'activity', 'activities']],
      ['screenshot.png', ['exec-out', 'screencap', '-p']],
    ]) {
      try {
        fs.writeFileSync(path.join(artifactDirectory, file), adb(args));
      } catch (error) {
        fs.writeFileSync(
          path.join(artifactDirectory, `${file}.error.txt`),
          `${error.message}\n`
        );
        if (!file.endsWith('.png')) {
          fs.writeFileSync(
            path.join(artifactDirectory, file),
            `${error.message}\n`
          );
        }
      }
    }
  }

  function cleanup() {
    const state = readState();
    if (!state) return;
    const errors = [];
    if (state.launched) {
      try {
        adb(['shell', 'am', 'force-stop', APP_ID]);
        state.launched = false;
      } catch (error) {
        errors.push(error.message);
      }
    }
    for (const port of [...state.reversePorts]) {
      try {
        adb(['reverse', '--remove', port]);
        state.reversePorts = state.reversePorts.filter(
          (value) => value !== port
        );
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (errors.length) {
      saveState(state);
      throw new Error(`Android cleanup failed: ${errors.join('; ')}`);
    }
    fs.unlinkSync(stateFile);
  }

  return { prepare, launch, check, diagnostics, cleanup };
}

module.exports = { createAndroidLauncher };

if (require.main === module) {
  async function main() {
    const [operation, ...rest] = process.argv.slice(2);
    if (
      !['prepare', 'launch', 'check', 'diagnostics', 'cleanup'].includes(
        operation
      ) ||
      rest.length
    ) {
      throw new Error(
        'Usage: android-ci-launcher.js <prepare|launch|check|diagnostics|cleanup>'
      );
    }
    await createAndroidLauncher()[operation]();
  }
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
