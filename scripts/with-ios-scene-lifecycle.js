const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withAppDelegate,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

// Backport the Expo 58 app template's scene lifecycle to our Expo 57 apps.
module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(
        'The scene lifecycle plugin requires a Swift AppDelegate.'
      );
    }
    let contents = config.modResults.contents;
    if (!contents.includes('ExpoReactNativeFactoryProvider')) {
      const startup =
        /#if os\(iOS\) \|\| os\(tvOS\)\n\s+window = UIWindow\(frame: UIScreen.main.bounds\)\n\s+factory.startReactNative\([\s\S]*?\)\n#endif/;
      if (
        !contents.includes('class AppDelegate: ExpoAppDelegate {') ||
        !startup.test(contents)
      ) {
        throw new Error(
          'Unexpected Expo 57 AppDelegate scene migration input.'
        );
      }
      contents = contents
        .replace(
          'class AppDelegate: ExpoAppDelegate {',
          'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
        )
        .replace(
          startup,
          '    // SceneDelegate creates the window and starts React Native.'
        );
    }
    config.modResults.contents = contents;
    return config;
  });

  return withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    fs.writeFileSync(
      path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        'SceneDelegate.swift'
      ),
      `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {}
`
    );
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: `${projectName}/SceneDelegate.swift`,
      groupName: projectName,
      project: config.modResults,
    });
    return config;
  });
};
