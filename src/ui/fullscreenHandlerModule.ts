/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values intentionally share their instance interface names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { FullscreenHandlerBridge } from './fullscreenHandlerBridge';
import type { NativeCallback } from '../native/nativeCallbacks';

/** @internal */
export type SharedFullscreenHandler = SharedObject &
  Pick<FullscreenHandlerBridge, 'destroy'> & {
    setIsFullscreenActive(active: boolean): Promise<void>;
  };

declare class FullscreenHandlerModule extends NativeModule {
  readonly SharedFullscreenHandler: new (
    callback: NativeCallback
  ) => SharedFullscreenHandler;
}
const nativeModule = requireNativeModule<FullscreenHandlerModule>(
  'FullscreenHandlerModule'
);
/** @internal */
export const SharedFullscreenHandler = nativeModule.SharedFullscreenHandler;
export default nativeModule;
