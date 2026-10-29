# Playlist Support — Plan & Proposal

> Working document. Not meant to be pushed.
>
> "Native" in this document refers to the Bitmovin Android Player SDK (`player-android`),
> not to the native bridge code of this repository.
>
> Reference repositories (look-up only, **read-only**):
>
> - Android SDK: `/home/lug/workspace/bitmovin/player-android`
> - iOS SDK: `/home/lug/workspace/bitmovin/player-ios`

## 1. Goal

Expose the native playlist feature (multiple sources loaded into one playback session,
gapless transitions, runtime playlist manipulation, playlist events) in the React Native SDK,
with API shape and semantics mirroring the native SDK.

### Scope

- **Android only for now.** iOS native code (`ios/`) is not touched in this iteration.
- The iOS SDK supports the same playlist API as Android, so the native Android SDK is the
  single reference for API design. The public TS API is platform-neutral (no `@platform` tags)
  and is expected to be covered by iOS later without API changes.
- Deferred iOS work is collected in [section 7](#7-deferred-ios-implementation).

### Working rules

- **`player-android` and `player-ios` are read-only (hard requirement).** Look things up only;
  never modify, build in, or run write commands in those repositories.
- Comments only where necessary; self-explanatory code gets no comment.
- Commit at least once per plan step, more often where useful. Commits are imperative, without
  `fix:`-style prefixes (repo convention).
- Commits are later split into multiple PRs: keep each commit scoped to one step/topic so it can
  be cherry-picked; mark commits for separate PRs with a `Split-PR: <topic>` trailer (section 5).
- This plan is a living document: update it as the implementation progresses. Plan commits touch
  **only this file** and are marked `(do not push)` in the subject, so they can be dropped later.

### Design principle: thin bridge

The main deliverable is the **bridge + public API**. The React Native layer only delegates
commands, getters and events between JS and the native SDK:

- Every public method maps 1:1 to a native SDK call; every new event maps 1:1 to a native event.
- No custom logic in TS or Kotlin unless technically required (e.g. resolving `nativeId`s to
  objects across the bridge). No validation, emulation, state tracking or behaviour changes.
- Native behaviour (no-ops, warnings, exceptions such as `EmptyPlaylistException`) is passed
  through unchanged and only documented in TSDoc.
- Names and semantics follow the native SDK.

## 2. Current state

### This repository

- No playlist feature exists on any platform. All `playlist` hits are HLS-manifest wording
  (e.g. `src/tweaksConfig.ts`) or sample URLs.
- `Player.load(sourceConfig)` / `Player.loadSource(source)` load a single source
  (`src/player.ts:155-181`, Android `PlayerModule.kt:308-314`, iOS `PlayerModule.swift:231-236`).
- `Player.source` is the source passed to the last load call; it is never updated afterwards.
- `Player.destroy()` only destroys `this.source`.
- Events reach the React Native JS layer only through props of the RN `PlayerView` component
  Layers involved (Android):

  | Layer                | What it is                                                                          | Role for events                                                                                                |
  | -------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
  | RN JS (app + `src/`) | `<PlayerView player={player} onSourceLoaded={...} />` (`src/components/PlayerView`) | Receives events as props                                                                                       |
  | Bridge view          | `RNPlayerView` (Kotlin `ExpoView`, `android/.../RNPlayerView.kt`)                   | Subscribes to the native **`Player`** (`attachPlayerListeners(player)`, `:312`) and dispatches events to RN JS |
  | Native view          | `com.bitmovin.player.PlayerView` from `player-android`, hosted by `RNPlayerView`    | Renders video; optionally the Bitmovin Web UI                                                                  |
  | Web UI               | Bitmovin Player Web UI in a WebView inside the native `PlayerView` (own JS context) | Not involved in RN event delivery; disabled for `UserInterfaceType.Subtitle` (`UiConfig.Disabled`, `:322-323`) |
  - Listeners are attached to the native `Player`, not to the native `PlayerView` or Web UI, so
    events flow regardless of the UI type.

- Event payloads carry a source _snapshot_ (`EventSource`: duration, isActive,
  isAttachedToPlayer, loadingState, metadata) **without a `nativeId`**, so events cannot be
  mapped back to the JS `Source` instance.
  - iOS has a reverse lookup (`SourceModule.nativeId(where:)`), Android does not.
- Sub-API pattern to follow: `BufferApi` (`src/bufferApi.ts` + `src/modules/BufferModule.ts`,
  Android `BufferModule.kt`, iOS `BufferModule.swift`), resolving the player via `PlayerModule`.

### Native SDK (`player-android`, bundled version 3.170.0)

Paths relative to `player-core/src/main/java/com/bitmovin/player/`.

**Config**

- `PlaylistConfig(sources: List<Source>, options: PlaylistOptions = PlaylistOptions())`
  (`api/playlist/PlaylistConfig.kt`). Empty `sources` throws `EmptyPlaylistException`.
- `PlaylistOptions(preloadAllSources: Boolean = false, replayMode: ReplayMode = ReplayMode.Playlist)`
  (`api/playlist/PlaylistOptions.kt`).
  - `preloadAllSources`: all sources start preloading on load (progressive sources excluded;
    they preload naturally before a transition according to the buffer target).
- `ReplayMode { Playlist, LastSource }` (`api/playlist/ReplayMode.kt`).
- `SeekTarget(offset: Double, startOffsetTimelineReference: TimelineReferencePoint? = null)`
  (`api/playlist/SeekTarget.kt`, since 3.147.0).
- `Player.load(playlistConfig: PlaylistConfig)` (`api/Player.kt:432`): first source becomes
  active immediately; implicit `unload()` of a previous session. Single-source loads are
  internally a one-element playlist.

**Runtime API** — `Player.playlist: PlaylistApi` (`api/playlist/PlaylistApi.kt`)

| Member                                  | Semantics                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `sources: List<Source>`                 | Empty if no active session. Exactly one is active.                                                                             |
| `add(source)` / `add(source, index)`    | No-op without session or invalid index. Throws if source attached to a player.                                                 |
| `remove(source)` / `remove(index)`      | Removing the active source is a no-op + `IncorrectApiUsage` warning.                                                           |
| `seek(source, time)`                    | Source must be in the session. On active live source: warning, no-op (use `timeShift`). `Double.MAX_VALUE` = default position. |
| `seek(source, seekTarget: SeekTarget?)` | `null` = source default position (`SourceOptions`). Non-null requires source `Loaded`. Unsupported while casting.              |

Without an active session, `Player.playlist` is an `EmptyPlaylistApi` that emits a warning on
every call.

`Player.source`: the currently active source, or `null`.

`Source`: `config`, `loadingState`, `isAttachedToPlayer`, `isActive`, `duration`,
`seekableRange`, track/quality getters & setters, `getThumbnail`. No public id.

**Events** (`api/event/Event.kt`)

- `PlayerEvent.PlaylistTransition(from: Source, to: Source)`
- `PlayerEvent.SourceAdded(source: Source, index: Int)` — also emitted for each initial source
  during `load()`, before `PlayerEvent.Active`.
- `PlayerEvent.SourceRemoved(source: Source, index: Int)` — also emitted on `unload()` for each
  source (after `SourceEvent.Unloaded`), then `PlayerEvent.Inactive`.
- `PlayerEvent.PlaybackFinished` — emitted after the last source finished.
- `PlayerEvent.Seek` / `Seeked` carry `SeekPosition(source, time)`; cross-source seeks have
  different sources in `from`/`to`.
- `SourceEvent.Load/Loaded(source)`, `SourceEvent.Unloaded` (no source field).

Forwarding rule: source events are re-emitted on the Player **only if the source is active**
(exception: `SourceEvent.Error` of inactive sources). `Load`/`Loaded` of preloaded inactive
sources are only observable on the `Source` itself.

**Behaviour worth documenting**

- No playlist-wide time; all times (`currentTime`, `duration`, `seek`) refer to the active source.
- No `PlaylistTransition` on load, unload or same-source seek.
- Replay order: `Play` → `PlaylistTransition` → `Playing`.
- Live sources supported (VoD↔live), per-source `liveConfig` applied on transition.
- Ads: `AdvertisingConfig.schedule` applies only to the first source.
- DRM: `DrmConfig.shouldKeepDrmSessionsAlive`, `TweaksConfig.useDrmSessionForClearSources`.
- `RetryPlaybackAction.SkipToNextSource` (3.125.0) skips a failing source.
- Error on an inactive source without retry handling unloads the whole session.

References: `player-test-app/.../scenarios/playlist/PlaylistViewModel.kt`,
system tests in `player-core/src/androidTest/.../tests/player/playlist/`.

## 3. Proposed public API (TypeScript)

```ts
// src/playlist/playlistConfig.ts
export interface PlaylistConfig {
  /** Must not be empty. */
  sources: Source[];
  options?: PlaylistOptions;
}

export interface PlaylistOptions {
  /** @defaultValue `false` */
  preloadAllSources?: boolean;
  /** @defaultValue `ReplayMode.Playlist` */
  replayMode?: ReplayMode;
}

export enum ReplayMode {
  Playlist = 'playlist',
  LastSource = 'lastSource',
}

export interface SeekTarget {
  offset: number;
  startOffsetTimelineReference?: TimelineReferencePoint;
}

// Player
player.loadPlaylist(config: PlaylistConfig): Promise<void>;  // Player.load(PlaylistConfig)
player.playlist: PlaylistApi;                                 // Player.playlist
player.getSource(): Promise<Source | undefined>;              // Player.source (replaces the `player.source` field, breaking)

// src/playlist/playlistApi.ts — thin TS facade; each method delegates 1:1 to a
// PlaylistModule function, which calls the native PlaylistApi
class PlaylistApi {
  getSources(): Promise<Source[]>;                          // sources
  add(source: Source, index?: number): Promise<void>;       // add(source) / add(source, index)
  remove(source: Source): Promise<void>;                    // remove(source)
  removeAt(index: number): Promise<void>;                   // remove(index)
  seek(source: Source, time: number): Promise<void>;        // seek(source, time)
  seekTo(source: Source, target?: SeekTarget): Promise<void>; // seek(source, seekTarget)
}
```

Separate method names instead of TS overloads (`remove`/`removeAt`, `seek`/`seekTo`) keep a
1:1 mapping to native functions without runtime type dispatch in TS.

Native `Source` objects returned by getters are resolved to the JS `Source` instances via
`nativeId` (see Steps 1, 4 and 4b) — the only bridging logic needed.

New `PlayerView` event props:

- `onPlaylistTransition({ from: EventSource, to: EventSource })`
- `onSourceAdded({ source: EventSource, index: number })`
- `onSourceRemoved({ source: EventSource, index: number })`

`EventSource` gets `nativeId?: string` so apps can correlate events with their `Source` objects.

## 4. Implementation steps

Progress: Steps 1–9 implemented. `yarn typecheck:all`, JS lints, ktlint, Android Kotlin compile and
`yarn build` pass. Integration tests: the `playlist` suite passes on a physical Android device
(11/11, Gradle built with JDK 21; JDK 25 breaks the CMake/prefab step with a restricted-method
warning). The example was tested manually on the device by the user.

### Step 1 — Source identity (foundation)

- Android: the source map moved from `SourceModule` into a global `SourceRegistry` object
  (like `PlayerRegistry`), so top-level event converters can resolve a source's `nativeId`
  (`SourceRegistry.getNativeId(source)`, identity comparison). `Source.toJson()` includes
  `nativeId`.
- TS: `EventSource.nativeId?: string`.
- Additive change for all existing source events.

### Step 2 — Loading

- TS: `Player.loadPlaylist` awaits `initialize()` of all sources (same as `loadSource` does for
  one source, so the native sources exist), then calls
  `PlayerModule.loadPlaylist(playerId, sourceNativeIds, options)`. No TS validation; an empty
  list surfaces the native `EmptyPlaylistException` as a rejected promise.
- Android: `AsyncFunction("loadPlaylist")` in `PlayerModule.kt`, resolves sources via
  `SourceModule`, calls `player.load(PlaylistConfig(...))` on `Queues.MAIN`;
  add `toPlaylistOptions` / `toReplayMode` converters.

### Step 3 — `PlaylistModule`

The playlist API lives in its own native module, `PlaylistModule`, mirroring the native
`PlaylistApi` behind `Player.playlist` and following the existing sub-API pattern (`BufferModule`
for `player.buffer`, `MediaControlsModule`, `PlayerAnalyticsModule`). Initially it was part of
`PlayerModule` (functions prefixed `playlist…`); it was extracted to keep `PlayerModule` small,
drop the prefix and allow platform-gating while iOS is missing.

- Android `PlaylistModule.kt`: `AsyncFunction`s that resolve the player via `PlayerRegistry` and
  sources via `SourceRegistry`, then call `player.playlist.*` on `Queues.MAIN`:
  `sources(nativeId)` (returns `nativeId[]`), `add(nativeId, sourceNativeId, index?)`,
  `remove(nativeId, sourceNativeId)`, `removeAt(nativeId, index)`,
  `seek(nativeId, sourceNativeId, time)`, `seekTo(nativeId, sourceNativeId, seekTarget?)`.
- Registered in `expo-module.config.json` for **Android only**.
- TS wrapper `src/modules/PlaylistModule.ts` is platform-gated like `MediaControlsModule.ts`
  (`null` on other platforms); `PlaylistApi` calls it with optional chaining, so on iOS the
  methods are no-ops and `getSources()` returns `[]`. No native iOS stubs.
- `PlaylistApi` and `Player.loadPlaylist` are documented with `@platform Android` until iOS lands.
  `loadPlaylist` stays on `PlayerModule` (native `Player.load(PlaylistConfig)`) and still fails on
  iOS (function missing).
- `PlaylistApi.add` initializes the source first (like `loadPlaylist`) and records it in the
  lookup (Step 4).
- Changing `expo-module.config.json` requires rebuilding the native app (autolinking).

### Step 4 — Resolving sources in TS (minimal bridging only)

- Native getters return `nativeId`s; TS needs a lookup `nativeId → Source` to hand back the JS
  instances. `Player` records every `Source` passed to `loadPlaylist` / `playlist.add` in a
  `Map<nativeId, Source>`. This is a pure lookup, no state tracking of the playlist itself
  (order, active source, etc. always come from native).
- `Player.destroy()` destroys the recorded sources (today it destroys `this.source`); otherwise
  native `SourceModule` registry entries leak.
- `playlist.remove()` does not destroy the source (native allows reusing detached sources).

### Step 4b — `player.source` delegates to native (breaking)

- Remove the `player.source?: Source` field (set on load, never updated). Replace it with
  `getSource(): Promise<Source | undefined>`, which calls native `Player.source` (currently active
  source, or none without an active session) and resolves the returned `nativeId` via the lookup.
  Named per the existing async getter style in `src/player.ts` (`getDuration`, `getVolume`, …).
- Android: the existing `AsyncFunction("source")` (`PlayerModule.kt:316`, returns `toJson()`,
  unused by TS) becomes the delegate and returns the source `nativeId`.
- Update internal usage (`Player.destroy()`) and the example
  (`example/src/screens/BasicDrmPlayback.tsx:158`).
- **iOS impact:** iOS `PlayerModule` has no `source` function, so `getSource()` fails on iOS until
  the iOS side is implemented. This also affects the existing iOS FairPlay flow
  (`renewExpiringLicense` in `BasicDrmPlayback`). Release blocker, see section 7.
- Offline content: playback is unaffected, but there is no JS `Source` for it.
  `loadOfflineContent` passes a `SourceConfig` to native `player.load(...)` (Android
  `PlayerModule.kt:267-275`, iOS `PlayerModule.swift:135-146`), so the SDK creates the `Source`
  internally and it is never registered in `SourceModule`. `getSource()` therefore resolves to
  `undefined` for offline content. Today `player.source` is not set by `loadOfflineContent`
  either (it stays `undefined` or still points to a previously loaded source), so this is no
  regression. Document it; registering natively created sources is out of scope.

### Step 5 — Events (parity TS / Android)

- TS: event types in `src/events.ts`; props in `src/components/PlayerView/events.ts` and
  `nativeEvents.ts`; proxy in `PlayerView/index.tsx`.
- Android: cases in `PlayerEvent.toJson()` (currently fall into the name-only `else`);
  subscriptions in `RNPlayerView.playerEventSubscriptions`; entries in the
  `RNPlayerViewManager` `Events(...)` list.
- Typing fix: `SourceUnloadedEvent.source` optional (Android never sends it; removals emit it).
  Separate commit, `Split-PR: source-unloaded-typing`.
- Event `name`s: Android derives them from the class name (`onSourceAdded`, `onSourceRemoved`,
  `onPlaylistTransition`). The iOS SDK names are `onSourceAddedEvent`, `onSourceRemovedEvent` and
  `onPlaylistTransition` (`player-ios/.../api/event/data/*Event.swift`), so iOS must map the first two
  to the RN names (section 7).

### Step 6 — Document native semantics in TSDoc

Behaviour is not reimplemented or guarded in RN; it is documented (adapted from native KDoc):

- `SourceAdded` fires for every initial source on load, before `Active`.
- Removing the active source: no-op + warning.
- `seek()` on active live source: no-op; use `timeShift`.
- `seekTo` with target requires a loaded source.
- Ads schedule only applies to the first source.
- `Load`/`Loaded` of inactive (preloaded) sources are not forwarded to the player.
- Times are per source; no playlist-wide time.

### Step 7 — Example screen

- `example/src/screens/Playlist.tsx` with 2–3 existing Bitmovin sample VoD streams (+ live if
  available).
- Shows the playlist with the active source; Previous/Next (`seek(source, 0)`), Add, Remove last;
  logs the new events. Loads with `preloadAllSources: true` (a toggle was dropped: `usePlayer`
  returns one player that is destroyed on blur, so reloading with other options would need a new
  player).
- Registered in `example/src/App.tsx` for Android only until iOS lands.
- The initial `SourceAdded` / `PlayerActive` events are emitted synchronously during the native
  `load` and are often not delivered to JS: the native view attaches its listeners in the `config`
  prop on mount, and even loading from `onPlayerViewReady` (#1006, a JS effect) can run before the
  native view is ready to deliver events (verified on device: list stayed empty). The example
  therefore loads in `onPlayerViewReady` (ensures the player is initialized) and reads the
  playlist once `loadPlaylist` resolves; later changes come from the playlist events. Apps need
  the same pattern; the integration tests are unaffected (the harness waits before calling the
  player).

### Step 8 — Integration tests (`integration_test/tests/playlistTest.ts`)

- Register as Android-only for now: add an `androidOnly` platform constant to
  `integration_test/tests/index.js` (does not exist yet); switch to `androidAndIos` once iOS lands.
- Add event names to `integration_test/playertesting/EventType.ts`.
- Cases:
  - Load emits `SourceAdded` × N, then `Active`.
  - Seek to second source emits `PlaylistTransition` with correct `nativeId`s.
  - Playing past the end of a short first source transitions automatically.
  - `add` / `remove` emit `SourceAdded` / `SourceRemoved` with correct index.
  - Removing the active source emits a warning; `getSources()` unchanged.
  - `preloadAllSources`: second source reaches `LoadingState.LOADED` while inactive.
  - `unload` emits `Inactive`.

### Step 9 — Changelog & docs

- `CHANGELOG.md` → `[Unreleased]` → new `### Added` (before `### Changed`):
  `Add playlist support via Player.loadPlaylist, Player.playlist and the PlaylistTransition, SourceAdded and SourceRemoved events`.
- If a release ships before the iOS implementation, prefix the entry with `Android:`; drop the
  prefix once iOS is implemented.
- Breaking changes go under `### Changed`, marked bold like the existing entries:
  - `**Breaking change:** Replace the \`Player.source\` property with \`Player.getSource()\`, which returns the currently active source of the native player`
- Known limitation under `### Known Issues`: events of inactive playlist sources (e.g. `Loaded` of
  a preloaded source) are not emitted, because native only re-emits source events on the player
  for the active source; use `Source.loadingState()`. Per-source events (`source.on(...)`) would be
  a separate feature.
- Bug fix under `### Fixed`: `Android: \`Source.loadingState()\` returning the state name instead of a \`LoadingState\` value`.

## 5. Prerequisite fixes (separate small PRs)

For now these fixes live on the same branch as the playlist work. They will be split into
separate PRs later. Rebases change commit hashes, so each fix commit is identified by a
**git trailer** in its commit message instead (trailers survive rebases, rewording and
cherry-picks):

```
Split-PR: <topic>
```

| Topic                            | Fix                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `android-loading-state`          | Android `LoadingState` mapping                                                 |
| `android-player-active-events`   | Missing Android `Events(...)` entries; Android `Active`/`Inactive` event names |
| `source-unloaded-typing`         | `SourceUnloadedEvent.source` optional                                          |
| `android-playback-speed-changed` | Android `PlaybackSpeedChanged` event (SDK 3.169.0+), same payload as iOS       |

Find them with `git log --grep='^Split-PR: android-loading-state$'` (or
`git log --format='%h %(trailers:key=Split-PR,valueonly) %s'`). Keep each fix in its own
commit(s), without playlist changes, so it can be cherry-picked onto `development` cleanly.
Plan-only commits are marked `(do not push)` in the subject and touch only this file.

- `LoadingState` is bridged inconsistently. Needed by the preload test
  (`source.loadingState() === LoadingState.LOADED`).
  - TS contract: numeric enum `UNLOADED = 0, LOADING = 1, LOADED = 2` (`src/source.ts:36`).
  - Android getter returns `loadingState.name` (`"Loaded"`, `SourceModule.kt:61`) — broken since
    the Expo migration (#661), which replaced the former `ordinal`.
  - Android event payloads send `loadingState.ordinal` (`JsonConverter.kt:305`).
  - iOS sends `loadingState.rawValue` typed `Int` (`ios/SourceModule.swift:58-59`,
    `ios/Event+JSON.swift:10`), i.e. the numeric raw value of the iOS SDK's Int-backed enum.
    The iOS SDK enum is `public enum LoadingState: Int { case unloaded, loading, loaded }`
    (`player-ios/BitmovinPlayerCore/BitmovinPlayerCore/model/playlist/LoadingState.swift:13`),
    i.e. implicit raw values `0, 1, 2`.
  - Fix (Android only, no TS / iOS change): keep the integer contract and add an explicit,
    exhaustive mapping in `JsonConverter.kt` instead of relying on `ordinal` / `name`:

    ```kotlin
    fun LoadingState.toJson(): Int = when (this) {
        LoadingState.Unloaded -> 0
        LoadingState.Loading -> 1
        LoadingState.Loaded -> 2
    }

    fun Int.toLoadingState(): LoadingState = when (this) {
        0 -> LoadingState.Unloaded
        1 -> LoadingState.Loading
        2 -> LoadingState.Loaded
        else -> throw IllegalArgumentException("Unknown LoadingState value: $this")
    }
    ```

    Use `toJson()` in the `loadingState` getter (`SourceModule.kt:61`) and in `Source.toJson()`
    (`JsonConverter.kt:305`). An explicit mapping is stable against reordering/renaming of native
    constants, and a new native value becomes a compile error (exhaustive `when`).
    `toLoadingState()` provides the reverse direction and throws on unknown values (currently no
    caller).

- Android `onBmpPlayerActive`, `onBmpPlayerInactive`, `onBmpPlaybackSpeedChanged` are declared in
  `RNPlayerView` but missing from the `RNPlayerViewManager` `Events(...)` list.
  - Expo drops events not exported from the view (`ViewEvent.kt`: "Event … wasn't exported",
    returns without emitting). The catch-all `onBmpEvent` is dispatched separately, so `onEvent`
    (and the integration tests) already received `Active`/`Inactive`; only the specific
    `onPlayerActive` prop never fired. (`onPlayerInactive` has no TS prop.)
  - Fix: register `onBmpPlayerActive` / `onBmpPlayerInactive` (changelog: `Android:
onPlayerActive not being emitted`).
  - `onBmpPlaybackSpeedChanged` is left as is: Android never subscribes to
    `PlaybackSpeedChanged`, so registering it would change nothing. Not playlist-related.

Status:

- [x] `android-loading-state` — done
- [x] `android-player-active-events` — done (2 commits)
- [x] `source-unloaded-typing` — done
- [x] `android-playback-speed-changed` — done; inserted right after the other prerequisite fixes (branch rebased)

Additional finding (fixed under `android-player-active-events`): Android named the events
`onActive` / `onInactive` (`PlayerEvent.getName()` uses the class name), while iOS and the TS types
use `onPlayerActive` / `onPlayerInactive`.

Gaps in adjacent APIs (source events, `Seeked` positions, `onPlayerInactive`, …) are tracked in
[`playlist-gaps-plan.md`](playlist-gaps-plan.md).

## 6. Open decisions

None currently.

Resolved:

- Playlist API lives in its own `PlaylistModule` (Step 3); `loadPlaylist` and `source` stay on
  `PlayerModule` (they are `Player` APIs natively).
- `player.source` delegates to native `Player.source` (Step 4b); breaking change is OK and noted
  in the changelog. Native: "the currently active `Source` in the playback session or null if
  there is no active playback session" (`api/Player.kt:105-108`, `DefaultPlayer.kt:185`).
  Offline content resolves to `undefined` (no JS `Source` exists; no regression, see Step 4b).
- Prerequisite fixes: same branch for now, split into separate PRs later (section 5).
- `LoadingState` stays an integer; only the Android translation is fixed with an explicit
  mapping (section 5). No TS / iOS change.
- iOS: deferred; Android is the reference and iOS supports the same API (see Scope).
- `SeekTarget` / `seekTo`: in scope (available on Android since 3.147.0, same API on iOS).

## 7. Deferred: iOS implementation

Not part of the current iteration. To do once iOS is picked up, mirroring the Android work:

- Source identity: use `SourceModule.nativeId(where:)` in `Source.toJSON()`
  (`ios/Event+JSON.swift:5`) to add `nativeId`.
- Loading: `loadPlaylist` in `ios/PlayerModule.swift` + `RCTConvert` converters for
  `PlaylistOptions` / `ReplayMode` / `SeekTarget`.
- `PlaylistModule.swift` (Step 3), add it to the `apple` list in `expo-module.config.json`, remove
  the platform gate in `src/modules/PlaylistModule.ts` and the `@platform Android` tags on
  `PlaylistApi` / `Player.loadPlaylist`.
- `source` delegate (Step 4b) in `ios/PlayerModule.swift`.
  `source` must exist before release: `Player.getSource()` replaced the `player.source` field on
  all platforms and is used by the iOS FairPlay `renewExpiringLicense` flow.
- Events: listener callbacks in `RNPlayerView.swift`, `JsonConvertible` conformances (otherwise
  the catch-all event arrives without a name), entries in `RNPlayerViewManager.swift`
  `Events(...)`.
- Event names: map `SourceAddedEvent` / `SourceRemovedEvent` (iOS SDK names `onSourceAddedEvent` /
  `onSourceRemovedEvent`) to `onSourceAdded` / `onSourceRemoved`.
- Example: register the `Playlist` screen on all platforms (remove the TODO in `App.tsx`).
- Integration tests: switch `playlistTest` to `androidAndIos` (remove the TODO in `tests/index.js`).
- Changelog: drop the `Android:` prefix if one was used.
