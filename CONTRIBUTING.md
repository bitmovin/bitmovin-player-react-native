# Contributing

## Issues

With bugs and problems, please try to describe the issue as detailed as possible to help us reproduce it.

## Pull Requests

Use the current [PR template](.github/PULL_REQUEST_TEMPLATE.md) and
[PR writing guide](docs/pull-request-writing.md) for concise descriptions,
behavioral coverage summaries, and reviewer smoke tests.

Before creating a pull request, please

- Make sure all guidelines are followed
- Make sure your branch is free of merge conflicts

## Development workflow

If this is your first React Native project, setup your React Native development environment for both Android and iOS as described [here](https://reactnative.dev/docs/set-up-your-environment).

For iOS and tvOS development, use Xcode 26.6, which includes the Swift 6.3.3 compiler, to match CI. Xcode 26.6 requires macOS Tahoe 26.2 or later. The native bridge remains in Swift 5 language mode (`s.swift_version = '5.10'`); this toolchain update does not enable Swift 6 language mode.

To get started with the project, run `yarn bootstrap` in the root directory to install the required dependencies for each package and cocoapods dependencies for the example app:

```sh
yarn bootstrap
```

Troubleshooting:

- If you see errors such as `xcrun: error: SDK "iphoneos" cannot be located`, switch the previously installed Xcode SDK using `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` and run `yarn bootstrap` again.

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

To edit the Swift/Objective-C files, open Xcode via `yarn example open:ios` and find the source files at `Pods > Development Pods > RNBitmovinPlayer`.

To edit the Kotlin files, open Android Studio via `yarn example open:android` and find the source files at `bitmovin-player-react-native` under `Android`.

## Development setup

- For the Example app, see the relevant [`example/README`](example/README.md#development-setup) section.
- For the integration tests, see the relevant [`integration_test/README`](README.md#2-environment-configuration) section.

## TypeScript Code Style

- Follow the `eslint` rules (`yarn lint`). They are enforced automatically via a pre-commit git hook.
- Always add return values to functions (even if `void`)
- No unused imports
- Public functions should be documented with a description that explains _what_ it does
- Every code block that does not obviously explain itself should be commented with an explanation of _why_ and _what_ it does

## Linting

### Pre-commit Hooks

The project uses pre-commit hooks to automatically enforce code quality standards across all languages (TypeScript, Swift, Kotlin). The hooks will:

- Run ESLint (quiet mode) on TypeScript/JavaScript files
- Auto-format Swift files with SwiftLint, then run SwiftLint (strict mode)
- Auto-format Kotlin files with ktlint, then run ktlint
- Auto-format files with Prettier

**Setup:**

```sh
yarn setup-hooks
```

Or manually install the pre-commit hook:

```sh
# Copy the pre-commit hook (done automatically by yarn setup-hooks)
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Testing all linting:**

```sh
yarn lint:all
```

### Typescript

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code.

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck
yarn lint
```

To run TypeScript checking for all packages:

```sh
yarn typecheck:all
```

To fix formatting errors, run the following:

```sh
yarn format:all
```

Or for specific platforms:

```sh
yarn format        # Prettier (TypeScript/JavaScript/Markdown/JSON/YAML)
yarn format:ios    # SwiftLint auto-correction
yarn format:android # ktlint formatting
```

### Kotlin

For Kotlin code [ktlint](https://pinterest.github.io/ktlint/) is used with [ktlint gradle plugin](https://github.com/jlleitschuh/ktlint-gradle).

Run the following to verify code format:

```sh
yarn lint:android
```

To fix formatting errors, run the following:

```sh
yarn format:android
```

Or manually inside `android` folder:

```sh
./gradlew ktlintFormat
```

### Swift

For Swift code [SwiftLint](https://github.com/realm/SwiftLint) is used.
To install SwiftLint, run `brew bundle install` in the root directory.

To verify Swift code, run the following:

```sh
yarn lint:ios
```

To fix auto-fixable SwiftLint violations, run the following:

```sh
yarn format:ios
```

Or manually:

```sh
swiftlint ios --autocorrect
```

## Testing

Remember to add tests for your change if possible. Run the player tests by:

```sh
yarn integration-test test:android
yarn integration-test test:ios
```

To set the license key to be used for the tests, you can set the key `"licenseKey"` in `integration_test/app.json`.

See available API for testing [here](/integration_test/playertesting/PlayerTesting.ts).

### Config plugin and dependency tests

Run `yarn test:plugin` to test Android Gradle configuration and iOS SPM project
integration. The iOS tests cover repeated prebuilds, SDK upgrades, conflicting
requirements, platform switching, preservation of customer-managed references,
and archive signature cleanup.

Run `python3 -m unittest discover -s .github/scripts -p 'test_*.py'` for repository
automation tests, including the iOS SDK version updater.

Native CI builds both examples, checks embedded Player, Analytics, and IMA
binaries, and saves `Package.resolved` artifacts. Pull requests archive iOS Release;
pushes to `development` archive Debug and Release for both iOS and tvOS. These
unsigned device archives check framework embedding and retained SDK signatures,
with JavaScript bundling skipped. App launch, playback, ads, Analytics,
and signed-device archives still need separate validation.

### Adding new tests

To add a new test suite:

1. Create a file such as `integration_test/tests/drmTest.ts` with the following
   structure:

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

2. Register it in `integration_test/tests/index.js` with a selector and its
   supported platforms:

```js
testSuite('drm', androidAndIos, () => require('./drmTest').default),
```

Use `iosOnly` instead of `androidAndIos` for an iOS-only suite. Keep tests
inside `spec.describe` so they receive the suite selector automatically.

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
        await callPlayerAndExpectEvents(
          (player) => {
            player.play();
          },
          EventSequence(EventType.Play, EventType.Playing)
        );
        await expectEvents(RepeatedEvent(EventType.TimeChanged, 5));
      });
    });
  });
};
```

### Writing reliable tests

#### How events reach expectations

Player events are delivered to the expectations listening at that moment and
then discarded. Nothing is buffered, so an event that arrives before its
expectation is attached is lost and the test times out. Each expectation's
timeout starts when it attaches, not when the trigger runs.

#### Races to avoid

- **Expecting after triggering.** `player.load(...)` followed by
  `await expectEvent(...)` misses events emitted while the call runs. Use
  `callPlayerAndExpectEvent(s)`, `loadSourceConfig` or `playUntil`; these attach
  first, then trigger.
- **Chaining awaits for events from one trigger.** After `await
expectEvent(AdManifestLoaded)`, the next `expectEvents(...)` attaches only once
  the first resolves, so it misses events emitted in between. Event order can
  also differ by platform: an ad break may start before the manifest event.
  Start every expectation for one trigger together:

  ```ts
  const expectations = [
    expectEvent(EventType.AdManifestLoaded, 20),
    expectEvents(EventSequence(EventType.AdBreakStarted /* ... */), 30),
    callPlayerAndExpectEvent((player) => player.seek(13), EventType.Seeked),
  ];
  try {
    await Promise.all(expectations);
  } finally {
    await Promise.allSettled(expectations);
  }
  ```

  The `finally` block waits for sibling expectations to release their listeners
  and timers before teardown, while preserving the original failure. Size these
  timeouts to cover the trigger plus preparation, because they start before it.

- **Sleeping instead of waiting.** Do not add fixed sleeps before player calls.
  Player helpers wait for the mounted view through `onPlayerViewReady`; wait for
  an event or condition instead of time.
- **Asserting a callback before it runs.** Native callbacks such as
  `shouldLoadAdItem` can run after the events you wait for. Fold the
  callback state into the awaited condition, for example
  `FilteredEvent(TimeChanged, (e) => e.currentTime > 0.25 && calls.length > 0)`,
  then assert.
- **Events from the previous test.** `TestablePlayer` drops events and view
  readiness from a player that a newer test replaced. Keep events flowing
  through it, not through listeners of your own.

#### Assertions that prove behavior

- Sequences match in order but ignore unrelated events in between, and nothing
  fails on an unexpected event. A sequence therefore cannot prove that an event
  did not happen or happened once. Prove absence with player state such as
  `isAd()`, or by counting.
- Record every invocation of a callback under test, with its arguments, and
  assert the count: exactly when the schedule determines it, at least once
  otherwise. A missing ad event alone also passes when the callback never ran or
  nothing was scheduled.
- Assert metadata through the typed `onMetadata` and `onMetadataParsed`
  callbacks, which add the `platform` discriminator. `TestablePlayer` already
  routes them; the raw `onEvent` copies omit `platform`.
- Register platform-specific cases only where they run: gate `spec.describe`
  with `Platform.OS`, or register the suite with `iosOnly`. An early `return`
  inside `spec.it` reports a passing test that checked nothing.
- Request ad tags with a fresh correlator in each test, as the `AdTags.pause`
  getter does, so ad servers do not cap or reuse earlier responses.
- Cover changes to test infrastructure with device-free tests in
  `integration_test/scripts/*.test.js`, run with
  `yarn integration-test test:runner`.

## Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn bootstrap`: setup the whole project by installing all dependencies and pods.
- `yarn bootstrap:example`: setup example project by installing all dependencies and pods.
- `yarn bootstrap:integration-test`: setup integration tests project by installing all dependencies and pods.
- `yarn build`: compile TypeScript files into `lib/` with ESBuild.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn typecheck:all`: type-check files with TypeScript in all packages.
- `yarn lint`: lint files with ESLint.
- `yarn format`: format files with Prettier.
- `yarn format:ios`: auto-fix SwiftLint violations.
- `yarn format:android`: format Kotlin files with ktlint.
- `yarn format:all`: format all files (Prettier, SwiftLint, ktlint).
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

### Updating the native iOS SDK

Run `python3 .github/scripts/update_ios_sdk_version.py <version>` to update the
Player pin in `ios/dependencies.json`. The SDK-update workflow uses the same
command. The podspec and Expo plugin both read this manifest.

Keep the iOS and tvOS IMA pins aligned with the versions used to build the native
Player SDK. Run the updater and plugin tests, then validate the native integration
when changing SDK versions.

Integrator instructions live in the [iOS dependency migration guide](docs/ios-dependencies.md).
