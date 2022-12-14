import { NativeModules } from 'react-native';
import { AnalyticsConfig, CustomDataConfig } from './config';
import NativeInstance from '../nativeInstance';

const AnalyticsModule = NativeModules.AnalyticsModule;

export class AnalyticsCollector extends NativeInstance<AnalyticsConfig> {
  /**
   * Whether the native `AnalyticsCollector` object has been created.
   */
  isInitialized = false;
  /**
   * Whether the native `AnalyticsCollector` object has been disposed.
   */
  isDestroyed = false;

  initialize = () => {
    if (!this.isInitialized) {
      AnalyticsModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  };

  destroy = () => {
    if (!this.isDestroyed) {
      this.detach();
      this.isDestroyed = true;
    }
  };

  attach = (playerId: string): void => {
    AnalyticsModule.attach(this.nativeId, playerId);
  };

  detach = (): void => {
    AnalyticsModule.detach(this.nativeId);
  };

  setCustomData = (customData: CustomDataConfig) => {
    AnalyticsModule.setCustomData(this.nativeId, customData);
  };

  getCustomData = async (): Promise<CustomDataConfig> => {
    return AnalyticsModule.getCustomData(this.nativeId);
  };
}
