import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../native/nativeCallbacks';

/** @internal */
export interface NativeFullscreen extends SharedObject {
  setIsFullscreenActive(active: boolean): Promise<void>;
  destroy(): Promise<void>;
}

declare class FullscreenHandlerModule extends NativeModule {
  readonly FullscreenHandler: new (
    callback: NativeCallback
  ) => NativeFullscreen;
}
const module = requireNativeModule<FullscreenHandlerModule>(
  'FullscreenHandlerModule'
);
/** @internal */
export const NativeFullscreen = module.FullscreenHandler;
export default module;
