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
