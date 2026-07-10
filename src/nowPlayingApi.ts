import { Platform } from 'react-native';
import NowPlayingModule from './modules/NowPlayingModule';

/**
 * Provides control for the Player's Now Playing integration.
 *
 * Accessible through {@link Player.nowPlaying}.
 *
 * @platform iOS
 */
export class NowPlayingApi {
  /**
   * The native player id that this Now Playing api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    this.nativeId = playerId;
  }

  /**
   * Indicates whether the Player publishes Now Playing information and registers media command handlers.
   *
   * The initial value is configured via {@link MediaControlConfig.isEnabled}.
   * Disabling this integration clears the Player's Now Playing metadata and removes the Player's command handlers.
   *
   * ## Limitations
   * - Google IMA SDK instances that were already created can still publish their own Now Playing information.
   * - This API only controls the Bitmovin Player media controls integration.
   *   It does not manage media controls, sessions, command handlers, or metadata
   *   created directly by the app or by other libraries.
   *
   * @platform iOS
   * @returns `true` if the Now Playing integration is enabled, `false` otherwise. Always `false` on Android.
   */
  isEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method nowPlaying.isEnabled is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return (await NowPlayingModule.isEnabled(this.nativeId)) ?? false;
  };

  /**
   * Enables or disables the Player's Now Playing integration at runtime.
   *
   * @platform iOS
   * @param enabled Whether the Now Playing integration should be enabled.
   */
  setEnabled = async (enabled: boolean): Promise<void> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method nowPlaying.setEnabled is not available for Android. Only iOS devices.`
      );
      return;
    }
    return NowPlayingModule.setEnabled(this.nativeId, enabled);
  };
}
