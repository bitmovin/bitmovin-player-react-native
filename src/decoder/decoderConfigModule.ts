import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { NativeCallback } from '../nativeCallbacks';
import {
  configurationCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';
import type { DecoderConfig } from './decoderConfig';

/** @internal */
export interface NativeDecoderConfig extends SharedObject {
  destroy(): Promise<void>;
}

declare class DecoderConfigModule extends NativeModule {
  create(
    config: Record<string, any>,
    callback: NativeCallback
  ): NativeDecoderConfig;
}

const nativeModule =
  Platform.OS === 'android'
    ? requireNativeModule<DecoderConfigModule>('DecoderConfigModule')
    : undefined;

/** @internal */
export function createNativeDecoderConfig(
  config?: DecoderConfig
): NativeDecoderConfig | undefined {
  return nativeModule?.create(
    serializeNativeConfig(config ?? {}),
    configurationCallback(config)
  );
}

export default nativeModule;
