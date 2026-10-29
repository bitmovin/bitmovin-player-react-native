import {
  AndroidConfig,
  ConfigPlugin,
  WarningAggregator,
  withAndroidManifest,
  withGradleProperties,
  // TODO: remove with expo 58
  withProjectBuildGradle,
} from 'expo/config-plugins';
import withAppGradleDependencies from './withAppGradleDependencies';
import { BitmovinConfigOptions } from './withBitmovinConfig';

type ManifestActivity = AndroidConfig.Manifest.ManifestActivity;

// TODO: remove with expo 58: START
// Expo SDK 58's React Native version uses Kotlin 2.2 and compiles against
// SDK 37 by default, so the app's versions no longer need to be raised.

// The Android player's transitive dependencies ship Kotlin 2.3 metadata, which
// needs at least a Kotlin 2.2 compiler.
const MIN_KOTLIN_VERSION = '2.2.21';
// Required by okhttp-android 5.5.0, which is pulled in by the Android player.
const MIN_COMPILE_SDK_VERSION = 37;

const KOTLIN_GRADLE_PLUGIN_CLASSPATH =
  /classpath\(\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::([^'"]*))?['"]\s*\)/;

const ROOT_PROJECT_PLUGIN = 'apply plugin: "expo-root-project"';
const GENERATED_BLOCK_BEGIN =
  '// @generated begin bitmovin-player-react-native';
const GENERATED_BLOCK_END = '// @generated end bitmovin-player-react-native';

// Expo's root project plugin only sets `kotlinVersion` and `compileSdkVersion`
// if they are not defined yet, so defining them before it is applied takes
// precedence over Expo's defaults.
const ROOT_PROJECT_VERSIONS = `${GENERATED_BLOCK_BEGIN}
// Gradle resolves the Kotlin Gradle plugin to the highest requested version, so
// let Expo pick KSP for that version instead of its default Kotlin version.
def kotlinGradlePlugin = buildscript.configurations.classpath.incoming.resolutionResult.allComponents
  .find { it.moduleVersion.group == 'org.jetbrains.kotlin' && it.moduleVersion.name == 'kotlin-gradle-plugin' }
if (kotlinGradlePlugin != null) {
  ext.kotlinVersion = kotlinGradlePlugin.moduleVersion.version
}
// Raise Expo's compile SDK version only if it is lower than required.
ext.compileSdkVersion = Math.max(
  ${MIN_COMPILE_SDK_VERSION},
  versionCatalogs.find('expoLibs')
    .flatMap { it.findVersion('compileSdk') }
    .map { it.requiredVersion as int }
    .orElse(0)
)
${GENERATED_BLOCK_END}`;

const compareVersions = (a: string, b: string) => {
  const aParts = a.split('.').map((part) => parseInt(part, 10) || 0);
  const bParts = b.split('.').map((part) => parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
};

const isLiteralVersion = (version: string) => /^\d+(\.\d+)*$/.test(version);

/**
 * Pins the Kotlin Gradle plugin in the root `build.gradle` to at least
 * `MIN_KOTLIN_VERSION`. The Expo template declares the plugin without a
 * version, so it would otherwise resolve to the version used by React Native's
 * Gradle plugin. Versions that are already high enough or not literal (e.g.
 * `$kotlinVersion`) are left untouched.
 */
const pinKotlinGradlePluginVersion = (contents: string) => {
  const match = contents.match(KOTLIN_GRADLE_PLUGIN_CLASSPATH);
  if (!match) {
    WarningAggregator.addWarningAndroid(
      'bitmovin-player-react-native',
      `Could not find the Kotlin Gradle plugin classpath entry in android/build.gradle. Make sure the app uses Kotlin ${MIN_KOTLIN_VERSION} or newer.`
    );
    return contents;
  }
  const currentVersion = match[1];
  if (
    currentVersion &&
    (!isLiteralVersion(currentVersion) ||
      compareVersions(currentVersion, MIN_KOTLIN_VERSION) >= 0)
  ) {
    return contents;
  }
  return contents.replace(
    KOTLIN_GRADLE_PLUGIN_CLASSPATH,
    `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${MIN_KOTLIN_VERSION}')`
  );
};

/**
 * Defines the Kotlin and compile SDK versions in the root `build.gradle` before
 * Expo's root project plugin is applied. The block is replaced on repeated
 * prebuilds, so it is only added once.
 */
const defineRootProjectVersions = (contents: string) => {
  const existingBlock = new RegExp(
    `${GENERATED_BLOCK_BEGIN}[\\s\\S]*?${GENERATED_BLOCK_END}`
  );
  if (existingBlock.test(contents)) {
    return contents.replace(existingBlock, ROOT_PROJECT_VERSIONS);
  }
  if (!contents.includes(ROOT_PROJECT_PLUGIN)) {
    WarningAggregator.addWarningAndroid(
      'bitmovin-player-react-native',
      `Could not find "${ROOT_PROJECT_PLUGIN}" in android/build.gradle. Make sure the app uses compileSdkVersion ${MIN_COMPILE_SDK_VERSION} or newer and a KSP version matching its Kotlin version.`
    );
    return contents;
  }
  return contents.replace(
    ROOT_PROJECT_PLUGIN,
    `${ROOT_PROJECT_VERSIONS}\n${ROOT_PROJECT_PLUGIN}`
  );
};
// TODO: remove with expo 58: END

const withBitmovinAndroidConfig: ConfigPlugin<BitmovinConfigOptions> = (
  config,
  options
) => {
  const { playerLicenseKey = '', features = {} } = options || {};
  const offlineFeatureConfig =
    typeof features.offline === 'object'
      ? features.offline
      : {
          android: {
            isEnabled: !!features.offline,
            externalStoragePermission: false,
          },
          ios: { isEnabled: !!features.offline },
        };

  if (features.backgroundPlayback) {
    config = AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.FOREGROUND_SERVICE',
    ]);
  }

  if (offlineFeatureConfig.android?.isEnabled) {
    config = AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.POST_NOTIFICATIONS',
    ]);
    if (offlineFeatureConfig.android?.externalStoragePermission) {
      config = AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ]);
    }
  }

  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    if (playerLicenseKey) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        mainApplication,
        'BITMOVIN_PLAYER_LICENSE_KEY',
        playerLicenseKey
      );
    }

    config.modResults.manifest['uses-permission'] =
      config.modResults.manifest['uses-permission'] || [];

    // Configure Picture-in-Picture support
    if (features.pictureInPicture) {
      const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
        config.modResults
      );

      // Add PiP support attribute
      mainActivity.$['android:supportsPictureInPicture'] = 'true';

      // Enhance configChanges to handle PiP transitions properly
      const currentConfigChanges =
        mainActivity.$['android:configChanges'] || '';
      const requiredConfigChanges = [
        'keyboard',
        'keyboardHidden',
        'orientation',
        'screenLayout',
        'screenSize',
        'smallestScreenSize',
        'uiMode',
      ];

      const existingChanges = currentConfigChanges.split('|').filter(Boolean);
      const allChanges = [
        ...new Set([...existingChanges, ...requiredConfigChanges]),
      ];
      mainActivity.$['android:configChanges'] = allChanges.join('|');
    }

    if (features.backgroundPlayback) {
      mainApplication.service = mainApplication.service || [];
      if (
        !mainApplication.service.find(
          (s) =>
            s.$['android:name'] ===
            'com.bitmovin.player.reactnative.services.MediaSessionPlaybackService'
        )
      ) {
        mainApplication.service.push({
          '$': {
            'android:name':
              'com.bitmovin.player.reactnative.services.MediaSessionPlaybackService',
            'android:exported': 'true',
            'android:foregroundServiceType': 'mediaPlayback',
          },
          'intent-filter': [
            {
              action: [
                {
                  $: {
                    'android:name':
                      'androidx.media3.session.MediaSessionService',
                  },
                },
              ],
            },
          ],
        });
      }
    }

    if (features.googleCastSDK) {
      const expandedControllerActivity = {
        '$': {
          'android:name':
            'com.bitmovin.player.casting.ExpandedControllerActivity',
          'android:exported': 'true',
          'android:label': '@string/app_name',
          'android:launchMode': 'singleTask',
          'android:screenOrientation': 'portrait',
        },
        'intent-filter': [
          {
            action: [
              {
                $: { 'android:name': 'android.intent.action.MAIN' },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.PARENT_ACTIVITY',
              'android:value': '.MainActivity', // maybe needs to be taken from main activity
            },
          },
        ],
      } as ManifestActivity;
      mainApplication.activity = mainApplication.activity || [];
      if (
        !mainApplication.activity.find(
          (a) =>
            a.$['android:name'] === expandedControllerActivity.$['android:name']
        )
      ) {
        mainApplication.activity.push(expandedControllerActivity);
      }

      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        mainApplication,
        'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME',
        'com.bitmovin.player.casting.BitmovinCastOptionsProvider'
      );

      let appId = features.googleCastSDK.appId;
      let messageNamespace = features.googleCastSDK.messageNamespace;
      if (typeof features.googleCastSDK.android == 'object') {
        // Override the top level appId and messageNamespace
        appId = features.googleCastSDK.android?.appId || appId;
        messageNamespace =
          features.googleCastSDK.android.messageNamespace || messageNamespace;
      }

      if (appId) {
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
          mainApplication,
          'BITMOVIN_CAST_APP_ID',
          appId
        );

        // Adding a messageNamespace inside the appId if block,
        // as there should not be a custom namespace without a custom appId
        if (messageNamespace) {
          AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'BITMOVIN_CAST_MESSAGE_NAMESPACE',
            messageNamespace
          );
        }
      }
    }

    return config;
  });

  const dependencies: string[] = [];
  if (features.offline) {
    dependencies.push(
      'androidx.localbroadcastmanager:localbroadcastmanager:1.1.0'
    );
  }

  if (features.googleCastSDK?.android) {
    const castSdkVersion =
      typeof features.googleCastSDK.android === 'string'
        ? features.googleCastSDK.android
        : features.googleCastSDK.android.version;
    if (!castSdkVersion) {
      throw new Error(
        'Google Cast SDK version is not specified in feature flags.'
      );
    }
    dependencies.push(
      `com.google.android.gms:play-services-cast-framework:${castSdkVersion}`
    );
  }

  config = withAppGradleDependencies(config, {
    dependencies,
    // The Android player only requires core library desugaring for Google IMA.
    coreLibraryDesugaring: !!features.googleIMA,
  });

  // TODO: remove with expo 58: START
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = defineRootProjectVersions(
        pinKotlinGradlePluginVersion(config.modResults.contents)
      );
    } else {
      WarningAggregator.addWarningAndroid(
        'bitmovin-player-react-native',
        `Cannot configure a Kotlin DSL build.gradle. Make sure the app uses Kotlin ${MIN_KOTLIN_VERSION} or newer, a KSP version matching it and compileSdkVersion ${MIN_COMPILE_SDK_VERSION} or newer.`
      );
    }
    return config;
  });
  // TODO: remove with expo 58: END

  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;
    AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      properties,
      'BITMOVIN_ENABLE_GOOGLE_IMA',
      String(!!features.googleIMA)
    );

    const existingEntry = properties.find(
      (item) =>
        item.type === 'property' &&
        item.key === 'android.extraMavenRepos' &&
        item.value
    );
    const mavenRepos = JSON.parse(
      existingEntry?.type == 'property' ? existingEntry.value : '[]'
    );
    const bitmovinRepoUrl =
      'https://artifacts.bitmovin.com/artifactory/public-releases';
    // Only add if not already present
    if (!mavenRepos.some((repo: any) => repo.url === bitmovinRepoUrl)) {
      mavenRepos.push({ url: bitmovinRepoUrl });
    }
    AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      properties,
      'android.extraMavenRepos',
      JSON.stringify(mavenRepos)
    );

    // Files that are shipped by multiple transitive dependencies of the native
    // player and would otherwise fail the app packaging with duplicate entries.
    const packagingExcludes = ['META-INF/versions/9/OSGI-INF/MANIFEST.MF'];
    const packagingExcludesKey = 'android.packagingOptions.excludes';
    const existingExcludesEntry = properties.find(
      (item) => item.type === 'property' && item.key === packagingExcludesKey
    );
    const existingExcludes =
      existingExcludesEntry?.type === 'property'
        ? existingExcludesEntry.value
            .split(',')
            .map((exclude) => exclude.trim())
        : [];

    AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      properties,
      packagingExcludesKey,
      [...new Set([...existingExcludes, ...packagingExcludes])].join(',')
    );

    config.modResults = properties;
    return config;
  });

  return config;
};

export default withBitmovinAndroidConfig;
