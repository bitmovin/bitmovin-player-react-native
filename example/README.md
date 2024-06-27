# Example Application

This is a React Native application built to showcase the features of `bitmovin-player-react-native`. The code for all feature samples is contained
inside the [`src/screens/`](https://github.com/bitmovin/bitmovin-player-react-native/tree/development/example/src/screens) directory:

- [Basic playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicPlayback.tsx)
- [Basic DRM playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicDrmPlayback.tsx)
- [Custom subtitles](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/SubtitlePlayback.tsx)
- [Picture in Picture](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicPictureInPicture.tsx)
- [Custom HTML UI](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/CustomHtmlUi.tsx) (iOS and Android only)
- [Basic Fullscreen handling](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicFullscreenHandling.tsx) (iOS and Android only)
- [Landscape Fullscreen handling](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/LandscapeFullscreenHandling.tsx) (iOS and Android only)
- [Basic Ads](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicAds.tsx)
- [Basic Analytics](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicAnalytics.tsx)
- [Basic Offline Playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/OfflinePlayback.tsx) (iOS and Android only)
- [System UI](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/SystemUi.tsx) (iOS and tvOS only)
- [Casting](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/Casting.tsx) (iOS and Android only)

### Custom asset playback

To play back a custom video asset, it is possible to set up a simple playback session using the [Custom playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/CustomPlayback.tsx) example. Just tap the `Custom` button at the top-right corner, fill in the form with the necessary video asset/stream information (URL, type and license key) then select `Play` to start playback in the `PlayerView` component. This example can also be useful to check how certain types of videos/streams will behave with the library.

**Note** that custom playback is disabled by default on TV devices due to issues with the focus engine, but it is possible to re-enable it, if desired, by removing [this line](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/App.tsx#L130) from code.

## Getting started

To get started with the project, run `yarn bootstrap` in the library's root directory (not `example/`). This will install dependencies for both the library and the example application (as well as native dependencies):

```sh
cd bitmovin-player-react-native # Go to library's root directory
yarn bootstrap # Install all dependencies
```

## Configuring your license key

Before running the application, make sure to set up your Bitmovin's license key in the native metadata file of each platform:

**iOS**

Edit the license key in `example/ios/BitmovinPlayerReactNativeExample/Info.plist`:

```xml
<key>BitmovinPlayerLicenseKey</key>
<string>ENTER_LICENSE_KEY</string>
```

**tvOS**

Edit the license key in `example/ios/BitmovinPlayerReactNativeExample-tvOS/Info.plist`:

```xml
<key>BitmovinPlayerLicenseKey</key>
<string>ENTER_LICENSE_KEY</string>
```

**Android**

Edit the license key in `example/android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data android:name="BITMOVIN_PLAYER_LICENSE_KEY" android:value="<ENTER_LICENSE_KEY>" />
```

**Programmatically**

Alternatively you can provide your license key programmatically via the config object of `usePlayer`. Providing it this way removes the need for the step above, but keep in mind that at least one of them is necessary to successfully run the examples.

```ts
const player = usePlayer({
  // Just pass the key in the config object of `usePlayer` or `new Player()` in each example
  licenseKey: 'Your-License-Key',
});
```

### Add the Package Name and Bundle Identifiers as an Allowed Domain

Add the following package names and bundle identifiers of the example applications ending as an allowed domain on [https://bitmovin.com/dashboard](https://bitmovin.com/dashboard), under `Player -> Licenses` and also under `Analytics -> Licenses`.

#### Android example application Package Name

```
com.bitmovin.player.reactnative.example
```

#### iOS example application Bundle Identifier

```
com.bitmovin.PlayerReactNative-Example
```

#### tvOS example application Bundle Identifier

```
com.bitmovin.PlayerReactNativeExample-tvOS
```

## Running the application

**Terminal**

```sh
yarn example ios # Run examples on iOS
yarn example android # Run examples on Android
```

Hint: You can provide a specific simulator by name when using `--simulator` flag. `xcrun simctl list devices available` provides you with a list of available devices in your environment.

```sh
yarn example ios --simulator="iPhone 15 Pro"
```

**IDE**

You can also open the iOS project using Xcode by typing `xed example/ios` on terminal, or `studio example/android` to open the android project in Android Studio (make sure to setup its binaries first).

### Running the bundler only

The bundler is automatically started when running `yarn example android` or `yarn example ios` or when running via the IDEs, but it can also be started separately.

To start the metro bundler, run the following command on the library's root (always execute `yarn` from the library's root):

```sh
yarn example start # Starts bundler on the example folder
```
