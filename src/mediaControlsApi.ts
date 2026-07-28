import { Platform } from 'react-native';
import MediaControlsModule from './modules/MediaControlsModule';

/**
 * Provides control for the Player's media controls integration.
 *
 * Accessible through {@link Player.mediaControls}.
 *
 * @platform iOS, tvOS
 */
export class MediaControlsApi {
  /**
   * The native player id that this media controls api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    this.nativeId = playerId;
  }

  /**
   * Indicates whether the Player publishes media control information and registers media command handlers.
   *
   * The initial value is configured via {@link MediaControlConfig.isEnabled}.
   * Disabling this integration clears the Player's media controls metadata and removes the Player's command handlers.
   *
   * ## Limitations
   * - Google IMA SDK instances that were already created can still publish their own media control information.
   * - This API only controls the Bitmovin Player media controls integration.
   *   It does not manage media controls, sessions, command handlers, or metadata
   *   created directly by the app or by other libraries.
   *
   * @platform iOS, tvOS
   * @returns `true` if the media controls integration is enabled, `false` otherwise. Always `false` on Android.
   */
  isEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Runtime mediaControls APIs are not implemented on Android yet.`
      );
      return false;
    }
    return (await MediaControlsModule?.isEnabled(this.nativeId)) ?? false;
  };

  /**
   * Enables or disables the Player's media controls integration at runtime.
   *
   * @platform iOS, tvOS
   * @param enabled Whether the media controls integration should be enabled.
   */
  setEnabled = async (enabled: boolean): Promise<void> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Runtime mediaControls APIs are not implemented on Android yet.`
      );
      return;
    }
    return MediaControlsModule?.setEnabled(this.nativeId, enabled);
  };
}
