# Gaps: React Native vs. `player-android` — Plan

> Working document. Not meant to be pushed. Companion to [`playlist-plan.md`](playlist-plan.md);
> the same working rules apply (thin bridge, `player-android` / `player-ios` read-only, plan
> commits touch only this file and are marked `(do not push)`, `Split-PR: <topic>` trailers).
>
> Native SDK paths are relative to
> `/home/lug/workspace/bitmovin/player-android/player-core/src/main/java/com/bitmovin/player/`.

## Context

The playlist API itself is on par with the native SDK (see `playlist-plan.md`). The gaps below
are adjacent APIs that playlists make more visible. Ordered by relevance for playlists.

Status legend: `todo` (not started, do not start without go-ahead), `done`.

| #   | Gap                                        | Status         | Split-PR topic                  |
| --- | ------------------------------------------ | -------------- | ------------------------------- |
| 1   | Source-level events                        | todo           | `source-events`                 |
| 2   | `Seeked` event lacks `from` / `to`         | done (Android) | `seeked-positions`              |
| 3   | No `onPlayerInactive` prop                 | done (Android) | `player-inactive-prop`          |
| 4   | No `Source.seekableRange`                  | todo           | `source-seekable-range`         |
| 5   | Track / quality APIs only on player level  | todo           | `source-tracks`                 |
| 6   | Per-source `liveConfig` and codec priority | todo           | `source-config-parity`          |
| 7   | Retry playback / `SkipToNextSource`        | todo           | `retry-playback`                |
| 8   | `DrmConfig.immediateLicenseRequest`        | todo           | `drm-immediate-license-request` |

## 1. Source-level events

- Native: `Source : EventEmitter<SourceEvent>` (`api/source/Source.kt:39`). Source events are
  re-emitted on the player only while the source is active (`event/SourceEventEmitter.kt:39-43`),
  so `Load` / `Loaded` of preloaded inactive sources are only observable on the `Source`.
- RN: no per-source subscription; only `PlayerView` props for the active source. Preload
  completion can only be detected by polling `source.loadingState()`.
- Proposal: subscribe on the native `Source` in `SourceModule` and forward events via Expo module
  events tagged with the source `nativeId`; TS `Source.on(...)` / `off(...)` filtered by
  `nativeId` (pattern: `src/network`, `src/decoder`). Needs an API-shape decision (event names,
  subscription object). Largest item.

## 2. `Seeked` event lacks `from` / `to`

- Native: `PlayerEvent.Seeked(from: SeekPosition, to: SeekPosition)` since 3.160.0
  (`api/event/Event.kt:875-887`; `from` source may no longer be attached).
- RN: Android `PlayerEvent.toJson()` had no `Seeked` case (name + timestamp only);
  TS `SeekedEvent = Event`.
- iOS SDK `SeekedEvent` has no `from` / `to` (`player-ios/.../api/event/data/SeekedEvent.swift`).
- Done: Android serializes `from` / `to` like `Seek`; TS `SeekedEvent.from?` / `to?` with
  `@platform Android`.

## 3. No `onPlayerInactive` prop

- Native: `PlayerEvent.Inactive` (`api/event/Event.kt:745`).
- RN: `PlayerInactiveEvent` type existed, Android dispatched `onBmpPlayerInactive` (registered by
  the `android-player-active-events` fix), but `PlayerView` had no prop; only the catch-all
  `onEvent` received it.
- iOS: `RNPlayerView.swift` has no `onPlayerInactive` listener and the manager does not export
  `onBmpPlayerInactive` → prop never fires on iOS until added (deferred, iOS untouched).
- Done: `onPlayerInactive` prop (TS `events.ts`, `nativeEvents.ts`, `PlayerView/index.tsx`).

## 4. No `Source.seekableRange`

- Native: `Source.seekableRange: TimeRange` (`api/source/Source.kt:79`), valid range for
  `Player.seek` / `PlaylistApi.seek`; `TimeRange(0.0, 0.0)` for live.
- Proposal: `SourceModule` `AsyncFunction("seekableRange")` → `{ start, end }`; TS
  `Source.getSeekableRange()`. Small.

## 5. Track / quality APIs only on player level

- Native `Source` (`api/source/Source.kt:92-244`): `availableVideoQualities`,
  `selectedVideoQuality`, `availableAudioTracks`, `selectedAudioTrack`, `availableAudioQualities`,
  `selectedAudioQuality`, `availableSubtitleTracks`, `selectedSubtitleTrack`, `setAudioTrack`,
  `setAudioQuality`, `setVideoQuality`, `setSubtitleTrack`, `removeSubtitleTrack`. Also valid for
  inactive sources (values of the most recently played period). Player-level equivalents are
  deprecated natively in favour of `player.source?.…`.
- RN: only player-level getters/setters (act on the active source).
- Proposal: mirror on `SourceModule` + TS `Source`, reusing existing converters. Medium.

## 6. Per-source `liveConfig` and codec priority

- Native `SourceConfig` (`api/source/SourceConfig.kt`): `liveConfig` (line 114, applied per source
  on transition), `videoCodecPriority` / `audioCodecPriority` (per source since 3.12.0).
- RN `SourceConfig` has neither (`liveConfig` only on `PlayerConfig`).
- Proposal: extend TS `SourceConfig` and `toSourceConfig()`. Small–medium; check iOS SDK parity
  before naming.

## 7. Retry playback / `SkipToNextSource`

- Native: `RetryPlaybackAction.SkipToNextSource` (`api/recovery/RetryPlaybackAction.kt:71-78`,
  3.125.0), `SourceEvent.RetryPlaybackAttempt` (emitted before `PlaylistTransition`, 3.128.0).
  Without it, an error in an inactive source unloads the whole session.
- RN: no retry-playback API at all.
- Proposal: needs research of the native retry config/callback shape (callback from native to JS,
  like `shouldLoadAdItem`). Medium–large.

## 8. `DrmConfig.immediateLicenseRequest`

- Native: `api/drm/DrmConfig.kt:55-67` — license requests as soon as init data is available for
  the active source in a playlist. Known issue (3.141.0) with pre-fetching for inactive sources.
- RN: missing (related `shouldKeepDrmSessionsAlive`, `useDrmSessionForClearSources` exist).
- Proposal: add to TS Widevine/DRM config and Android converter. Small.

## Deferred iOS work for done items

- #2: iOS SDK `SeekedEvent` has no positions; nothing to bridge unless the iOS SDK adds them.
- #3: add `onPlayerInactive` listener in `RNPlayerView.swift` and export `onBmpPlayerInactive` in
  `RNPlayerViewManager.swift`.
