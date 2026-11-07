import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';

/** @internal */
export interface NativeFullscreen extends SharedObject {
  setIsFullscreenActive(active: boolean): Promise<void>;
  destroy(): Promise<void>;
}

declare class FullscreenHandlerModule extends NativeModule {
  create(callback: NativeCallback): NativeFullscreen;
}

export default requireNativeModule<FullscreenHandlerModule>(
  'FullscreenHandlerModule'
);
