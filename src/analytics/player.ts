import {
  nativePlayerReference,
  type NativePlayerReference,
} from '../modules/PlayerModule';
import { Platform } from 'react-native';
import type { Player } from '../player';
import type { CustomDataConfig } from './config';

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  private readonly nativePlayer: NativePlayerReference;

  constructor(player: Player | NativePlayerReference) {
    this.nativePlayer = nativePlayerReference(player);
  }

  private get native() {
    const native = this.nativePlayer();
    if (!native && Platform.OS === 'android') {
      throw Object.assign(new Error('Player is not initialized'), {
        code: 'PlayerAnalyticsError',
      });
    }
    return native;
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = async (customData: CustomDataConfig) => {
    await this.native?.sendCustomDataEvent(customData);
  };

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string | null> => {
    return (await this.native?.getAnalyticsUserId()) ?? null;
  };
}
