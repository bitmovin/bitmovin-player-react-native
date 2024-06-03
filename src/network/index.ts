import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import NativeInstance from '../nativeInstance';
import {
  HttpRequestType,
  HttpRequest,
  HttpResponse,
  NetworkConfig,
} from './networkConfig';

// Export config types from Network module.
export { HttpRequestType, HttpRequest, HttpResponse, NetworkConfig };

const NetworkModule = NativeModules.NetworkModule;

/**
 * Represents a native Network configuration object.
 * @internal
 */
export class Network extends NativeInstance<NetworkConfig> {
  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  /**
   * Allocates the Network config instance and its resources natively.
   */
  initialize = () => {
    if (!this.isInitialized) {
      // Register this object as a callable module so it's possible to
      // call functions on it from native code, e.g `onPreprocessHttpResponse`.
      BatchedBridge.registerCallableModule(`Network-${this.nativeId}`, this);
      // Create native configuration object.
      NetworkModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native Network config and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      NetworkModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  };

  /**
   * Applies the user-defined `preprocessHttpResponse` function to native's `type` and `response` data and store
   * the result back in `NetworkModule`.
   *
   * Called from native code when `NetworkConfig.preprocessHttpResponse` is dispatched.
   *
   * @param responseId Passed through to identify the completion handler of the response on native.
   * @param type Type of the request to be made.
   * @param response The HTTP response to process.
   */
  onPreprocessHttpResponse = (
    responseId: string,
    type: HttpRequestType,
    response: HttpResponse
  ) => {
    this.config
      ?.preprocessHttpResponse?.(type, response)
      .then((resultResponse) => {
        NetworkModule.setPreprocessedHttpResponse(responseId, resultResponse);
      })
      .catch(() => {
        NetworkModule.setPreprocessedHttpResponse(responseId, response);
      });
  };
}
