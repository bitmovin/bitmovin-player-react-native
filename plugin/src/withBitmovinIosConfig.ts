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
  const googleCastIosConfig = features.googleCastSDK?.ios
    ? typeof features.googleCastSDK.ios === 'string'
      ? { version: features.googleCastSDK.ios }
      : features.googleCastSDK.ios
    : null;

  config = withInfoPlist(config, (config) => {
    if (playerLicenseKey) {
      config.modResults['BitmovinPlayerLicenseKey'] = playerLicenseKey;
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
      }
      if (googleCastIosConfig) {
        const appId =
          googleCastIosConfig.appId || googleCastConfig?.appId || 'FFE417E5';
        const messageNamespace =
          googleCastIosConfig.messageNamespace ||
          googleCastConfig?.messageNamespace;
        const localNetworkUsageDescription =
          googleCastIosConfig.localNetworkUsageDescription ||
          '${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.';

        config.modResults['BitmovinPlayerGoogleCastApplicationId'] = appId;
        if (messageNamespace) {
          config.modResults['BitmovinPlayerGoogleCastMessageNamespace'] =
            messageNamespace;
        } else {
          delete config.modResults['BitmovinPlayerGoogleCastMessageNamespace'];
        }

        config.modResults['NSBonjourServices'] = [
          '_googlecast._tcp',
          `_${appId}._googlecast._tcp`,
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
      if (googleCastIosConfig) {
        config.modResults['BITMOVIN_GOOGLE_CAST_SDK_VERSION'] =
          googleCastIosConfig.version;
      }
      return config;
    });
  }

  return config;
};

export default withBitmovinIosConfig;
