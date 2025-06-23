# Contributing

## Issues

With bugs and problems, please try to describe the issue as detailed as possible to help us reproduce it.

## Pull Requests

Before creating a pull request, please

- Make sure all guidelines are followed
- Make sure your branch is free of merge conflicts

## Development workflow

To get started with the project, run `yarn bootstrap` in the root directory to install the required dependencies for each package and cocoapods dependencies for the example app:

```sh
yarn bootstrap
```

> While it's possible to use [`npm`](https://github.com/npm/cli), the tooling is built around [`yarn`](https://classic.yarnpkg.com/), so you'll have an easier time if you use `yarn` for development.

While developing, you can run the [example app](/example/) to test your changes. Any changes you make in your library's JavaScript code will be reflected in the example app without a rebuild. If you change any native code, then you'll need to rebuild the example app.

To start the packager, run in the root directory:

```sh
yarn example start
```

To build and run the example app on Android:

```sh
yarn example android
```

To build and run the example app on iOS:

```sh
yarn example ios
```

To edit the Swift/Objective-C files, open `example/ios/BitmovinPlayerReactNativeExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > RNBitmovinPlayer`.

To edit the Kotlin files, open `example/android` in Android Studio and find the source files at `bitmovin-player-react-native` under `Android`.

## For iOS/tvOS on-device development

To build the example project for an iOS or tvOS device, you need to create a file at `example/ios/Developer.xcconfig`. In this file, add your development team like this:

```yml
DEVELOPMENT_TEAM = YOUR_TEAM_ID
```

## TypeScript Code Style

- Follow the `eslint` rules (`yarn lint`). They are enforced automatically via a pre-commit git hook.
- Always add return values to functions (even if `void`)
- No unused imports
- Public functions should be documented with a description that explains _what_ it does
- Every code block that does not obviously explain itself should be commented with an explanation of _why_ and _what_ it does

## Linting

### Typescript

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter will pass when committing.
Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typescript
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

### Kotlin

For Kotlin code [ktlint](https://pinterest.github.io/ktlint/) is used with [ktlint gradle plugin](https://github.com/jlleitschuh/ktlint-gradle).
Run the following inside `android` folder to verify code format:

```sh
./gradlew ktlintCheck
```

To fix formatting errors, run the following inside `android` folder:

```sh
./gradlew ktlintFormat
```

You can add a lint check pre-commit hook by running inside `android` folder:

```sh
./gradlew addKtlintCheckGitPreCommitHook
```

and for automatic pre-commit formatting:

```sh
./gradlew addKtlintFormatGitPreCommitHook
```

### Swift

For Swift code [SwiftLint](https://github.com/realm/SwiftLint) is used.
To install SwiftLint, run `brew bundle install` in the root directory.
Our pre-commit hooks verify that the linter will pass when committing.

To verify Swift code, run the following:

```sh
swiftlint
```

To fix auto-fixable SwiftLint violations, run the following:

```sh
swiftlint lint --autocorrect
```

## Testing

Remember to add tests for your change if possible. Run the player tests by:

```sh
yarn integration-test test:android
yarn integration-test test:ios
```

To set the license key to be used for the tests, you can set the key `"licenseKey"` in `integration_test/app.json`.

See available API for testing [here](/integration_test/playertesting/PlayerTesting.ts).

### Adding new tests

To add new tests:

1. create a new file in the `specs/` folder.
1. import the new file to the `specs/index.ts` file and add it to the default exported array.

A Player Test has the following structure always:

```ts
export default (spec: TestScope) => {
  spec.describe('SCENARIO TO TEST', () => {
    spec.it('EXPECTATION', async () => {
      await startPlayerTest({}, async () => {
        // TEST CODE
      });
    });
  });
};
```

For example:

```ts
export default (spec: TestScope) => {
  spec.describe('playing a source', () => {
    spec.it('emits TimeChanged events', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig({
          url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
          type: SourceType.HLS,
        });
        await callPlayerAndExpectEvents((player) => {
          player.play();
        }, EventSequence(EventType.Play, EventType.Playing));
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });
  });
};
```

## Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn bootstrap`: setup the whole project by installing all dependencies and pods.
- `yarn bootstrap:example`: setup example project by installing all dependencies and pods.
- `yarn bootstrap:integration-test`: setup integration tests project by installing all dependencies and pods.
- `yarn build`: compile TypeScript files into `lib/` with ESBuild.
- `yarn typescript`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn format`: format files with Prettier.
- `yarn docs`: generate documentation with TypeDoc.
- `yarn brew`: install all dependencies for iOS development with Homebrew.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example pods`: install pods only.
- `yarn integration-test start`: start the Metro server for the integration tests.
- `yarn integration-test test:android`: run the player tests on Android emulator.
- `yarn integration-test test:ios`: run the player tests on iOS simulator.
- `yarn integration-test pods`: install pods only.
- `yarn example ios`: run the example app on iOS.
