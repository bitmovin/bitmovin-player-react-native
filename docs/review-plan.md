# Review of `feature/player-source-events` vs `development` — Fix Plan

> Working document. Not meant to be pushed. Result of a full review (Android bridge, TS API / event
> pipeline, playlist parity and backwards compatibility, changelog). Nothing has been changed yet.
> Same working rules as `docs/playlist-plan.md` / `docs/events-plan.md` (thin bridge, Android only,
> `player-android` / `player-ios` read-only, Gradle with JDK 17 and `taskset -c 0-3 … --max-workers=4`,
> plan commits touch only this file and are marked `(do not push)`, `Split-PR: <topic>` trailers,
> never push).
>
> Findings are tagged **verified** (traced in code, incl. native SDK source) or **suspected**.
> IDs are referenced from the steps in section 5.

## 1. Summary

- Playlist API (`loadPlaylist`, `PlaylistApi`, `SeekTarget`, `PlaylistOptions`, `ReplayMode`) and the
  bridged events are on par with `player-android`; overloads, payloads and defaults match.
- Main problems:
  - **iOS regressions** of existing behaviour: `Player.getSource()` and `Player.loadPlaylist()`
    reject with `TypeError` (functions missing on the iOS `PlayerModule`); the old `player.source`
    worked on iOS. The iOS FairPlay example is broken.
  - **`Player.destroy()` now destroys every source ever passed to the player** (also sources replaced
    by later loads or reused in another player) — undocumented breaking change.
  - Silent data loss in bridging: `loadPlaylist` drops unknown sources, `getSources()` drops
    unregistered sources → indices no longer match native.
  - Event pipeline: metadata events via `Player.on` miss the `platform` field; one throwing listener
    stops dispatch for others; teardown in module `OnDestroy` is not thread-safe / leaks listeners.
  - Changelog misses one breaking change and marks two breaking changes as fixes.
  - Several TSDoc statements contradict native behaviour or miss `@platform Android`.

## 2. Breaking changes vs `development`

| #   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                    | Platforms                              | Can be made compatible?      | Proposal                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| B1  | `Player.source` property removed, replaced by async `Player.getSource()` (returns the _active_ source instead of the last loaded one)                                                                                                                                                                                                                                                                                                     | all (and `getSource()` rejects on iOS) | yes                          | keep a `@deprecated` `source` getter returning the last loaded source (old semantics) until the next major (F1) |
| B2  | `Player.destroy()` destroys every source passed to `load` / `loadSource` / `loadPlaylist` / `playlist.add`, not only the last loaded one                                                                                                                                                                                                                                                                                                  | all                                    | partly                       | destroy only the sources of the current session (decision D2)                                                   |
| B3  | `SourceUnloadedEvent.source` is optional → TS compile error for `event.source.x`                                                                                                                                                                                                                                                                                                                                                          | all (type)                             | not honestly                 | keep, mark bold in changelog                                                                                    |
| B4  | Android event names `onActive` / `onInactive` → `onPlayerActive` / `onPlayerInactive` (affects `onEvent` consumers comparing `event.name`)                                                                                                                                                                                                                                                                                                | Android                                | not recommended (dual names) | keep, mark bold in changelog                                                                                    |
| B5  | Android `Source.loadingState()` returns a `LoadingState` number instead of the state name                                                                                                                                                                                                                                                                                                                                                 | Android                                | n/a (was broken vs typings)  | keep as fix; mention in changelog that apps relying on the string must update                                   |
| B6  | Android `PlayerView` event props / `onEvent` delivered via `Player.on`: not tied to native view attachment, two views of one player both receive events, order vs fullscreen/PiP may differ, `onEvent` additionally receives `playbackSpeedChanged`, `playerInactive`, `sourceAdded`, `sourceRemoved`, `playlistTransition`; native `onBmp*` player events gone from the Android view (only relevant for direct `NativePlayerView` users) | Android                                | no                           | keep; extend the existing changelog entry                                                                       |
| B7  | Android native `PlayerModule.source` returns a `nativeId` instead of source JSON (internal module API)                                                                                                                                                                                                                                                                                                                                    | Android                                | n/a                          | internal, no entry needed                                                                                       |

Non-breaking but notable: `SeekedEvent` alias → interface with optional `from` / `to`;
`EventSource.nativeId?`; `PlaybackSpeedChangedEvent` no longer iOS-only.

