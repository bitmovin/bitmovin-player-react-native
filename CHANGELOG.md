# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2022-09-19

### Fixed

- Fix installation errors by changing husky's setup from `postinstall` to `prepare`.

## [0.2.0] - 2022-08-23

### Added

- Setup [React Navigation](https://github.com/react-navigation/react-navigation) in `example/` app to enable listing multiple samples.
- Bridge to native `Source` object in Android/iOS.
- Bridge called `Drm` that matches `WidevineConfig`/`FairplayConfig` in Android/iOS, respectively.
- JS-side drm configuration for a single source via `SourceConfig.drmConfig`, besides `Drm` class.
- Drm feature sample under `example/` app.
- External subtitles loading via `SourceConfig.subtitleTracks`. (See `SideLoadedSubtitleTrack` and `SubtitleTrack`)
- Subtitle added, removed and changed events listening via `PlayerViewProps`.
- External subtitles loading sample under `example/` app.

## [0.1.0] - 2022-07-11

### Added

- Basic React Native app under `example/` to test library changes in development.
- React component bridge to native `PlayerView` view in Android/iOS.
- Bridge to native `Player` object in Android/iOS.
- JS-side configuration for player's `licenseKey` via `usePlayer` or `Player` class. (See `PlayerConfig`)
- Simple source loading via `Player#load` function. (See `SourceConfig`)
- Ability to listen to native player/source events via `PlayerViewProps`.

[unreleased]: https://github.com/bitmovin/bitmovin-player-react-native/compare/v0.2.1...development
[0.2.1]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.1
[0.2.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.0
[0.1.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.1.0
