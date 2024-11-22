import { NativeModules } from 'react-native';

const DebugModule = NativeModules.DebugModule;

export class DebugConfig {
  private static _isDebugEnabled = false;

  /**
   * Enables global debug logging for all Bitmovin components.
   *
   * Provides detailed information primarily for debugging purposes, helping to
   * diagnose problems and trace the flow of execution within the Player.
   *
   * ### Platform-Specific Logging Behavior:
   * - **iOS:** logs are printed using `NSLog` at the verbose log level.
   * - **Android:** logs are printed using `android.util.Log` with the following tags:
   *   - `BitmovinPlayer`
   *   - `BitmovinPlayerView`
   *   - `BitmovinOffline`
   *   - `BitmovinSource`
   *   - `BitmovinExoPlayer`
   *
   * ### Usage Notes:
   * - On Android, this flag **must** be set **before** creating any Bitmovin component to take effect.
   * - We recommend setting this flag during your app's initialization phase, such as in the
   *   `Application.onCreate` function on Android or equivalent initialization on iOS.
   *
   * ### Warning:
   * This option **should not be enabled in production** as it may log sensitive or confidential
   * information to the console.
   *
   * @defaultValue `false`
   */
  static get isDebugLoggingEnabled(): boolean {
    return DebugConfig._isDebugEnabled;
  }

  static set isDebugLoggingEnabled(value: boolean) {
    DebugConfig._isDebugEnabled = value;
    DebugModule.setLoggingEnabled(value).then(() => {});
  }
  // getter sync, setter sync (empty promise)
}

// const DebugConfig = {
//   set isDebugLoggingEnabled(value: boolean) {
//     DebugModule.setLoggingEnabled(value).then(() => {}); // TODO: do I need a promise here?
//   },
//   // use get and set if cannot figure it out
// };

// export default DebugConfig;