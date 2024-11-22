import { NativeModules } from 'react-native';

const DebugModule = NativeModules.DebugModule;

/**
 * Global debug configuration for all Bitmovin components.
 */
export class DebugConfig {
  private static _isDebugEnabled = false;

  /**
   * Retrieves the current debug logging state.
   *
   * @returns `true` if debug logging is enabled, otherwise `false`.
   */
  static get isDebugLoggingEnabled(): boolean {
    return DebugConfig._isDebugEnabled;
  }

  /**
   * Enables or disables global debug logging for all Bitmovin components.
   *
   * Debug logging provides detailed information primarily for debugging purposes,
   * helping to diagnose problems and trace the flow of execution within the Player.
   *
   * ### Warning:
   * This option **should not be enabled in production** as it may log sensitive or confidential
   * information to the console.
   *
   * ## Platform-Specific Logging Behavior
   * ---
   * - **iOS:** logs are printed using `NSLog` at the verbose log level.
   * - **Android:** logs are printed using `android.util.Log` with the following tags:
   *   - `BitmovinPlayer`
   *   - `BitmovinPlayerView`
   *   - `BitmovinOffline`
   *   - `BitmovinSource`
   *   - `BitmovinExoPlayer`
   *
   * ## Limitations
   * ---
   * **Android**
   * - This flag **must** be set **before** creating any Bitmovin component to take effect.
   *
   * ## Usage Notes
   * ---
   * - We recommend setting this flag during your app's initialization phase, such as in the
   *   application's entry point (e.g. `App.tsx`).
   *
   * @defaultValue `false`
   */
  static async setDebugLoggingEnabled(value: boolean): Promise<void> {
    DebugConfig._isDebugEnabled = value;
    await DebugModule.setDebugLoggingEnabled(value);
  }
}
