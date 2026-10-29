# Player and Source Events — Plan

> Working document. Not meant to be pushed. Written to be executed autonomously by a sub-agent.
>
> "Native" refers to the Bitmovin Android Player SDK (`player-android`), not to this repository's
> bridge code. Reference repositories (look-up only, **read-only**):
>
> - Android SDK: `/home/lug/workspace/bitmovin/player-android`
> - iOS SDK: `/home/lug/workspace/bitmovin/player-ios`

## 1. Goal

Mirror the native event model:

- The native `Player` is an `EventEmitter` (`on` / `off` / `next`): player events and the source
  events of the **active** source reach player listeners, independent of any view.
- The native `Source` is an `EventEmitter<SourceEvent>`: all source events of that source,
  including while it is **inactive** (e.g. `Loaded` of a preloaded playlist source).
- The native `PlayerView` additionally emits view events (PiP, fullscreen, …).

Today React Native only delivers player/source events as `PlayerView` props while an
`RNPlayerView` is mounted (`RNPlayerView.attachPlayerListeners`). Consequences:

- no events without a mounted `PlayerView` (audio-only, after Activity destroy in background);
- the initial `SourceAdded` / `PlayerActive` of a load are often lost (view not ready yet);
- events of inactive sources are never delivered (Known Issue in `CHANGELOG.md`).

Target: add `Player.on` / `off` and `Source.on` / `off`. The `PlayerView`
props stay unchanged, so the UI keeps getting the events it needs; the player and sources receive
events independently.

## 2. Scope

- **Android only.** Do not touch `ios/`. The public API is platform-gated in TS
  (`@platform Android`, no-op subscription on other platforms), like the playlist API.
- Two phases, executed in order. Phase 2 starts only after phase 1 is verified (section 6):
  - **Phase 1:** `Player.on` / `off` and `Source.on` / `off`. `PlayerView` props and `RNPlayerView`
    event delivery stay as they are.
  - **Phase 2:** the `PlayerView` event props are delivered through `player.on` on Android instead of
    native view events; `RNPlayerView` keeps only view events. Not a breaking change (section 5.3).
- iOS is done separately later (no macOS available); all iOS steps are written down in section 11.
- Thin bridge: subscriptions and payloads map 1:1 to native events; reuse the existing
  `toJson()` converters, event names and `NonFiniteSanitizer`. No emulation of native behaviour.

## 3. Working rules (hard requirements)

- **`player-android` and `player-ios` are read-only.** You are allowed and expected to read them
  (Read / Grep / `cat` / `sed -n` / `grep` with absolute paths, e.g.
  `/home/lug/workspace/bitmovin/player-android/player-core/src/main/java/com/bitmovin/player/api/event/Event.kt`)
  to verify native APIs and semantics. Never modify, create, delete, build in, or run write
  commands (git, gradle, editors) in those directories.
- **Branch:** create `feature/player-source-events` from the current `feature/playlist-support`
  HEAD and work only there. Never rewrite commits that existed before you started.
- **Never push.** No `git push` in any form, no remote-changing commands (`git remote`, `gh pr`,
  `gh repo`, …). `git push` is additionally denied in `.claude/settings.local.json`.
- **Commits:** at least one per step (section 6), imperative subject, no `fix:`-style prefixes,
  end every message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add the trailer
  `Split-PR: player-source-events` to every non-plan commit.
- **Plan commits:** this file is a living document. Update it after each step (progress, decisions,
  deviations) in separate commits that touch **only `docs/events-plan.md`**, subject suffixed with
  `(do not push)`. Commit with an explicit pathspec (`git commit -- docs/events-plan.md`) and check
  afterwards that the pre-commit hook (prettier) did not leave the file modified; if it did, amend
  that plan commit with the formatted file.
- **Comments:** only where necessary; self-explanatory code gets no comment. Match the surrounding
  code style (see `CLAUDE.md`).
- **Gradle CPU limit:** every Gradle call must run as
  `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 taskset -c 0-3 ./gradlew --max-workers=4 <tasks>`
  (4 of 8 cores). Run `./gradlew --stop` once
  before the first Gradle call. For `git commit`s that touch Kotlin, run `taskset -c 0-3 git commit …`
  (the pre-commit hook runs Gradle).
