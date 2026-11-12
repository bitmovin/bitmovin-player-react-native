import { SharedMediaControlsApi } from './modules/playerModule';
import type { Player } from './player';
import { Platform } from 'react-native';

/**
 * Provides control for the Player's media controls integration.
 *
 * Accessible through {@link Player.mediaControls}.
 *
 * @platform iOS/tvOS
 */
export class MediaControlsApi {
  private readonly native?: SharedMediaControlsApi;
  // Retain the configured Player while this runtime helper is reachable.
  declare private readonly player: Player;

  /** @internal */
  constructor(player: Player) {
    this.player = player;
    if (Platform.OS === 'ios')
      this.native = new SharedMediaControlsApi(player.native);
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
   * @platform iOS/tvOS
   * @returns `true` if the media controls integration is enabled, `false` otherwise. Always `false` on Android.
   */
  isEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        'Runtime mediaControls APIs are not implemented on Android yet.'
      );
      return false;
    }
    return (await this.native?.isEnabled()) ?? false;
  };

  /**
   * Enables or disables the Player's media controls integration at runtime.
   *
   * @platform iOS/tvOS
   * @param enabled Whether the media controls integration should be enabled.
   */
  setEnabled = async (enabled: boolean): Promise<void> => {
    if (Platform.OS === 'android') {
      console.warn(
        'Runtime mediaControls APIs are not implemented on Android yet.'
      );
      return;
    }
    return this.native?.setEnabled(enabled);
  };
}
