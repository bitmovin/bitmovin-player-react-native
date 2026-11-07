import { getNativeOwner } from '../nativeOwner';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';

/** @internal */
export interface NativeNetwork extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeNetwork(owner: object): NativeNetwork | undefined {
  return getNativeOwner<NativeNetwork>(owner);
}

declare class NetworkModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeNetwork;
}

export default requireNativeModule<NetworkModule>('NetworkModule');
