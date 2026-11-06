import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import { lookup } from '../nativeInstanceRegistry';

/** @internal */
export interface NativeFullscreen extends SharedObject {
  setIsFullscreenActive(active: boolean): Promise<void>;
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeFullscreen(id: string): NativeFullscreen | undefined {
  return lookup<NativeFullscreen>('fullscreen', id);
}

declare class FullscreenHandlerModule extends NativeModule {
  create(callback: NativeCallback): NativeFullscreen;
}

export default requireNativeModule<FullscreenHandlerModule>(
  'FullscreenHandlerModule'
);
