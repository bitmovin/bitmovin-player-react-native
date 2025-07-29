import { createRunOncePlugin } from 'expo/config-plugins';
import withBitmovinConfig from './withBitmovinConfig';
import FeatureFlags from './FeatureFlags';

// Keeping the name, and version in sync with it's package.
const pkg = require('../../package.json');

export { FeatureFlags };
export default createRunOncePlugin(withBitmovinConfig, pkg.name, pkg.version);
