/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values intentionally share their instance interface names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { CustomMessageHandler } from './customMessageHandler';
import type { NativeCallback } from '../native/nativeCallbacks';

/** @internal */
export type SharedCustomMessageHandler = SharedObject &
  Pick<CustomMessageHandler, 'sendMessage' | 'destroy'>;

declare class CustomMessageHandlerModule extends NativeModule {
  readonly SharedCustomMessageHandler: new (
    config: { synchronousMessage: string; asynchronousMessage: string },
    callback: NativeCallback
  ) => SharedCustomMessageHandler;
}
const nativeModule = requireNativeModule<CustomMessageHandlerModule>(
  'CustomMessageHandlerModule'
);
/** @internal */
export const SharedCustomMessageHandler =
  nativeModule.SharedCustomMessageHandler;
export default nativeModule;
