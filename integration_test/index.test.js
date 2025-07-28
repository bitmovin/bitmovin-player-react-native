import PlayerTestWorld from './playertesting/PlayerTestWorld';

const BITMOVIN_PLAYER_LICENSE_KEY =
  process.env.EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY;
if (!BITMOVIN_PLAYER_LICENSE_KEY) {
  throw new Error(
    'EXPO_PUBLIC_BITMOVIN_PLAYER_LICENSE_KEY is not set. Please set it in your .env file.'
  );
}

PlayerTestWorld.defaultLicenseKey = BITMOVIN_PLAYER_LICENSE_KEY;

import { registerRootComponent } from 'expo';
import TestableApp from './src/TestableApp';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(TestableApp);
