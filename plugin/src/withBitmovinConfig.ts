import { ConfigPlugin } from 'expo/config-plugins';
import withBitmovinIosConfig from './withBitmovinIosConfig';
import Features from './Features';
import withBitmovinAndroidConfig from './withBitmovinAndroidConfig';

const defaultFeatureFlags: Features = {
  airPlay: false,
  backgroundPlayback: false,
  googleCastSDK: undefined,
  offline: false,
  pictureInPicture: false,
};

/**
 * Expo Config Plugin for Bitmovin Player.
 * This plugin configures the Bitmovin Player for both iOS and Android platforms.
 * It accepts a player license key and feature flags to customize the player's behavior.
 * @param config - The Expo config object.
 * @param options - An object containing the player license key and feature flags.
 * @returns The modified Expo config object with Bitmovin Player configurations.
 *
 * @example
 * // app.config.js
 * module.exports = {
 *   plugins: [
 *     [
 *       'bitmovin-player-react-native',
 *       {
 *         playerLicenseKey: 'YOUR_BITMOVIN_PLAYER_LICENSE_KEY',
 *         featureFlags: {
 *           airPlay: true,
 *           backgroundPlayback: true,
 *           googleCastSDK: { android: '21.3.0', ios: '4.8.1.2' },
 *           offline: true,
 *           pictureInPicture: true,
 *         },
 *       },
 *     ]
 *   ]
 * };
 */
const withBitmovinConfig: ConfigPlugin<{
  playerLicenseKey: string;
  featureFlags: Features;
}> = (config, { playerLicenseKey, featureFlags }) => {
  const features = { ...defaultFeatureFlags, ...(featureFlags || {}) };
  config = withBitmovinIosConfig(config, { playerLicenseKey, features });
  config = withBitmovinAndroidConfig(config, { playerLicenseKey, features });
  return config;
};

export default withBitmovinConfig;
