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
yarn integration-test test:ios # Run tests on iOS simulator
yarn integration-test test:android # Run tests on Android emulator
yarn integration-test test # Run tests on both Android emulator and iOS simulator
```

To set the license key to be used for the tests, you can set the key `"licenseKey"` in `integration_test/app.json`.

Note: The tests are currently only supported on iOS simulators and Android emulators. Running them on real devices is not supported at the moment because the testing framework has hard-coded `localhost` as the server address.
