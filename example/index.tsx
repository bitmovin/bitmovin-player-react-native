import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

/* Registering the component to the native environment. */
AppRegistry.registerComponent(appName, () => App);
