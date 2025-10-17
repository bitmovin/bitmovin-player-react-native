# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript API surface and React components (library code).
- `ios/`, `android/`: Native bridges (Swift/Kotlin) used by the Expo Module.
- `plugin/`: Expo Config Plugin code used during prebuild.
- `example/`: Runnable sample app (Expo) to develop and validate changes.
- `integration_test/`: Expo app + Cavy-based integration tests.
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

- Framework: Cavy; tests live under `integration_test/tests`.
- Setup: `cp integration_test/.env.example integration_test/.env` and set `EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY`.
- Run: `yarn integration-test test:ios` or `test:android` (simulator/emulator only).
- Add per‑feature tests (e.g., `Playback.test.ts`) covering happy‑path and error events.

## Commit & Pull Request Guidelines

- Commits: concise, imperative; do not use prefixes such as `fix:`, `chore:`, etc.
- PRs: follow `.github/PULL_REQUEST_TEMPLATE.md`; link issues; add screenshots for UI-facing changes.
- Required before review: `yarn lint:all`, `yarn typecheck:all`, build the library, and run the example on at least one platform.
- Changelog: add a `CHANGELOG.md` entry for user‑visible behavior changes.

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
  - Platforms per README: Expo 53+, React Native 0.79+, React 17+.
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
  - Tests: extend integration tests; validate on at least one platform.
  - Naming: keep method/event names identical across TS, iOS, Android.
