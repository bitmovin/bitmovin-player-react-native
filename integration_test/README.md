# Integration Tests

This is the integration test suite for the Bitmovin Player React Native SDK. It is based on [Cavy](https://github.com/pixielabs/cavy).
This is intended for maintainers to test the SDK on different platforms and devices.

## Setup

### 1. Install Dependencies

To run the integration tests, you need to install dependencies first.

Run the following command from the repository root:

```sh
yarn bootstrap
```

### 2. Environment Configuration

The integration tests require a valid Bitmovin Player license key. You need to set up an environment file:

1. Copy the environment template:

   ```sh
   cp integration_test/.env.example integration_test/.env
   ```

2. Edit `integration_test/.env` and set your license key:
   ```
   EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY="YOUR_LICENSE_KEY_HERE"
   ```

**Important**: The `.env` file is gitignored to prevent committing sensitive license keys. Never commit your actual license key to the repository.

## Running the tests

To run the tests, run the following command from the repository root:

```sh
yarn integration-test test:ios # Run tests on iOS simulator
yarn integration-test test:android # Run tests on Android emulator
yarn integration-test test # Run tests on both Android emulator and iOS simulator
```

List the available selectors or run one or more test suites by passing
comma-separated selectors:

```sh
yarn integration-test list-tags
yarn integration-test test:android --tags playback
yarn integration-test test:ios --tags playback,unloading
```

`yarn integration-test test` runs Android and iOS sequentially, so its
selection must cover both platforms. Use a shared selector or combine
platform-specific selectors:

```sh
yarn integration-test test --tags playback
yarn integration-test test --tags advertising,media-controls
```

Arguments other than `--tags` are forwarded to `cavy-cli`. Omitting `--tags`
runs the complete test suite.

See [Adding new tests](../CONTRIBUTING.md#adding-new-tests) to register a suite.

### Run a prebuilt app locally or in CI

From `integration_test/`, use the shared supervisor with a fresh artifact
directory:

```sh
CAVY_ARTIFACTS_DIR=/tmp/cavy-android-run node scripts/run-ci-tests.js android --tags playback,loading-vod
CAVY_ARTIFACTS_DIR=/tmp/cavy-ios-run node scripts/run-ci-tests.js ios --tags playback,loading-vod
```

`playback,loading-vod` uses the existing Art of Motion VOD tests. The `loading`
selector still includes both VOD and live loading tests. `loading-vod` is an
explicit subset selector; omitting tags runs the original full suite without
duplicating its VOD tests.

Install the pinned dependencies first. The supervisor starts Metro and the
installed Cavy CLI, waits for Metro's `/status` response and the Cavy reporter
port, then invokes the platform adapter. `EXPO_PUBLIC_CAVY_CI=1` selects
the existing Cavy entry without swapping source files. It never builds the app. Both local
and CI runs use this same command.

The adapters require these environment variables:

| Platform | Variables                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Android  | `ANDROID_SERIAL` for a booted emulator and `CAVY_ANDROID_APK` for a prebuilt APK                                                |
| iOS      | `IOS_SMOKE_APP_PATH`, `IOS_SMOKE_RUNTIME`, and `IOS_SMOKE_DEVICE_TYPE` for a prebuilt simulator app and the simulator to create |
| Both     | `EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY`; CI maps the existing `INTEGRATION_TESTS_PLAYER_LICENSE_KEY` secret to this variable  |

`RCT_METRO_PORT` defaults to 8081; Cavy uses 8082. Occupied ports and existing
Cavy reports are rejected. Metro uses IPv4-first DNS resolution for Android's
reverse port mapping. `CAVY_TIMEOUT_MS` bounds startup and test execution
(default 600000 ms); startup readiness also has a 120-second limit. Bounded
adapter cleanup runs afterward.

`CAVY_ARTIFACTS_DIR` defaults to `cavy-artifacts/` in the current directory.
It retains `metro.log`, `cavy.log`, `app.log`, Cavy XML/Markdown reports, and
adapter diagnostics. Success requires Cavy to exit successfully with a valid,
nonempty XML report containing no failures, errors, or skipped tests. Missing
reports, early process exits, startup failures, and timeouts fail the command.
Cleanup signals only processes started by this run; adapters own their device
cleanup. Keep `patches/cavy+4.0.2.patch`: the CLI fork does not replace the
runtime fixes. The canonical CLI is
[`bitmovin-engineering/cavy-cli`](https://github.com/bitmovin-engineering/cavy-cli),
pinned to `833199422418fa72ba6f977b190f46beb23fbba2` in the lockfile; the
runtime remains upstream `cavy@4.0.2`.

The initial smoke gate excludes live loading, advertising, captions, metadata,
DRM and TV runtime coverage. FairPlay cannot run on Apple simulators; these
excluded tests are not counted as passing.

The Android adapter exposes `prepare`, `launch`, `check`, `diagnostics`, and
`cleanup` operations. The iOS adapter stays alive while the app runs and fails
if it exits early; the supervisor sends SIGTERM after validating the report.
The iOS adapter records disposal in `ios-cleanup.json`; failed or missing
disposal acknowledgement fails the run. Text diagnostics redact the configured
player license before artifact upload.
The pinned CLI spells its no-build flag `--skipbuild`, so the supervisor uses
that spelling with `--no-screenshots --xml`.

## Architecture

This integration test app is built as an Expo application using:

- **Expo SDK**: Modern React Native development with prebuild workflow
- **Cavy Testing Framework**: Automated integration testing for React Native
- **Bitmovin Player SDK**: Via Expo Modules architecture
- **Environment Configuration**: Secure license key management via dotenv

## Test Coverage

The integration tests are located in the [`tests`](./tests) directory. Each file in this directory corresponds to a feature or a set of related features being tested. Please refer to the contents of this directory for an up-to-date list of what is covered.

## Platform Support

Note: The tests are currently only supported on iOS simulators and Android emulators. Running them on real devices is not supported at the moment because the testing framework has hard-coded `localhost` as the server address.
