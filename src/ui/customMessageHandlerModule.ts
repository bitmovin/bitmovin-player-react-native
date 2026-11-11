/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values intentionally share their instance interface names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../native/nativeCallbacks';

/** @internal */
export interface NativeCustomMessage extends SharedObject {
  sendMessage(message: string, data?: string): Promise<void>;
  destroy(): Promise<void>;
}

declare class CustomMessageHandlerModule extends NativeModule {
  readonly CustomMessageHandler: new (
    config: { synchronousMessage: string; asynchronousMessage: string },
    callback: NativeCallback
  ) => NativeCustomMessage;
}
const nativeModule = requireNativeModule<CustomMessageHandlerModule>(
  'CustomMessageHandlerModule'
);
/** @internal */
export const NativeCustomMessage = nativeModule.CustomMessageHandler;
export default nativeModule;
