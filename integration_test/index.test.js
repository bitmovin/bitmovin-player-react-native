import { AppRegistry } from 'react-native';
import TestableApp from './src/TestableApp';
import PlayerTestWorld from './playertesting/PlayerTestWorld';
import { name as appName, licenseKey } from './app.json';

PlayerTestWorld.defaultLicenseKey = licenseKey;

AppRegistry.registerComponent(appName, () => TestableApp);
