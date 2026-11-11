import { NativeAnalytics } from '../modules/playerModule';
import type { Player } from '../player';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi extends NativeAnalytics {
  // Retains configured JS callbacks while this native API handle is retained.
  declare private readonly owner: Player;

  /** @internal */
  constructor(owner: Player) {
    super(owner);
    this.owner = owner;
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent: (customData: CustomDataConfig) => Promise<void> =
    super.sendCustomDataEvent.bind(this);

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId: () => Promise<string | null> = super.getUserId.bind(this);
}
