import { ConfigPlugin, withInfoPlist, withPodfileProperties } from "expo/config-plugins";
import FeatureFlags from "./FeatureFlags";

const withBitmovinIosConfig: ConfigPlugin<{ playerLicenseKey: string, features: FeatureFlags }> = (config, { playerLicenseKey, features }) => {
  const offlineFeatureConfig = typeof features.offline === 'object' ? features.offline : { android: { isEnabled: !!features.offline, externalStoragePermission: false }, ios: { isEnabled: !!features.offline } };

  config = withInfoPlist(config, config => {
    config.modResults['BitmovinPlayerLicenseKey'] = playerLicenseKey;
    if (features.backgroundPlayback || features.airPlay || features.pictureInPicture) {
      let backgroundModes = new Set(config.modResults['UIBackgroundModes'] || []);
      backgroundModes.add('audio');
      config.modResults['UIBackgroundModes'] = Array.from(backgroundModes);
    }
    if (offlineFeatureConfig?.ios?.isEnabled) {
      config.modResults['BitmovinPlayerOfflineSupportEnabled'] = true;
    }
    return config;
  });

  config = withPodfileProperties(config, config => {
    if (features.googleCastSDK?.ios) {
      const castSdkVersion = typeof features.googleCastSDK.ios === 'string' ? features.googleCastSDK.ios : features.googleCastSDK.ios.version;
      config.modResults['BITMOVIN_GOOGLE_CAST_SDK_VERSION'] = castSdkVersion;
      // TODO: Roland auto add Google Cast SDK permissions?
    }
    return config;
  });

  return config;
};

export default withBitmovinIosConfig;
