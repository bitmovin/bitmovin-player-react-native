import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { NativeCallback } from '../nativeCallbacks';
import { lookup } from '../nativeInstanceRegistry';

/** @internal */
export interface NativeDecoder extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeDecoder(id: string): NativeDecoder | undefined {
  return lookup<NativeDecoder>('decoder', id);
}

declare class DecoderConfigModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeDecoder;
}

export default Platform.OS === 'android'
  ? requireNativeModule<DecoderConfigModule>('DecoderConfigModule')
  : undefined;
