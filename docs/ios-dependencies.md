# iOS SDK dependencies

This guide covers iOS and tvOS apps integrating the React Native Player SDK.
Player is installed through Swift Package Manager (SPM). Google IMA also uses
SPM when explicitly enabled. CocoaPods still installs the React Native bridge,
ExpoModulesCore, and optional Google Cast SDK.

Google IMA is disabled by default. IMA ad sources require it, while Bitmovin
Advertising Module (BAM) ads and ordinary playback do not.

## Enabling Google IMA

### Apps using Expo prebuild

Set `features.googleIMA` in the Bitmovin config plugin:

```js
[
  'bitmovin-player-react-native',
  {
    features: {
      googleIMA: true,
    },
  },
];
```

After enabling or disabling the feature, rerun Expo prebuild, run `pod install`
from the directory containing the Podfile, and rebuild the native app.
The plugin writes `BITMOVIN_ENABLE_GOOGLE_IMA` to
`Podfile.properties.json` and updates the application target's SPM references.

### Apps maintained without Expo prebuild

Set both properties in the `Podfile.properties.json` beside the Podfile before
running `pod install`:

```json
{
  "BITMOVIN_APPLE_PLATFORM": "ios",
  "BITMOVIN_ENABLE_GOOGLE_IMA": "true"
}
```

Use `tvos` for `BITMOVIN_APPLE_PLATFORM` when building tvOS. Always add the
Player package and `BitmovinPlayer` product to the application target. When IMA
is enabled, also add the current platform's IMA package and product listed in
`node_modules/bitmovin-player-react-native/ios/dependencies.json`. Use the exact
versions from that file.

To disable IMA later, set `BITMOVIN_ENABLE_GOOGLE_IMA` to `false`, run
`pod install`, and remove the IMA package, product, framework, and build-file
references that you added to the application target. Keep the Player package
and product.

## Migrating from CocoaPods to SPM

After upgrading the React Native Player package, follow the steps for your
project's workflow.

### Apps using Expo prebuild

1. Remove any explicit Player, Player Core, Analytics, or IMA pod dependencies.
2. Set `features.googleIMA: true` if the app uses IMA ad sources.
3. Rerun Expo prebuild for iOS. Use `EXPO_TV=1` for tvOS prebuilds.
4. Install pods if prebuild did not do so, then open the generated `.xcworkspace`.
5. Build and launch the app. The config plugin configures SPM dependencies for
   both the bridge and application targets.

### Apps maintained without Expo prebuild

Your app must already support Expo modules and call `react_native_post_install`
in its Podfile. React Native's `spm_dependency` helper must be available.

1. Set `BITMOVIN_APPLE_PLATFORM` to `ios` or `tvos` and set
   `BITMOVIN_ENABLE_GOOGLE_IMA` to `true` or `false` in the
   `Podfile.properties.json` beside your Podfile, **before running `pod install`**.
2. Remove explicit Player, Player Core, Analytics, and IMA pod dependencies, then
   run `pod install`. Keep the bridge, Expo, and optional Cast dependencies.
3. In Xcode, add the Player package from
   `node_modules/bitmovin-player-react-native/ios/dependencies.json`. If IMA is
   enabled, add the current platform's IMA package as well. Use the exact
   versions from that file. Add the named products to the application target's
   Frameworks, Libraries, and Embedded Content. Let Xcode embed the dynamic
   frameworks supplied by these products.
4. Build and launch the app. A successful compilation alone does not verify
   framework embedding. Validate Release archives and tvOS if used.

Apps with multiple application targets must integrate the products into each
target using the bridge. New integrations follow the same setup for their chosen
workflow.

## Upgrading after the migration

Check the release notes and the installed package's `ios/dependencies.json` for
native integration changes. If anything changes, rerun prebuild or update the
packages manually according to that release's instructions, then install pods
as needed and rebuild. The CocoaPods-to-SPM migration only needs to happen once.

Keep the workspace's `xcshareddata/swiftpm/Package.resolved` under version control
and refresh it when changing SDK versions. Player and IMA use exact pins; Player's
Analytics dependency allows compatible updates.

## Existing package requirements

The plugin records the package references it creates in the Xcode project's
`BitmovinSwiftPackages` attributes and updates them on SDK upgrades. Keep these
attributes when editing the generated project.

If a requirement was changed manually or is shared with another target, a
conflicting version causes prebuild to fail. Align that requirement with
`dependencies.json` and rerun prebuild.

## Xcode archive failures with version 1.27.0

Archiving an iOS app may fail with:

```text
“BitmovinPlayerAnalytics.xcframework-ios.signature” couldn’t be copied
to “Signatures” because an item with the same name already exists.
```

This happens when Xcode collects duplicate SPM framework signatures from the app
and `RNBitmovinPlayer` build directories. Disabling code signing does not prevent it.

Until a fixed SDK version is available, add a **Run Script build phase at the end
of your app target’s build phases**:

```sh
set -eu

if [ "${ACTION:-}" = "install" ]; then
  shared_dir="${CONFIGURATION_BUILD_DIR:?}"
  pod_dir="$shared_dir/RNBitmovinPlayer"

  for signature in "$pod_dir"/*.xcframework-*.signature; do
    [ -f "$signature" ] || continue
    shared_signature="$shared_dir/$(basename "$signature")"

    if [ -f "$shared_signature" ] &&
       cmp -s "$signature" "$shared_signature"; then
      rm -f "$signature"
    fi
  done
fi
```

Disable **Based on dependency analysis** for this phase so it runs for every
archive. The script removes only duplicate signatures from `RNBitmovinPlayer`
when an identical shared copy exists.

For projects using Expo prebuild, add the phase through a local config plugin so
it survives regeneration of the native project. Remove the workaround after
upgrading to the SDK version containing the fix.
