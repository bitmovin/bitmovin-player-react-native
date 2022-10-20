# Example

This is a React Native app built to showcase `bitmovin-player-react-native`'s features. The code for all feature samples are contained
inside the [`src/screens/`](https://github.com/bitmovin/bitmovin-player-react-native/tree/development/example/src/screens) directory. Check them out for snippets and tips:

- [Basic playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicPlayback.tsx)
- [Basic DRM playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicDrmPlayback.tsx)
- [Custom subtitles](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/SubtitlePlayback.tsx)

### Custom playback

It's also possible to setup a simple playback session using the [Custom playback](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/CustomPlayback.tsx) example. Just select the `Custom` button at the top-right corner, fill in the form with the necessary stream information (URL, type and license key) then select `Play` to start it on a `PlayerView` component. It's useful to see how some type of stream/setup will behave with the library.

**Note** that custom playback is disabled by default on TV devices due to issues with the focus engine, but it's possible to re-enable it, if desired, by removing [this line](https://github.com/bitmovin/bitmovin-player-react-native/blob/development/example/src/screens/BasicDrmPlayback.tsx) from code.

## Getting started

To get started with the project, run `yarn bootstrap` in the lib's root directory (not `example/`). This will install dependencies for both the library and the example app (as well as native deps too):

```sh
cd bitmovin-player-react-native # Go to lib's root directory
yarn bootstrap # Install all dependencies
```

## Configure your license key

Before running the app, make sure to setup your Bitmovin's license key in the native metadata file of each platform:

**iOS**

Edit the license key in `ios/BitmovinPlayerReactNativeExample/Info.plist`:

```xml
<key>BitmovinPlayerLicenseKey</key>
<string>ENTER_LICENSE_KEY</string>
```

**Android**

Edit the license key in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data android:name="BITMOVIN_PLAYER_LICENSE_KEY" android:value="<ENTER_LICENSE_KEY>" />
```

**Programmatically**

Alternatively you can provide your license key programmatically via the config object of `usePlayer`. Providing it this way removes the need for the step above, but keep in mind at least of them is necessary to run the examples successfully.

```ts
const player = usePlayer({
  // Just pass the key in the config object of `usePlayer` or `new Player()` in each example
  licenseKey: 'Your-License-Key',
});
```

## Run the app

First start the metro bundler by running the following command on the lib's root (always execute `yarn` from the lib's root):

```sh
yarn example start # Starts bundler on the example folder
```

Then run it via terminal or an IDE (Xcode/Android Studio):

**Terminal**

```sh
yarn example ios # Run examples on iOS
yarn example android # Run examples on Android
```

**IDE**

You can also open the iOS project using Xcode by typing `xed example/ios/` on terminal, or `studio example/android/` to open the android project in Android Studio (make sure to setup its binaries first).
