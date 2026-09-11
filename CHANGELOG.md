# Changelog

## [Unreleased]

### Changed

- Update Bitmovin's native Android SDK version to [`3.166.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31660)

## [1.26.0] - 2026-09-11

### Added

- Android: Expose `bitmapHeight` on `CueEnterEvent` and `CueExitEvent` cue `layout` for image-based TTML/IMSC subtitle cues

### Changed

- Update Bitmovin's native Android SDK version to [`3.165.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31650)
- Update Bitmovin's native iOS SDK version to [`3.121.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31210)

## [1.25.0] - 2026-08-13

### Changed

- Update Bitmovin's native Android SDK version to [`3.162.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31620)
- Update Bitmovin's native iOS SDK version to [`3.120.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31200)

### Fixed

- iOS: Prevent startup crashes when Google Cast is not configured

## [1.24.0] - 2026-07-31

### Added

- iOS/tvOS: Expose cue metadata on `CueEnterEvent` and `CueExitEvent` via `html`, `cea608Position`, and native cue `layout` or `region` metadata when available
- iOS/tvOS: `Player.mediaControls` namespace of type `MediaControlsApi` to dynamically query, enable or disable Bitmovin Player's media controls integration via `MediaControlsApi.isEnabled` and `MediaControlsApi.setEnabled`

### Changed

- Cue layout no longer emits empty `layout` objects or uses `'auto'` for `line`, `position`, or `positionAlign`; automatic or unset placement is now represented by omitting these fields

## [1.23.0] - 2026-07-28

### Added

- Android and iOS/tvOS: Expose `VideoQuality.colorInfo.dynamicRange` (`sdr`, `hdr`, `unknown`) via the new `DynamicRange` enum

### Changed

- Update Bitmovin's native iOS SDK version to [`3.118.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31180)
- Update Bitmovin's native Android SDK version to [`3.160.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31600)

## [1.22.0] - 2026-07-23

### Added

- `PlayerViewProps.onPlayerViewReady` callback fired once after the player is initialized and the native view is mounted

### Changed

- Update Bitmovin's native Android SDK version to [`3.159.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31590)
- Update Bitmovin's native iOS SDK version to [`3.117.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31170)

## [1.21.0] - 2026-06-26

### Added

- Android: Expose normalized cue layout data on `CueEnterEvent` and `CueExitEvent` via `layout` (`line`, `lineAlign`, `position`, `positionAlign`, `size`, `textAlign`, `writingMode`) and `html`
- iOS: `Player.showAirPlayTargetPicker()` to display the system AirPlay route selection menu

### Fixed

- Android: Expo config plugin now enables core library desugaring independently from Cast and offline features

### Removed

- iOS: `TweaksConfig.updatesNowPlayingInfoCenter`. Use `MediaControlConfig.isEnabled` to control the Now Playing information instead

### Changed

- Update Bitmovin's native Android SDK version to [`3.155.1+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31551)
- Update Bitmovin's native iOS SDK version to [`3.115.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31150)

## [1.20.1] - 2026-06-12

### Fixed

- Android: Fix known limitation of `PictureInPictureEntered` and `PictureInPictureExited` events on Android <15

## [1.20.0] - 2026-05-29

### Added

- Android: `PictureInPictureEntered` and `PictureInPictureExited` player events
  - Known Limitation: On Android <15 the `PictureInPictureEntered` and `PictureInPictureExited` events are called before the `AppState` changed callback is called

### Changed

- Update Bitmovin's native Android SDK version to [`3.154.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31540)
- Update Bitmovin's native iOS SDK version to [`3.114.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31141)

### Fixed

- iOS: Expo config plugin no longer drops `NSLocalNetworkUsageDescription` from `Info.plist` when `features.googleCastSDK.ios` is configured as an object without an explicit `localNetworkUsageDescription`. The default description is now applied as a fallback, restoring local-network access required for Cast device discovery

## [1.19.0] - 2026-05-08

### Added

- Android: `AdvertisingConfig.shouldPlayAdBreak` callback to decide at runtime whether a scheduled ad break should play

### Changed

