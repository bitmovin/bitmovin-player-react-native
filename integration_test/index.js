// CI serves the same Cavy entry used by the local CLI without swapping files.
if (process.env.EXPO_PUBLIC_CAVY_CI === '1') {
  require('./index.test');
} else {
  const { registerRootComponent } = require('expo');
  const App = require('./src/App').default;
  registerRootComponent(App);
}
