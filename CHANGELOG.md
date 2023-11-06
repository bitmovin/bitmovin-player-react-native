# Changelog

## [Unreleased]

### Added

- `LiveConfig.minTimeshiftBufferDepth` to control the minimum buffer depth of a stream needed to enable time shifting.
- `Player.buffer` to control buffer preferences and to query the current buffer state
- `DownloadFinishedEvent` to signal when the download of specific content has finished

### Fixed

- Android: Playback doesn't pause when app goes to background
- Android: `PlayerView.onDestroy` not being called when the view is detached from the view hierarchy

## [0.13.0] (2023-10-20)

### Added

- API Reference now can be found [here](https://cdn.bitmovin.com/player/reactnative/0/docs/index.html)
- `PlayerViewConfig` with a `UiConfig` to the `PlayerView` to enable configuration of the visual presentation and behaviour
- `PictureInPictureConfig` to `PlayerViewConfig` to allow configuring the Picture in Picture behavior
- `PictureInPictureConfig.isEnabled` to enable configuring if Picture in Picture is enabled
- `PictureInPictureConfig.shouldEnterOnBackground` to start Picture in Picture automatically when the app transitions to background
- `onPictureInPictureAvailabilityChanged` event is now emitted on iOS and tvOS in addition to Android
- `BufferConfig` to configure player buffer depth
- `PlayerView.isPictureInPictureRequested` to programmatically create a Picture in Picture request
- `PlayerView.scalingMode` to allow changing the video scaling mode

### Changed

- Update IMA SDK dependency on Android to `3.31.0`
- Update Bitmovin's native Android SDK version to `3.47.0`

### Deprecated

- `PlaybackConfig.isPictureInPictureEnabled` in favor of `PictureInPictureConfig.isEnabled`

## [0.12.0] (2023-09-25)

### Added

- `DefaultMetadata` for configuration of the bundled analytics collector
- `Player.analytics` to access the `AnalyticsApi` and interact with the bundled analytics collector
- `SourceConfig.analyticsSourceMetadata` for extended configuration of the bundled analytics collector
- Google Cast SDK support for Android and iOS

### Changed

- `AnalyticsConfig` properties to match the Bitmovin analytics v3 API
- Use `jason` build of Bitmovin's native Android SDK
- Update Bitmovin's native Android SDK version to `3.44.0`

### Removed

- `AnalyticsCollector` in favor of the bundled analytics functionality
- `CdnProvider`, as the property on the `AnalyticsConfig` is now a `string`

## [0.11.0] (2023-09-11)

### Added

- `Player.getAudioTrack` and `Player.getSubtitleTrack` APIs to get currently selected audio and subtitle tracks
- `SourceConfig.description` property to allow setting a description for the source
- `Player.getThumbnail` and `Source.getThumbnail` APIs to get thumbnail images

### Changed

- Update Bitmovin's native Android SDK version to `3.43.0`

## [0.10.0] (2023-09-04)

### Added

- Offline playback support on Android and iOS
- `SourceConfig.options` to enable configuring stream start position
- `PlayerConfig.adaptationConfig` to allow configuring the player's adaptation behavior
- `Player.setMaxSelectableBitrate` to allow setting the maximum selectable bitrate on the `Player`

## [0.9.2] (2023-08-24)

### Changed

- Update Bitmovin's native iOS SDK version to `3.43.1`

## [0.9.1] (2023-08-17)

### Fixed

- Android: Player sometimes plays sound but doesn't display video nor controls.

## [0.9.0] (2023-08-11)

### Added

- Support for `Player.analyticsCollector.addSourceMetadata` to allow updating metadata assigned to the current source
- Support for `CustomData.experimentName` for the A/B testing support with Bitmovin Analytics
- iOS, tvOS: Support for configuring UI type via `StyleConfig.userInterfaceType`

### Changed

- Update Bitmovin's native iOS SDK version to `3.42.0`

### Fixed

- Android: Player sometimes plays sound but no video

## [0.8.0] (2023-07-31)

### Added

- Support for programmatic fullscreen request (`PlayerView.isFullscreenRequested`)

### Changed

- Update Bitmovin's native iOS SDK version to `3.41.2`
- Update Bitmovin's native Android SDK version to `3.40.0`
- Update IMA SDK dependency on iOS to `3.18.4`, respectively `4.8.2` for tvOS
- Update IMA SDK dependency on Android to `3.29.0`

### Fixed

- Android: Sporadic black screen after initialization

## [0.7.2] (2023-07-03)

### Fixed

- Android: None of the Player Web UI menu items work (anything that triggers a native UI pop up)

## [0.7.1] (2023-06-29)

### Added

- Support for `Player.timeShift` and `timeShift` related events

### Fixed

- Project forces the usage of specific `react-native` version

## [0.7.0] (2023-06-26)

### Added

- Support for `SourceConfig.metadata` and `Source.metadata` to allow passing custom metadata to the Player UI
- Support for `CustomMessageHandler` to allow two-way communication between the Player UI and the React Native app

### Fixed

- Android module build issues

## [0.6.0] (2023-03-27)

### Added

- Support for programmatic audio and subtitle track selection. (Thanks to @joornby-angel)
- Custom header support for DRM playback on Android.
- Support for keeping the DRM session alive for consecutive DRM protected sources on Android.

### Changed

- Update Bitmovin's native iOS SDK version to `v3.36.0`.
- Update Bitmovin's native Android SDK version to `v3.35.0`.

## [0.5.1] (2023-01-23)

### Fixed

- Fix missing export of `FullscreenHandler` to allow fullscreen support to be integrated.

## [0.5.0] (2023-01-13)

This version introduces analytics integration, fullscreen support and customizing the Player UI.

### Added

- Built-in Bitmovin Analytics integration.
- `FullscreenHandler` support.
- Bitmovin Player Web UI customization via `styleConfig` property on player creation.

## [0.4.0] (2022-11-24)

This version introduces the advertising API, full Picture in Picture support and exposes Stall events.

### Added

- Advertising API support.
- Complete Picture in Picture support.
- `onStallStarted`/`onStallEnded` events support. (Thanks to @joornby-angel)

## [0.3.1] (2022-10-26)

Adds tweaks configuration support.

### Added

- Support for setting `TweaksConfig` on both Android and iOS.

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

[0.4.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.4.0
[0.3.1]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.3.1
[0.3.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.3.0
[0.2.1]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.1
[0.2.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.2.0
[0.1.0]: https://github.com/bitmovin/bitmovin-player-react-native/releases/tag/v0.1.0
