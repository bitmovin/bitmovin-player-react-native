import { NativeModules } from 'react-native';
import NativeInstance from '../nativeInstance';
import { AnalyticsConfig, CustomDataConfig } from './config';

const AnalyticsModule = NativeModules.AnalyticsModule;

/**
 * Analytics collector that can be attached to a player object in order to collect and send
 * its analytics information.
 */
export class AnalyticsCollector extends NativeInstance<AnalyticsConfig> {
  /**
   * Whether the native `AnalyticsCollector` object has been created.
   */
  isInitialized = false;

  /**
   * Whether the native `AnalyticsCollector` object has been disposed.
   */
  isDestroyed = false;

  /**
   * Initializes a native `BitmovinPlayerCollector` object.
   */
  initialize = () => {
    if (!this.isInitialized) {
      AnalyticsModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  };

  /**
   * Disposes the native `BitmovinPlayerCollector` object that has been created
   * during initialization.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      AnalyticsModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  };

  /**
   * Attach a player instance to this analytics plugin. After this is completed, BitmovinAnalytics
   * will start monitoring and sending analytics data based on the attached player instance.
   *
   * @param playerId - Native Id of the player to attach this collector instance.
   */
  attach = (playerId: string): void => {
    AnalyticsModule.attach(this.nativeId, playerId);
  };

  /**
   * Detach a player instance from this analytics plugin if there's any attached. If no player is attached,
   * nothing happens.
   */
  detach = (): void => {
    AnalyticsModule.detach(this.nativeId);
  };

  /**
   * Dynamically updates analytics custom data information. Use this method
   * to update your custom data during runtime.
   *
   * @param customData - Analytics custom data config.
   */
  setCustomDataOnce = (customData: CustomDataConfig) => {
    AnalyticsModule.setCustomDataOnce(this.nativeId, customData);
  };

  /**
   * Sets the internal analytics custom data state.
   *
   * @param customData - Analytics custom data config.
   */
  setCustomData = (customData: CustomDataConfig) => {
    AnalyticsModule.setCustomData(this.nativeId, customData);
  };

  /**
   * Gets the current custom data config from the native `BitmovinPlayerCollector` instance.
   *
   * @returns The current custom data config.
   */
  getCustomData = async (): Promise<CustomDataConfig> => {
    return AnalyticsModule.getCustomData(this.nativeId);
  };

  /**
   * Gets the current user id used by the native `BitmovinPlayerCollector` instance.
   *
   * @returns The current user id.
   */
  getUserId = async (): Promise<string> => {
    return AnalyticsModule.getUserId(this.nativeId);
  };
}
