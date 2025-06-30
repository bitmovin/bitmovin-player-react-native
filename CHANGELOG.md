# Changelog

## [0.43.0] - 2025-06-30

### Added

- Android: `AudioTrack.qualities`, providing the `AudioQuality`s associated with the `AudioTrack`

### Changed

- Update Bitmovin's native Android SDK version to `3.115.0`
- Update Bitmovin's native iOS SDK version to `3.92.0`

## [0.42.0] - 2025-06-02

### Changed

- Update Bitmovin's native Android SDK version to `3.112.0`
- Update Bitmovin's native iOS SDK version to `3.90.0`

### Added

- `SubtitleTrack.roles` and `AudioTrack.roles` to list the associated `MediaTrackRole` information

## [0.41.0] - 2025-04-02

### Changed

- Update react-native-screens to v3.35.0 for Android SDK version compatibility

### Added

- Android: `DecoderConfig.decoderPriorityProvider`, a callback interface to specify which decoder implementation the Player should use to decode the media

### Changed

- Update IMA SDK dependency on Android to `3.35.1`

## [0.40.0] - 2025-03-20

### Changed

- Update Bitmovin's native Android SDK version to `3.104.2`
- Update Bitmovin's native iOS SDK version to `3.85.2`

## [0.39.0] - 2025-03-07

### Added

- `CueEnterEvent.image` and `CueExitEvent.image` to expose the Base64 encoded image data URI of the cue when available

## [0.38.0] - 2025-02-28

### Changed

- Update Bitmovin's native Android SDK version to `3.104.1`
- Update Bitmovin's native iOS SDK version to `3.85.0`

## [0.37.0] - 2025-01-17

### Fixed

- Android: App crashes when `mediaControlConfig.isEnabled` is set to `false` and the player gets destroyed

## [0.36.0] - 2024-12-20

### Changed

- Update Bitmovin's native iOS SDK version to `3.80.0`

### Added

- Android: `PlayerViewConfig.surfaceType` that allows to render video on a `TextureView`

## [0.35.0] - 2024-12-10

### Changed

- Update Bitmovin's native Android SDK version to `3.98.0`
- Update Bitmovin's native iOS SDK version to `3.79.0`

### Fixed

- Android: Controls disappearing post midroll ads on select device by setting background color to `Color.TRANSPARENT` on IMA Ad container

## [0.34.0] - 2024-12-04

### Changed

- Update Bitmovin's native Android SDK version to `3.96.0`

## [0.33.0] - 2024-11-28

### Added

- Android: `TweaksConfig.forceReuseVideoCodecReasons` that allows to force the reuse of the video codec despite a configuration change. This flag should be set only, if it is known that the codec can handle the given configuration change.
- `DebugConfig.isDebugLoggingEnabled` and `DebugConfig.setDebugLoggingEnabled(value: boolean)` to check and set whether debug logging is enabled. Debug logging helps diagnose problems and trace the flow of execution within the Player and **should not be enabled in production** as it may log sensitive or confidential information to the console.

### Changed

- Update Bitmovin's native iOS SDK version to `3.78.0`
- Update Bitmovin's native Android SDK version to `3.94.0`

## [0.32.0] - 2024-11-14

### Changed

- Update Bitmovin's native Android SDK version to `3.92.0`

### Fixed

- Error where setting `PlaybackConfig.isAutoplayEnabled = true` causes the player view creation to fail on Android
- Potential infinite stall when using `NetworkConfig.preprocessHttpRequest` and `NetworkConfig.preprocessHttpResponse` on Android

## [0.31.0] - 2024-11-07

### Added

- `MediaControlConfig` to configure the media control information for the application. When `isEnabled` is `true`, the current media information will be shown on the lock-screen, in notifications, and within the control center
- Android: `playerConfig.playbackConfig.isBackgroundPlaybackEnabled` to support background playback

### Changed

- Update Bitmovin's native Android SDK version to `3.91.0`

### Deprecated

