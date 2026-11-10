import type { NativePlayer } from '../modules/playerModule';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  /** @internal */
  constructor(private readonly nativePlayer: Promise<NativePlayer>) {}

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = async (customData: CustomDataConfig) => {
    await (await this.nativePlayer).sendCustomDataEvent(customData);
  };

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string | null> => {
    return (await this.nativePlayer).getAnalyticsUserId();
  };
}
