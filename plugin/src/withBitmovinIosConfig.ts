import {
  ConfigPlugin,
  withInfoPlist,
  withPodfileProperties,
} from 'expo/config-plugins';
import { BitmovinConfigOptions } from './withBitmovinConfig';

const isTV = !!process.env.EXPO_TV;

const withBitmovinIosConfig: ConfigPlugin<BitmovinConfigOptions> = (
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

  const googleCastConfig = features.googleCastSDK;
  let googleCastVersion =
    typeof googleCastConfig?.ios === 'object'
      ? googleCastConfig?.ios?.version
      : googleCastConfig?.ios;
  let googleCastAppId = googleCastConfig?.appId || 'FFE417E5';
  let googleCastMessageNamespace = googleCastConfig?.messageNamespace;

  if (typeof googleCastConfig?.ios == 'object') {
    googleCastAppId = googleCastConfig?.ios?.appId || googleCastAppId;
    googleCastMessageNamespace =
      googleCastConfig?.ios?.messageNamespace || googleCastMessageNamespace;
  }

  config = withInfoPlist(config, (config) => {
    if (playerLicenseKey) {
      config.modResults['BitmovinPlayerLicenseKey'] = playerLicenseKey;
    } else {
      delete config.modResults['BitmovinPlayerLicenseKey'];
    }
    if (
      features.backgroundPlayback ||
      features.airPlay ||
      features.pictureInPicture
    ) {
      let backgroundModes = new Set(
        config.modResults['UIBackgroundModes'] || []
      );
      backgroundModes.add('audio');
      config.modResults['UIBackgroundModes'] = Array.from(backgroundModes);
    }
    if (!isTV) {
      if (offlineFeatureConfig?.ios?.isEnabled) {
        config.modResults['BitmovinPlayerOfflineSupportEnabled'] = true;
      } else {
        delete config.modResults['BitmovinPlayerOfflineSupportEnabled'];
      }
      if (googleCastConfig?.ios != null) {
        const localNetworkUsageDescription =
          typeof googleCastConfig?.ios === 'object'
            ? googleCastConfig?.ios?.localNetworkUsageDescription
            : '${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.';

        config.modResults['BitmovinPlayerGoogleCastApplicationId'] =
          googleCastAppId;
        if (googleCastMessageNamespace) {
          config.modResults['BitmovinPlayerGoogleCastMessageNamespace'] =
            googleCastMessageNamespace;
        } else {
          delete config.modResults['BitmovinPlayerGoogleCastMessageNamespace'];
        }

        config.modResults['NSBonjourServices'] = [
          '_googlecast._tcp',
          `_${googleCastAppId}._googlecast._tcp`,
        ];
        config.modResults['NSLocalNetworkUsageDescription'] =
          localNetworkUsageDescription;
      } else {
        delete config.modResults['BitmovinPlayerGoogleCastApplicationId'];
        delete config.modResults['BitmovinPlayerGoogleCastMessageNamespace'];
      }
    }
    return config;
  });

  if (!isTV) {
    config = withPodfileProperties(config, (config) => {
      if (googleCastVersion != null) {
        config.modResults['BITMOVIN_GOOGLE_CAST_SDK_VERSION'] =
          googleCastVersion;
      } else {
        delete config.modResults['BITMOVIN_GOOGLE_CAST_SDK_VERSION'];
      }
      return config;
    });
  }

  return config;
};

export default withBitmovinIosConfig;