- `TweaksConfig.updatesNowPlayingInfoCenter` in favor of `MediaControlConfig.isEnabled`

## [0.30.0] - 2024-10-31

### Changed

- Update Bitmovin's native Android SDK version to `3.90.0`
- Update Bitmovin's native iOS SDK version to `3.77.0`

### Added

- `WebUiConfig.variant` to set the UI variant that should be used by the Bitmovin Web UI

### Fixed

- Spatial navigation in the Web UI does not work properly

## [0.29.0] - 2024-09-09

### Added

- Android: `AdaptationConfig.initialBandwidthEstimateOverride` to override the selection of the optimal media tracks before actual bandwidth data is available

### Changed

- Update Bitmovin's native Android SDK version to `3.82.0`
- Update Bitmovin's native iOS SDK version to `3.71.0`
- Update IMA SDK dependency on Android to `3.33.0`

### Changed

## [0.28.0] - 2024-08-07

### Added

- Android: `AdItem.preloadOffset` to control when ad manifest gets loaded

### Changed

- Update Bitmovin's native Android SDK version to `3.78.0`
- Update Bitmovin's native iOS SDK version to `3.67.0`

## [0.27.1] - 2024-07-05

### Fixed

- `player.setMaxSelectableBitrate(null)` does not reset the maximum selectable bitrate on iOS and tvOS
- Building with Xcode 16 beta due to negative integer overflow error with `UInt` type

## [0.27.0] - 2024-06-21

### Changed

- Update Google IMA SDK dependencies to `3.23.0` for iOS, and to `4.13.0` for tvOS
- Update example app dependency: Google Cast iOS sender SDK to `4.8.1`
- Update Bitmovin's native Android SDK version to `3.74.0`
- Update Bitmovin's native iOS SDK version to `3.66.0`

## [0.26.0] - 2024-06-14

### Added

- Support for `Player.setVideoQuality()` API to enable video quality selection on Android

### Changed

- Update Bitmovin's native Android SDK version to `3.73.0`
- Update Bitmovin's native iOS SDK version to `3.65.0`

### Fixed

- Missing parameter documentations in the API reference

## [0.25.0] - 2024-06-07

### Added

- `viewRef` property to `PlayerView` to allow setting a reference to the native view

### Fixed

- iOS: Possible crash on hot-reload

## [0.24.0] - 2024-06-04

### Added

- `NetworkConfig` to configure the network request manipulation functionality
  - `preprocessHttpRequest(type, request) => Promise<HttpRequest>` to pre-process an HTTP request before the request is executed by the player
  - `preprocessHttpResponse(type, response) => Promise<HttpResponse>` to pre-process an HTTP response before it gets passed to the player

### Changed

- Update Bitmovin's native Android SDK version to `3.72.0`
- Update Bitmovin's native iOS SDK version to `3.64.0`

### Fixed

- Android: Can't create a new Player with an existing NativeID (to bind to the same native Player)
- iOS: Performance problem with large WebVTT thumbnail or subtitle tracks

## [0.23.0] - 2024-05-08

### Changed

- Update Bitmovin's native Android SDK version to `3.68.0`
- Update Bitmovin's native iOS SDK version to `3.62.0`

### Fixed

- Android: Player Web UI freezing sometimes, under excessive WebUI-RN code messaging

## [0.22.0] - 2024-04-15

### Added

- iOS: `TweaksConfig.updatesNowPlayingInfoCenter` to decide whether AVKit should update Now Playing information automatically when using System UI. You may want to disable automatic updates in case they are interfering with manual updates you are performing

### Changed

- Update Bitmovin's native iOS SDK version to `3.60.0`
- Update IMA SDK dependency on iOS to `3.19.1`, respectively `4.9.2` for tvOS

## [0.21.0] - 2024-04-08

### Fixed

- Android: Entering Picture-in-Picture automatically when navigating the app to the background after activating Picture-in-Picture mode once
- Android: Example app Toolbar not visible after going into PiP mode -> Dismissing PiP window (stopping the app) -> Opening the app again