- Update Bitmovin's native iOS SDK version to [`3.113.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31130)
- Update Bitmovin's native Android SDK version to [`3.152.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31520)

## [1.18.0] - 2026-05-01

### Added

- `AdvertisingConfig.shouldLoadAdItem` callback to filter ad items before they are loaded
- iOS: `PictureInPictureConfig.shouldExitOnForeground` to automatically exit PiP mode when the app transitions to the foreground

### Changed

- Update Bitmovin's native Android SDK version to [`3.151.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31510)
- Update Bitmovin's native iOS SDK version to [`3.112.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31120)
- Android: Kotlin version to `2.2.20`
- Update Expo SDK version to `54.0.34`

## [1.17.0] - 2026-04-17

### Changed

- Update Bitmovin's native Android SDK version to [`3.149.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31490)
- Update Expo SDK version to `54.0.33` and React Native version to `0.81.5`
  - Minimum supported Expo SDK version is now `54`
  - Minimum supported React Native version is now `0.81.5`

## [1.16.0] - 2026-04-10

### Added

- Android: `PlayerView.isPictureInPictureEnabled` to enable or disable Picture in Picture availability dynamically after player initialization

### Changed

- `DebugConfig.setDebugLoggingEnabled` now also controls JS-side debug logging; `console.log` calls in the `Network` and `Drm` modules are suppressed unless debug logging is enabled
- Update Bitmovin's native iOS SDK version to [`3.111.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31110)

### Fixed

- Android: `OfflineDownloadRequest.minimumBitrate` not correctly parsed from React Native for offline rendition selection
- Android: Picture in Picture fragmented rendering when resizing the PiP window

## [1.15.0] - 2026-03-27

### Added

- Android: `PlaybackConfig.handleAudioFocus` to control whether the player pauses playback when audio focus is lost
- iOS: `PlayerView.isPictureInPictureEnabled` to enable or disable Picture in Picture availability dynamically after player initialization

### Changed

- Update Bitmovin's native iOS SDK version to [`3.110.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31100)

### Fixed

- iOS, tvOS: Error/Warning code not forwarded to the React Native bridge on error and warning events

## [1.14.0] - 2026-03-20

### Added

- `SourceConfig.cmcdConfig.isEnabled` to enable support for Common Media Client Data (CMCD) on iOS/tvOS 18+ (Android currently ignores `cmcdConfig`)

### Changed

- Update Bitmovin's native iOS SDK version to [`3.109.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31090)
- Update Bitmovin's native Android SDK version to [`3.146.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31460)

## [1.13.0] - 2026-03-13

### Changed

- Update Bitmovin's native Android SDK version to [`3.145.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31450)

## [1.12.0] - 2026-03-13

## [1.11.0] - 2026-03-05

### Added

- Support for streaming ads with the Bitmovin Advertising Module (BAM) via `AdSourceType.BITMOVIN` in `AdvertisingConfig` ad schedules. Note: on iOS, VMAP is currently not supported with BAM.

### Changed

- Update Bitmovin's native Android SDK version to [`3.144.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31440)
- Update Expo SDK version to `53.0.27`

## [1.10.0] - 2026-02-27

### Changed

- Update Bitmovin's native iOS SDK version to [`3.108.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31081)
- Update Bitmovin's native Android SDK version to [`3.143.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31430)
- Update Expo SDK version to `53.0.26`

### Fixed

- iOS, tvOS: defaultMetadata from analyticsConfig was not applied when initializing a player with analytics
- Correctly await DRM teardown before releasing OfflineContentManager native resources
- Android: stabilize PlayerView ownership handoff in RNPlayerViewManager during rapid view transitions (e.g. fullscreen/modal re-mounts) to avoid rendering instability

### Added

- Android: TweaksConfig option `enableDrmLicenseRenewRetry` to retry renewing a DRM license when the first renewal attempt fails
- Android/iOS: Expose `DeficiencyData` on error and warning events, providing additional diagnostic information such as the HTTP response body when a network request (e.g. DRM license) fails
- iOS, tvOS: `onFairplayLicenseAcquired` player event, providing the `contentKeyRequest` of the acquired FairPlay license
- iOS, tvOS: `Source.drm.fairplay.renewExpiringLicense` method to proactively renew an expiring FairPlay license using the `contentKeyRequest` from a `FairplayLicenseAcquiredEvent`

