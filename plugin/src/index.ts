import { createRunOncePlugin } from 'expo/config-plugins';
import withBitmovinConfig from './withBitmovinConfig';
import type Features from './Features';

// Keeping the name, and version in sync with it's package.
const pkg = require('../../package.json');

export type { Features as FeatureFlags };
export default createRunOncePlugin(withBitmovinConfig, pkg.name, pkg.version);
