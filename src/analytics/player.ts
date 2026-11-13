import type { Player } from '../player';
import type { SharedPlayer } from '../modules/playerModule';
import type { CustomDataConfig } from './config';
import PlayerAnalyticsModule from './playerAnalyticsModule';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  private readonly player: SharedPlayer;
  /**
   * The native player id that this analytics api is attached to.
   */
  playerId: string;

  constructor(player: Player) {
    this.playerId = player.nativeId;
    this.player = player.native;
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = async (customData: CustomDataConfig) => {
    await PlayerAnalyticsModule.sendCustomDataEvent(this.player, customData);
  };

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string | null> => {
    return PlayerAnalyticsModule.getUserId(this.player);
  };
}