- **JDK 17 for every Gradle run** (ktlint, compile, `assembleDebug`, and `git commit`s whose hook
  runs Gradle): `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`. The default JDK 25 breaks the
  CMake/prefab step. Set it per command only; do not change any config. Verified: ktlint and
  `:bitmovin-player-react-native:compileDebugKotlin` pass with JDK 17.
- **Pause / resume / cancel (control protocol):** the user controls the run with the local script
  `.agent-control/agent-control.sh` (not in VCS; excluded via `.git/info/exclude`; never commit or
  modify it).
  - Checkpoints: run `.agent-control/agent-control.sh wait` before each step, before every Gradle /
    build / device command and after every commit.
    - Exit `0`: continue. Exit `2`: still paused → run `wait` again (repeat until `0` or `3`).
    - Exit `3`: cancelled → stop immediately: do not commit further, leave the working tree as it is
      (no reset / stash / checkout), and send the final report (section 10) including what was in
      progress.
  - `pause` freezes running Gradle processes (SIGSTOP) and `resume` unfreezes them, so always run
    Gradle and other long commands with `run_in_background` and wait for the completion
    notification; never rely on a foreground timeout. If a background Gradle command fails while the
    state is `cancel`, treat it as cancelled, not as a build error.
  - Gradle processes are identified by `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`; this is one
    more reason to always set it (see JDK rule).
- **No questions back:** work autonomously. When something is ambiguous, choose the option that best
  fits the thin-bridge principle and native parity, record it in section 8 (Decision log), and
  continue. Stop and report only if blocked (e.g. build cannot pass, device unavailable).

## 4. Verified facts (starting point)

- Expo modules (`node_modules/expo-modules-core/android/.../ObjectDefinitionBuilder.kt`) support
  `Events(...)`, `OnStartObserving(eventName)` / `OnStopObserving(eventName)`, and
  `Module.sendEvent(name, Map<String, Any?>)` / `sendEvent(name, Bundle)`.
- Existing module-event pattern: `PlayerModule.kt` sends `onShouldLoadAdItem` with `nativeId`;
  `src/player.ts` subscribes via `PlayerModule.addListener('onShouldLoadAdItem', …)` and filters by
  `nativeId` (`ensureShouldLoadAdItemListener`).
- Event list and serialization: `RNPlayerView.kt` `playerEventSubscriptions`
  (`EventSubscription<T> { onEvent(dispatcher, it.toJson()) }`), `EventSubscription.kt`,
  `converter/JsonConverter.kt` (`PlayerEvent.toJson()`, `SourceEvent.toJson()`),
  `extensions/Events.kt` (`getName()`: `onPlay`, `onPlayerActive`, `onSourceLoaded`,
  `onAudioAdded`, …), `util/NonFiniteSanitizer.kt`.
- TS event types: `src/events.ts`; `PlayerView` props: `src/components/PlayerView/events.ts`.
- Registries: `PlayerRegistry` (global), `SourceRegistry` (global, `getSource`, `getNativeId`).
- Native semantics (`player-core/src/main/java/com/bitmovin/player/`):
  - `api/event/EventEmitter.kt`: `on`, `next`, `off`.
  - `event/SourceEventEmitter.kt:39-43`: source events are re-emitted on the player only while the
    source is active (plus `SourceEvent.Error` of inactive sources, `core/DefaultSourceRegistry.kt`).
  - `api/source/Source.kt:39`: `Source : EventEmitter<SourceEvent>`.
- Integration tests: Cavy, `integration_test/tests`, helpers in `integration_test/playertesting`;
  run on device as described in section 7.

## 5. Design

### 5.1 Public API (TS)

