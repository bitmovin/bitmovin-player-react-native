import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import NativeInstance from '../nativeInstance';
import NetworkExpoModule from './networkExpoModule';
import {
  HttpRequestType,
  HttpRequest,
  HttpResponse,
  NetworkConfig,
} from './networkConfig';

/**
 * Represents a native Network configuration object using Expo modules.
 * Maintains the same API as the legacy Network class for backward compatibility.
 * @internal
 */
export class NetworkExpo extends NativeInstance<NetworkConfig> {
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
  initialize = async () => {
    if (!this.isInitialized) {
      // Register this object as a callable module so it's possible to
      // call functions on it from native code, e.g `onPreprocessHttpResponse`.
      BatchedBridge.registerCallableModule(`Network-${this.nativeId}`, this);

      // Create native configuration object using Expo module
      if (this.config) {
        await NetworkExpoModule.initializeWithConfig(
          this.nativeId,
          this.config
        );
      }
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native Network config and releases all of its allocated resources.
   */
  destroy = async () => {
    if (!this.isDestroyed) {
      await NetworkExpoModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  };

  /**
   * Applies the user-defined `preprocessHttpRequest` function to native's `type` and `request` data and store
   * the result back in `NetworkExpoModule`.
   *
   * Called from native code when `NetworkConfig.preprocessHttpRequest` is dispatched.
   *
   * @param requestId Passed through to identify the completion handler of the request on native.
   * @param type Type of the request to be made.
   * @param request The HTTP request to process.
   */
  onPreprocessHttpRequest = (
    requestId: string,
    type: HttpRequestType,
    request: HttpRequest
  ) => {
    this.config
      ?.preprocessHttpRequest?.(type, request)
      .then((resultRequest) => {
        NetworkExpoModule.setPreprocessedHttpRequest(requestId, resultRequest);
      })
      .catch(() => {
        NetworkExpoModule.setPreprocessedHttpRequest(requestId, request);
      });
  };

  /**
   * Applies the user-defined `preprocessHttpResponse` function to native's `type` and `response` data and store
   * the result back in `NetworkExpoModule`.
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
        NetworkExpoModule.setPreprocessedHttpResponse(
          responseId,
          resultResponse
        );
      })
      .catch(() => {
        NetworkExpoModule.setPreprocessedHttpResponse(responseId, response);
      });
  };
}
