/**
 * Expo plugin for bitmovin-player-react-native
 *
 * Example:
 *   "plugins": [
 *     [
 *       "bitmovin-player-react-native",
 *       {
 *          "licenseKey": "ENTER_LICENSE_KEY",
 *          "featureFlags": {
 *            "airPlay": true,
 *            "backgroundPlayback": true,
 *            "googleCastSDK": { "android": "21.3.0", "ios": "4.8.1.2" },
 *            "offline": true,
 *            "pictureInPicture": true
 *         }
 *       }
 *     ]
 *   ]
 */
module.exports = require('./plugin/build');