```ts
// src/events.ts (or a new src/eventMap.ts, exported from src/index.ts)
export interface PlayerEventMap {          // all events the player emits
  playerActive: PlayerActiveEvent;
  play: PlayEvent;
  playlistTransition: PlaylistTransitionEvent;
  sourceLoaded: SourceLoadedEvent;         // source events of the active source
  // … one entry per event in RNPlayerView.playerEventSubscriptions (+ any player event the
  //   view does not cover yet only if it already has a TS type)
}
export interface SourceEventMap {          // all events a source emits
  sourceLoad: SourceLoadEvent;
  sourceLoaded: SourceLoadedEvent;
  sourceUnloaded: SourceUnloadedEvent;
  // … every SourceEvent with a toJson() case / TS type
}

export interface EventSubscription { remove(): void }

// Player
on<K extends keyof PlayerEventMap>(event: K, listener: (e: PlayerEventMap[K]) => void): EventSubscription;
off<K extends keyof PlayerEventMap>(event: K, listener: (e: PlayerEventMap[K]) => void): void;

// Source: same two methods with SourceEventMap
```

- Keys = the existing event `name` without the `on` prefix, first letter lower-cased
  (`onPlaylistTransition` → `playlistTransition`). The payload is exactly what the `PlayerView`
  prop receives today (same `toJson()`), so types are shared.
- `@platform Android` on all new methods. On other platforms they return a no-op subscription.
- `Player.destroy()` / `Source.destroy()` remove all their listeners.
- No `once`: native has no such method (its one-shot `next` is not bridged in this iteration).

### 5.1.1 Types and `NativePlayerViewEvents`

- `NativePlayerViewEvents` (`src/components/PlayerView/nativeEvents.ts`, internal, `onBmp*` view props
  with `{ nativeEvent }` wrappers) and the public `PlayerViewEvents` (`events.ts`) stay unchanged:
  the view delivery path is not touched.
- No `NativePlayerEvents` export: the module payload `{ nativeId, event }` is typed internally on the
  module wrappers (`PlayerModuleEvents` in `src/modules/PlayerModule.ts`, `SourceModuleEvents` in
  `src/modules/SourceModule.ts`), like `onShouldLoadAdItem`.
- New public types: `PlayerEventMap`, `SourceEventMap`, `EventSubscription`, reusing the event types
  from `src/events.ts`. Each map entry gets a short TSDoc line.
- Deriving `PlayerViewEvents` / `NativePlayerViewEvents` from `PlayerEventMap` via mapped types is
  **not** done: it would drop the per-prop TSDoc that TypeDoc renders, and the view props also
  contain view-only events (PiP, fullscreen). Follow-up together with moving the props onto
  `Player.on` (section 9).

### 5.2 Delivery (native → JS)

- One module event per emitter type: `PlayerModule` declares `Events(..., "onPlayerEvent")`,
  `SourceModule` declares `Events("onSourceEvent")`. Payload:
  `{ nativeId, event: <sanitized toJson()> }`.
- **Lazy native subscriptions** (avoid bridge traffic for unobserved high-frequency events like
  `TimeChanged`): new `AsyncFunction`s on the respective module, on `Queues.MAIN`:
  - `PlayerModule`: `subscribe(nativeId, eventName)`, `unsubscribe(nativeId, eventName)`
  - `SourceModule`: `subscribe(nativeId, eventName)`, `unsubscribe(nativeId, eventName)`
  - Native keeps per instance a map `eventName → EventListener`; `subscribe` attaches one native
    listener (`player.on(eventClass, …)` / `source.on(eventClass, …)`) if none exists,
    `unsubscribe` detaches it. Clean up on player/source destroy and module `OnDestroy`.
- Apply `normalizeNonFinite` (`src/utils/normalizeNonFinite.ts`) to every dispatched event, like the
  `PlayerView` proxy does (`src/hooks/useProxy.ts`), so `player.on` and the props deliver identical
  objects.
- JS side (`Player` / `Source`): keep `Map<eventName, Set<listener>>`; first listener for a name →
  native `subscribe`, last removed → native `unsubscribe`. One module listener per instance,
  filtered by `nativeId`, dispatching to the listeners of `event.name`.
