# Bitmovin Player React Native

Official React Native bindings for Bitmovin's native Player SDKs.

[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/bitmovin/bitmovin-player-react-native/blob/main/LICENSE)
[![Bitmovin Community](https://img.shields.io/discourse/users?label=community&server=https%3A%2F%2Fcommunity.bitmovin.com)](https://community.bitmovin.com/?utm_source=github&utm_medium=bitmovin-player-react-native&utm_campaign=dev-community)

- [Installation](#installation)
  - [Add package dependency](#add-package-dependency)
  - [Setup iOS Player SDK](#setup-ios-player-sdk)
  - [Setup Android Player SDK](#setup-android-player-sdk)
- [Getting Started](#getting-started)
  - [Setting up a license key](#setting-up-a-license-key)
  - [Accessing native `Player` instances](#accessing-native-player-instances)
  - [Listening to events](#listening-to-events)


## Installation

Be aware the installation process requires some extra steps for the native part that cannot be managed by React Native's Autolink. That's because both Bitmovin's native SDKs are distributed through custom [Cocoapods](https://github.com/bitmovin/cocoapod-specs) and [Maven](https://artifacts.bitmovin.com/ui/native/public-releases) repositories. Not the central ones.

So checkout the detailed installation instructions for each platform below or go to their respective [getting started docs](https://bitmovin.com/docs/getting-started) for more information.

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

If you ran `pod install` after installing the node package and received an error similar to the one below, don't worry. That's because Bitmovin's custom cocoapods repository hasn't been added to the `Podfile` and the [`iOS Player SDK`](https://github.com/bitmovin/bitmovin-player-ios-samples) couldn't be resolved:

```
[!] Unable to find a specification for `BitmovinPlayer (= 3.xx.x)` depended upon by `RNBitmovinPlayer`

You have either:
 * out-of-date source repos which you can update with `pod repo update` or with `pod install --repo-update`.
 * mistyped the name or version.
 * not added the source repo that hosts the Podspec to your Podfile.
```

Open up `ios/Podfile` and setup Bitmovin's pods source url:

```ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

# Bitmovin pods source url
source 'https://github.com/bitmovin/cocoapod-specs.git'

# iOS version should be 12 or greater.
# If you're running RN 0.69 you should be fine already.
platform :ios, '12.4'
install! 'cocoapods', :deterministic_uuids => false

target 'MyApp' do
  config = use_native_modules!

  # Rest of Podfile...
```

Now run `pod install` again (try with `--repo-update` if the error persists) then everything should be just fine.

### Setup Android Player SDK

The Android setup also needs one extra step in order to correctly resolve the [Android Player SDK](https://github.com/bitmovin/bitmovin-player-android-samples) native dependency.

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

The following piece of code is the simplest working component one can create using this library:

```typescript
import React, { useEffect, useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { usePlayer, SourceType, PlayerView } from 'bitmovin-player-react-native';

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
      url: Platform.OS === 'ios'
        // HLS for iOS
        ? 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
        // Dash for Android
        : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
      type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
      // Optionally set a title that will appear at player's top-left corner.
      title: 'Art of Motion',
      // Optionally load a poster image over the player.
      poster: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg'
      // Optionally set whether poster image will persist over player.
      // Useful for audio-only streams. Default to false.
      isPosterPersistent: false,
    });
  }, [player]);

  // onReady is called when the player has downloaded initial
  // video and audio and is ready to start playback.
  const onReady = useCallback((event) => {
    // Start playback
    player.play();
    // Print event timestamp
    console.log(event.timestamp);
  }, [player]);

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
// Simply pass the `licenseKey` property to `PlayerConfig` when
// instantiating a player.

// With hooks
import { usePlayer } from 'bitmovin-player-react-native';
const player = usePlayer({
  licenseKey: '<ENTER-YOUR-LICENSE-KEY>',
});

// Without hooks
import { Player } from 'bitmovin-player-react-native';
const player = new Player({ // Make sure to use React.createRef if instantiating inside a component.
  licenseKey: '<ENTER-YOUR-LICENSE-KEY>',
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
  return (
    <PlayerView player={player} />
  );
};

// Using `new Player()`
export const CompB = () => {
  // Same `player` as in `CompA`.
  const player = useRef(new Player({
    nativeId: 'my-player',
  }));
  return (
    <PlayerView player={player.current} />
  );
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