## 3. Findings

### 3.1 Critical / high

- **C1 — `Player.getSource()` rejects on iOS** (verified). `ios/PlayerModule.swift` has no `source`
  function; `src/player.ts:203-210` has no `@platform`; `example/src/screens/BasicDrmPlayback.tsx:158`
  (iOS FairPlay) now fails with an unhandled rejection. Regression of a working API.
- **C2 — `Player.loadPlaylist()` on iOS** (verified) initializes all sources and fills `knownSources`,
  then rejects with `TypeError` (`src/player.ts:224-237`). Inconsistent with `PlaylistApi` (silent
  no-op on iOS). `PlaylistApi.add` also initializes the source on iOS before its no-op (`playlistApi.ts`).
- **C3 — `Player.destroy()` destroys all `knownSources`** (verified, `src/player.ts:126-127`). A source
  replaced by a later load and reused in another player gets destroyed (unregistered natively, JS
  listeners removed) while playing elsewhere. Reusing a destroyed `Source` silently fails
  (`isInitialized` stays `true`).
- **C4 — `loadPlaylist` silently drops unknown sources** (verified, `PlayerModule.kt:344` `mapNotNull`).
  A destroyed / failed source is skipped → playlist indices differ from what the app passed; all
  missing → misleading `EmptyPlaylistException`.
