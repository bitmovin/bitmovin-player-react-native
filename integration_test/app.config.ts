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

const BITMOVIN_PLAYER_LICENSE_KEY = process.env.BITMOVIN_PLAYER_LICENSE_KEY;

if (!BITMOVIN_PLAYER_LICENSE_KEY) {
  throw new Error(
    'BITMOVIN_PLAYER_LICENSE_KEY is required. Please set it in your .env file.'
  );
}

export default {
  expo: {
    name: 'IntegrationTest',
    slug: 'integration-test',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      deploymentTarget: '14.0',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 21,
    },
    plugins: [
      [
        '../',
        {
          playerLicenseKey: BITMOVIN_PLAYER_LICENSE_KEY,
        },
      ],
    ],
  },
  licenseKey: BITMOVIN_PLAYER_LICENSE_KEY,
};
