import { NativeModules } from 'react-native';
import { CustomDataConfig } from './config';

const AnalyticsModule = NativeModules.AnalyticsModule;

/**
 * Provides the means to control the analytics collected by a `Player`.
 * Use the `Player.analytics` property to access a `Player`'s `AnalyticsApi`.
 */
export class AnalyticsApi {
  /**
   * The native player id that this analytics api is attached to.
   */
  playerId: string;

  constructor(playerId: string) {
    this.playerId = playerId;
  }

  /**
   * Sends a sample with the provided custom data.
   * Does not change the configured custom data of the collector or source.
   */
  sendCustomDataEvent = (customData: CustomDataConfig) => {
    AnalyticsModule.sendCustomDataEvent(this.playerId, customData);
  };

  /**
   * Gets the current user id used by the bundled analytics instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string> => {
    return AnalyticsModule.getUserId(this.playerId);
  };
}
