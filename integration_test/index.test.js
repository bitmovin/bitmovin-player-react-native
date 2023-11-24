import { AppRegistry } from 'react-native';
import TestableApp from './src/TestableApp';
import PlayerWorld from './playertesting/PlayerWorld';
import { name as appName, licenseKey } from './app.json';

PlayerWorld.defaultLicenseKey = licenseKey;

AppRegistry.registerComponent(appName, () => TestableApp);
