import {
  AndroidConfig,
  ConfigPlugin,
  WarningAggregator,
  withAndroidManifest,
  withGradleProperties,
  withProjectBuildGradle,
} from 'expo/config-plugins';
import withAppGradleDependencies from './withAppGradleDependencies';
import { BitmovinConfigOptions } from './withBitmovinConfig';

type ManifestActivity = AndroidConfig.Manifest.ManifestActivity;

// The Android player's transitive dependencies ship Kotlin 2.3 metadata, which
// needs at least a Kotlin 2.2 compiler.
const MIN_KOTLIN_VERSION = '2.2.21';
// Required by okhttp-android 5.5.0, which is pulled in by the Android player.
// Can be removed with Expo SDK 58, which compiles against SDK 37 by default.
const MIN_COMPILE_SDK_VERSION = 37;

const KOTLIN_GRADLE_PLUGIN_CLASSPATH =
  /classpath\(\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::([^'"]*))?['"]\s*\)/;

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
export const pinKotlinGradlePluginVersion = (contents: string) => {
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

  config = withAppGradleDependencies(config, { dependencies });

  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = pinKotlinGradlePluginVersion(
        config.modResults.contents
      );
    } else {
      WarningAggregator.addWarningAndroid(
        'bitmovin-player-react-native',
        `Cannot pin the Kotlin Gradle plugin in a Kotlin DSL build.gradle. Make sure the app uses Kotlin ${MIN_KOTLIN_VERSION} or newer.`
      );
    }
    return config;
  });

  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const existingEntry = properties.find(
      (item) =>
        item.type === 'property' &&
        item.key === 'android.extraMavenRepos' &&
        item.value
    );
    if (existingEntry) {
      properties.splice(config.modResults.indexOf(existingEntry), 1);
    }
    const mavenRepos = JSON.parse(
      existingEntry?.type == 'property' ? existingEntry.value : '[]'
    );
    const bitmovinRepoUrl =
      'https://artifacts.bitmovin.com/artifactory/public-releases';
    // Only add if not already present
    if (!mavenRepos.some((repo: any) => repo.url === bitmovinRepoUrl)) {
      mavenRepos.push({ url: bitmovinRepoUrl });
    }
    properties.push({
      type: 'property',
      key: 'android.extraMavenRepos',
      value: JSON.stringify(mavenRepos),
    });

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

    const kotlinVersionEntry = properties.find(
      (item) => item.type === 'property' && item.key === 'android.kotlinVersion'
    );
    if (
      kotlinVersionEntry?.type !== 'property' ||
      compareVersions(kotlinVersionEntry.value, MIN_KOTLIN_VERSION) < 0
    ) {
      AndroidConfig.BuildProperties.updateAndroidBuildProperty(
        properties,
        'android.kotlinVersion',
        MIN_KOTLIN_VERSION
      );
    }

    const compileSdkEntry = properties.find(
      (item) =>
        item.type === 'property' && item.key === 'android.compileSdkVersion'
    );
    if (
      compileSdkEntry?.type !== 'property' ||
      (parseInt(compileSdkEntry.value, 10) || 0) < MIN_COMPILE_SDK_VERSION
    ) {
      AndroidConfig.BuildProperties.updateAndroidBuildProperty(
        properties,
        'android.compileSdkVersion',
        `${MIN_COMPILE_SDK_VERSION}`
      );
    }

    config.modResults = properties;
    return config;
  });

  return config;
};

export default withBitmovinAndroidConfig;
