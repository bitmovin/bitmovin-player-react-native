import { getNativeOwner } from '../nativeOwner';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';
import type { NetworkConfig } from './networkConfig';

/** @internal */
export interface NativeNetworkConfig extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeNetworkConfig(
  owner: object
): NativeNetworkConfig | undefined {
  return getNativeOwner<NativeNetworkConfig>(owner);
}

declare class NetworkModule extends NativeModule {
  create(
    config: Record<string, any>,
    callback: NativeCallback
  ): NativeNetworkConfig;
}

const nativeModule = requireNativeModule<NetworkModule>('NetworkModule');

/** @internal */
export function createNativeNetworkConfig(
  config?: NetworkConfig
): NativeNetworkConfig {
  return nativeModule.create(
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
  );
}

export default nativeModule;
