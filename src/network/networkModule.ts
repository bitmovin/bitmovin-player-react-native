import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import { lookup } from '../nativeInstanceRegistry';

/** @internal */
export interface NativeNetwork extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeNetwork(id: string): NativeNetwork | undefined {
  return lookup<NativeNetwork>('network', id);
}

declare class NetworkModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeNetwork;
}

export default requireNativeModule<NetworkModule>('NetworkModule');
