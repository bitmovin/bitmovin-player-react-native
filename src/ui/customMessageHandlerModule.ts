import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import { lookup } from '../nativeInstanceRegistry';

/** @internal */
export interface NativeCustomMessage extends SharedObject {
  sendMessage(message: string, data?: string): Promise<void>;
  destroy(): Promise<void>;
}

/** @internal */
export function getNativeCustomMessage(
  id: string
): NativeCustomMessage | undefined {
  return lookup<NativeCustomMessage>('customMessage', id);
}

declare class CustomMessageHandlerModule extends NativeModule {
  create(callback: NativeCallback): NativeCustomMessage;
}

export default requireNativeModule<CustomMessageHandlerModule>(
  'CustomMessageHandlerModule'
);
