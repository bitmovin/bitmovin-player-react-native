import { SharedAnalyticsApi } from '../modules/playerModule';
import type { Player } from '../player';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  private readonly native: SharedAnalyticsApi;

  /** @internal */
  constructor(player: Player) {
    this.native = new SharedAnalyticsApi(player.native);
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = (customData: CustomDataConfig): Promise<void> =>
    this.native.sendCustomDataEvent(customData);

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = (): Promise<string | null> => this.native.getUserId();
}
