# Integration Tests

This is the integration test suite for the Bitmovin Player React Native SDK. It is based on [Cavy](https://github.com/pixielabs/cavy).
This is intended for maintainers to test the SDK on different platforms and devices.

## Setup

To run the integration tests, you need to install depencencies first.

Run the following command from the repository root:

```sh
yarn bootstrap
```

## Running the tests

To run the tests, run the following command from the repository root:

```sh
yarn integration-test test:ios # Run tests on iOS
yarn integration-test test:android # Run tests on Android
```

Hint: You can provide a specific iOS simulator by name when using `--simulator` flag. `xcrun simctl list devices available` provides you with a list of available devices in your environment.

```sh
yarn example ios --simulator="iPhone 14 Pro"
```

Note: The tests are currently only supported on iOS simulators and Android emulators. Running them on real devices is not supported at the moment.
