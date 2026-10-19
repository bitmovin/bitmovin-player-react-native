# Playlist API plan

## Baseline

Latest `development`.

## Objective

Expose the existing native playlist features through React Native with a thin
wrapper. Preserve each platform's native behavior, defaults, limitations, and
errors rather than introducing a separate playlist contract.

## Required capabilities

### Playlist loading and options

- Load an ordered collection of sources into a player.
- Preserve native session replacement, initial active-source selection,
  automatic advancement, and playback completion behavior.
- Expose preloading of all sources, disabled by default.
- Expose replay modes for the entire playlist or only the last source, with
  entire-playlist replay as the default.

### Playlist management

- Append a source or insert it at a specified index.
- Remove a source by reference or index.
- Seek within a specified playlist source, including switching sources.
- Expose native seeking capabilities where supported: time-based seeking,
  seeking to the source's default position, and timeline-relative seek targets.
- Retrieve the sources in playlist order.
- Preserve source identity so returned sources remain usable with existing
  source APIs and playlist operations.
- Reflect native active-source changes in the player's active-source reference.

### Events

- Expose source-added, source-removed, and playlist-transition events.
- Preserve native event information, including source identities, affected
  indices, previous and new sources, names, and timestamps.
- Deliver events to the corresponding player without requiring a mounted view.

### Behavioral compatibility

- Follow the native SDKs shipped by the baseline on iOS, tvOS, Android, and
  Android TV; do not imply identical capabilities where native support differs.
- Preserve native no-op behavior, including removal of the active source and
  operations without an active session where the SDK defines these as no-ops.
- Preserve native handling of playlist membership, indices, invalid inputs,
  loading state, and seeking restrictions. Surface native failures rather than
  replacing documented no-ops with errors.
- Retain platform-specific casting and structured-seeking limitations.
- Keep source lifecycle and existing single-source playback APIs compatible.
- Add only validation and lifecycle handling necessary for safe React Native
  access; do not introduce new playback policies or ownership semantics.

## Demonstration and documentation

- Provide a sample showing loading, playlist management, seeking, options,
  active-source changes, and events using existing Bitmovin sample streams.
- Document exposed features, native defaults, no-op behavior, errors, and
  platform-specific restrictions.
- Announce the feature in the changelog.

## Acceptance criteria

- Exposed operations, options, events, and edge cases match the corresponding
  native SDK behavior on each supported platform.
- Native seeking capabilities are available wherever supported, including
  structured seek targets; unsupported cases are documented.
- Returned sources refer to the existing native sources and remain operational.
- Events retain native information and remain isolated between players.
- Existing source functionality and playback integrations remain compatible.
- Library, sample, documentation, and integration checks pass; platform coverage
  and unverified environments are recorded explicitly.

## Out of scope

- New playback features or guarantees beyond the native playlist APIs.
- Custom playlist playback, preloading, replay, or error-handling policies.
- Unrelated public API changes or lifecycle refactors.

## Native Android reference

- [PlaylistApi](https://cdn.bitmovin.com/player/android/md/3/player-core/player-core/com.bitmovin.player.api.playlist/-playlist-api/index.md)
- [Playlist loading](https://cdn.bitmovin.com/player/android/md/3/player-core/player-core/com.bitmovin.player.api/-player/load.md)
- [PlaylistOptions](https://cdn.bitmovin.com/player/android/md/3/player-core/player-core/com.bitmovin.player.api.playlist/-playlist-options/index.md)
- [Seeking behavior and limitations](https://cdn.bitmovin.com/player/android/md/3/player-core/player-core/com.bitmovin.player.api.playlist/-playlist-api/seek.md)

The Android reference tracks current v3. The capabilities and behavior exposed
must reflect the native SDK versions shipped by the baseline.