- **Event name → class mapping:** extract a shared Kotlin mapping (e.g. `PlayerEventTypes.kt`)
  from the classes used in `RNPlayerView.playerEventSubscriptions`, keyed by the JS key from 5.1, so
  the view and the modules use one list. The view keeps its dispatchers; only the class list is
  shared. Source events: same mapping restricted to `SourceEvent` subclasses.
- **Timing:** `subscribe` resolves after the native listener is attached, so `await
player.on(...)`-style usage is not required, but listeners registered before `load` /
  `loadPlaylist` must catch the initial `SourceAdded` / `PlayerActive`. Ensure ordering: JS awaits
  pending `subscribe` calls of the same instance before issuing `load*` (keep a promise of pending
  subscriptions on `Player`; `loadSource` / `loadPlaylist` await it). Record the final approach in
  the decision log.

### 5.3 Phase 2: `PlayerView` props on top of `player.on`

- TS `PlayerView` (Android): for every player/source event prop the app passes (`onPlay`,
  `onPlaylistTransition`, …), subscribe with `player.on(<key>, …)` and forward to the prop.
  - Subscribe per prop _name_ (when a prop becomes defined/undefined) and call the latest function
    through a ref, so re-renders with new function identities do not resubscribe.
  - Unsubscribe on unmount and when the `player` changes.
  - Catch-all `onEvent`: if set, subscribe to all `PlayerEventMap` keys and forward every event; it
    also keeps receiving the view events (below). Integration tests rely on `onEvent`. It is a
    public prop, so it stays; it costs about the same as today's view path (where every event is
    always forwarded). Document it in TSDoc as intended for debugging/testing and recommend specific
    props or `player.on` otherwise, because it subscribes to high-frequency events like
    `TimeChanged`. Without `onEvent`, only events with a set prop cross the bridge.
- Android `RNPlayerView` / `RNPlayerViewManager`: remove the player/source event dispatchers,
  `playerEventSubscriptions`, `attachPlayerListeners` / `detachPlayerListeners` and their `Events(...)`
  entries. Keep the view events (picture-in-picture, fullscreen, custom message handler) and keep
  `onBmpEvent` for those view events only.
- Platform branch in the TS `PlayerView` until iOS is done: Android uses `player.on`, iOS keeps the
  `onBmp*` props. Mark it with a `TODO` referencing the iOS step in section 11.
- `NativePlayerViewEvents` shrinks to the view events on Android usage; the type itself stays shared
  with iOS until iOS is migrated.
- **Not a breaking change:** prop names, types and payloads stay the same; `NativePlayerViewEvents`
  is internal. Behavioural differences (changelog `### Changed`, Android):
  - early events of a load (`onSourceAdded`, `onPlayerActive`) are no longer lost when the app
    subscribes (mounts the `PlayerView`) before loading;
  - two `PlayerView`s mounted for the same player both receive the events (previously only the view
    owning the player);
  - the order of view events (PiP, fullscreen) relative to player events can differ slightly.

## 6. Steps

### Phase 1 — `Player.on` / `Source.on`

1. **Shared event mapping (Android).** Extract the event name → class mapping; `RNPlayerView`
   uses it without behaviour change. Compile + ktlint.
2. **Player events (Android + TS).** `onPlayerEvent`, `subscribe` / `unsubscribe` on `PlayerModule`;
   `PlayerEventMap`, `Player.on/off`, cleanup in `destroy`, ordering with `load*`. Export from
   `src/index.ts`.
3. **Source events (Android + TS).** `onSourceEvent`, `subscribe` / `unsubscribe` on `SourceModule`
   (listeners on the native `Source`, also while inactive); `SourceEventMap`, `Source.on/off`,
   cleanup in `destroy`.
4. **Docs.** TSDoc on all new API (`@platform Android`, semantics: player gets source events only
   of the active source, source gets all of its own). README/docs only if an existing section
   covers events.
5. **Example.** Update `example/src/screens/Playlist.tsx`: use `player.on` for the playlist list
   (register before `loadPlaylist`, drop the refresh-after-load workaround) and `source.on` to show
   when a preloaded source is loaded. Keep it small.
