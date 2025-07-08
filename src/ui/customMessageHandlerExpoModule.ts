import { requireNativeModule } from 'expo-modules-core';

/**
 * Native CustomMessageHandlerExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface CustomMessageHandlerExpoModuleInterface {
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

/**
 * Expo-based CustomMessageHandlerModule implementation.
 * This provides the same functionality as the legacy CustomMessageHandlerModule but uses Expo's modern module system.
 */
const CustomMessageHandlerExpoModule =
  requireNativeModule<CustomMessageHandlerExpoModuleInterface>(
    'CustomMessageHandlerExpoModule'
  );

export default CustomMessageHandlerExpoModule;
export { CustomMessageHandlerExpoModuleInterface };
