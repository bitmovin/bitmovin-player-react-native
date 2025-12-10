import { ExpoConfig } from '@expo/config-types';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');
const envExamplePath = path.resolve(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.warn(
      'Created integration_test/.env from integration_test/.env.example. Update it with your Bitmovin license key before running.'
    );
  } else {
    throw new Error(
      'Environment file not found at "integration_test/.env" and no template found at "integration_test/.env.example". Please create it and fill it out.'
    );
  }
}

// Load environment variables from .env file
dotenv.config({ path: envPath });

const BITMOVIN_PLAYER_LICENSE_KEY =
  process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;

if (
  !BITMOVIN_PLAYER_LICENSE_KEY ||
  BITMOVIN_PLAYER_LICENSE_KEY === 'YOUR_LICENSE_KEY_HERE'
) {
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
    bundleIdentifier: 'com.bitmovin.player.reactnative.integrationtests',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.bitmovin.player.reactnative.integrationtests',
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
        features: {
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