6. **Integration tests.** New suite `events` (`integration_test/tests/eventsTest.ts`,
   Android-only via the `androidOnly` constant in `tests/index.js`):
   - `player.on` receives `PlayerActive` / `SourceAdded` registered before load;
   - `off` / `remove()` stops delivery;
   - `source.on('sourceLoaded')` fires for a preloaded inactive playlist source;
   - listeners are removed on `destroy`.
7. **Changelog.** `[Unreleased]` → `### Added`: `Android: Player.on/off and Source.on/off
to receive player and source events independently of a PlayerView`. Remove the Known Issue about
   events of inactive playlist sources (now covered by `Source.on`).
8. **Verification.** `yarn typecheck:all`, `yarn lint`, `yarn example lint`,
   `yarn integration-test lint`, ktlint (limited Gradle), Kotlin compile, `yarn build`, then the
   device run (section 7) for the suites `events` and `playlist`.

### Phase 2 — `PlayerView` props via `player.on` (start only after phase 1 passed step 8)

9. **TS `PlayerView`.** Implement section 5.3 (Android branch), including `onEvent`.
10. **Android cleanup.** Remove the player/source event delivery from `RNPlayerView` /
    `RNPlayerViewManager` as described in 5.3; keep the shared event mapping (step 1) for the modules.
11. **Example.** Simplify the playlist example if the props now cover the initial events (keep
    `source.on` for the preload state).
12. **Integration tests.** No new suite needed; the existing suites use `onEvent` and must keep
    passing. Add one test to `events` that a `PlayerView` prop receives `onPlayerActive` when the
    view is mounted before loading.
13. **Changelog.** `### Changed`: `Android: PlayerView event props are delivered through the
player's event subscriptions, so events emitted right after loading (e.g. onPlayerActive) are no
longer lost`. Not marked as breaking.
14. **Verification.** As step 8, but run **all Android suites** on the device (set
    `EXPO_PUBLIC_CAVY_ONLY_TAGS` to all Android tags from `yarn integration-test list-tags`, or omit it
    to run everything; iOS-only suites are skipped automatically).

### Progress

- Step 1 done: `PlayerEventTypes` (Kotlin) maps RN event keys to native classes; `RNPlayerView`
  builds its subscriptions from it. Kotlin compile passes.
- Step 2 done: `EventRelay` (Kotlin, per-instance `eventName → EventListener`, main thread),
  `PlayerModule.subscribe` / `unsubscribe` / `onPlayerEvent`; TS `PlayerEventMap`, `SourceEventMap`,
  `EventSubscription` (`src/eventMap.ts`), shared JS helper `EventListeners`
  (`src/utils/eventListeners.ts`), `Player.on` / `off`.
- Step 3 done: `SourceModule.subscribe` / `unsubscribe` / `onSourceEvent` (listeners on the native
  `Source`, independent of its active state), `Source.on` / `off`; `SourceModule.destroy` now runs on
  the main queue so the relay is only touched from the main thread.
- Step 4 done: TSDoc for the new API was written with steps 2/3 (`@platform Android`, active-source
  semantics on `Player.on`, inactive-source semantics on `Source.on`, map entries documented). README
  has no events section, so only the `PlayerViewEvents` doc now points to `Player.on` / `Source.on`.
- Step 5 done: `example/src/screens/Playlist.tsx` registers `player.on` for `playerActive`,
  `playlistTransition`, `sourceAdded`, `sourceRemoved` in an effect (before `loadPlaylist` in
  `onPlayerViewReady`), drops the refresh-after-load workaround and the corresponding props, and marks
  sources as `(loaded)` via `source.on('sourceLoaded' / 'sourceUnloaded')`.
- Step 6 done: `integration_test/tests/eventsTest.ts`, suite `events` (`androidOnly`). Four tests:
  listeners registered before `initialize`/load get `SourceAdded` then `PlayerActive`; `remove()` and
  `off` stop delivery while another listener keeps receiving; destroy delivers `destroy` and nothing
  afterwards (player and source listeners); `source.on('sourceLoaded')` fires for the preloaded inactive
  second source while `player.on('sourceLoaded')` does not see it.
