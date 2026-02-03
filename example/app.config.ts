import { ExpoConfig } from '@expo/config-types';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  throw new Error(
    `Environment file not found at "example/.env". Please copy "example/.env.example" to "example/.env" and fill it out.`
  );
}

// Load environment variables from .env file
dotenv.config({ path: envPath });

const {
  BITMOVIN_PLAYER_LICENSE_KEY,
  APPLE_DEVELOPMENT_TEAM_ID,
  BITMOVIN_PLAYER_CAST_APP_ID,
  BITMOVIN_PLAYER_CAST_MESSAGE_NAMESPACE,
} = process.env;

if (!BITMOVIN_PLAYER_LICENSE_KEY) {
  throw new Error(
    'BITMOVIN_PLAYER_LICENSE_KEY is not set in example/.env. Please follow the setup instructions in example/README.md.'
  );
}

if (!APPLE_DEVELOPMENT_TEAM_ID) {
  console.warn(
    'APPLE_DEVELOPMENT_TEAM_ID is not set in example/.env. This is required for running on real iOS/tvOS devices. Please follow the setup instructions in example/README.md.'
  );
}

const config: ExpoConfig = {
  name: 'Bitmovin Player React Native Example',
  slug: 'bitmovin-player-react-native-example',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1EABE3',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bitmovin.player.reactnative.example',
    ...(APPLE_DEVELOPMENT_TEAM_ID && {
      appleTeamId: APPLE_DEVELOPMENT_TEAM_ID,
    }),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1EABE3',
    },
    package: 'com.bitmovin.player.reactnative.example',
  },
  plugins: [
    [
      '@react-native-tvos/config-tv',
      {
        androidTVBanner: './assets/android-tv-banner.png',
        appleTVImages: {
          icon: './assets/tvos-1280x768.png',
          iconSmall: './assets/icon-tvos.png',
          iconSmall2x: './assets/icon-tvos@2x.png',
          topShelf: './assets/TopShelf.png',
          topShelf2x: './assets/TopShelf@2x.png',
          topShelfWide: './assets/TopShelfWide.png',
          topShelfWide2x: './assets/TopShelfWide@2x.png',
        },
      },
    ],
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
          googleCastSDK: {
            appId: BITMOVIN_PLAYER_CAST_APP_ID,
            messageNamespace: BITMOVIN_PLAYER_CAST_MESSAGE_NAMESPACE,
            android: {
              version: '21.3.0',
            },
            ios: {
              version: '4.8.4',
            },
          },
          offline: true,
          pictureInPicture: true,
        },
      },
    ],
  ],
};

export default config;
