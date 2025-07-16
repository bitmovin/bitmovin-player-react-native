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

Note that Windows users should instead run:

```powershell
cd bitmovin-player-react-native # Go to library's root directory
yarn install # Install root project dependencies
yarn example install # Install example folder dependencies
```

## Development Setup

To run the example app for local development, you need to provide a Bitmovin Player license key. This project uses a local `.env` file and a dynamic `app.config.ts` to manage these secrets.

1. **Create a local environment file:**
   From the root of the repository, copy the example `.env` template:

   ```bash
   cp example/.env.example example/.env
   ```

2. **Add your credentials:**
   Open `example/.env` and replace the placeholder values.
   - The `BITMOVIN_PLAYER_LICENSE_KEY` is required.
   - The `BITMOVIN_ANALYTICS_LICENSE_KEY` is optional. It is used in the "Basic Analytics" screen.
   - The `APPLE_DEVELOPMENT_TEAM_ID` is optional and only needed if you want to build the app on a physical iOS or tvOS device. You can find your Apple Team ID on the [Apple Developer website](https://developer.apple.com/account/) under "Membership details".

These values are loaded automatically by `example/app.config.ts` during the prebuild process and are not committed to version control. **This method is for internal development only.**

### Alternative: Programmatic License Key

Alternatively you can provide your license key programmatically via the config object of `usePlayer`. This method can be used alongside the `.env` configuration.

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
