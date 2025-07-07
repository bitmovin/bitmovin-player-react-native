# TODO: Phased Migration to Expo Modules

This document outlines a complete, phased plan to migrate all legacy React Native bridge modules to the modern Expo Modules API. The migration is prioritized by complexity to minimize risk and ensure stability.

## Guiding Principles
- **Single Library Architecture:** This is not a migration to separate libraries. The goal is to add new `Expo Module` subclasses *within the existing `bitmovin-player-react-native` package*. New native files will be added to the existing `ios/` and `android/` source sets.
- **Preserve Public API and Stability:** The primary goal is to ensure the library's public API and the stability of the core player do not change. All changes must be internal.
- **Phased Migration:** Modules are grouped into three priority levels based on complexity and risk. Migration will proceed in order, from lowest to highest risk.

## Contingency and Rollback Plan
- **Per-Module Rollback:** If a migrated module fails verification and a fix is not straightforward, the commit(s) for that specific module will be reverted using `git revert`.

## Migration Log & Checklist
This document serves as the primary log for the migration. After a module's migration is complete, its status and the final commit hash should be recorded in the checklist below.

### Priority 1: Foundational & Utility Modules (Low Risk)
| Module Name | Status | Commit |
| -------------------------- | :------: | :---: |
| `UuidModule` | \[ ] Not Started | |
| `DebugModule` | \[ ] Not Started | |
| `AudioSessionModule` | \[ ] Not Started | |
| `NetworkModule` | \[ ] Not Started | |
| `CustomMessageHandlerModule`| \[ ] Not Started | |

### Priority 2: Stateful Feature Modules (Medium Risk)
| Module Name | Status | Commit |
| -------------------------- | :------: | :---: |
| `DrmModule` | \[ ] Not Started | |
| `OfflineModule` | \[ ] Not Started | |
| `PlayerAnalyticsModule` | \[ ] Not Started | |
| `BitmovinCastManagerModule`| \[ ] Not Started | |
| `FullscreenHandlerModule` | \[ ] Not Started | |

### Priority 3: Core Player Engine & View (High Risk)
*These modules require the enhanced process from Phase 3.*
| Module Name | Status | Commit |
| -------------------------- | :------: | :---: |
| `PlayerModule` | \[ ] Not Started | |
| `SourceModule` | \[ ] Not Started | |
| `BufferModule` | \[ ] Not Started | |
| `RNPlayerView` (ViewManager) | \[ ] Not Started | |

## Phase 1: Preparation and Setup

- [ ] **Understand Expo Modules:** Familiarize with the [Expo Modules API documentation](docs/expo-module-api.mdx).
- [ ] **Analyze Existing Modules:** Create a comprehensive list of all legacy modules, documenting their methods, props, constants, events, and native dependencies.
- [ ] **Choose a Pilot Module:** Select `UuidModule` from Priority 1 for the initial migration.

## Phase 2: General Migration Process (Per-Module)

### 1. Native Migration (Android & iOS)
- [ ] **Dependency Management:** Inspect the legacy module's dependencies. Ensure these dependencies are correctly declared in the main package's `build.gradle` and `.podspec` so they are available to the new Expo Module subclass.
- [ ] **Build Configuration:** Rely on Expo's autolinking and prebuild commands for all build configuration. No manual changes to `Info.plist` or `build.gradle` in the `example/` directory are needed.
- [ ] **Define Typed Data Models:** For complex objects and event payloads, define corresponding strongly-typed `Record`s (Kotlin data classes, Swift structs) to improve type safety.
- [ ] Create the module file for each platform and implement the `Definition`/`definition()` block.
- [ ] **Register Module:** Add the new module's class name to `expo-module.config.json`:
    - For iOS, add the Swift class name to the `apple.modules` array.
    - For Android, add the fully qualified Kotlin class name to the `android.modules` array.
- [ ] **Port Native Constants:** Migrate any constants exported by the legacy module.
- [ ] **Port Methods and Events:**
    - [ ] Port all methods, ensuring data types are consistent.
    - [ ] **Handle Errors:** Migrate legacy promise rejection (e.g., `RCTPromiseRejectBlock`) to throw `CodedException` or other appropriate exceptions as per Expo Modules guidelines.
    - [ ] **Preserve Threading:**
        - **iOS:** If a legacy module uses a custom `methodQueue`, ensure the new Expo Module dispatches to the correct queue (e.g., main thread for UI work).
        - **Android:** Replicate any threading logic, such as moving work off the main thread.
- [ ] **Handle Lifecycle Events (Android):** Migrate any logic from `onHostResume`, `onHostPause`, and `onHostDestroy` to their Expo Modules or `LifecycleEventListener` equivalents.

### 2. TypeScript Bridge and Internal Wiring
- [ ] Create an internal TypeScript wrapper for the new native module.
- [ ] **Internal Wiring:**
    - [ ] Identify and replace legacy `NativeModules` calls within the main `src/` directory with the new Expo module wrapper.
    - [ ] **Update Event Handling:** Replace `NativeEventEmitter` listeners with the new Expo module's event subscription model (e.g., `module.addListener('eventName', ...)`).
    - [ ] **Verify Public API:** Ensure that the public-facing API that depended on the module retains its exact signature and behavior.

### 3. Integration and Verification
- [ ] Run a full manual test case checklist.
- [ ] **Verify Event Payloads:** During testing, log events and their data payloads to confirm that the event names and payload structures are identical to the legacy implementation.
- [ ] Perform a clean rebuild (`yarn example prebuild`).

## Phase 3: Enhanced Process for High-Risk Modules

For all **Priority 3** modules, the following additional steps are required.

- [ ] **Performance Benchmarking:** Document and compare key performance metrics before and after migration to prevent regressions.
- [ ] **Migrate `PlayerModule`:**
    - [ ] **Preserve Static Methods and Extensions:** The static `PlayerModule.retrieve()` (Swift) and `PlayerModule.getPlayerOrNull()` (Kotlin) methods—and the `com.bitmovin.player.reactnative.extensions.playerModule` Kotlin extension—are called by other native modules. They must remain available at runtime with their existing signatures to ensure cross-module compatibility.
- [ ] **Migrate `RNPlayerView` (ViewManager):**
    - [ ] **Note on Component Implementation:** The new React component that wraps the Expo View must be wrapped in `React.forwardRef` to correctly forward the `ref`.
    - [ ] **Props:** Migrate all view props from the legacy `ViewManager` to the new Expo `ViewManager`'s `props` block. Complex objects like `playerConfig` may require custom setters.
    - [ ] **Imperative Commands:** Identify all imperative commands (e.g., `play`, `seek`). Re-implement them in the new `ViewManager` and expose them from the new component using a `ref` and `useImperativeHandle`.

## Phase 4: Cleanup (Post-Migration)

- [ ] Once a module is fully migrated and verified, its legacy files can be removed in a distinct commit.
- [ ] **Remove Legacy Code:** Delete the legacy module's native files and any associated `import` or `require` statements in the native code.

## Phase 5: Documentation

- [ ] After migration, review and update all internal documentation and code comments that refer to the old React Native Bridge or `NativeModules` to reflect the new Expo Modules implementation.
