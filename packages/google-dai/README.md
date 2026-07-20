# Bitmovin Player React Native Google DAI

Optional companion package for Google IMA Dynamic Ad Insertion (DAI/SSAI) support in `bitmovin-player-react-native`.

> Release note: this package is prepared in-repository for Android-first validation. Do not publish it publicly until the rollout checklist is complete, including the confirmed iOS native DAI SDK contract.

## Installation

```sh
yarn add bitmovin-player-react-native @bitmovin/player-react-native-google-dai
```

The companion package is an Expo module and does not require a companion Expo config plugin for the MVP. Installing the package is enough for Expo autolinking.

## Compatibility

- Peer package: `bitmovin-player-react-native@^1.21.0`
- Expo crypto peer: `expo-crypto@>=14.0.0` (used for generated `GoogleDai.nativeId` values)
- Android native DAI artifact: `com.bitmovin.player.integration:google-dai:0.1.0-alpha.1`
- Android Bitmovin Player artifact: pinned to the same `com.bitmovin.player:player` version as the core package.
- iOS Bitmovin Player pod: pinned to the same `BitmovinPlayer` version as the core `RNBitmovinPlayer` pod; the iOS Google DAI pod/API is still unconfirmed.
- Android repository:

```kotlin
repositories {
    maven {
        url = uri("https://artifacts.bitmovin.com/artifactory/public-releases")
    }
}
```

Native DAI artifacts are pinned by this package and are intentionally not consumer-overridable in the MVP.

### Confirmed Android native contract

The Android bridge is implemented against the alpha artifact listed above. The confirmed API surface used by this package is:

- extension property: `com.bitmovin.player.integration.googledai.api.googleDai` on `Player`;
- adapter interface: `GoogleDai` with `load(GoogleDaiSourceConfig)`;
- live source config: `GoogleDaiSourceConfig.Live(assetKey, type, apiKey, networkCode, adTagParameters)`;
- native Android source type enum values: `GoogleDaiSourceType.Dash` and `GoogleDaiSourceType.Hls` (the companion JavaScript API exposes `GoogleDaiSourceType.DASH` and `GoogleDaiSourceType.HLS`).

The alpha Android adapter has no public `destroy()` method on the `GoogleDai` interface. The React Native bridge removes all of its registries/listeners on `destroy()` and performs a best-effort native adapter cleanup if the implementation exposes a no-argument `destroy` method.

### Android runtime compatibility status

The companion is aligned with the core Android Player SDK version `3.159.0+jason`, which is expected to satisfy the alpha Google DAI artifact's `AdvertisingApi.getViewGroup()` requirement.

Previous validation against Android Player SDK `3.155.1+jason` failed with:

```txt
NoSuchMethodError: No interface method getViewGroup()Landroid/view/ViewGroup;
in class Lcom/bitmovin/player/api/advertising/AdvertisingApi;
```

The Android bridge keeps a native compatibility preflight for `AdvertisingApi.getViewGroup()` before native adapter initialization/load and surfaces any mismatch as a `Google DAI native dependency compatibility error`. Runtime DAI playback validation still needs to be rerun with `3.159.0+jason` on a device or emulator.

## Usage

```tsx
import { useEffect, useMemo } from 'react';
import { Button } from 'react-native';
import { Player, PlayerView } from 'bitmovin-player-react-native';
import {
  GoogleDaiSourceType,
  withGoogleDai,
} from '@bitmovin/player-react-native-google-dai';

export function GoogleDaiPlayer() {
  const player = useMemo(
    () =>
      withGoogleDai(
        new Player({
          playbackConfig: {
            isAutoplayEnabled: true,
          },
        })
      ),
    []
  );

  useEffect(() => {
    return () => player.destroy();
  }, [player]);

  return (
    <>
      <PlayerView
        player={player}
        onPlayerError={(event) => console.warn(event)}
        onAdStarted={(event) => console.warn('ad started', event)}
      />
      <Button
        title="Load DAI"
        onPress={() => {
          void player.googleDai.load({
            kind: 'live',
            assetKey: '...',
            type: GoogleDaiSourceType.HLS,
            apiKey: '...',
            networkCode: '...',
            adTagParameters: {
              cust_params: '...',
            },
          });
        }}
      />
    </>
  );
}
```

## API

```ts
const player = withGoogleDai(new Player(config));
await player.googleDai.load(liveDaiConfig);
player.play();
player.destroy();
```

`withGoogleDai(player)` preserves the original player object identity, attaches a read-only non-enumerable `googleDai` property to that player instance, and returns `Player & GoogleDaiCapability`. It does not modify `Player.prototype`. Repeated calls with the same player return the same `GoogleDai` instance. `player.googleDai.load()` lazily creates the native DAI adapter for an already initialized player before loading the source config. It does not initialize the core `Player`.

### Source config

```ts
export enum GoogleDaiSourceType {
  DASH = 'dash',
  HLS = 'hls',
}

export interface GoogleDaiLiveSourceConfig {
  kind: 'live';
  assetKey: string;
  type: GoogleDaiSourceType;
  apiKey?: string;
  networkCode?: string;
  adTagParameters?: Record<string, string>;
}
```