- **C5 — destroyed-but-attached sources and unknown sources are dropped from lists** (verified):
  `PlaylistModule.sources` (`mapNotNull`) + `PlaylistApi.getSources` (`flatMap`) and event payloads
  without `nativeId`. Index-based calls (`removeAt`, the example's Prev/Next) then act on the wrong
  native entry. Also `[]` during offline playback although a session is active.
- **C6 — metadata events via `Player.on` / `Source.on` lack `platform`** (verified):
  `addPlatformToMetadataEvent` is only applied in `usePlayerEventProps.ts:124`, not in
  `eventListeners.ts` `dispatch`; types promise the field.

### 3.2 Medium

- **M1 — throwing listener breaks dispatch** (verified for same instance, suspected across instances):
  `eventListeners.ts:131` `forEach` stops at the first throw; the exception propagates into Expo's
  emitter loop. In `usePlayerEventProps` a throwing prop skips `onEvent`.
- **M2 — native teardown in `OnDestroy`** (suspected threading, verified leak):
  `PlayerModule.OnDestroy` / `SourceModule.OnDestroy` call `eventRelay.clear()` off the main queue on
  a plain map; `SourceModule` never calls `off` on source emitters (lambdas keep the dead module);
  `PlayerModule` destroys players with relay listeners still attached → `sendEvent` during teardown.
- **M3 — `loadOfflineContent` does not await pending subscriptions** (verified, `src/player.ts:181`),
  unlike `loadSource` / `loadPlaylist`; listeners/props can miss the first events of offline playback.
- **M4 — load order is not "last call wins"** (verified by reasoning): `loadSource` is
  fire-and-forget, `loadPlaylist` awaited; each waits for its own `source.initialize()` → an earlier
  load with slower init (DRM, several sources) can override a later one. Pre-existing for `loadSource`,
  more likely now.
- **M5 — concurrent `initialize()`** (verified): `Player` / `Source` set `isInitialized` only after
  awaits → double native init attempts, a second `Drm` instance leaks, `attachNative` runs twice.
- **M6 — `knownSources` stale on failed `add` / `loadPlaylist`** (verified): entries are added before
  the native call; native throws `IllegalStateException` ("source is already attached to a player");
  for `loadPlaylist` the previous session is already stopped when it rejects.
- **M7 — player destroyed by the SDK** (verified): e.g. license errors destroy the native player; the
  registry/relay keep entries; later `subscribe` emits spurious "on called on destroyed player"
  warnings.
- **M8 — native subscriptions are per `nativeId`, JS listeners per wrapper** (verified): two JS
  `Player` wrappers with the same `nativeId` — one unsubscribing stops the other.

### 3.3 Low / readability

- **L1** `EventListeners.settled()` (`eventListeners.ts:99-120`, awaited in `loadSource` /
  `loadPlaylist`) is likely redundant: `subscribe` and `load*` all run on `Queues.MAIN` (FIFO) and
  `on()` enqueues synchronously. It also swallows subscribe errors. Either remove or comment which
  ordering it protects (e.g. listeners registered before `initialize`).
- **L2** `usePlayerEventProps`: any prop add/remove changes the joined string → all subscriptions are
  torn down and re-added (short gap where events can be lost); `propsRef` updated in `useEffect`
  (events between render and commit use old props). Prefer one subscription per event name and
  `useLayoutEffect` for the ref.
- **L3** `PlayerView/index.tsx:214` wires `onBmpPlaybackSpeedChanged={proxy(…)}` instead of
  `playerEventProxy` (harmless on Android today, reads like a double path).
- **L4** Unknown event names are silently ignored natively (`EventRelay.kt:20`) — log in debug.
- **L5** Inconsistent lookups: `loadSource` uses `getModule<SourceModule>()?.getSourceOrNull` with a
  misleading "CRITICAL … called by PlayerModule.loadSource" comment (`SourceModule.kt:126-128`), while
  playlist code uses `SourceRegistry`; players mix `PlayerRegistry` and `getModule<PlayerModule>()`.
- **L6** `Source.toJson()` reads the global `SourceRegistry` (O(n) identity scan per event payload) —
  acceptable, add a short comment (or `IdentityHashMap` reverse map).
- **L7** Public type name `EventSubscription` shadows expo-modules-core's `EventSubscription`
  (`player.ts` already aliases it). Consider `PlayerEventSubscription` — still unreleased, so free to
  rename. Registering the same function twice is deduplicated (one `remove()` removes it) — document.
- **L8** Integration tests: `playlistTest.ts:184` ignores the `waitUntil(LOADED)` result before
  `seekTo`; `eventsTest.ts` "removes all listeners when destroyed" does not use `withPlayer` (leaks on
  failure) and relies on fixed delays for negative assertions; no iOS assertions for gated APIs.
- **L9** Example `Playlist.tsx`: unhandled `loadPlaylist` rejection; no refresh on `playerInactive`;
  index-based Prev/Next/Remove (see C5).
- **Kept on purpose:** `Int.toLoadingState()` (requested earlier, currently unused);
  `PlaybackSpeedChanged` float values passed through unchanged (thin bridge).

### 3.4 Documentation (TSDoc)

- Missing `@platform Android`: `SourceAddedEvent`, `SourceRemovedEvent`, `PlaylistTransitionEvent`
  (`src/events.ts`), props `onSourceAdded` / `onSourceRemoved` / `onPlaylistTransition`
  (`PlayerView/events.ts`, `nativeEvents.ts`), `EventSource.nativeId`, `Player.playlist` property,
  `Player.getSource` (unless F1 makes it work on iOS).
- `SourceUnloadedEvent.source`: replace prose "Not provided on Android" with `@platform iOS, tvOS`.
- `Player.on`, `Player.loadPlaylist`, `PlayerEventMap`: the player emits source events of the active
  source **except `sourceError`, which native also relays for inactive sources** (without identifying
  the source → use `Source.on`).
- `PlaylistApi.add`: rejects if the source is attached to another player (native
  `IllegalStateException`).
- `PlaylistApi.remove` / `removeAt` / `seek`: "has no effect" → "has no effect and emits a
  `PlayerWarning`" (no session, active source, live seek).
- `PlaylistApi.removeAt` / `add` bounds: native ignores `index < 0 || index > lastIndex` for removal →
  "≥ the number of sources" (current doc copied a wrong native KDoc).
- `PlaylistApi.seek`: verify the "active live source → use `timeShift`" statement against native
  (`DefaultPlaylistApi.kt`) or drop it.
- `SourceRemovedEvent.index`: is `0` for every source while a session is unloaded (native
  `dispose()` iterates over a shrinking list).
- `PlaylistApi.getSources`: also empty / incomplete for sources not created through `Source`
  (offline content).
- `onPlayerInactive`: "emitted when the active playback session has ended (e.g. `Player.unload`)"
  instead of "when a source is unloaded".
- `PlayerView/events.ts:79`: "events of `PlayerView` are simply a proxy over `NativePlayerView`" is no
  longer true on Android.

### 3.5 Changelog (`[Unreleased]`)

- Missing: B2 (destroy semantics) — bold breaking entry.
- Misplaced: `SourceUnloadedEvent.source` is under Fixed with `Android:` → move to Changed, bold
  breaking, no prefix (type change on all platforms).
- `onActive` / `onInactive` rename (Fixed) → add "Apps comparing `Event.name` in `onEvent` must use the
  new names", mark bold breaking.
- `Player.source` entry: adjust to the final F1 decision (deprecated getter → not breaking any more;
  or note iOS limitation).
- `PlayerView` Changed entry: add that `onEvent` now also receives the new event types (B6).
- Optional: playlist entry listing `PlaylistApi`, `PlaylistConfig`, `PlaylistOptions`, `ReplayMode`,
  `SeekTarget`; `onPlaybackSpeedChanged` "(previously iOS only)".

## 4. Decisions needed before implementing

- **D1 — `player.source` compatibility:** keep a `@deprecated` synchronous getter returning the last
  loaded source (old semantics) next to `getSource()`? _Recommended: yes_ (B1 becomes non-breaking).
- **D2 — `Player.destroy()` semantics:** (a) destroy only sources of the current session (needs the
  native session list before destroying, or JS bookkeeping updated by load / add / remove);
  (b) restore old behaviour (only the last loaded source); (c) keep "all" and document as breaking.
  _Recommended: (a)._
- **D3 — gated APIs on iOS:** uniform behaviour for `loadPlaylist`, `PlaylistApi`, `getSource`, `on`:
  explicit rejection ("not supported on iOS yet") or silent no-op? _Recommended: reject for
  `loadPlaylist` / `getSource` (they return values / start playback), keep no-op for `on` / `off` and
  `PlaylistApi` mutations — or reject everywhere for clarity._ With D1, iOS `getSource()` could also
  resolve to the last loaded source instead of rejecting.
- **D4 — serialize loads (M4):** per-player promise chain so the last load call wins? _Recommended:
  yes, small and removes a real race._
- **D5 — rename `EventSubscription` → `PlayerEventSubscription` (L7)?** _Recommended: yes (unreleased)._
- **D6 — destroyed-but-attached sources (C5):** reject `Source.destroy()` while attached, or keep and
  document? _Recommended: document + keep unknown sources visible (see F4)._

## 5. Proposed steps (after decisions)

Each step = own commit(s) with the matching `Split-PR` topic; where a fix belongs to an earlier
commit of the same topic, use `git commit --fixup` + non-interactive autosquash to keep history clean.

1. **F1 — `player.source` / `getSource()` on iOS (C1, B1, D1, D3):** deprecated `source` getter;
   iOS-safe `getSource()`; fix the FairPlay example; TSDoc `@platform` accordingly.
2. **F2 — iOS gating (C2, D3):** guard `loadPlaylist` and `PlaylistApi.add` before any side effect.
3. **F3 — destroy semantics (C3, M6, D2):** implement the chosen option; add `knownSources` entries only
   after native success.
4. **F4 — no silent drops (C4, C5):** Android `loadPlaylist` rejects with a coded exception naming the
   missing source; `sources` keeps unknown entries visible (e.g. `null` placeholder) so indices match;
   decide TS representation (`Source | undefined` entries vs reject) together with D6.
5. **F5 — event dispatch (C6, M1):** apply `addPlatformToMetadataEvent` in `EventListeners.dispatch`
   (remove from the hook); try/catch per listener with `console.error`; `onEvent` still called.
6. **F6 — native teardown (M2, M7, L4):** in `OnDestroy` detach relay listeners (`off`) for all players
   / sources on the main thread before destroying; skip `subscribe` for destroyed players; debug log
   for unknown event names.
7. **F7 — load ordering (M3, M4, M5, L1):** memoize `initialize()` promises (Player / Source); serialize
   `load*` / `loadOfflineContent`; make `loadOfflineContent` honour pending subscriptions; then remove
   or document `settled()`.
8. **F8 — `usePlayerEventProps` (L2, L3):** one subscription per event name, `useLayoutEffect` for the
   props ref, `playerEventProxy` for `onBmpPlaybackSpeedChanged`.
9. **F9 — readability (L5, L6, L7):** consistent registry lookups, fix the misleading comment, comment
   on the global lookup in `Source.toJson`, optional rename (D5).
10. **F10 — docs (3.4).**
11. **F11 — tests and example (L8, L9):** assert `waitUntil`; `withPlayer` + event-based negative
    checks; tests for metadata via `Player.on`, `Source.off`, `on` after `initialize`, destroy with a
    reused source, `loadSource` vs `loadPlaylist` race; minimal iOS gating assertions (suite
    `androidAndIos` for the gating part); example: handle rejection, refresh on `playerInactive`.
12. **F12 — changelog (3.5).**
13. **Verification:** `yarn typecheck:all`, all JS lints, `yarn build`, Kotlin compile + standalone
    ktlint on changed files (JDK 17, limited Gradle), device run of `events`, `playlist`, `playback`
    (and all Android suites once), `yarn lint:ios` is not available on Linux (not needed, iOS stays untouched).

## 6. Checked and correct (no action)

- Event names: every `PlayerEventTypes` key equals the JS key derived from `getName()`; compile-time
  check keeps the TS lists complete.
- `EventRelay` listener identity / `off`, duplicate-subscribe guard, lazy subscribe/unsubscribe,
  `destroy` event still delivered before JS removes listeners, listeners registered before
  `initialize` are attached.
- Threading of `subscribe` / `unsubscribe` / `PlaylistModule.*` / `loadPlaylist` / `source` /
  `SourceModule.destroy` (`Queues.MAIN`); `SourceRegistry` is a `ConcurrentHashMap`.
- `PlaylistModule` overloads, `PlaylistOptions` / `ReplayMode` / `SeekTarget` mapping and defaults,
  payload fields of `SourceAdded` / `SourceRemoved` / `PlaylistTransition` / `Seeked`, `LoadingState`
  mapping, `NonFiniteSanitizer` on all module events.
- Removing player listeners from `RNPlayerView` is safe (PiP handler has its own listeners; background
  playback / media session do not depend on them); `PlaylistModule` registered Android-only and the TS
  wrapper gated (CLAUDE.md pattern); exports complete; `@defaultValue` usage correct.

## 7. Decisions (user feedback on the review)

Work one by one, one commit per change; stop and ask (one question at a time) when feedback is
needed.

- **Breaking changes:**
  - B1 `Player.source` removal: stays as is (no deprecated getter, D1).
  - B2 destroy semantics: add a changelog entry; verify that it matches `player-android`.
  - B3 `SourceUnloadedEvent.source` optional: explain why it is optional.
  - B4 `onActive` / `onInactive` rename: add a changelog entry.
  - B5 `loadingState` mapping: already done early on (separate PR), nothing to do.
  - B6 `PlayerView` delivery entry: show the current changelog before extending it.
- **Critical / high:**
  - C1, C2 (iOS): ignored for now; iOS is done before merging, iOS may be broken meanwhile (D3).
  - C3: fix — destroy only the sources bound to the player being destroyed (D2: current player and
    the sources loaded in that player only).
  - C4, C5: show the problem, then fix.
  - C6: explain in more detail.
- **Medium:**
  - M1: fix (catch-all for listener errors).
  - M2: detach source listeners, similar to the native player.
  - M3: ignore.
  - M4: show the race (D4: serialize loads — yes).
  - M5: explain how it can happen.
  - M6: fix (bogus state).
  - M7: show the warnings (possibly a known issue).
  - M8: show it (should never happen).
- **Low / readability:**
  - Redundant code (e.g. `settled()`): remove if safely redundant.
  - `usePlayerEventProps`: must not re-subscribe everything; clarify whether unsubscribing in between
    is needed.
  - Lookup patterns (L5): explain; probably ignore.
  - Rename `EventSubscription` → `BitmovinEventSubscription` (D5; it is used for player and source).
  - Leftover `proxy` for `onBmpPlaybackSpeedChanged`: remove if only needed for iOS (iOS may break).
  - Fix broken docs where necessary (section 3.4).
- **D6** (destroyed-but-attached sources): behave like the native player; give an example first.

### Progress

(updated per step)

- **C3 + B2** done (`Destroy only the sources of the current session with the player`): native returns the
  released source IDs of the player's session; JS destroys only those. Changelog entry (breaking).
- **B3** done (`Provide the unloaded source in Android SourceUnloaded events`): `UnloadedSourceResolver`
  correlates the `Unloaded` event instance; `SourceUnloadedEvent.source` is required again.
- **B4** done: the `onActive`/`onInactive` rename is a bold breaking entry under "Changed".
- **B6** done: the `PlayerView` entry lists the events `onEvent` now also receives.
- **C4** done (`Allow initializing a destroyed source again`): `destroy()` resets `isInitialized`,
  `initialize()` resets `isDestroyed`, Android source initialization runs on the main queue (as on iOS).
  A destroyed source is re-created natively from its config (new native instance, listeners must be
  re-registered).
  - **Ignored (not in the changelog):** a source released _while_ a load is in flight (between
    `source.initialize()` and the native lookup) is still dropped silently by `mapNotNull` in
    `loadPlaylist` (and ignored by `playlist.add`/`loadSource`). Only possible when the same `Source`
    object is reused by another player that is destroyed meanwhile, when the app destroys it during the
    load, or when two `Source`s share an app-provided `nativeId`.
- **C5 + D6** done (`Release sources once they are removed from a player`): `Source.destroy()` is
  `@internal`. Android releases a source (relay listeners + registry entry) once a player emits
  `SourceRemoved` for it (posted, skipped if attached again, e.g. reloaded) and on `Player.destroy()`.
  `Source.initialize()` always re-creates a released native source; JS listeners are kept and re-attached.
  `PlayerModule.destroy` no longer returns the released IDs. Supersedes the JS part of C3 and the C4
  changelog entry.
  - **iOS (later):** release sources on `SourceRemoved`/destroy as on Android, otherwise they leak now that
    `Source.destroy()` is internal.
- **Source tracking merged** (`Merge the source tracking of players into PlayerSourceTracker`): one class for
  unloaded-source resolution and removed-source release. `Player.destroy()` relies on native emitting
  `SourceRemoved` for every source. Race fixed: a source initialized again before its posted release is kept
  (`PlayerSourceTracker.keep`), and the same native instance is reused.
- **Memory** (`Keep only the sources of the current session in the player`, `Forget sources removed from the
playlist in the player`): `knownSources` keeps only the current session (pruned after a successful load,
  cleared on unload); native `remove`/`removeAt` return the removed `nativeId`, which JS forgets.
  - **Accepted (not in the changelog):** a source initialized but never loaded stays registered; DRM configs
    (`DrmModule.drmConfigs` + JS `Drm`) are never destroyed now that `Source.destroy()` is internal.
- **C6 ignored** (not a regression vs `development`): `player.on('metadata' | 'metadataParsed')` and
  `source.on('metadataParsed')` deliver ID3/DATERANGE entries without the JS-added `platform` field, although
  the types promise it (gap in the new event API). `PlayerView` `onMetadata`/`onMetadataParsed` still get it
  via `usePlayerEventProps`; `onEvent` never had it. Possible fix later: apply `addPlatformToMetadataEvent`
  centrally in `EventListeners.dispatch`.
- **M1** done (`Keep delivering events when a listener throws`): `callListener` catches and logs listener
  errors in `EventListeners.dispatch` and for `PlayerView` props.
- **M2** done (`Detach event listeners before tearing down the modules`): `OnDestroy` detaches the relay
  and source-tracker listeners from the native players/sources before destroying them.
  - **Split-PR caveat:** tagged `player-source-events`, but also touches `PlayerSourceTracker`
    (`playlist-support`); split when creating the PRs.
- **M4 + D4 ignored** (not a regression vs `development`, API misuse): two load calls without awaiting the
  first (or a load followed by `unload()`) reach native in the order their preparation finishes, so a load
  with a slower `initialize()` (e.g. DRM) can override a later one. `loadSource` on `development` behaves the
  same. A single `loadPlaylist` is not affected (all sources are initialized before the one native load).
  No serialization added.
- **M5** (concurrent `initialize()`):
  - **Source** done (`Initialize DRM configs on the main queue`): a concurrent second `initialize()` skipped
    the DRM step and could create the native source before its DRM config was registered (DRM init on the
    modules queue, source init on main since C4), i.e. without DRM. Both now run on the main queue (FIFO).
    Test in `loadingTest.ts` (failed before, passes now). The double native source init is harmless.
  - **Player ignored** (not a regression vs `development`): concurrent `Player.initialize()` (React
    StrictMode, app + `PlayerView`, two views per player) creates a second `Network` / decoder config that
    leaks (native config + JS listeners); playback works. Possible fix later: share the in-flight promise.
  - **Unrelated:** `errorTest` "emits an error with httpResponse when a DRM license request fails" fails
    because `httpstat.us/403` no longer responds.
- **M6** done (`Forget sources that a player did not add or load`): sources are still remembered before the
  native call (event listeners resolve them via `getSources`), and forgotten again unless known before when
  native ignores an `add` (no active session, invalid index; native `add` now returns whether it added) or a
  load fails (e.g. a source that cannot be initialized). Impact was memory only (lookups go via native IDs).
  - **Ignored (API misuse):** a source attached to another player (`add` / `loadSource` / `loadPlaylist`
    throw; a load has already stopped the old session, whose entries stay until the next load / unload /
    destroy). Apps should create a separate `Source` per player.
- **M7 ignored** (not a regression vs `development`, matches native): on `LicenseKeyNotFound` /
  `LicenseAuthenticationFailed` native destroys the player itself; later JS calls (`player.on` for a new event
  name, `PlayerView` props, API calls, `player.destroy()`) emit "The player was destroyed …" warnings, as
  native does for a native app. Registry/relay entries stay until `player.destroy()`, as on `development`
  (which even emitted ~50 `on` warnings when a `PlayerView` attached a destroyed player).
- **M8** done (`Count native event subscriptions per instance`): `EventRelay` counts subscriptions per
  `nativeId` and event name, so one of several JS instances with the same app-provided `nativeId`
  unsubscribing no longer detaches the shared native listener. Test in `eventsTest.ts` (failed before).
  - **Accepted:** after a source release, only the `Source` wrapper that calls `initialize()` re-subscribes;
    another wrapper with the same `nativeId` stays detached until its own `initialize()`.
- **L1** done (`Do not wait for native subscription changes before loading`): `settled()` and the pending
  tracking are removed; subscribe/unsubscribe/load all run on the main queue in call order (same guarantee
  as the DRM fix). Subscribe errors are no longer swallowed (unhandled rejection, like other `void` calls).
- **L2** done (`Only resubscribe the changed PlayerView event props`): subscriptions are kept per event name
  and diffed; unsubscribing in between is not needed. All are removed only on unmount / player change.
  `propsRef` is still updated in `useEffect` (events between render and commit use the previous props; kept).
- **L5** done (`Look up the source of loadSource in the SourceRegistry`): `loadSource` reads `SourceRegistry`
  like the rest of the new code; `SourceModule.getSourceOrNull` (and its stale "CRITICAL" comment) removed.
  The older `getModule<PlayerModule>()?.getPlayerOrNull` call sites are unchanged.
  - Flaky once: "emits PlaylistTransition when seeking to another source" timed out waiting for `onReady`
    (1 of 4 runs; passed on the re-runs).
- **L7 / D5** done (`Rename EventSubscription to BitmovinEventSubscription`): public type renamed (unreleased);
  the `expo-modules-core` aliases in `player.ts` / `eventListeners.ts` are gone again.
- **L3** done (`Route the PlaybackSpeedChanged prop like the other player events`): `playerEventProxy`
  instead of `proxy` (undefined on Android, unchanged on iOS, which still emits the view event).
- **Docs (3.4)** done, verified against native, split by PR: `Describe PlayerInactive as the end of the
playback session` (android-player-active-events), `Document how PlayerView and Player.on deliver events`
  (player-source-events), `Fix the docs of the playlist API` (playlist-support). `@platform Android` on the
  playlist events/props, `Player.playlist`, `Player.getSource`, `EventSource.nativeId` (iOS has neither);
  `sourceError` of inactive sources; `PlayerWarning` / rejection cases of `PlaylistApi`; `removeAt` bounds
  (`>=`); `SourceRemovedEvent.index` is 0 while unloading; offline sources missing from `getSources`.
  `SourceUnloadedEvent.source` item obsolete (B3).
- **M3 ignored** (decision): `loadOfflineContent` no longer needs to await subscriptions anyway (L1: FIFO on
  the main queue).
- **L9 ignored** (decision): the example never triggers a `loadPlaylist` / `add` rejection (fresh sources,
  static configs); native emits a `SourceRemoved` per source before `PlayerInactive`, so the list is already
  refreshed when the session ends; stale indexes only matter in the short window before a refresh.
- **L6** done (`Resolve the nativeId of a source in constant time`): `SourceRegistry` keeps a reverse
  `IdentityHashMap`; methods are `@Synchronized` instead of a `ConcurrentHashMap`. Performance only.