### Changed

- Android: Default Picture-in-Picture implementation doesn't automatically hide/show the Toolbar anymore. This should be handled by the app itself, check out the sample app for an example implementation
- Update Bitmovin's native Android SDK version to `3.65.0`
- Update Bitmovin's native iOS SDK version to `3.59.0`

## [0.20.0] - 2024-03-29

### Added

- `preferSoftwareDecodingForAds` in `TweaksConfig` to use software decoding for ads, which can be useful for low-end Android devices
- `hideFirstFrame` in `PlayerViewConfig` to ensure no frame of the main content is shown before pre-roll ads

### Changed

- Update Bitmovin's native Android SDK version to `3.64.0`

## [0.19.0] - 2024-03-22

### Added

- `CueEnterEvent` and `CueExitEvent` to signal when a subtitle entry transitions into an active or inactive status respectively

### Changed

- Update Bitmovin's native Android SDK version to `3.63.0`
- Update Bitmovin's native iOS SDK version to `3.57.2`

### Fixed

- Fix potential event name conflicts with other 3rd party libraries

## [0.18.0] - 2024-03-06

### Changed

- React Native version to `0.73.4`
- Update Bitmovin's native Android SDK version to `3.61.0`
- Update Bitmovin's native iOS SDK version to `3.56.3`

### Fixed

- Android: Subtitles appear out of frame

## [0.17.0] - 2024-01-26

### Added

- Support for side-loaded SRT (SubRip) subtitles

### Changed

- Update Bitmovin's native iOS SDK version to `3.55.0`

### Fixed

- Remove `patch-package` usage from released product

## [0.16.0] - 2024-01-17

### Changed

- Update Bitmovin's native Android SDK version to `3.56.0`
- Android: Kotlin version to `1.9.21`

## [0.15.0] - 2023-12-18

### Added

- Player (E2E) tests for Android and iOS can now be executed via `yarn integration-test test:android` and `yarn integration-test test:ios` respectively

### Changed

- React Native version to `0.72.6`
- React Native peer dependency version to `0.65.0+`
- Update Bitmovin's native Android SDK version to `3.54.0`
- Android: Kotlin version to `1.8.20`

## [0.14.2] - 2023-11-27

### Fixed

- Android: `onEvent` callback not being called on `PlayerView`
- iOS: `onEvent` on iOS has incomplete payload information
- tvOS: Picture in Picture sample screen has unwanted padding
- iOS: hide home indicator when entering fullscreen mode in the example application
- iOS: invalid `loadingState` value in `SeekEvent`, `SourceLoadEvent`, `SourceLoadedEvent` and in `SourceUnloadedEvent`

## [0.14.1] - 2023-11-16

### Fixed

- Android: `PlayerView` destroys attached `Player` instance on destroy. `Player` lifecycle must be handled on the creation side

## [0.14.0] - 2023-11-14

### Added

- `LiveConfig.minTimeshiftBufferDepth` to control the minimum buffer depth of a stream needed to enable time shifting
- `Player.buffer` to control buffer preferences and to query the current buffer state
- `DownloadFinishedEvent` to signal when the download of specific content has finished
- `Player.videoQuality`, `Player.availableVideoQualities`, and `VideoDownloadQualityChangedEvent` to query current video qualities and listen to related changes
- `Player.playbackSpeed`, `Player.canPlayAtPlaybackSpeed`, `PlaybackSpeedChangedEvent` to query, control, and listen to changes to the speed of the playback
- Support for `UserInterfaceType.Subtitle` on Android

### Fixed

- Android: Playback doesn't pause when app goes to background
- Android: `PlayerView.onDestroy` not being called when the view is detached from the view hierarchy

## [0.13.0] - 2023-10-20

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

## [0.12.0] - 2023-09-25

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

## [0.11.0] - 2023-09-11

### Added

