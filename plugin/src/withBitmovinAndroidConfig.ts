import { AndroidConfig, ConfigPlugin, withAndroidManifest, withGradleProperties } from "expo/config-plugins";
import FeatureFlags from "./FeatureFlags";
import withAppGradleDependencies from "./withAppGradleDependencies";

type ManifestActivity = AndroidConfig.Manifest.ManifestActivity;

const withBitmovinAndroidConfig: ConfigPlugin<{ playerLicenseKey: string, features: FeatureFlags }> = (config, { playerLicenseKey, features }) => {
  const offlineFeatureConfig = typeof features.offline === 'object' ? features.offline : { android: { isEnabled: !!features.offline, externalStoragePermission: false }, ios: { isEnabled: !!features.offline } };

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

  config = withAndroidManifest(config, config => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'BITMOVIN_PLAYER_LICENSE_KEY',
      playerLicenseKey
    );

    config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'] || [];
    if (features.backgroundPlayback) {
      mainApplication.service = mainApplication.service || [];;
      if (!mainApplication.service.find(s => s.$['android:name'] === 'com.bitmovin.player.reactnative.services.MediaSessionPlaybackService')) {
        mainApplication.service.push({
          $: {
            'android:name': 'com.bitmovin.player.reactnative.services.MediaSessionPlaybackService',
            'android:foregroundServiceType': 'mediaPlayback',
            'android:exported': 'true',
          },
          'intent-filter': [{
            action: [{
              $: { 'android:name': 'androidx.media3.session.MediaSessionService' },
            }]
          }],
        });
      }
    }

    if (features.googleCastSDK) {
      const expandedControllerActivity = {
        $: {
          'android:name': 'com.bitmovin.player.casting.ExpandedControllerActivity',
          'android:exported': 'true',
          'android:label': '@string/app_name',
          'android:launchMode': 'singleTask',
          'android:screenOrientation': 'portrait',
        },
        'intent-filter': [{
          action: [{
            $: { 'android:name': 'android.intent.action.MAIN' },
          }]
        },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.PARENT_ACTIVITY',
              'android:value': '.MainActivity',// maybe needs to be taken from main activity
            },
          },
        ],
      } as ManifestActivity;
      mainApplication.activity = mainApplication.activity || [];
      if (!mainApplication.activity.find(a => a.$['android:name'] === expandedControllerActivity.$['android:name'])) {
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

  const dependencies: string[] = [];
  if (features.offline) {
    dependencies.push('androidx.localbroadcastmanager:localbroadcastmanager:1.1.0');
  }

  if (features.googleCastSDK?.android) {
    const castSdkVersion = typeof features.googleCastSDK.android === 'string' ? features.googleCastSDK.android : features.googleCastSDK.android.version;
    dependencies.push(`com.google.android.gms:play-services-cast-framework:${castSdkVersion}`);
    dependencies.push('androidx.mediarouter:mediarouter:1.3.1');
  }

  config = withAppGradleDependencies(config, { dependencies });

  config = withGradleProperties(config, config => {
    const properties = config.modResults
    const existingEntry = properties.find(item =>
      item.type === 'property' && item.key === 'android.extraMavenRepos' && item.value
    );
    if (existingEntry) {
      properties.splice(config.modResults.indexOf(existingEntry), 1);
    }
    const mavenRepos = JSON.parse(existingEntry?.type == 'property' ? existingEntry.value : '[]');
    mavenRepos.push(
      {
        "url": "https://artifacts.bitmovin.com/artifactory/public-releases"
      }
    )
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
