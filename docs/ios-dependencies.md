# iOS SDK dependencies

This guide covers iOS and tvOS apps integrating the React Native Player SDK.
Player and Google IMA are installed through Swift Package Manager (SPM).
CocoaPods still installs the React Native bridge, ExpoModulesCore, and optional
Google Cast SDK.

## Migrating an existing app to this release

After upgrading the React Native Player package, follow the steps for your
project's workflow.

### Apps using Expo prebuild

1. Remove any explicit Player, Player Core, Analytics, or IMA pod dependencies.
2. Rerun Expo prebuild for iOS. Use `EXPO_TV=1` for tvOS prebuilds.
3. Install pods if prebuild did not do so, then open the generated `.xcworkspace`.
4. Build and launch the app. The config plugin configures SPM dependencies for
   both the bridge and application targets.

### Apps maintained without Expo prebuild

Your app must already support Expo modules and call `react_native_post_install`
in its Podfile. React Native's `spm_dependency` helper must be available.

1. Set `BITMOVIN_APPLE_PLATFORM` to `ios` or `tvos` in the
   `Podfile.properties.json` beside your Podfile, **before running `pod install`**.
2. Remove explicit Player, Player Core, Analytics, and IMA pod dependencies, then
   run `pod install`. Keep the bridge, Expo, and optional Cast dependencies.
3. In Xcode, add the Player package and the appropriate IMA package from
   `node_modules/bitmovin-player-react-native/ios/dependencies.json`, using their
   exact versions. Add the named products to the application target's Frameworks,
   Libraries, and Embedded Content. Let Xcode embed the dynamic frameworks
   supplied by these products.
4. Build and launch the app. A successful compilation alone does not verify
   framework embedding. Validate Release archives and tvOS if used.

Apps with multiple application targets must integrate the products into each
target using the bridge. New integrations follow the same setup for their chosen
workflow.

## Upgrading to later releases

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
