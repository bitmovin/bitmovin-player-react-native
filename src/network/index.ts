import { setNativeOwner } from '../nativeOwner';
import { createNativeNetwork, getNativeNetwork } from './networkModule';
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
      setNativeOwner(this, createNativeNetwork(this.config));
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
