import { ExpoConfig } from '@expo/config-types';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  throw new Error(
    `Environment file not found at "integration_test/.env". Please copy "integration_test/.env.example" to "integration_test/.env" and fill it out.`
  );
}

// Load environment variables from .env file
dotenv.config({ path: envPath });

const BITMOVIN_PLAYER_LICENSE_KEY =
  process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;

if (!BITMOVIN_PLAYER_LICENSE_KEY) {
  throw new Error(
    'EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY is required. Please set it in your .env file.'
  );
}

const config: ExpoConfig = {
  name: 'IntegrationTest',
  slug: 'integration-test',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bitmovin.integrationtestnew',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.bitmovin.integrationtestnew',
  },
  plugins: [
    '@react-native-tvos/config-tv',
    [
      'expo-build-properties',
      {
        android: {
          buildToolsVersion: '35.0.0',
        },
        ios: {
          flipper: false,
        },
      },
    ],
    [
      '../app.plugin.js',
      {
        playerLicenseKey: BITMOVIN_PLAYER_LICENSE_KEY,
        featureFlags: {
          airPlay: true,
          backgroundPlayback: true,
          googleCastSDK: { android: '21.3.0', ios: '4.8.1.2' },
          offline: true,
          pictureInPicture: true,
        },
      },
    ],
  ],
};

export default config;
