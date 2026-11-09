import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { NativeCallback } from '../nativeCallbacks';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';
import type { DecoderConfig } from './decoderConfig';

/** @internal */
export interface NativeDecoder extends SharedObject {
  destroy(): Promise<void>;
}

declare class DecoderConfigModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeDecoder;
}

const nativeModule =
  Platform.OS === 'android'
    ? requireNativeModule<DecoderConfigModule>('DecoderConfigModule')
    : undefined;

/** @internal */
export function createNativeDecoder(
  config?: DecoderConfig
): NativeDecoder | undefined {
  return nativeModule?.create(
    serializeNativeConfig(config ?? {}),
    createNativeCallback((operation, [context, preferredDecoders]) => {
      if (operation !== 'overrideDecodersPriority') return null;
      return (
        config?.decoderPriorityProvider?.overrideDecodersPriority(
          context,
          preferredDecoders
        ) ?? preferredDecoders
      );
    })
  );
}

export default nativeModule;
