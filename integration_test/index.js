// Metro inlines EXPO_PUBLIC_CAVY_CI when bundling JavaScript to select the Cavy entry.
if (process.env.EXPO_PUBLIC_CAVY_CI === '1') {
  require('./index.test');
} else {
  const { registerRootComponent } = require('expo');
  const App = require('./src/App').default;
  registerRootComponent(App);
}
