import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type CustomMessageHandlerModuleEvents = {
  onReceivedSynchronousMessage: ({
    nativeId,
    id,
    message,
    data,
  }: {
    nativeId: string;
    id: number;
    message: string;
    data: string | undefined;
  }) => void;
  onReceivedAsynchronousMessage: ({
    nativeId,
    message,
    data,
  }: {
    nativeId: string;
    message: string;
    data: string | undefined;
  }) => void;
};

/**
 * Native CustomMessageHandlerModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class CustomMessageHandlerModule extends NativeModule<CustomMessageHandlerModuleEvents> {
  registerHandler(nativeId: string): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  onReceivedSynchronousMessageResult(
    id: number,
    result: string | undefined
  ): Promise<void>;
  sendMessage(
    nativeId: string,
    message: string,
    data: string | undefined
  ): Promise<void>;
}

export default requireNativeModule<CustomMessageHandlerModule>(
  'CustomMessageHandlerModule'
);
