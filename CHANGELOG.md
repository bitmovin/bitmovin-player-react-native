# Changelog

## [0.3.0] (2022-10-13)

Adds support for tvOS projects and ability to customize the default playback behavior of `Player` objects.

### Added

- Custom playback configuration option as `PlayerConfig.playbackConfig`. (Thanks to @jonathanm-tkf)

### Changed

- Update Bitmovin's native iOS SDK version to `v3.28.0`.
- Update Bitmovin's native Android SDK version to `v3.24.2`.
- Setup a new tvOS target on example app's `.xcodeproj` file.
- Replace `react-native` with `react-native-tvos` on the example app.

### Fixed

- Fix pod installation error on tvOS projects by adding `:tvos => 12.4` to the list of supported platforms.

## [0.2.1] (2022-09-19)

Fixes an NPM installation issue.

### Fixed

- Fix installation error caused by wrong husky setup when fetching package from NPM.

## [0.2.0] (2022-08-23)

Adds support for DRM playback on Android (Widevine only) and iOS (FairPlay only), as well as configuring
external subtitle tracks for a stream source.

### Added

- Basic DRM playback support.
- External subtitle tracks option on the source configuration.
- Support for listening subtitle track events via `PlayerView`'s component props.
- `Player.getAvailableSubtitles()` method for fetching the available subtitle tracks in the player's active source.

### Changed

- Setup a list of examples in the example app using [React Navigation](https://github.com/react-navigation/react-navigation).

### Fixed

- Fix error caused when navigating back from screens containing a `PlayerView` child.

## [0.1.0] (2022-07-11)

Adds support for basic playback using Bitmovin's Web UI as the default (and only) player UI.
No support for custom UI yet.

### Added

- Native react component bridge to SDKs `PlayerView`.
- Minimal set of Player APIs through `Player` and `usePlayer` constructs.
- Support for listening most of `Player` and `Source` events via `PlayerView`'s component props.
- Simple React Native app to exemplify and test library features in development.

[0.3.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.3.0
[0.2.1]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.1
[0.2.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.0
[0.1.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.1.0
