import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import NativeInstance from '../nativeInstance';
import { VideoAdaptationData, AdaptationConfig } from './adaptationConfig';

// Export config types from Adaptation module.
export { VideoAdaptationData, AdaptationConfig };

const AdaptationModule = NativeModules.AdaptationModule;

/**
 * Represents a native Adaptation configuration object.
 * @internal
 */
export class Adaptation extends NativeInstance<AdaptationConfig> {
  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  /**
   * Allocates the Adaptation config instance and its resources natively.
   */
  initialize = () => {
    if (!this.isInitialized) {
      // Register this object as a callable module so it's possible to
      // call functions on it from native code, e.g `onVideoAdaptation`.
      BatchedBridge.registerCallableModule(`Adaptation-${this.nativeId}`, this);
      // Create native configuration object.
      AdaptationModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native Adaptation config and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      AdaptationModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  };

  /**
   * Applies the user-defined `onVideoAdaptation` function to native's `data` and store
   * the result back in `AdaptationModule`.
   *
   * Called from native code when `AdaptationConfig.videoAdaptation` is dispatched.
   *
   * @param requestId Passed through to identify the completion handler of the request on native.
   * @param data The quality according to VideoQuality.id that is returned will be downloaded next.
   */

  onVideoAdaptation = (requestId: string, data: VideoAdaptationData) => {
    this.config?.videoAdaptation
      ?.onVideoAdaptation?.(data)
      .then((resultData: string) => {
        AdaptationModule.setOnVideoAdaptation(requestId, resultData);
      })
      .catch(() => {
        AdaptationModule.setOnVideoAdaptation(requestId, data);
      });
  };
}
