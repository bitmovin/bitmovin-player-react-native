import { setNativeOwner } from '../nativeOwner';
import NetworkModule, { getNativeNetwork } from './networkModule';
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
export class Network {
  constructor(readonly config?: NetworkConfig) {}

  isInitialized = false;
  isDestroyed = false;

  initialize = async () => {
    if (!this.isInitialized) {
      const config = this.config;
      setNativeOwner(
        this,
        NetworkModule.create(
          serializeNativeConfig(config ?? {}),
          createNativeCallback((operation, [type, value]) => {
            if (operation === 'preprocessHttpRequest') {
              return Promise.resolve()
                .then(() => config?.preprocessHttpRequest?.(type, value))
                .then(
                  (result) => result ?? value,
                  () => value
                );
            }
            if (operation === 'preprocessHttpResponse') {
              return Promise.resolve()
                .then(() => config?.preprocessHttpResponse?.(type, value))
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
      const native = getNativeNetwork(this);
      if (native) {
        setNativeOwner(this);
        await native.destroy();
      }
      this.isDestroyed = true;
    }
  };
}