## [1.9.0] - 2026-02-13

### Changed

- Android/iOS: Bitmovin Player Web UI integration migrates to v4 (checkout [What's new in UI v4](https://developer.bitmovin.com/playback/docs/whats-new-in-ui-v4))
  - `WebUiConfig.variant` now resolves to v4 UIFactory names:
    - `SmallScreenUi` -> `bitmovin.playerui.UIFactory.buildSmallScreenUI`
    - `TvUi` -> `bitmovin.playerui.UIFactory.buildTvUI`
  - UIFactory v3 names were renamed in v4. For example:
    - `buildDefaultSmallScreenUI` / `buildModernSmallScreenUI` -> `buildSmallScreenUI`
    - `buildDefaultTvUI` / `buildModernTvUI` -> `buildTvUI`
  - If you have no UI customizations, no action is required; the new UI is used automatically
  - If you ship a custom v3 bundle (even if it still uses the legacy v3 factory names), [migrate to UI v4](https://developer.bitmovin.com/playback/reference/migration-guide-v3-to-v4) or set a legacy factory explicitly via `new CustomUi('<legacy UIFactory function>')` and keep loading the v3 bundle
- iOS: When re-attaching a different Player to an existing PlayerView, fullscreen and Picture-in-Picture are exited before the swap
- Update Bitmovin's native iOS SDK version to [`3.107.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31070)
- Update Bitmovin's native Android SDK version to [`3.141.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31410)

### Fixed

- Event handlers could fail to fire in some setups, notably on Android with Paper (old architecture)
- iOS: Re-attaching a new Player to an existing PlayerView now cleanly resets state
- iOS: some valid FairPlay configurations could fail during source loading with an "Unsupported URL" playback error

## [1.8.0] - 2026-02-03

### Changed

- Update Bitmovin's native Android SDK version to [`3.140.1+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31401)
- Update Bitmovin's native iOS SDK version to [`3.106.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31060)
- iOS: `appId` property from Expo config `Features.googleCastSDK.ios` object is now used to initialize Cast receiver application ID

### Fixed

- Android: Setup of custom `appId` and `messageNamespace` for casting

### Added

- Android: Expo config `Features.googleCastSDK.android` object properties `appId` and `messageNamespace`
- iOS: Expo config `Features.googleCastSDK.ios` object property `messageNamespace`
- Expo config `Features.googleCastSDK` object properties `appId` and `messageNamespace` (in case the Android and iOS properties are the same)

### Known Issues

- Event handlers can fail to fire in some setups, notably on Android with Paper (old architecture). This affects versions `1.0.0` to `1.8.x` and is fixed in `1.9.0`.

## [1.7.0] - 2026-01-15

### Changed

- Update Bitmovin's native Android SDK version to [`3.138.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31380)
- Update IMA SDK dependency on Android to `3.38.0`
- Update Bitmovin's native iOS SDK version to [`3.105.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31050)
- Update the Google Cast iOS Sender SDK used by the example app to `4.8.4`

## [1.6.0] - 2025-12-11

### Added

- `MetadataParsedEvent` and `MetadataEvent` to signal when metadata is parsed or encountered during playback. See the new **BasicMetadata** sample in our demo app for a working demonstration.
  - These events come with typed metadata models (ID3, HLS Date Range, EMSG, and SCTE)

### Changed

- Update Bitmovin's native Android SDK version to [`3.135.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31350)

## [1.5.0] - 2025-12-05

### Added

- `pictureInPictureActions` property on `<PlayerView>` to configure Picture in Picture actions
  - `PictureInPictureAction.TogglePlayback` to add a play/pause action
  - `PictureInPictureAction.Seek` to add seek forward and seek backward for 10 seconds actions
- Android: `PictureInPictureConfig.shouldEnterOnBackground` now automatically requests Picture in Picture when the app is backgrounded, matching iOS behavior
- `PlayerViewConfig.uiConfig.enableWebViewInspecting` to allow inspection of the Player UI WebView on iOS

### Changed

- Update Bitmovin's native Android SDK version to [`3.134.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31340)
- Update Bitmovin's native iOS SDK version to [`3.102.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31020)
- When no subtitle is selected on iOS/tvOS, it returns `null` instead of a track with identifier `off` to align with the Android Player SDK behavior
- `SubtitleChangedEvent`'s properties of `oldSubtitleTrack` and `newSubtitleTrack` are now optional to align with the native Player SDKs

### Fixed

- Android: `player.setSubtitleTrack()` now correctly disables subtitles when passing `undefined` as a parameter. Calling `player.setSubtitleTrack()` without a parameter is no longer supported
- Android: Improve lifecycle handling to free resources

## [1.4.0] - 2025-11-06

### Changed

- Update Bitmovin's native Android SDK version to [`3.132.1+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31321)
- Update Bitmovin's native iOS SDK version to [`3.98.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3980)

### Fixed

- iOS: race condition causing invalid initial state for full screen button on `PlayerView`

## [1.3.0] - 2025-10-29

### Added

- `AdvertisingConfig.ima` namespace with type `ImaAdvertisingConfig`
- `ImaAdvertisingConfig.beforeInitialization` API to allow customization of IMA SDK behavior via `ImaSettings`
  - `ImaSettings.ppid` property to allow setting Publisher Provided Identification (PPID) sent with ad requests.
  - `ImaSettings.language` property to set the language for ad UI elements via IETF BCP 47 language tag.
  - `ImaSettings.maxRedirects` property to set the maximum number of redirects the IMA SDK will follow when loading ads.
  - `ImaSettings.enableBackgroundPlayback` property to allow ads to continue playing when the app goes into the background on iOS and tvOS.
  - `ImaSettings.playerVersion` property to set a custom player version string sent with ad requests.
  - `ImaSettings.sessionId` property to set a custom session ID sent with ad requests.
  - `ImaSettings.sameAppKeyEnabled` property to enable Same App Key feature for ad requests on iOS.
- Android: `AudioQuality.channelCount`, providing the channel count associated with `AudioQuality`.

### Changed

- Update Bitmovin's native Android SDK version to [`3.131.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31310)

### Fixed

- Android: `AudioTrack.qualities` API returning empty list when no audio qualities are available

## [1.2.0] - 2025-10-17

### Changed

- Update Bitmovin's native iOS SDK version to [`3.97.2`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3972)
- Update Bitmovin's native Android SDK version to [`3.128.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31280)
- Update IMA SDK dependency on iOS to `3.26.1`
- Update IMA SDK dependency on tvOS to `4.15.1`
- Update IMA SDK dependency on Android to `3.37.0`

## [1.1.0] - 2025-09-03

### Changed

- Update Bitmovin's native Android SDK version to [`3.123.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#31230)
- Update Bitmovin's native iOS SDK version to [`3.94.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3941)

### Fixed

- Crash when using `react-native-reanimated` along with `bitmovin-player-react-native` and playing a live stream
- Expo config plugin feature configurations taking no effect
- Example application crash on tvOS simulator

## [1.0.0] - 2025-08-04

### Breaking Change

- Introduction of Expo SDK support. Upgrading requires following the [Migration Guide](https://developer.bitmovin.com/playback/docs/react-native-migrating-to-v1).

### Added

- React Native New Architecture Support
- Expo Config Plugin to manage native configuration from `app.config.ts`.
- Automatic configuration for Google Cast, Offline, Picture-in-Picture, AirPlay, and Background Playback through Expo plugin.

### Changed

- Minimum iOS/tvOS version is now 15.1+ (was 14.0+). Due to a transient React Native minimum [iOS/tvOS version change](https://github.com/react-native-community/discussions-and-proposals/discussions/812).
- Minimum Android SDK version is now 24 (was 21). Due to a transient React Native minimum [Android version change](https://github.com/react-native-community/discussions-and-proposals/discussions/802).
- Native setup is now automated through Expo SDK - manual configuration is no longer required for v1.0.0+.

## [0.44.0] - 2025-07-25

### Changed

- Update Bitmovin's native Android SDK version to [`3.118.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#31180)
- Update Bitmovin's native iOS SDK version to [`3.93.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3930)
- Android: Add null safety checks to `ReadableMap`/`ReadableArray` calls in `JsonConverter`

### Removed

- Android: `TweaksConfig.shouldApplyTtmlRegionWorkaround` as support for TTML attributes defined in a Region's Style has improved

## [0.43.0] - 2025-06-30

### Added

- Android: `AudioTrack.qualities`, providing the `AudioQuality`s associated with the `AudioTrack`

### Changed

- Update Bitmovin's native Android SDK version to [`3.115.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#31150)
- Update Bitmovin's native iOS SDK version to [`3.92.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3920)

## [0.42.0] - 2025-06-02

### Changed

- Update Bitmovin's native Android SDK version to [`3.112.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#31120)
- Update Bitmovin's native iOS SDK version to [`3.90.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3900)

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

- Update Bitmovin's native Android SDK version to [`3.104.2`](https://developer.bitmovin.com/playback/docs/release-notes-android#31042)
- Update Bitmovin's native iOS SDK version to [`3.85.2`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3852)

## [0.39.0] - 2025-03-07

### Added

- `CueEnterEvent.image` and `CueExitEvent.image` to expose the Base64 encoded image data URI of the cue when available

## [0.38.0] - 2025-02-28

### Changed

- Update Bitmovin's native Android SDK version to [`3.104.1`](https://developer.bitmovin.com/playback/docs/release-notes-android#31041)
- Update Bitmovin's native iOS SDK version to [`3.85.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3850)

## [0.37.0] - 2025-01-17

### Fixed

- Android: App crashes when `mediaControlConfig.isEnabled` is set to `false` and the player gets destroyed

## [0.36.0] - 2024-12-20

### Changed

- Update Bitmovin's native iOS SDK version to [`3.80.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3800)

### Added

- Android: `PlayerViewConfig.surfaceType` that allows to render video on a `TextureView`

## [0.35.0] - 2024-12-10

### Changed

- Update Bitmovin's native Android SDK version to [`3.98.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3980)
- Update Bitmovin's native iOS SDK version to [`3.79.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3790)

### Fixed

- Android: Controls disappearing post midroll ads on select device by setting background color to `Color.TRANSPARENT` on IMA Ad container

## [0.34.0] - 2024-12-04

### Changed

- Update Bitmovin's native Android SDK version to [`3.96.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3960)

## [0.33.0] - 2024-11-28

### Added

- Android: `TweaksConfig.forceReuseVideoCodecReasons` that allows to force the reuse of the video codec despite a configuration change. This flag should be set only, if it is known that the codec can handle the given configuration change.
- `DebugConfig.isDebugLoggingEnabled` and `DebugConfig.setDebugLoggingEnabled(value: boolean)` to check and set whether debug logging is enabled. Debug logging helps diagnose problems and trace the flow of execution within the Player and **should not be enabled in production** as it may log sensitive or confidential information to the console.

### Changed

- Update Bitmovin's native iOS SDK version to [`3.78.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3780)
- Update Bitmovin's native Android SDK version to [`3.94.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3940)

## [0.32.0] - 2024-11-14

### Changed

- Update Bitmovin's native Android SDK version to [`3.92.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3920)

### Fixed

- Error where setting `PlaybackConfig.isAutoplayEnabled = true` causes the player view creation to fail on Android
- Potential infinite stall when using `NetworkConfig.preprocessHttpRequest` and `NetworkConfig.preprocessHttpResponse` on Android

## [0.31.0] - 2024-11-07

### Added

- `MediaControlConfig` to configure the media control information for the application. When `isEnabled` is `true`, the current media information will be shown on the lock-screen, in notifications, and within the control center
- Android: `playerConfig.playbackConfig.isBackgroundPlaybackEnabled` to support background playback

### Changed

- Update Bitmovin's native Android SDK version to [`3.91.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3910)

### Deprecated

- `TweaksConfig.updatesNowPlayingInfoCenter` in favor of `MediaControlConfig.isEnabled`

## [0.30.0] - 2024-10-31

### Changed

- Update Bitmovin's native Android SDK version to [`3.90.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3900)
- Update Bitmovin's native iOS SDK version to [`3.77.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3770)

### Added

- `WebUiConfig.variant` to set the UI variant that should be used by the Bitmovin Web UI

### Fixed

- Spatial navigation in the Web UI does not work properly

## [0.29.0] - 2024-09-09

### Added

- Android: `AdaptationConfig.initialBandwidthEstimateOverride` to override the selection of the optimal media tracks before actual bandwidth data is available

### Changed

- Update Bitmovin's native Android SDK version to [`3.82.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3820)
- Update Bitmovin's native iOS SDK version to [`3.71.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3710)
- Update IMA SDK dependency on Android to `3.33.0`

### Changed

## [0.28.0] - 2024-08-07

### Added

- Android: `AdItem.preloadOffset` to control when ad manifest gets loaded

### Changed

- Update Bitmovin's native Android SDK version to [`3.78.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3780)
- Update Bitmovin's native iOS SDK version to [`3.67.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3670)

## [0.27.1] - 2024-07-05

### Fixed

- `player.setMaxSelectableBitrate(null)` does not reset the maximum selectable bitrate on iOS and tvOS
- Building with Xcode 16 beta due to negative integer overflow error with `UInt` type

## [0.27.0] - 2024-06-21

### Changed

- Update Google IMA SDK dependencies to `3.23.0` for iOS, and to `4.13.0` for tvOS
- Update example app dependency: Google Cast iOS sender SDK to `4.8.1`
- Update Bitmovin's native Android SDK version to [`3.74.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3740)
- Update Bitmovin's native iOS SDK version to [`3.66.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3660)

## [0.26.0] - 2024-06-14

### Added

- Support for `Player.setVideoQuality()` API to enable video quality selection on Android

### Changed

- Update Bitmovin's native Android SDK version to [`3.73.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3730)
- Update Bitmovin's native iOS SDK version to [`3.65.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3650)

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

- Update Bitmovin's native Android SDK version to [`3.72.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3720)
- Update Bitmovin's native iOS SDK version to [`3.64.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3640)

### Fixed

- Android: Can't create a new Player with an existing NativeID (to bind to the same native Player)
- iOS: Performance problem with large WebVTT thumbnail or subtitle tracks

## [0.23.0] - 2024-05-08

### Changed

- Update Bitmovin's native Android SDK version to [`3.68.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3680)
- Update Bitmovin's native iOS SDK version to [`3.62.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3620)

### Fixed

- Android: Player Web UI freezing sometimes, under excessive WebUI-RN code messaging

## [0.22.0] - 2024-04-15

### Added

- iOS: `TweaksConfig.updatesNowPlayingInfoCenter` to decide whether AVKit should update Now Playing information automatically when using System UI. You may want to disable automatic updates in case they are interfering with manual updates you are performing

### Changed

- Update Bitmovin's native iOS SDK version to [`3.60.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3600)
- Update IMA SDK dependency on iOS to `3.19.1`, respectively `4.9.2` for tvOS

## [0.21.0] - 2024-04-08

### Fixed

- Android: Entering Picture-in-Picture automatically when navigating the app to the background after activating Picture-in-Picture mode once
- Android: Example app Toolbar not visible after going into PiP mode -> Dismissing PiP window (stopping the app) -> Opening the app again

### Changed

- Android: Default Picture-in-Picture implementation doesn't automatically hide/show the Toolbar anymore. This should be handled by the app itself, check out the sample app for an example implementation
- Update Bitmovin's native Android SDK version to [`3.65.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3650)
- Update Bitmovin's native iOS SDK version to [`3.59.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3590)

## [0.20.0] - 2024-03-29

### Added

- `preferSoftwareDecodingForAds` in `TweaksConfig` to use software decoding for ads, which can be useful for low-end Android devices
- `hideFirstFrame` in `PlayerViewConfig` to ensure no frame of the main content is shown before pre-roll ads

### Changed

- Update Bitmovin's native Android SDK version to [`3.64.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3640)

## [0.19.0] - 2024-03-22

### Added

- `CueEnterEvent` and `CueExitEvent` to signal when a subtitle entry transitions into an active or inactive status respectively

### Changed

- Update Bitmovin's native Android SDK version to [`3.63.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3630)
- Update Bitmovin's native iOS SDK version to [`3.57.2`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3572)

### Fixed

- Fix potential event name conflicts with other 3rd party libraries

## [0.18.0] - 2024-03-06

### Changed

- React Native version to `0.73.4`
- Update Bitmovin's native Android SDK version to [`3.61.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3610)
- Update Bitmovin's native iOS SDK version to [`3.56.3`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3563)

### Fixed

- Android: Subtitles appear out of frame

## [0.17.0] - 2024-01-26

### Added

- Support for side-loaded SRT (SubRip) subtitles

### Changed

- Update Bitmovin's native iOS SDK version to [`3.55.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3550)

### Fixed

- Remove `patch-package` usage from released product

## [0.16.0] - 2024-01-17

### Changed

- Update Bitmovin's native Android SDK version to [`3.56.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3560)
- Android: Kotlin version to `1.9.21`

## [0.15.0] - 2023-12-18

### Added

- Player (E2E) tests for Android and iOS can now be executed via `yarn integration-test test:android` and `yarn integration-test test:ios` respectively

### Changed

- React Native version to `0.72.6`
- React Native peer dependency version to `0.65.0+`
- Update Bitmovin's native Android SDK version to [`3.54.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3540)
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
- Update Bitmovin's native Android SDK version to [`3.47.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3470)

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
- Update Bitmovin's native Android SDK version to [`3.44.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3440)

### Removed

- `AnalyticsCollector` in favor of the bundled analytics functionality
- `CdnProvider`, as the property on the `AnalyticsConfig` is now a `string`

## [0.11.0] - 2023-09-11

### Added

- `Player.getAudioTrack` and `Player.getSubtitleTrack` APIs to get currently selected audio and subtitle tracks
- `SourceConfig.description` property to allow setting a description for the source
- `Player.getThumbnail` and `Source.getThumbnail` APIs to get thumbnail images

### Changed

- Update Bitmovin's native Android SDK version to [`3.43.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3430)

## [0.10.0] - 2023-09-04

### Added

- Offline playback support on Android and iOS
- `SourceConfig.options` to enable configuring stream start position
- `PlayerConfig.adaptationConfig` to allow configuring the player's adaptation behavior
- `Player.setMaxSelectableBitrate` to allow setting the maximum selectable bitrate on the `Player`

## [0.9.2] - 2023-08-24

### Changed

- Update Bitmovin's native iOS SDK version to [`3.43.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3431)

## [0.9.1] - 2023-08-17

### Fixed

- Android: Player sometimes plays sound but doesn't display video nor controls.

## [0.9.0] - 2023-08-11

### Added

- Support for `Player.analyticsCollector.addSourceMetadata` to allow updating metadata assigned to the current source
- Support for `CustomData.experimentName` for the A/B testing support with Bitmovin Analytics
- iOS, tvOS: Support for configuring UI type via `StyleConfig.userInterfaceType`

### Changed

- Update Bitmovin's native iOS SDK version to [`3.42.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3420)

### Fixed

- Android: Player sometimes plays sound but no video

## [0.8.0] - 2023-07-31

### Added

- Support for programmatic fullscreen request (`PlayerView.isFullscreenRequested`)

### Changed

- Update Bitmovin's native iOS SDK version to [`3.41.2`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3412)
- Update Bitmovin's native Android SDK version to [`3.40.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3400)
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

- Update Bitmovin's native iOS SDK version to [`v3.36.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3360).
- Update Bitmovin's native Android SDK version to [`v3.35.0`](https://developer.bitmovin.com/playback/docs/release-notes-android#3350).

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

- Update Bitmovin's native iOS SDK version to [`v3.28.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3280).
- Update Bitmovin's native Android SDK version to [`v3.24.2`](https://developer.bitmovin.com/playback/docs/release-notes-android#3242).
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