The MVP supports live DAI streams only. VOD support is intentionally rejected until the native source-config contract is added.

### Public runtime validation samples

For Android runtime smoke tests, Google publishes test DAI streams using network code `21775744923`:

```ts
// Big Buck Bunny live HLS
{
  kind: 'live',
  assetKey: 'c-rArva4ShKVIAkNfy6HUQ',
  networkCode: '21775744923',
  type: GoogleDaiSourceType.HLS,
}

// Tears of Steel live DASH
{
  kind: 'live',
  assetKey: 'PSzZMzAkSXCmlJOWDmRj8Q',
  networkCode: '21775744923',
  type: GoogleDaiSourceType.DASH,
}
```

Google's API-key-protected Big Buck Bunny sample uses asset key `XYrjlG09QTa8pxAo5Fzjww` with test API key `8B1DA006064BD04C5CD474456AB8C9BDA790628E3184E95074EC65E308331EBC`.

## Lifecycle and limitations

- `withGoogleDai(player)` validates that `player.nativeId` is a non-empty string and that the native `GoogleDaiModule` is available.
- `withGoogleDai(player)` throws if the player already defines a conflicting `googleDai` property.
- The attached `player.googleDai` property is read-only, non-enumerable, and stored internally under a private symbol without modifying `Player.prototype`.
- `player.googleDai.load()` requires an already initialized, non-destroyed `Player`.
- Mount `PlayerView` or explicitly `await player.initialize()` before calling `player.googleDai.load(...)`.
- Google DAI needs the player's ad UI container; mount/attach `PlayerView` before loading DAI.
- If `load()` is called without a mounted `PlayerView`, the native SDK may surface a fatal player error through existing `onPlayerError` events.
- Only one active `GoogleDai` instance is allowed per `Player`.
- `player.googleDai.destroy()` is awaitable and idempotent.
- If `destroy()` is called while initialization is in flight, native cleanup waits for that initialization attempt before releasing ownership.
- `withGoogleDai(player)` registers Google DAI cleanup with the player destroy lifecycle without overriding or monkey-patching `player.destroy()`.
- Native bridges unregister on player destruction, but call `player.googleDai.destroy()` explicitly when possible to release companion ownership deterministically.
- After `destroy()`, a JS `GoogleDai` object cannot be used again.
- Existing player ad/error events are reused; the MVP adds no DAI-specific JS events.
- The existing hard Google IMA dependency in the core package is out of scope for this companion package.

## iOS status

The iOS Expo module currently validates lifecycle/source-config errors, tracks one active placeholder integration per player, unregisters on explicit/player destroy, and rejects `load()` with a clear `IOS_GOOGLE_DAI_NOT_IMPLEMENTED` error. The following iOS SDK-owner confirmations are still required before public release:

- pod name and module import;
- supported platforms;
- native DAI adapter class and constructor;
- source config type and source type enum;
- load/destroy semantics;
- regular ad/SSAI event forwarding behavior.

## Validation and release checklist

Run the companion TypeScript checks from the repository root:

```sh
yarn build:google-dai
yarn lint:google-dai
yarn typecheck:google-dai
```

Native/package validation is manual for now. For Android, generate `example/android` and `example/node_modules`, open the committed `Google IMA DAI` example screen, verify Expo autolinking, build the example app, and confirm Gradle resolves `com.bitmovin.player.integration:google-dai:0.1.0-alpha.1`. For runtime validation, launch that example screen on a device/emulator and confirm `player.googleDai.load(liveConfig)` reaches playback/ad events.

For iOS, validate the placeholder module with SwiftLint/Xcode or CocoaPods as available, and confirm Apple autolinking resolves `RNBitmovinPlayerGoogleDai` when the companion is installed.

The companion package has a guarded `prepublishOnly` script and is blocked from publishing by default. Set `BITMOVIN_GOOGLE_DAI_ALLOW_PUBLISH=1` only after the checklist below is complete.

Before publishing this companion package:

- [ ] companion TypeScript build, lint, and typecheck pass;
- [ ] companion Android native lint/build checks pass;
- [ ] companion iOS native lint/build checks pass after the iOS DAI dependency is confirmed;
- [ ] a core-only fixture builds without autolinking `GoogleDaiModule`;
- [ ] the core-only fixture has no Android `google-dai` artifact in its dependency tree;
- [ ] a DAI-enabled fixture autolinks the companion package without a config plugin;
- [ ] the DAI-enabled fixture resolves the pinned Android `google-dai` artifact;
- [ ] the DAI-enabled fixture resolves the confirmed iOS DAI dependency;
- [ ] `withGoogleDai(player)` attaches `player.googleDai` and initializes through the bridge;
- [ ] `player.googleDai.load(liveConfig)` starts a DAI stream request and playback;
- [ ] existing player ad/error events cover the DAI lifecycle and serialize SSAI ad objects;
- [ ] duplicate, invalid-config, destroyed-player, and double-destroy error cases are covered;
- [ ] release, package-maintenance, CI-fixture, and native-dependency-pin owners are assigned.
