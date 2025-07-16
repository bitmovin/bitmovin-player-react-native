import PlayerTestWorld from './playertesting/PlayerTestWorld';

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
PlayerTestWorld.defaultLicenseKey = BITMOVIN_PLAYER_LICENSE_KEY;

import { registerRootComponent } from 'expo';
import TestableApp from './src/TestableApp';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(TestableApp);
