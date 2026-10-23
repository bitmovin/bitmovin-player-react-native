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

A failed test runs once more with a fresh app and player, like the native player
suites. It passes if the second attempt passes. Each retry logs a
`[Cavy retry]` line with the first error, so search the Metro output for it to
spot flaky tests.

See [Adding new tests](../CONTRIBUTING.md#adding-new-tests) to register a suite.

### Run a prebuilt app locally or in CI

From `integration_test/`, use the shared supervisor with a fresh artifact
directory:

```sh
CAVY_TIMEOUT_MS=1800000 CAVY_ARTIFACTS_DIR=/tmp/cavy-android-run node scripts/run-ci-tests.js android
CAVY_TIMEOUT_MS=1800000 CAVY_ARTIFACTS_DIR=/tmp/cavy-ios-run node scripts/run-ci-tests.js ios
```

CI runs every registered suite supported by its platform, including live loading,
advertising, captions, cue metadata, ID3, unloading, audio tracks and video quality.
For a short local smoke run, append `--tags playback,loading-vod` to use the
existing Art of Motion VOD tests. The `loading`
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
(default 600000 ms; full-suite CI uses 1800000 ms); startup readiness also has a 120-second limit. Bounded
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

Android includes the Widevine license-error assertion, which requires a license
request to reach the expected HTTP 403 response. It does not establish successful
encrypted playback or hardware-backed DRM coverage.

Metro serves the fixed license-error response and the checked-in positioned
WebVTT HLS fixture under `/cavy-fixtures/`. Both local runs and CI use the
resolved Metro origin, so these cases require no external fixture credentials.

FairPlay cannot run on Apple simulators. The suite excludes that iOS test
with an explicit log message. Physical-device coverage requires a device-capable harness.
The current simulator launcher is not a physical-device runner. Platform-only
ID3, media-control and ad-break tests are registered only where applicable, so
unsupported cases are not reported as passing no-ops. Existing platform-specific
ad and caption coverage remains intact. TV runtime execution remains outside CI.

The Android adapter exposes `prepare`, `launch`, `check`, `diagnostics`, and
`cleanup` operations. The iOS adapter stays alive while the app runs and fails
if it exits early; the supervisor sends SIGTERM after validating the report.
The iOS adapter records disposal in `ios-cleanup.json`; failed or missing
disposal acknowledgement fails the run. Text diagnostics redact the configured
player license before artifact upload.
The pinned CLI spells its no-build flag `--skipbuild`, so the supervisor uses
that spelling with `--no-screenshots --xml`.

## Local HTTP fixtures

Prefer small, versioned local fixtures when a test needs predictable media or an
exact HTTP response. Keep real-service tests where the service itself is being
validated, such as successful DRM licensing or ad-provider integration. Local
fixtures do not make the whole suite offline: other tests still use remote media
and advertising services.

### How hosting works

The test app already uses Metro to load JavaScript. Its
[`metro.config.js`](./metro.config.js) wraps Metro's normal HTTP handler with
[`fixture-middleware.js`](./scripts/fixture-middleware.js) through
`server.enhanceMiddleware`. Middleware is a request handler: this wrapper answers
only its fixture routes and delegates every other request to the existing
handler, preserving Expo/Metro behavior. No separate server process or port is
needed.

The wrapper serves an explicit allowlist of HLS manifests, a video segment and
WebVTT under `/cavy-fixtures/positioned-webvtt/` for `GET` and `HEAD`. Files load
into memory when Metro starts. Responses set their MIME type and length and use
`Cache-Control: no-store`; restart Metro after editing fixture files.

`POST /cavy-fixtures/drm/license-403` always returns HTTP 403 with the body
`Forbidden\n`. The native player sends a real DRM license request to this
endpoint. `req.resume()` drains and discards its request body without parsing,
storing or logging the DRM challenge. This checks Android's license-error event
and HTTP response details; it does not issue a license or establish successful
encrypted playback or hardware-backed DRM coverage.

[`fixtureUrl`](./tests/helper/FixtureUrl.ts) obtains the HTTP origin from a
resolved React Native image asset. Fixture requests therefore use the same
reachable host and port as the JavaScript assets, including a custom Metro port,
without hard-coding an emulator address. The native player fetches the media
over HTTP; its playback and subtitle handling remain real.

### Scope and limitations

- This hosting code runs in Node on the maintainer's machine or CI runner. It is
  loaded only by the integration app's Metro config. The integration app includes
  the test cases and URL helper; the HTTP server is not embedded in that app
- The SDK, native bridges, config plugin and ordinary example app do not import
  this middleware. `.npmignore` excludes `integration_test/` from the published
  package. Keep new fixture code inside this boundary so consumer apps do not
  acquire test routes, assets or configuration
- Metro must be running and reachable. The URL helper rejects bundled/local-file
  assets without an HTTP origin. Standalone release and offline test hosts need
  another fixture-hosting arrangement; physical-device support is not implied
- Host reachability and Android reverse-port mapping remain the launcher's
  responsibility. `localhost` can bind to IPv6 only; check the actual listener
  before substituting an IPv4 address
- This is a small fixture host, not a network simulator. It returns complete files
  and does not implement byte-range responses, live playlist updates, HTTPS
  setup, throttling, delayed responses or connection-failure scenarios

Keep this wrapper small. Reconsider hosting when a concrete test needs those
missing behaviors, must run without Metro, or must share fixtures with another
platform harness. A separately managed fixture server adds startup, addressing
and cleanup work, so it is not needed for the current cases.

### Expo/Metro upgrades

Checked on 2026-10-21 with Expo 57.0.27 and Metro 0.84.6: the installed Metro
supports `server.enhanceMiddleware` and does not provide the newer
`unstable_middleware` or `unstable_priorityMiddleware` hooks. Current upstream
[Metro documentation](https://metrobundler.dev/docs/configuration/#enhancemiddleware)
deprecates `enhanceMiddleware` in favor of those newer hooks. This is an upgrade
compatibility check, not a reason to use an unavailable API in the pinned version.

After upgrading Expo, React Native or Metro:

1. From `integration_test/`, check the actual resolved version with
   `node -p "require('metro/package.json').version"` and inspect that version's
   middleware API. If migrating, preserve existing Expo middleware and delegate
   unmatched requests; do not add a silent fallback that drops fixture routes
2. Run `yarn integration-test check:runner` from the repository root. It covers
   fixture content, route/method matching, binary license requests, origin
   resolution and the DRM error assertion
3. Start Metro with `yarn integration-test start`. At its actual host and port,
   check `/status`, a `GET` or `HEAD` of
   `/cavy-fixtures/positioned-webvtt/master.m3u8` (200), and a `POST` to
   `/cavy-fixtures/drm/license-403` (403). Then exercise `error,cue-metadata` on
   Android and `cue-metadata` on iOS using the test selectors above. FairPlay
   remains excluded on simulators

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

FairPlay requires a physical Apple device. The DRM license-error test is excluded
on iOS before registration and logs an explicit exclusion message, so it does not
count as a passing test. This also excludes physical iOS until the test runner supports
physical-device execution. Physical-device FairPlay validation remains pending. Android's
Widevine license-error test remains enabled. The example app hides its DRM sample
on iOS and tvOS simulators; physical Apple devices and Android retain the sample.
