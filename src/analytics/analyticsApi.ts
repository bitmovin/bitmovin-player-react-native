import { NativeAnalytics } from '../modules/playerModule';
import type { Player } from '../player';
import { retainPlayerApi } from '../native/playerApiOwner';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi extends NativeAnalytics {
  /** @internal */
  constructor(player: Player) {
    super(player);
    retainPlayerApi(this, player);
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  declare sendCustomDataEvent: (customData: CustomDataConfig) => Promise<void>;

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  declare getUserId: () => Promise<string | null>;
}
