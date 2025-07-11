import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type CustomMessageHandlerExpoModuleEvents = Record<string, any>;

/**
 * Native CustomMessageHandlerExpoModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class CustomMessageHandlerExpoModule extends NativeModule<CustomMessageHandlerExpoModuleEvents> {
  registerHandler(nativeId: string): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  onReceivedSynchronousMessageResult(
    nativeId: string,
    result: string | undefined
  ): Promise<void>;
  sendMessage(
    nativeId: string,
    message: string,
    data: string | undefined
  ): Promise<void>;
}

export default requireNativeModule<CustomMessageHandlerExpoModule>(
  'CustomMessageHandlerExpoModule'
);
