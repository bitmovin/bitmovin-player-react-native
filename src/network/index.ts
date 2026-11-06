import NativeInstance from '../nativeInstance';
import NetworkModule, { getNativeNetwork } from './networkModule';
import { getOrCreate, remove } from '../nativeInstanceRegistry';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';
import type { HttpRequest, HttpResponse, NetworkConfig } from './networkConfig';
import { HttpRequestType } from './networkConfig';

export { HttpRequestType };
export type { HttpRequest, HttpResponse, NetworkConfig };

/**
 * Represents a native Network configuration object.
 * @internal
 */
export class Network extends NativeInstance<NetworkConfig> {
  isInitialized = false;
  isDestroyed = false;

  initialize = async () => {
    if (!this.isInitialized) {
      getOrCreate('network', this.nativeId, () =>
        NetworkModule.create(
          serializeNativeConfig(this.config ?? {}),
          createNativeCallback((operation, [type, value]) => {
            if (operation === 'preprocessHttpRequest') {
              return Promise.resolve()
                .then(() => this.config?.preprocessHttpRequest?.(type, value))
                .then(
                  (result) => result ?? value,
                  () => value
                );
            }
            if (operation === 'preprocessHttpResponse') {
              return Promise.resolve()
                .then(() => this.config?.preprocessHttpResponse?.(type, value))
                .then(
                  (result) => result ?? value,
                  () => value
                );
            }
            return null;
          })
        )
      );
      this.isInitialized = true;
    }
  };

  destroy = async () => {
    if (!this.isDestroyed) {
      const native = getNativeNetwork(this.nativeId);
      if (native) {
        remove('network', this.nativeId, native);
        await native.destroy();
      }
      this.isDestroyed = true;
    }
  };
}