- Step 7 done: `[Unreleased]` → `### Added` entry; Known Issue about inactive playlist source events
  removed (the `### Known Issues` section was left empty, so it was removed too).
- Step 8 done (phase 1 verified): `yarn typecheck:all`, `yarn lint`, `yarn example lint`,
  `yarn integration-test lint`, `ktlint.gradle ktlintCheck` (limited Gradle), standalone `ktlint` on
  the new Kotlin files (0 violations), `:bitmovin-player-react-native:compileDebugKotlin --rerun`,
  `yarn build`: all pass. Device run (2A041JEGR01437, `events,playlist`): first run 13/15, the two
  `TimeChanged` tests called `play()` before the asynchronous load reached native; fixed by waiting
  for `ready` first. Second run: **15 examples, 0 failures** (events 4/4, playlist 11/11). The
  `destroy` event reaches `player.on` before the JS listeners are removed (ordering holds on device).
- Step 9 done: `src/components/PlayerView/usePlayerEventProps.ts` subscribes per set prop name (or all
  names with `onEvent`), calls the latest props through a ref, resubscribes only when the set of names
  or the player changes. `index.tsx` passes `undefined` for the player/source `onBmp*` props on Android
  (`usesPlayerEvents`, `TODO` for iOS). `onEvent` TSDoc documents its debugging/testing intent.
- Step 10 done: `RNPlayerView` keeps only the fullscreen / PiP dispatchers and
  `attachPlayerViewListeners`; player/source dispatchers, `playerEventSubscriptions`,
  `attach/detachPlayerListeners` and `onEvent` removed; `RNPlayerViewManager` `Events(...)` reduced to
  the nine view events; unused `EventSubscription.kt` deleted. `PlayerEventTypes` stays for the modules.
- Step 11: no code change (see decision log).
- Step 12 done: `PlayerTestWorld.onPlayerActive` / `playerActivePropEvents`, set as `onPlayerActive` on
  the test app's `PlayerView`; new `events` test "deliver PlayerActive when the view is mounted before
  loading" (expects exactly one event after `loadSourceConfig`).
- Step 13 done: `### Changed` entry (Android, not breaking), also naming the two-views and ordering
  differences from section 5.3.
- Step 14 done (phase 2 verified): `yarn typecheck:all`, `yarn lint`, `yarn example lint`,
  `yarn integration-test lint`, `yarn build`, `ktlint.gradle ktlintCheck`, standalone `ktlint` on the
  new/changed-clean Kotlin files (0 violations), `compileDebugKotlin --rerun`, `assembleDebug`: all
  pass. Device runs (all Android suites; `EXPO_PUBLIC_CAVY_ONLY_TAGS` set to every Android tag, split
  into two runs after an SDK-internal crash):
  - first full run stopped after 17 advertising tests: the app crashed with
    `IllegalStateException: The source is not attached to any player` inside `player-core` track
    selection (`MediaSourceStateAggregator`); not reproduced in the three later runs that include the
    same test;
  - all suites except `advertising`: 50 examples, 2 failures (`error`: DRM license `onPlayerError`;
    `metadata-id3`: Android ID3 frame shape); `events` 5/5 and `playlist` 11/11 pass;
  - `advertising,error,metadata-id3`: 30 examples, 8 failures (6 ad playback / ad break tests, plus the
    two above).
  - Baselines for `advertising,error,metadata-id3` on the phase 1 head (`50fb21a9`) and on the
    pre-feature head (`8481be7b`, built from the same tree with those sources checked out temporarily
    and restored afterwards) show **the same 8 failures** (30 examples each), so they are pre-existing
    and not caused by this work.

## 7. Running integration tests on the device

The repo script only supports emulators; run the same steps manually:

1. Check that port 8081 is free (`lsof -nP -iTCP:8081 -sTCP:LISTEN`). If it is used by anything
   else, **do not kill it** — skip the device run and report it.
2. Build: `cd integration_test/android && JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 taskset -c 0-3 ./gradlew --max-workers=4 assembleDebug --console=plain`
   (rebuild needed because native code changed).
