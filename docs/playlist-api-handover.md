# Native playlist API handover

## Branch and tracking

- Branch: `PRN-293/native-playlist-support`, pushed to `origin`.
- Base at creation: `e80b4fa7` on `origin/development`. The previous tunneled-playback work is already in that base, not an extra feature commit on this branch.
- Implementation: `329079a4` (public API/native bridges) and `b96fa651` (example/tests).
- Tracking story: [PRN-293](https://bitmovin.atlassian.net/browse/PRN-293).
- Existing epic: [PRN-1 — Playlist Support for React Native SDK](https://bitmovin.atlassian.net/browse/PRN-1). Whether to parent PRN-293 under it or close the new story remains undecided. No Jira relationship or implementation-status updates were made during this handover.
- Status: implementation snapshot for continuation, **not a release sign-off**. Open decisions and verification gaps are listed below.

## Goal and scope

Expose the native Bitmovin playlist capabilities through a thin React Native wrapper, preserving native behavior rather than implementing a JS playlist engine. See the [original plan](playlist-api-plan.md) for the full acceptance criteria.

Included:

- Load an ordered collection of existing `Source` objects and replace the current playback session.
- Configure native preloading and replay behavior.
- Append/insert, remove by source/index, seek between sources, and query membership in native order.
- Emit source-added, source-removed, and transition events without requiring a mounted `PlayerView`.
- Preserve operational JS source references and update `player.source` on known-source transitions.
- Keep the existing single-source loading API; add a sample, public documentation, changelog entry, and regression coverage.

Platforms: Android/Android TV and iOS/tvOS, subject to their native differences. The branch base pins Android Player `3.165.0+jason` and Apple Player `3.128.0`; SDK upgrades are not part of the playlist diff.

Out of scope: a custom playback/preloading/replay policy, URL-based source deduplication, new cross-platform casting guarantees, and a broad source-lifecycle redesign.

## Public surface

```ts
await player.loadPlaylist(sources, options);
// Equivalent entry point: player.playlist.load(sources, options).
await player.playlist.add(source, index);
await player.playlist.remove(source);
await player.playlist.removeAt(index);
await player.playlist.seek(source, 0);
const orderedSources = await player.playlist.getSources();
const subscription = player.playlist.addEventListener(
  'playlistTransition',
  handler
);
subscription.remove();
```

`PlaylistConfig` also accepts `{ sources, options }`. Public types are re-exported from `src/index.ts`.

- Defaults: `preloadAllSources: false`, `replayMode: ReplayMode.PLAYLIST`; `ReplayMode.LAST_SOURCE` is also exposed.
- Numeric playlist seeking is available on both native bridges.
- Structured `{ offset, startOffsetTimelineReference }` targets are Android-only. The Apple JS path warns and returns without seeking for structured targets.
- Android forwards `null`/`undefined` time to native default-position seeking. The Apple bridge currently maps missing time to `0`; do not assume identical default-position semantics.

## Architecture

```text
Player.loadPlaylist / Player.playlist
  -> PlaylistApi (JS handles, initialization, event decoding)
  -> typed Expo PlayerModule bridge (player/source native IDs)
  -> Android Player.playlist / Apple Player.playlist

Native player events
  -> module-level emitters + player nativeId
  -> internal active-source observer, then public event listeners
```

### JavaScript

- `src/player.ts` owns `PlaylistApi`, supplies initialization and active-source callbacks, and disposes its internal observer on player destruction. Existing `loadSource` calls also register their source reference with the playlist wrapper.
- `Player.initialize()` shares an in-flight promise between concurrent callers. It reuses the network wrapper, initializes native resources once, and clears the promise after completion/failure so a failed initialization can be retried.
- `src/playlist.ts` initializes each distinct input `Source` object once per playlist load, registers references by `nativeId`, and delegates operations to native. It preserves the original input order and IDs, including repetitions; native decides whether repeated membership is valid.
- The source-reference map belongs to each `PlaylistApi` wrapper. `getSources()` retrieves ordered native IDs and resolves only IDs known to that map; it does not create/adopt missing handles.

### Native bridges and identity

| Area          | Implementation                                                                                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo contract | `src/modules/PlayerModule.ts`: asynchronous playlist functions and typed module events.                                                                                                                                                                                                        |
| Android       | `android/src/main/java/com/bitmovin/player/reactnative/PlayerModule.kt`: native playlist operations, option/seek conversion, and per-player native event subscriptions with teardown. `SourceModule.kt` reverse-maps native source object identity to registered IDs.                          |
| Apple         | `ios/PlayerModule.swift`: playlist operations on the main queue and a `PlaylistEventEmitter`. Player identity is resolved through `PlayerRegistry`; source identity is resolved through registered source-config object identity. `RCTConvert+BitmovinPlayer.swift` converts playlist options. |
| Serialization | Native source snapshots, indices, IDs, event names, and timestamps are retained. Android extends `converter/JsonConverter.kt`; Apple falls back to the native event's name/timestamp when JSON conversion is unavailable.                                                                      |

### Events

The only application subscription API is `player.playlist.addEventListener(...)`, for `sourceAdded`, `sourceRemoved`, and `playlistTransition`.

1. Native emitters attach the owning player's `nativeId`; each JS wrapper filters on it. Delivery is independent of view-manager events.
2. A lazy internal transition subscription is installed before application listeners, either when sources are registered or a public listener is added. It updates `player.source` once for a known destination. Construction itself does not subscribe, avoiding render-time side effects from `usePlayer`.
3. Public event enrichment is pure: a listener resolving an event cannot overwrite a source change made by an earlier listener.
4. `normalizeNonFinite` decodes native sentinels before original `Source` references are attached. This preserves `Infinity`/`NaN` values without cloning operational handles into plain objects.
5. `source`/`from`/`to` are event-time snapshots. `sourceReference`/`fromSourceReference`/`toSourceReference` are optional original JS handles; they are not interchangeable with snapshots.

## Decisions made

- **Thin native wrapper:** native remains authoritative for playback, ordering, advancement, replay, and documented no-ops/errors. Do not add speculative JS policies.
- **Compatible entry points:** retain single-source methods; add `loadPlaylist` and the `playlist` namespace rather than overloading existing single-source `load`.
- **One event API:** duplicate callback-style playlist APIs were removed. Do not reintroduce parallel callback properties.
- **Identity by native ID:** reuse original JS objects, not config/URL matching or newly constructed source wrappers. Equal-URL sources may still be distinct playlist entries.
- **Platform-specific seeking:** expose Android structured targets without pretending Apple supports them. Integration coverage uses numeric seeking.
- **Initialization and event ordering:** share player initialization, decode before attaching handles, and update active source once before application callbacks.
- **No constructor subscriptions:** the internal observer is lazy and explicitly disposed.
- **Small simplifications:** initialize repeated input objects once; clean event-waiter subscriptions/timers in `finally`, including action failure; refresh sample membership from native events and report operation failures.
- **Sample continuity:** reuse existing Bitmovin sample streams and retain the existing duplicate labels. `origin/feature/playlist-api` at `4d241478` was compared for UI ideas, not adopted wholesale; its incomplete native bridges were not copied.
- **Defer ownership changes:** no new global handle registry or automatic destruction of every playlist source was introduced without agreement on ownership.

## Pending decisions and known risks

| Topic                                  | Current behavior / risk                                                                                                                                                                                                                                                         | Decision or follow-up needed                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership and retention         | `Player.destroy()` destroys its active source, not every source ever registered. The playlist map retains historical references. Example/test-created inactive or removed sources are not comprehensively cleaned up.                                                           | Agree whether playlist sources remain caller-owned or gain explicit player ownership, and how sharing works. Then add cleanup for example/tests and define cache pruning. Do not blindly destroy sources that another player/caller may use. |
| Aliases and unknown IDs                | Two JS `Player` wrappers for the same native player have separate reference maps. Unknown native IDs are filtered out of `getSources()` and do not produce operational event references.                                                                                        | Decide whether aliases/native-created sources must be supported through shared identity/adoption, or explicitly restrict/document the supported model. Resolve ownership before introducing a global registry.                               |
| Failed/no-op loads                     | `PlaylistApi.load()` registers sources and publishes the first JS source before native loading completes. A native rejection or early-return/no-op can leave JS state describing a session that was not accepted.                                                               | Define confirmation/rollback semantics, including concurrent loads, without converting native no-ops into invented errors. Add failure-path regression coverage.                                                                             |
| Apple quality-serialization workaround | `RCTConvert+BitmovinPlayer.swift` currently hardcodes video-quality `colorInfo.dynamicRange` to `unknown` and removes the previous native mapping. This is a compatibility workaround carried from verification, not a playlist requirement, and can regress HDR/SDR reporting. | Recheck against the actual baseline Apple SDK and generated app dependencies. Restore the mapping if supported, or isolate/justify the compatibility change before merge.                                                                    |
| Demo/options acceptance                | The API exposes both options, but the sample fixes replay to `PLAYLIST` and has no preload/replay controls.                                                                                                                                                                     | Finish the plan's option demonstration, or explicitly agree to narrow that acceptance criterion.                                                                                                                                             |
| Tracking                               | PRN-1 predates the new PRN-293 story and covers the same high-level goal.                                                                                                                                                                                                       | Choose epic parenting versus closing the new story. No automatic cleanup was performed.                                                                                                                                                      |

Additional review/coverage gaps:

- Complete the native-bridge architecture review; the earlier dedicated reviewer timed out, so that lane is not a review approval.
- Verify native no-op/error behavior for empty sessions, invalid indices, non-member sources, and removing the active source. The README describes these behaviors; the current integration test is not exhaustive proof across platforms.
- Cover preload/replay behavior, automatic progression/completion, live structured seeking, casting restrictions, headless native delivery, and isolation between distinct players.
- JS initialization tests cover concurrent player initialization and retry, not every load/add/destroy race. Per-load source deduplication is not a global single-flight implementation of `Source.initialize()`.

## Verification record

The following were run after moving onto base `e80b4fa7`, during branch preparation and handover. Only documentation changed afterward:

| Check                       | Result                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn lint:all`             | Passed: library, example, SwiftLint, ktlint.                                                                                                                                                                                                                                                                                        |
| `yarn typecheck:all`        | Passed: library, example, integration app.                                                                                                                                                                                                                                                                                          |
| `yarn build`                | Passed: library and plugin. This is not a native Apple/Android app build.                                                                                                                                                                                                                                                           |
| `yarn test:playlist`        | Passed. Executes real TS player/source/playlist/waiter code with mocked native modules; covers shared initialization/retry, source identity/order, repeated-source initialization, decoding, reentrant listeners, headless JS observation, teardown, and waiter success/failure/timeout cleanup. It does not prove native playback. |
| Targeted playlist test lint | Passed: `yarn --cwd integration_test eslint tests/playlistTest.ts --quiet`. The Node regression script also passed ESLint with its inapplicable TS-only floating-promise rule disabled.                                                                                                                                             |
| `git diff --check`          | Passed.                                                                                                                                                                                                                                                                                                                             |
| `yarn lint:all-with-tests`  | Blocked by existing `@typescript-eslint/no-floating-promises` errors in unchanged `integration_test/tests/audioTrackTest.ts` at lines 27 and 52. No unrelated fix was included.                                                                                                                                                     |

Historical device evidence and outstanding work:

- The Android example was assembled and manually exercised on an emulator earlier: loading, transitions, seeking, add/list/remove, and playlist events. That predates the latest initialization/event fixes and the move to the current base. **The pushed implementation has not been reverified on an emulator.**
- The Cavy playlist suite exists in `integration_test/tests/playlistTest.ts` and is registered for Android/iOS, but neither it nor the full Cavy suite was run. It checks loading/order, numeric seeking, source-reference identity, timestamps, and add/remove of distinct equal-config sources.
- The earlier iOS example build stopped at a generated deployment-target mismatch: `BitmovinAnalytics` targeted iOS 14 while `BitmovinPlayerCore` required 15. This was not resolved. The base now pins Apple Player 3.128.0, so regenerate/recheck native dependencies instead of assuming the older failure is unchanged.
- No iOS, tvOS, or Android TV runtime pass is recorded.

## Continue from here

1. Agree on tracking and source ownership/aliasing semantics; handle the failed-load state issue and review the Apple quality workaround before merge.
2. Follow the [example setup](../example/README.md) and [integration test setup](../integration_test/README.md). Keep license keys in their ignored `.env` files; do not add them to this branch.
3. Rebuild/run the Android example and run `yarn integration-test test:android` for native integration coverage. Add the missing headless, multi-player, lifecycle/failure, and option/edge-case checks.
4. Resolve the generated Apple deployment/dependency setup, run `yarn integration-test test:ios`, and verify platform-specific behavior. Rerun prebuild when native/configuration inputs change.
5. Rerun the quality gates, finish native review, and compare against the original plan before calling the feature complete. No pull request was opened as part of this branch handover.
