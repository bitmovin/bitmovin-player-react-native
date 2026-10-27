# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript API surface and React components (library code).
- `ios/`, `android/`: Native bridges (Swift/Kotlin) used by the Expo Module.
- `plugin/`: Expo Config Plugin code used during prebuild.
- `example/`: Runnable sample app (Expo) to develop and validate changes.
- `integration_test/`: Expo app + Cavy system tests.
- `scripts/`: Repo tooling (lint/format hooks, helpers). `build/`: transpiled output.

## Build, Test, and Development Commands

- `yarn bootstrap` — install deps, prebuild example, set up pods.
- `yarn build` (`build:module`, `build:plugin`) — build the library and plugin to `build/`.
- `yarn example start | ios | android` — run Metro or launch the example on simulators/emulators.
- `yarn integration-test test:ios | test:android | test` — run Cavy tests.
- `yarn lint` (`lint:all`), `yarn typecheck` (`typecheck:all`), `yarn format:all` — quality gates.
- `yarn docs` — generate TypeDoc documentation.

## Coding Style & Naming Conventions

- TypeScript: ESLint + Prettier (2 spaces, single quotes, trailing commas `es5`).
- Names: types/interfaces PascalCase; variables/functions camelCase; React components PascalCase.
- Files in `src/` use camelCase (e.g., `playerConfig.ts`).
- iOS: SwiftLint via `yarn lint:ios`; format with `yarn format:ios`.
- Android: ktlint via `yarn lint:android`; format with `yarn format:android`.

## Testing Guidelines

