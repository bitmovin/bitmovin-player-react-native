import {
    ConfigPlugin,
  } from 'expo/config-plugins';
  import withBitmovinIosConfig from './withBitmovinIosConfig';
  import FeatureFlags from './FeatureFlags';
  import withBitmovinAndroidConfig from './withBitmovinAndroidConfig';
  
  const defaultFeatureFlags: FeatureFlags = {
    airPlay: false,
    backgroundPlayback: false,
    googleCastSDK: undefined,
    offline: false,
    pictureInPicture: false,
    expoPermissionsServiceFix: false,
  };
  
  const withBitmovinConfig: ConfigPlugin<{ playerLicenseKey: string, featureFlags: FeatureFlags }> = (config, { playerLicenseKey, featureFlags }) => {
    const features = {...defaultFeatureFlags, ...featureFlags || {}};
    config = withBitmovinIosConfig(config, { playerLicenseKey, features });
    config = withBitmovinAndroidConfig(config, { playerLicenseKey, features });
    return config;
  };
  
  export default withBitmovinConfig;
  