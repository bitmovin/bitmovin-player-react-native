import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withGradleProperties,
  withMainActivity,
} from 'expo/config-plugins';
import { addImports } from '@expo/config-plugins/build/android/codeMod';
import {
  mergeContents,
  removeContents,
} from '@expo/config-plugins/build/utils/generateCode';
import withAppGradleDependencies from './withAppGradleDependencies';
import { BitmovinConfigOptions } from './withBitmovinConfig';

type ManifestActivity = AndroidConfig.Manifest.ManifestActivity;

type MainActivityLanguage = 'java' | 'kt';

const BITMOVIN_PIP_ON_PAUSE_TAG =
  'bitmovin-player-react-native-main-activity-onPause';

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
    }

    return config;
  });

  config = withMainActivity(config, (config) => {
    const language = config.modResults.language;

    if (language !== 'java' && language !== 'kt') {
      return config;
    }

    if (features.pictureInPicture) {
      config.modResults.contents = ensurePictureInPictureOnPause(
        config.modResults.contents,
        language
      );
    } else {
      config.modResults.contents = removePictureInPictureOnPause(
        config.modResults.contents
      );
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
    mavenRepos.push({
      url: 'https://artifacts.bitmovin.com/artifactory/public-releases',
    });
    properties.push({
      type: 'property',
      key: 'android.extraMavenRepos',
      value: JSON.stringify(mavenRepos),
    });
    config.modResults = properties;
    return config;
  });

  return config;
};

export default withBitmovinAndroidConfig;

function ensurePictureInPictureOnPause(
  mainActivity: string,
  language: MainActivityLanguage
): string {
  const isJava = language === 'java';
  const snippet = isJava
    ? getJavaPictureInPictureOnPause()
    : getKotlinPictureInPictureOnPause();
  const anchor = /^}/m; // match the class-closing brace (no indentation)

  let contents = addImports(mainActivity, ['android.os.Build'], isJava);
  contents = removePictureInPictureOnPause(contents);

  return mergeContents({
    src: contents,
    newSrc: snippet,
    anchor,
    offset: 0,
    comment: '//',
    tag: BITMOVIN_PIP_ON_PAUSE_TAG,
  }).contents;
}

function removePictureInPictureOnPause(mainActivity: string): string {
  return removeContents({
    src: mainActivity,
    tag: BITMOVIN_PIP_ON_PAUSE_TAG,
  }).contents;
}

function getKotlinPictureInPictureOnPause(): string {
  return [
    '    override fun onPause() {',
    '        // If called while in PiP mode, do not effectively pause RN',
    '        super.onPause()',
    '',
    '        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {',
    '            if (isInPictureInPictureMode) {',
    '                // RN would normally go "paused" here and stop reliably updating UI.',
    '                // Calling onResume() keeps the React Native instance in an active state',
    '                // so JS/UI updates can still be committed while in PiP.',
    '                this.onResume()',
    '            } else {',
    '                // Normal paused behaviour for non-PiP cases',
    '            }',
    '        }',
    '    }',
  ].join('\n');
}

function getJavaPictureInPictureOnPause(): string {
  return [
    '  @Override',
    '  public void onPause() {',
    '    // If called while in PiP mode, do not effectively pause RN',
    '    super.onPause();',
    '',
    '    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {',
    '      if (isInPictureInPictureMode()) {',
    '        // RN would normally go "paused" here and stop reliably updating UI.',
    '        // Calling onResume() keeps the React Native instance in an active state',
    '        // so JS/UI updates can still be committed while in PiP.',
    '        this.onResume();',
    '      } else {',
    '        // Normal paused behaviour for non-PiP cases',
    '      }',
    '    }',
    '  }',
  ].join('\n');
}
