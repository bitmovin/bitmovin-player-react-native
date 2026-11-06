import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import { lookup } from '../nativeInstanceRegistry';

/** @internal */
export interface NativeDrm extends SharedObject {
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeDrm(id: string): NativeDrm | undefined {
  return lookup<NativeDrm>('drm', id);
}

declare class DrmModule extends NativeModule {
  create(config: Record<string, any>, callback: NativeCallback): NativeDrm;
}

export default requireNativeModule<DrmModule>('DrmModule');
