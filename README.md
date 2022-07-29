# Bitmovin Player React Native

Official React Native bindings for Bitmovin's mobile Player SDKs.

[![npm](https://img.shields.io/npm/v/bitmovin-player-react-native)](https://www.npmjs.com/package/bitmovin-player-react-native)
![Supports Android and iOS](https://img.shields.io/badge/platforms-android%20%7C%20ios-lightgrey.svg)
[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Bitmovin Community](https://img.shields.io/discourse/users?label=community&server=https%3A%2F%2Fcommunity.bitmovin.com)](https://community.bitmovin.com/?utm_source=github&utm_medium=bitmovin-player-react-native&utm_campaign=dev-community)

> :warning: **Beta Version**: The library is under active development. The current Beta release supports basic playback of unprotected video assets.

- [Bitmovin Player React Native](#bitmovin-player-react-native)
  - [Installation](#installation)
    - [Add package dependency](#add-package-dependency)
    - [Setup iOS Player SDK](#setup-ios-player-sdk)
    - [Setup Android Player SDK](#setup-android-player-sdk)
  - [Getting Started](#getting-started)
    - [Setting up a license key](#setting-up-a-license-key)
      - [Configuring through code](#configuring-through-code)
    - [Setting up a playback configurations](#setting-up-a-playback-configurations)
      - [Configuring through code](#configuring-through-code-1)
      - [Configuring `Info.plist`](#configuring-infoplist)
      - [Configuring `AndroidManifest.xml`](#configuring-androidmanifestxml)
    - [Accessing native `Player` instances](#accessing-native-player-instances)
    - [Listening to events](#listening-to-events)
  - [Contributing](#contributing)

## Installation

Since Bitmovin's native SDKs are distributed through custom [Cocoapods](https://github.com/bitmovin/cocoapod-specs) and [Maven](https://artifacts.bitmovin.com/ui/native/public-releases) repositories, the installation cannot be managed by React Native's Autolink and requires some extra steps. Please refer to the installation instructions for each platform below. For more information on integrating the native SDKs, refer to the [Getting Started guides](https://bitmovin.com/docs/getting-started).

### Add package dependency

This library is available as an [NPM package](https://www.npmjs.com/package/bitmovin-player-react-native) and may be added as a dependency to your project using any node-based package manager, e.g.

> npm

```sh
npm install bitmovin-player-react-native --save
```

> yarn

```sh
yarn add bitmovin-player-react-native
```

### Setup iOS Player SDK

If you ran `pod install` after installing the node package and received an error similar to the one below, it is because Bitmovin's custom cocoapods repository has not been added to the `Podfile` and the [`iOS Player SDK`](https://github.com/bitmovin/bitmovin-player-ios-samples) could not be resolved:

```
[!] Unable to find a specification for `BitmovinPlayer (= 3.xx.x)` depended upon by `RNBitmovinPlayer`

You have either:
 * out-of-date source repos which you can update with `pod repo update` or with `pod install --repo-update`.
 * mistyped the name or version.
 * not added the source repo that hosts the Podspec to your Podfile.
```

To fix above error, open your `ios/Podfile` and set up Bitmovin's pods source url:

```ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

# Bitmovin pods source url
source 'https://github.com/bitmovin/cocoapod-specs.git'

# iOS version should be 12 or greater.
# If you are running RN 0.69 you should be fine already.
platform :ios, '12.4'
install! 'cocoapods', :deterministic_uuids => false

target 'MyApp' do
  config = use_native_modules!

  # Rest of Podfile...
```

Now run `pod install` again (try with `--repo-update` if the error persists) - the error should now be resolved.

### Setup Android Player SDK

The Android setup also needs an extra step in order to correctly resolve the [Android Player SDK](https://github.com/bitmovin/bitmovin-player-android-samples) native dependency.

Just make sure to add Bitmovin's artifacts repository to the `allprojects.repositories` section of your `android/build.gradle`:

```groovy
allprojects {
    repositories {
        maven { url("$rootDir/../node_modules/react-native/android") }
        maven { url("$rootDir/../node_modules/jsc-android/dist") }
        mavenCentral {
            content {
                excludeGroup "com.facebook.react"
            }
        }
        google()
        maven { url 'https://www.jitpack.io' }
        // Add Bitmovin's artifacts repository url
        maven { url 'https://artifacts.bitmovin.com/artifactory/public-releases' }
    }
}
```

## Getting Started

The following is the simplest working component one can create using this library:

```typescript
import React, { useEffect, useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import {
  usePlayer,
  SourceType,
  PlayerView,
} from 'bitmovin-player-react-native';

export default function PlayerSample() {
  // The `usePlayer` hook creates or references a certain native `Player`
  // instance from within any component.
  const player = usePlayer({
    // The only required parameter is the license key but it can be omitted from code upon correct
    // Info.plist/AndroidManifest.xml configuration.
    //
    // Head to `Setting up a license key` for more information.
    licenseKey: '<ENTER-YOUR-LICENSE-KEY>',
  });

  useEffect(() => {
    // Load a streamable video source during component's initialization.
    player.load({
      // Select url and type dependeding on the running platform.
      url:
        Platform.OS === 'ios'
          ? // HLS for iOS
            'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
          : // Dash for Android
            'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
      type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
      // Optionally set a title that will appear at player's top-left corner.
      title: 'Art of Motion',
      // Optionally load a poster image over the player.
      poster:
        'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
      // Optionally set whether poster image will persist over player.
      // Useful for audio-only streams. Default to false.
      isPosterPersistent: false,
    });
  }, [player]);

  // onReady is called when the player has downloaded initial
  // video and audio and is ready to start playback.
  const onReady = useCallback(
    (event) => {
      // Start playback
      player.play();
      // Print event timestamp
      console.log(event.timestamp);
    },
    [player]
  );

  // Make sure to pass the `player` prop in `PlayerView`.
  return (
    <View style={styles.flex1}>
      <PlayerView style={styles.flex1} player={player} onReady={onReady} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});
```

If you're interested in a complete running example, head to [`example/`](https://github.com/bitmovin/bitmovin-player-react-native/tree/main/example).

### Setting up a license key

First of all, create a license key on the [Dashboard](https://bitmovin.com/dashboard) and then make sure to associate your iOS app bundle id with it (see more [here](https://bitmovin.com/docs/player/getting-started/ios#step-3-configure-your-player-license)).

Then your license key can be either set from code or by configuring `Info.plist` and `AndroidManifest.xml`.

#### Configuring through code

```typescript
// Simply pass the `licenseKey` property to `PlayerConfig` when instantiating a player.

// With hooks
import { usePlayer } from 'bitmovin-player-react-native';
const player = usePlayer({
  licenseKey: '<ENTER-YOUR-LICENSE-KEY>',
});

// Without hooks
import { Player } from 'bitmovin-player-react-native';
const player = new Player({
  // Make sure to use React.createRef if instantiating inside a component.
  licenseKey: '<ENTER-YOUR-LICENSE-KEY>',
});
```

### Setting up a playback configurations

If you need more option to playback configuration you can add new parameter `playbackConfig`

#### Configuring through code

```typescript
// Simply pass the `playbackConfig` property to `PlaybackConfig` when instantiating a player.

// With hooks
import { usePlayer } from 'bitmovin-player-react-native';
const player = usePlayer({
  playbackConfig: {
    // Optionally isAutoplayEnabled: Specifies whether autoplay is enabled. Default is false.
    isAutoplayEnabled: true,
    // Optionally isMuted: Specifies if the player should start muted. Default is false.
    isMuted: true,
    // Optionally isTimeShiftEnabled: Specifies if time shifting (during live streaming) should be enabled. Default is true.
    isTimeShiftEnabled: true,
    // Optionally isBackgroundPlaybackEnabled: Specifies if isBackgroundPlaybackEnabled should be enabled. Only in iOS. Default is false.
    isBackgroundPlaybackEnabled: true,
  }
});

// Without hooks
import { Player } from 'bitmovin-player-react-native';
const player = new Player({
  // Make sure to use React.createRef if instantiating inside a component.
  playbackConfig: {
    isAutoplayEnabled: true,
    isMuted: true,
    isTimeShiftEnabled: true,
    isBackgroundPlaybackEnabled: true,
  }
});
```

#### Configuring `Info.plist`

Add the following lines to the `<dict>` section of your `ios/Info.plist`:

```xml
<key>BitmovinPlayerLicenseKey</key>
<string>ENTER-YOUR-LICENSE-KEY</string>
```

#### Configuring `AndroidManifest.xml`

Add the following line to the `<application>` section of your `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data android:name="BITMOVIN_PLAYER_LICENSE_KEY" android:value="ENTER-YOUR-LICENSE-KEY" />
```

### Accessing native `Player` instances

When you instantiate a player with `usePlayer` or `new Player()` from javascript, you're actually either creating a new `Player` instance in the native side (see [SDKs docs](https://bitmovin.com/docs/player/sdks) for more info) or referencing an existing one.

So it means that a player with the same `nativeId` in two different parts of the code is referencing the same in-memory instance internally.

**Example**

Both components in the example below are referencing the same native `Player` indexed as `my-player`. And even though each `<PlayerView />` creates a different `View` internally, the `Player` instance (which is a separate thing) remains the same. It just gets attached to a different view.

```typescript
// Using `usePlayer`
export const CompA = () => {
  // Same `player` as in `CompB`.
  const player = usePlayer({
    nativeId: 'my-player',
  });
  return <PlayerView player={player} />;
};

// Using `new Player()`
export const CompB = () => {
  // Same `player` as in `CompA`.
  const player = useRef(
    new Player({
      nativeId: 'my-player',
    })
  );
  return <PlayerView player={player.current} />;
};
```

### Listening to events

Both player and source events can be registered from `PlayerView`, but not all of them. For a complete list of the events currently available, checkout [`EventProps`](https://github.com/bitmovin/bitmovin-player-react-native/blob/main/src/components/PlayerView/events.ts#L29) and [`events.ts`](https://github.com/bitmovin/bitmovin-player-react-native/blob/main/src/events.ts).

To register an event callback, just pass its name prefixed with `on` as a `PlayerView` prop:

```typescript
return (
  <PlayerView
    onReady={onReady}
    onMuted={onMuted}
    onPaused={onPaused}
    onPlayerActive={onPlayerActive}
    onSourceLoaded={onSourceLoaded}
    onPlayerError={onPlayerError}
    onSourceError={onSourceError}
    onPlaybackFinished={onPlaybackFinished}
    {...}
  />
);
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.