- `Player.getAudioTrack` and `Player.getSubtitleTrack` APIs to get currently selected audio and subtitle tracks
- `SourceConfig.description` property to allow setting a description for the source
- `Player.getThumbnail` and `Source.getThumbnail` APIs to get thumbnail images

### Changed

- Update Bitmovin's native Android SDK version to `3.43.0`

## [0.10.0] - 2023-09-04

### Added

- Offline playback support on Android and iOS
- `SourceConfig.options` to enable configuring stream start position
- `PlayerConfig.adaptationConfig` to allow configuring the player's adaptation behavior
- `Player.setMaxSelectableBitrate` to allow setting the maximum selectable bitrate on the `Player`

## [0.9.2] - 2023-08-24

### Changed

- Update Bitmovin's native iOS SDK version to `3.43.1`

## [0.9.1] - 2023-08-17

### Fixed

- Android: Player sometimes plays sound but doesn't display video nor controls.

## [0.9.0] - 2023-08-11

### Added

- Support for `Player.analyticsCollector.addSourceMetadata` to allow updating metadata assigned to the current source
- Support for `CustomData.experimentName` for the A/B testing support with Bitmovin Analytics
- iOS, tvOS: Support for configuring UI type via `StyleConfig.userInterfaceType`

### Changed

- Update Bitmovin's native iOS SDK version to `3.42.0`

### Fixed

- Android: Player sometimes plays sound but no video

## [0.8.0] - 2023-07-31

### Added

- Support for programmatic fullscreen request (`PlayerView.isFullscreenRequested`)

### Changed

- Update Bitmovin's native iOS SDK version to `3.41.2`
- Update Bitmovin's native Android SDK version to `3.40.0`
- Update IMA SDK dependency on iOS to `3.18.4`, respectively `4.8.2` for tvOS
- Update IMA SDK dependency on Android to `3.29.0`

### Fixed

- Android: Sporadic black screen after initialization

## [0.7.2] - 2023-07-03

### Fixed

- Android: None of the Player Web UI menu items work (anything that triggers a native UI pop up)

## [0.7.1] - 2023-06-29

### Added

- Support for `Player.timeShift` and `timeShift` related events

### Fixed

- Project forces the usage of specific `react-native` version

## [0.7.0] - 2023-06-26

### Added

- Support for `SourceConfig.metadata` and `Source.metadata` to allow passing custom metadata to the Player UI
- Support for `CustomMessageHandler` to allow two-way communication between the Player UI and the React Native app

### Fixed

- Android module build issues

## [0.6.0] - 2023-03-27

### Added

- Support for programmatic audio and subtitle track selection. (Thanks to @joornby-angel)
- Custom header support for DRM playback on Android.
- Support for keeping the DRM session alive for consecutive DRM protected sources on Android.

### Changed

- Update Bitmovin's native iOS SDK version to `v3.36.0`.
- Update Bitmovin's native Android SDK version to `v3.35.0`.

## [0.5.1] - 2023-01-23

### Fixed

- Fix missing export of `FullscreenHandler` to allow fullscreen support to be integrated.

## [0.5.0] - 2023-01-13

This version introduces analytics integration, fullscreen support and customizing the Player UI.

### Added

- Built-in Bitmovin Analytics integration.
- `FullscreenHandler` support.
- Bitmovin Player Web UI customization via `styleConfig` property on player creation.

## [0.4.0] - 2022-11-24

This version introduces the advertising API, full Picture in Picture support and exposes Stall events.

### Added

- Advertising API support.
- Complete Picture in Picture support.
- `onStallStarted`/`onStallEnded` events support. (Thanks to @joornby-angel)

## [0.3.1] - 2022-10-26

Adds tweaks configuration support.

### Added

- Support for setting `TweaksConfig` on both Android and iOS.

## [0.3.0] - 2022-10-13

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

## [0.2.1] - 2022-09-19

Fixes an NPM installation issue.

### Fixed

- Fix installation error caused by wrong husky setup when fetching package from NPM.

## [0.2.0] - 2022-08-23

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

## [0.1.0] - 2022-07-11

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
