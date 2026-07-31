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

Run one or more test suites by passing their comma-separated selectors:

```sh
yarn integration-test list-tags # List selectors and their supported platforms
yarn integration-test test:android --tags playback
yarn integration-test test:ios --tags playback,unloading
```

When running both platforms, the selection must include at least one tag
supported by Android and at least one supported by iOS. A shared tag can cover
both platforms, or platform-specific tags can be combined:

```sh
yarn integration-test test --tags playback
yarn integration-test test --tags advertising,media-controls
```

The available suite selectors are:

- `advertising` — advertising configuration, scheduling, playback, and errors
- `audio-track` — audio track events and properties
- `caption` — general caption playback and event coverage
- `error` — player error events and network details
- `loading` — source loading and download events
- `media-controls` — iOS media controls configuration and runtime changes
- `metadata-id3` — Android and iOS ID3 metadata serialization
- `playback` — play, pause, time updates, and playback completion
- `unloading` — source unloading events and player state
- `video-quality` — video quality events and properties

Focused selectors are also available for test groups within a larger feature:

- `cue-geometry` — Android and iOS cue geometry coverage
- `cue-metadata` — iOS cue metadata coverage

Arguments other than `--tags` are forwarded to `cavy-cli`. Omitting `--tags`
runs the complete test suite.

`tests/index.js` is the source of truth for suite registration, selector names,
and platform support. Tests must be registered inside `spec.describe`; those
groups receive their suite selector automatically. To make a focused group
selectable independently, add it to the same manifest and pass its exported
selector as the third argument to `spec.describe`.

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
