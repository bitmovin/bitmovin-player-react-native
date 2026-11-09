import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';
import { Platform } from 'react-native';
import type { DrmConfig } from './index';

/** @internal */
export interface NativeDrmConfig extends SharedObject {
  destroy(): Promise<void>;
}

declare class DrmModule extends NativeModule {
  create(
    config: Record<string, any>,
    callback: NativeCallback
  ): NativeDrmConfig;
}

const nativeModule = requireNativeModule<DrmModule>('DrmModule');

/** @internal */
export function createNativeDrmConfig(config?: DrmConfig): NativeDrmConfig {
  return nativeModule.create(
    serializeNativeConfig(config ?? {}),
    createNativeCallback((operation, args) => {
      const platformConfig =
        Platform.OS === 'ios' ? config?.fairplay : config?.widevine;
      const callback =
        platformConfig?.[operation as keyof typeof platformConfig];
      return typeof callback === 'function'
        ? (callback as (...values: any[]) => any).apply(platformConfig, args)
        : null;
    })
  );
}

export default nativeModule;