- Before choosing or adding tests, read [Testing](docs/testing.md): use JS unit tests for JS orchestration and Cavy system tests (or focused native tests) for native behavior.
- Add per‑feature tests (e.g., `Playback.test.ts`) covering happy‑path and error events.
- A mocked bridge does not prove native completion, decoding, or playback. Report excluded or unrun cases separately from passes.
- Before writing integration tests, follow [Writing reliable tests](CONTRIBUTING.md#writing-reliable-tests): observe events before triggering them, avoid sleeps, and register platform-specific cases only where they run.

## Commit & Pull Request Guidelines

- Commits: concise, imperative; do not use prefixes such as `fix:`, `chore:`, etc.
- PRs: read the current template and [PR writing guide](docs/pull-request-writing.md). Explain why, keep only review-relevant highlights, describe behavioral coverage, and delete inapplicable checks. Retained reviewer manual-testing checks require runnable smoke instructions and expected results. Link public issues; add screenshots for UI-facing changes.
- For code changes, required before review: `yarn lint:all`, `yarn typecheck:all`, build the library, and run the example on at least one platform. For documentation-only changes, check links, formatting, and consistency with current repository instructions.
- Changelog: add a `CHANGELOG.md` entry for user‑visible behavior changes.
- Changelog platform prefixes:
  - Prefix platform-specific changes with the affected platform, e.g. `iOS: Add ...` or `Android: Add ...`.
  - For iOS changes that also apply to tvOS, use `iOS:` only; tvOS is implicit unless it differs.
  - Do not prefix entries for features available on all platforms; write `Add ...`, not `iOS/tvOS and Android: Add ...`.

## Security & Configuration Tips

- Never commit secrets. Keep license keys only in `integration_test/.env` (gitignored).

## Docs Index

- CONTRIBUTING.md — Development workflow, Development setup, TypeScript Code Style, Linting (pre-commit hooks), Kotlin, Swift, Testing, Scripts.
- example/README.md — Getting started, Development Setup (.env and license keys), Running the application (iOS/Android/tvOS/Android TV), Bundler only, Architecture, Troubleshooting.
- integration_test/README.md — Setup, Environment Configuration (.env), Running the tests, Architecture, Test Coverage, Platform Support.
- README.md — “Sample Application” section links to `example/` README and official docs; use as entry point.

## Developer Essentials

- Environment
  - Node + Yarn (use Yarn across workspaces); macOS: Xcode + CocoaPods; Android: Android Studio + JDK 17+ (Gradle 8.2 wrapper).
  - Platforms per README: Expo 57+, React Native 0.86.3+, React 17+.
- Tooling & Hooks
  - Install hooks with `yarn setup-hooks`; verify with `yarn lint:all` and `yarn typecheck:all` before PRs.
  - SwiftLint/ktlint required for native; use `yarn format:ios` / `yarn format:android` for auto-fixes.
- Workflow
  - Bootstrap from repo root: `yarn bootstrap`. Re-run prebuilds after env/native/config changes (`yarn example prebuild`, `yarn integration-test prebuild`).
  - Public API: export via `src/index.ts`; keep native module/view names identical to TS wrappers; maintain event parity with TS types.
  - Instance routing uses stable `nativeId` values; ensure native registries clean up on module destruction.
- Secrets
  - Never commit keys. Store license keys only in `.env` under `example/` and `integration_test/` as documented.
- Validation
  - Use the example app for manual checks and the integration tests on simulators/emulators for feature coverage.

## Routing Public API to React Native

- Source of truth: export public surface from `src/index.ts:1-29` (ensure new modules are re‑exported).
- Use typed Expo wrappers in `src/modules/`:
  - Define `declare class <Feature>Module extends NativeModule<Events> { ... }` and load with `requireNativeModule('<Feature>Module')` (example: `src/modules/PlayerModule.ts:1,251`).
- For platform-specific native modules:
  - Do not add a native stub on unsupported platforms just to satisfy `requireNativeModule`.
  - Platform-gate the TS wrapper instead, following `src/modules/AudioSessionModule.ts`.
  - Register the native module in `expo-module.config.json` only for platforms that actually implement it.
  - The public JS API may still exist cross-platform if it has guarded no-op/unsupported behavior and a future implementation is expected.
- Public React Native API names should be platform-neutral when Android/iOS parity is expected. Keep Apple/Android SDK terminology inside native implementation files only.
- New runtime APIs should be exported from `src/index.ts`.
- Public API docs should use `@platform` only when the API is platform-gated.
  - Valid cases are `@platform iOS`, `@platform tvOS`, `@platform iOS/tvOS`, and `@platform Android`.
  - Include OS versions when support is version-gated, e.g. `@platform iOS 18+, tvOS 18+`.
  - Android TV does not need a separate platform distinction; treat it as Android.
  - If an API is available on all platforms, omit `@platform` entirely. Do not write `@platform iOS/tvOS/Android`.
- Public API docs should use TypeDoc's `@defaultValue` tag for documented defaults on properties, accessors, and config fields.
  - Prefer `` @defaultValue `false` `` over prose like ``Default is `false`.`` because TypeDoc renders the tag explicitly.
  - Put `@defaultValue` near other tags, before or next to `@platform`.
  - Do not duplicate the same default in prose and `@defaultValue`.
  - If defaults differ by platform, describe that inside `@defaultValue`, e.g. `@defaultValue iOS: \`1.0\`, Android: \`0.2\``.
  - When touching public docs that already mention defaults in prose, convert the touched default to `@defaultValue` instead of preserving the older style.
- Developer-facing warnings must be raised from JS with `console.warn` so they show in the Metro terminal and LogBox.
  - Native logs do not reach Metro: Android `Log.w` goes only to logcat; ExpoModulesCore `log.warn` on iOS goes only to the Xcode console and Console.app.
  - When the condition is only known natively, expose it to JS (e.g. a module `Constant`) and warn there. Example: `PlayerModule.isGoogleImaEnabled` with the warning in `src/player.ts`.
- Match native names exactly on both platforms:
  - iOS: `Name("PlayerModule")` in `ios/PlayerModule.swift:7`; Android: `Name("PlayerModule")` in `android/src/main/java/com/bitmovin/player/reactnative/PlayerModule.kt:23`.
- Bridge views via view managers:
  - TS host component: `requireNativeViewManager('RNPlayerViewManager')` in `src/components/PlayerView/native.ts:33-35`.
  - iOS manager: `ios/RNPlayerViewManager.swift:6`; Android manager: `android/src/main/java/com/bitmovin/player/reactnative/RNPlayerViewManager.kt:12`.
- Events flow native → JS via Expo `Events(...)` lists; keep parity with TS props:
  - Android events list: `android/.../RNPlayerViewManager.kt:50-112`; iOS: `ios/RNPlayerViewManager.swift:33-60`.
  - TS event typings live in `src/components/PlayerView/nativeEvents.ts:72-160` (extend as needed).
- Instance routing uses `nativeId` across modules; keep IDs stable and registry-backed on native:
  - Example registry and async functions in `android/src/main/java/com/bitmovin/player/reactnative/OfflineModule.kt:18-24,41-49`.
- Adding a new API (happy path):
  - TS: add method on a `src/modules/<Feature>Module.ts` wrapper, export from `src/index.ts`.
  - iOS/Android: add matching `AsyncFunction("methodName")` to Expo `ModuleDefinition`; emit events if needed.
  - Views: add `Prop(...)`/`Events(...)` in native managers and extend `NativePlayerViewProps`.
  - Tests: choose coverage using [Testing](docs/testing.md); validate native behavior on at least one platform.
  - Naming: keep method/event names identical across TS, iOS, Android.
- Example screens should reuse existing Bitmovin sample streams rather than introducing third-party test streams.
