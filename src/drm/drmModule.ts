import { getNativeOwner } from '../nativeOwner';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';

/** @internal */
export interface NativeDrm extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeDrm(owner: object): NativeDrm | undefined {
  return getNativeOwner<NativeDrm>(owner);
}

declare class DrmModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeDrm;
}

export default requireNativeModule<DrmModule>('DrmModule');
