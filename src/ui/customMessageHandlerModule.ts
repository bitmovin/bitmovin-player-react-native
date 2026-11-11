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
const module = requireNativeModule<CustomMessageHandlerModule>(
  'CustomMessageHandlerModule'
);
/** @internal */
export const NativeCustomMessage = module.CustomMessageHandler;
export default module;
