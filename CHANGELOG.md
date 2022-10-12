# Release notes

### [0.2.1] (2022-09-19)

- Library:
  - Fix installation error caused by bad husky setup.

### [0.2.0] (2022-08-23)

- UI:
  - Enable listening to `SubtitleTrack` events via `PlayerView`'s component props.
- Player:
  - Enable listing currently available subtitle tracks via `Player.getAvailableSubtitles()`.
- Source:
  - Add JS interface to create, access and control native `Source` objects.
  - Enable DRM configuration for a single source via `SourceConfig.drmConfig` option.
  - Enable loading external subtitles for a single source via `SourceConfig.subtitleTracks` option.
- Example:
  - Enable listing multiple samples under the same app with [React Navigation](https://github.com/react-navigation/react-navigation).
  - Add DRM example.
  - Add External Subtitles example.
- DRM:
  - Add JS interface to create, access and control native `DRMConfig` objects.

### [0.1.0] (2022-07-11)

- UI:
  - Add component bridge to native `PlayerView`.
  - Enable listening to some `Player` and `Source` events via `PlayerView`'s component props.
- Player:
  - Add JS interface to create, access and control native `Player` objects.
- Source:
  - Enable simple source loading via `Player.load(...opts)`.
- Example:
  - Bootstrap a React Native app under `example/` to test changes made to the library during development.

[0.2.1]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.1
[0.2.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.0
[0.1.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.1.0