3. Install: `adb -s 2A041JEGR01437 install -r app/build/outputs/apk/debug/app-debug.apk`.
4. Metro (background): `cd integration_test && EXPO_PUBLIC_CAVY_ONLY_TAGS=events,playlist npx expo start --port 8081 --localhost --clear`;
   wait until `curl -s localhost:8081/status` returns `packager-status:running`.
5. Cavy (background): `cd integration_test && ANDROID_SERIAL=2A041JEGR01437 npx cavy run-android --skipbuild --no-screenshots --keep-alive-timeout=300`.
6. `adb -s 2A041JEGR01437 reverse tcp:8081 tcp:8081`, `… reverse tcp:8082 tcp:8082`, then launch:
   `adb -s 2A041JEGR01437 shell monkey -p com.bitmovin.player.reactnative.integrationtests -c android.intent.category.LAUNCHER 1`.
7. Read the Cavy output; afterwards stop the Metro you started (only that process) and run
   `adb -s 2A041JEGR01437 reverse --remove tcp:8082`.

## 8. Decision log

(Fill in while executing: decision, reason, alternatives considered.)

- **`PlaybackSpeedChanged` in the maps (revised after the run).** Originally left out because the
  Android bridge had no converter. The converter and the view subscription were then added on
  `feature/playlist-support` (commit "Emit PlaybackSpeedChanged on Android", `Split-PR:
android-playback-speed-changed`), and this branch was rebased onto it. During the rebase
  `playbackSpeedChanged` was added to `PlayerEventTypes.player`, `PlayerEventMap` and the
  `PlayerView` prop name list, so on Android it is delivered via `player.on` like every other
  event.
- **Generic `Event.toJson()`** in `JsonConverter.kt` dispatches to the existing `PlayerEvent` /
  `SourceEvent` converters, so the shared class map can be serialized without per-event lambdas.
- **ktlint verification.** `yarn lint:android` (`ktlint.gradle`) only covers Kotlin scripts, and the
  library's own `:bitmovin-player-react-native:ktlintCheck` fails on existing files (its
  `ktlintFormat` rewrites unrelated files, which were reverted). Changed files are checked with the
  standalone `ktlint` CLI (0.50, repo `.editorconfig`); only pre-existing violations remain.
- **Subscribe before the native instance exists.** `Player.on` before `initialize()` only records the
  listener in JS; `initialize()` attaches all recorded event names after creating the native player and
  resolves only once they are attached. `loadSource` / `loadPlaylist` additionally await pending
  `subscribe` calls. Native `subscribe` for an unknown `nativeId` is a no-op. A load issued while
  `initialize()` is still in flight is not covered (pre-existing: such a load can already miss the
  native player). Alternative (native pending subscriptions per `nativeId`) rejected: more native state,
  and sources are created off the main thread.
- **`destroy` event.** Native `destroy` calls `player.destroy()` before detaching the listeners, and JS
  removes its listeners only after `PlayerModule.destroy` settled, so `player.on('destroy')` receives
  the event (needed for phase 2, where the `onDestroy` prop uses `player.on`).
- **Dispatch key** is derived from `event.name` (`onPlayerActive` → `playerActive`), matching the
  native mapping keys; no extra field in the payload.
- **Listener errors** are not caught: a throwing listener surfaces like any other JS error.
- `PlayerEventMap` extends `SourceEventMap`, as the player re-emits the active source's events.
- **Exhaustive event name list in TS.** `usePlayerEventProps` needs the `PlayerEventMap` keys at
  runtime; they are listed in an object checked with `satisfies Record<keyof PlayerEventMap, true>`,
  so a missing or extra key fails the typecheck.
- **Metadata payloads.** As before, `onMetadata` / `onMetadataParsed` get the event enriched via
  `addPlatformToMetadataEvent`, while `onEvent` receives it unchanged.
- **`onBmpEvent` removed on Android instead of kept for view events.** The plan assumed `onEvent`
  receives view events, but neither platform forwards fullscreen / PiP events to `onBmpEvent` today
  (Android called the specific dispatcher only; iOS sends only `PlayerListener.onEvent`). Keeping
  parity, `onEvent` stays player events only, and the Android native view no longer declares
  `onBmpEvent`; the TS view passes it only on iOS. The `onEvent` TSDoc says "player" accordingly.
