# Expo SDK Integration Improvement Plan

This document outlines 10 key areas for improving the integration with the Expo SDK, focusing on enhancing type safety, reducing boilerplate code, and fully leveraging the modern Expo Modules API.

### 1. Adopt Type-Safe `Record` for Configuration Objects

**Problem:** Configuration objects like `PlayerConfig`, `SourceConfig`, and `AnalyticsConfig` are passed from TypeScript as generic `[String: Any]` or `Map<String, Any>` objects. This requires extensive manual parsing and validation in native code (e.g., `RCTConvert.playerConfig` in Swift, `toPlayerConfig` in Kotlin), which is error-prone and lacks type safety at the bridge boundary.

**Improvement:** Refactor these configuration objects into `Record` structs/classes on iOS and Android. The Expo Modules API will then handle the conversion and validation from the JavaScript object automatically, providing compile-time and runtime type safety.

**Example (`PlayerConfig`):**

- **Swift:** Create a `struct PlayerConfig: Record` with `@Field` properties.
- **Kotlin:** Create a `class PlayerConfig: Record` with `@Field` properties.
- The `initializeWithConfig` function signature would change from `(nativeId: String, config: [String: Any]?)` to `(nativeId: String, config: PlayerConfig)`.

### 2. Use `Enumerable` for Type-Safe Native Enums

**Problem:** Many properties accept a limited set of string values (e.g., `scalingMode` in `RNPlayerViewManager`, `mode` in `currentTime`). These are passed as raw strings, offering no validation until they are used in native logic.

**Improvement:** Define these as native enums that conform to the `Enumerable` protocol. This allows the Expo bridge to automatically validate incoming string values and convert them to a type-safe native enum, throwing a descriptive error for invalid values.

**Example (`scalingMode`):**

- **Swift:** `enum ScalingMode: String, Enumerable { case fit, stretch, zoom }`
- **Kotlin:** `enum class ScalingMode(val value: String) : Enumerable { FIT("fit"), ... }`
- The `scalingMode` prop on `RNPlayerViewExpo` would then be of type `ScalingMode`.

### 3. Refactor `RNPlayerViewManager` Props to Use Records

**Problem:** The `config` prop for the `RNPlayerViewManager` is a generic dictionary (`[String: Any]?`). This bundles multiple pieces of information (`playerId`, `playerViewConfig`, etc.) into one untyped object, requiring manual extraction and casting inside the view.

**Improvement:** Decompose the `config` prop into multiple, strongly-typed props. Use a `Record` for the complex `playerViewConfig`.

**Example:**

- **Before:** `Prop("config", (view, playerInfo: [String: Any]?))`
- **After:**
  - `Prop("playerId", (view, playerId: String?))`
  - `Prop("playerViewConfig", (view, config: PlayerViewConfigRecord?))`
  - `Prop("customMessageHandlerBridgeId", (view, bridgeId: String?))`

### 4. Replace Custom Event Dispatching with `EventDispatcher`

**Problem:** The `RNPlayerViewExpo` class listens to dozens of native player events and manually forwards them to JS using a custom `eventEmitter.emit()` pattern. This requires significant boilerplate for each event.

**Improvement:** Fully adopt the modern `EventDispatcher` pattern for all view events. In `RNPlayerViewExpo`, declare each event using `let onPlayerReady = EventDispatcher()`. The Expo Modules API handles the wiring. This makes the code more declarative and reduces the chance of errors from stringly-typed event names.

**Example (`onReady` event):**

- **Swift:** In `RNPlayerViewExpo.swift`, declare `let onReady = EventDispatcher()`. In the native player's ready delegate method, call `onReady([:])`.
- **Kotlin:** In `RNPlayerViewExpo.kt`, declare `val onReady by EventDispatcher()`. In the native listener, call `onReady(emptyMap())`.
- The `Events(...)` list in the module definition remains the same.

### 5. Create Custom `Convertible` Types for Complex Data

**Problem:** The project uses many custom helper functions (e.g., `RCTConvert.audioTrackJson`, `toJson(videoQuality:)`) to convert native objects into JSON-like dictionaries before sending them to JS.

**Improvement:** For complex, frequently used return types like `AudioTrack` or `VideoQuality`, make them conform to `ExpoModulesCore.Convertible` in Swift. This protocol allows you to define a `toDictionary()` method that the bridge will automatically call when the type is used as a return value in an `AsyncFunction`. This co-locates conversion logic with the data type itself. (Note: Custom converters in Kotlin are a planned feature for the Expo SDK).

### 6. Simplify Asynchronous Functions with `Promise`

**Problem:** Many asynchronous functions are defined with a simple return type (e.g., `AsyncFunction("getVolume") { ... -> Int? }`). While this works, it doesn't allow for explicit rejection with an error message if something goes wrong (e.g., player not found).

**Improvement:** Refactor key async functions to accept a `Promise` as the final argument. This allows for more robust error handling by calling `promise.reject(...)` with a specific error code and message, which is more informative for the TypeScript caller than receiving `null`.

**Example (`getVolume`):**

- **Swift:** `AsyncFunction("getVolume") { (nativeId: String, promise: Promise) in ... promise.resolve(volume) }`

### 7. Leverage Modern Lifecycle Events (`OnAppEntersBackground`, etc.)

**Problem:** The project may contain imperative logic to observe application lifecycle notifications.

**Improvement:** Systematically replace any manual observers (e.g., `NotificationCenter.default.addObserver`) with the declarative lifecycle methods provided by the Expo Modules API, such as `OnAppEntersForeground`, `OnAppEntersBackground`, and `OnActivityDestroys`. This makes lifecycle management cleaner, safer, and more integrated with Expo.

### 8. Consolidate Native Module Dependencies

**Problem:** Modules frequently need to access other modules (e.g., `PlayerExpoModule` accessing `SourceExpoModule`). This is done via `appContext.moduleRegistry.get(Module.self)`. While functional, this can lead to tight coupling.

**Improvement:** For closely related modules, evaluate if they can be merged into a single, larger module to reduce cross-module dependencies. For example, the `SourceExpoModule` logic could potentially be a part of the `PlayerExpoModule` since a player is rarely used without a source. This is a larger architectural change to be considered for simplification.

### 9. Enhance the Expo Config Plugin with Stricter Validation

**Problem:** The config plugin (`withBitmovinConfig.ts`) provides a good layer of automation. However, it could be more robust.

**Improvement:** Add stricter validation logic within the plugin. For example, before modifying native files, validate that the provided `playerLicenseKey` is a non-empty string. If feature flags depend on each other, enforce those rules within the plugin. This prevents misconfigurations that lead to native build failures.

### 10. Phase Out the Custom `RCTConvert` Helper

**Problem:** The `RCTConvert+BitmovinPlayer.swift` file is a large, custom utility class that mirrors the patterns of the legacy React Native bridge. It's a major source of technical debt.

**Improvement:** Create a long-term plan to deprecate and remove this file. Each of the improvements above (using `Record`, `Enumerable`, `Convertible`) will chip away at the responsibilities of this class. The ultimate goal is to replace all manual `RCTConvert` calls with the automatic, type-safe conversion mechanisms of the Expo Modules API. Each function removed from this file is a step toward a more modern and maintainable codebase.
