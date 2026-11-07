import PlayerModule, { getNativePlayer } from '../modules/PlayerModule';
import type { Player } from '../player';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  constructor(private readonly player: Player) {}

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = async (customData: CustomDataConfig) => {
    await (
      getNativePlayer(this.player) ?? PlayerModule.createEmpty()
    ).sendCustomDataEvent(customData);
  };

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string | null> => {
    return (
      getNativePlayer(this.player) ?? PlayerModule.createEmpty()
    ).getAnalyticsUserId();
  };
}
