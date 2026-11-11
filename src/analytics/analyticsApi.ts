import { bindNativeMethods } from '../native/bindNativeMethods';
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
    bindNativeMethods(this, NativeAnalytics.prototype);
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
