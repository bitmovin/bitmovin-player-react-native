# Apple SDK dependencies

The Player and Google IMA SDKs are installed through Swift Package Manager (SPM).
CocoaPods still installs the React Native bridge, ExpoModulesCore, and optional
Google Cast SDK. Keep running `pod install` after prebuild.

## Expo projects

Run Expo prebuild after installing or upgrading this library, then install pods
and open the generated `.xcworkspace`. The Bitmovin config plugin configures both
the bridge and application targets. Xcode resolves and embeds the package products
when building the app. Use `EXPO_TV=1` for tvOS prebuilds.

Package versions and products live in `ios/dependencies.json`. The podspec and
config plugin read the same file. Do not add separate CocoaPods dependencies for
Player, Player Core, Analytics, or IMA.

The plugin records its package references in the Xcode project's
`BitmovinSwiftPackages` attributes. It updates those references on SDK upgrades.
If a requirement was changed manually or is shared with another target, prebuild
reports a conflict instead. Align that requirement with the manifest and rerun
prebuild. Keep the project attributes when editing the generated project.

## Projects without Expo prebuild

The app must already support Expo modules and call `react_native_post_install`
in its Podfile. React Native's `spm_dependency` helper must be available.

1. Set `BITMOVIN_APPLE_PLATFORM` to `ios` or `tvos` in the
   `Podfile.properties.json` beside your Podfile.
2. Remove explicit Player, Analytics, and IMA pod dependencies, then run
   `pod install`. Keep the bridge and Expo dependencies.
3. In Xcode, add the Player package and the appropriate IMA package from
   `node_modules/bitmovin-player-react-native/ios/dependencies.json`, using their
   exact versions. Add their named products to the application target's
   Frameworks, Libraries, and Embedded Content. Let Xcode embed the dynamic
   frameworks supplied by these products.
4. Build and launch the app. A successful compilation alone does not verify
   framework embedding. Repeat this check for Release archives and tvOS if used.

Repeat the package-version updates when upgrading the library. Apps with multiple
application targets must integrate the products into each target using the bridge.

## Maintaining the integration

Use `python3 .github/scripts/update_ios_sdk_version.py <version>` to update the Player
pin. The SDK update workflow uses this command too. Change IMA pins in the same
manifest when updating IMA.

Run `yarn test:plugin` to check repeated prebuilds, SDK upgrades, platform switching,
and preservation of customer-managed references. Native CI resolves SPM packages
and builds the examples. Validate app launch, playback, ads, Analytics, and signed
device archives separately; compilation alone does not verify runtime behavior.

CI saves each example's `Package.resolved` as an artifact so the selected
transitive versions can be inspected. In application repositories, keep the
workspace's `xcshareddata/swiftpm/Package.resolved` under version control and
refresh it when changing SDK versions. Player and IMA use exact pins; Player's
Analytics dependency allows compatible updates.