- **Step 11 keeps `player.on` in the playlist example.** The props would now also receive the initial
  events, but switching back would not make the screen simpler (same four subscriptions, no
  workaround either way) and the example is the only place demonstrating `Player.on`. `source.on` for
  the preload state stays.
- **Between steps 9 and 10** the Android native view still forwards player events to `onBmpEvent`, so
  `onEvent` would see them twice; step 10 removes that. The intermediate commit is not meant to ship
  alone.
- **Events tests use players without a `PlayerView`** (`new Player()` in the test, not
  `startPlayerTest`), which directly covers the main goal (events independent of a view).

## 9. Out of scope / follow-ups

- iOS implementation: see section 11 (done separately).
- View events on a JS `PlayerView` emitter.
- Deriving the `PlayerView` prop types from `PlayerEventMap` (section 5.1.1), possible once iOS is
  migrated (phase 2 on iOS).
- A one-shot listener mirroring native `next`.

## 10. Final report (for the sub-agent)

When done, report: commits created (hash + subject), verification results (each command, pass/fail,
test counts), decisions from section 8, anything skipped and why.

## 11. iOS steps (to be done separately on macOS)

Not executed by the sub-agent. Reference: iOS SDK at `/home/lug/workspace/bitmovin/player-ios`
(read-only). The iOS playlist bridge from `docs/playlist-plan.md` (section 7) is a prerequisite.

Phase 1 (iOS):

1. **Player events:** in `ios/PlayerModule.swift` add `"onPlayerEvent"` to `Events(...)` and
   `AsyncFunction`s `subscribe(nativeId, eventName)` / `unsubscribe(nativeId, eventName)` on the main
   queue. Subscribe with the SDK's Combine API `player.events.on(<EventType>.self).sink { … }`
   (`BitmovinPlayerCore/api/event/PlayerEventsApi.swift`) and keep the `AnyCancellable` per
   `(nativeId, eventName)`; cancel on `unsubscribe` and when the player is destroyed.
2. **Name mapping:** add one Swift table from the RN key (`PlayerEventMap` / `SourceEventMap`) to the
   SDK event type. Use RN keys, not SDK names: e.g. SDK `SourceAddedEvent.name` is
   `onSourceAddedEvent`, RN key is `sourceAdded`.
3. **Payload:** send `{ nativeId, event }` with the existing `JsonConvertible` conversion
   (`ios/Event+JSON.swift`), including `nativeId` on sources (playlist plan section 7) and the same
   non-finite handling as the view path.
4. **Source events:** in `ios/SourceModule.swift` add `"onSourceEvent"` and `subscribe` /
   `unsubscribe` using `source.events.on(<SourceEventType>.self)`
   (`BitmovinPlayerCore/api/event/SourceEventsApi.swift`); cancel on source destroy.
5. **TS:** remove the platform gate of `Player.on/off` / `Source.on/off` and the `@platform Android`
   tags; switch the `events` integration suite to `androidAndIos`.
6. **Changelog:** drop the `Android:` prefix of the phase 1 entry.

Phase 2 (iOS):

7. **TS `PlayerView`:** remove the platform branch (`TODO` from 5.3); all platforms use `player.on`.
8. **`ios/RNPlayerView.swift`:** remove the player/source `EventDispatcher`s and the `PlayerListener`
   conformance used for event forwarding (`player.add(listener: self)`); keep the view events
   (`playerView?.add(listener: self)`: fullscreen, picture-in-picture, …) and `onBmpEvent` for them.
9. **`ios/RNPlayerViewManager.swift`:** remove the player/source entries from `Events(...)`.
10. **Types:** `NativePlayerViewEvents` can now be reduced to view events; optionally derive the
    prop types from `PlayerEventMap` (section 5.1.1).
11. **Changelog:** drop the `Android:` prefix of the phase 2 entry.
12. **Verification:** `yarn lint:ios`, all integration suites on the iOS simulator.
